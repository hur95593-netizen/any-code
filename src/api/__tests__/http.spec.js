import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError, get, joinUrl, post, request } from '../http.js'

/** 造一个 Response 替身,只实现 http.js 用到的那几个成员。 */
function fakeResponse(body, { status = 200, contentType = 'application/json' } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => (name.toLowerCase() === 'content-type' ? contentType : null) },
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  }
}

describe('joinUrl', () => {
  it('没有 baseURL 时补上前导斜杠', () => {
    expect(joinUrl('', 'users')).toBe('/users')
    expect(joinUrl('', '/users')).toBe('/users')
  })

  it('拼接时不产生重复斜杠', () => {
    expect(joinUrl('https://api.test/v1', '/users')).toBe('https://api.test/v1/users')
    expect(joinUrl('https://api.test/v1/', 'users')).toBe('https://api.test/v1/users')
  })

  it('绝对地址原样使用', () => {
    expect(joinUrl('https://api.test', 'https://other.test/ping')).toBe('https://other.test/ping')
  })
})

describe('request', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('GET 解析 JSON 响应,不带请求体和 Content-Type', async () => {
    fetch.mockResolvedValue(fakeResponse({ id: 1, name: '张三' }))

    await expect(get('/users/1')).resolves.toEqual({ id: 1, name: '张三' })

    const [url, init] = fetch.mock.calls[0]
    expect(url).toBe('/users/1')
    expect(init.method).toBe('GET')
    expect(init.body).toBeUndefined()
    expect(init.headers['Content-Type']).toBeUndefined()
  })

  it('POST 序列化请求体并带上 JSON 请求头', async () => {
    fetch.mockResolvedValue(fakeResponse({ ok: true }, { status: 201 }))

    await expect(post('/users', { name: '李四' })).resolves.toEqual({ ok: true })

    const [, init] = fetch.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"name":"李四"}')
    expect(init.headers['Content-Type']).toBe('application/json')
  })

  it('204 与空响应体返回 null', async () => {
    fetch.mockResolvedValueOnce(fakeResponse('', { status: 204 }))
    await expect(get('/empty')).resolves.toBeNull()

    fetch.mockResolvedValueOnce(fakeResponse('', { status: 200 }))
    await expect(get('/blank')).resolves.toBeNull()
  })

  it('非 JSON 响应按文本返回', async () => {
    fetch.mockResolvedValue(fakeResponse('pong', { contentType: 'text/plain' }))
    await expect(get('/ping')).resolves.toBe('pong')
  })

  it('非 2xx 抛 ApiError 并带上状态码与响应体', async () => {
    fetch.mockResolvedValue(fakeResponse({ message: '没有权限' }, { status: 403 }))

    const error = await get('/admin').catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(403)
    expect(error.code).toBe('HTTP_ERROR')
    expect(error.data).toEqual({ message: '没有权限' })
  })

  it('JSON 解析失败归一成 BAD_JSON', async () => {
    fetch.mockResolvedValue(fakeResponse('{不是 JSON', { status: 200 }))

    const error = await get('/broken').catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('BAD_JSON')
    expect(error.data).toBe('{不是 JSON')
  })

  it('网络错误归一成 NETWORK', async () => {
    fetch.mockRejectedValue(new TypeError('failed to fetch'))

    const error = await get('/offline').catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('NETWORK')
    expect(error.status).toBe(0)
    expect(error.cause).toBeInstanceOf(TypeError)
  })

  it('超时会中断请求并抛 TIMEOUT', async () => {
    vi.useFakeTimers()
    // fetch 一直不返回,直到超时定时器触发 abort
    fetch.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () => reject(new Error('aborted')))
        }),
    )

    const pending = request('/slow', { timeout: 5000 }).catch((e) => e)
    await vi.advanceTimersByTimeAsync(5000)

    const error = await pending
    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('TIMEOUT')
    expect(error.message).toContain('5000ms')
  })

  it('调用方取消请求时抛 ABORTED', async () => {
    const controller = new AbortController()
    fetch.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () => reject(new Error('aborted')))
        }),
    )

    const pending = request('/cancel', { signal: controller.signal }).catch((e) => e)
    controller.abort()

    const error = await pending
    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('ABORTED')
  })
})
