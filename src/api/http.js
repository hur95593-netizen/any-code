// 统一的 HTTP 请求层:基于 fetch,零第三方依赖。
// 职责只有三件:拼地址、超时控制、把各种失败归一成 ApiError,业务代码不必自己判断 res.ok。

const DEFAULT_TIMEOUT = 10000

/** 请求失败时抛出的统一错误。status 为 0 表示请求没走到服务端(网络错误或超时)。 */
export class ApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN', data = null, cause = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.data = data
    this.cause = cause
  }
}

/** 拼接 baseURL 与路径;传入绝对地址时原样使用。 */
export function joinUrl(base, path) {
  if (/^https?:\/\//i.test(path)) {
    return path
  }
  if (!base) {
    return path.startsWith('/') ? path : `/${path}`
  }
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

function baseUrl() {
  // Vite 会把 import.meta.env 注入到构建产物;未配置时退化为同源相对路径
  return import.meta.env?.VITE_API_BASE_URL ?? ''
}

/**
 * 发起请求并返回解析后的响应体。
 *
 * @param {string} path 相对路径(如 `/users`)或绝对地址
 * @param {object} [options]
 * @param {string} [options.method] 默认 GET
 * @param {*} [options.body] 非 undefined 时按 JSON 序列化
 * @param {object} [options.headers] 追加的请求头
 * @param {number} [options.timeout] 毫秒,默认 10000
 * @param {AbortSignal} [options.signal] 调用方自己的取消信号
 * @returns {Promise<*>} 响应体;204 或空响应返回 null
 * @throws {ApiError} 超时、网络错误、非 2xx 状态码
 */
export async function request(path, { method = 'GET', body, headers = {}, timeout = DEFAULT_TIMEOUT, signal } = {}) {
  const controller = new AbortController()
  let timedOut = false

  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeout)
  // 调用方的取消信号要能穿透到内部 controller
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort)

  let response
  try {
    response = await fetch(joinUrl(baseUrl(), path), {
      method,
      headers: body === undefined ? headers : { 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (error) {
    if (timedOut) {
      throw new ApiError(`请求超时(${timeout}ms):${method} ${path}`, { code: 'TIMEOUT', cause: error })
    }
    if (signal?.aborted) {
      throw new ApiError(`请求已取消:${method} ${path}`, { code: 'ABORTED', cause: error })
    }
    throw new ApiError(`网络错误:${method} ${path}`, { code: 'NETWORK', cause: error })
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }

  const payload = await parseBody(response)

  if (!response.ok) {
    throw new ApiError(`请求失败(${response.status}):${method} ${path}`, {
      status: response.status,
      code: 'HTTP_ERROR',
      data: payload,
    })
  }

  return payload
}

/** 解析响应体:JSON 走 JSON,其余按文本;空响应返回 null。 */
async function parseBody(response) {
  if (response.status === 204) {
    return null
  }
  const text = await response.text()
  if (text === '') {
    return null
  }
  const contentType = response.headers?.get?.('content-type') ?? ''
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text)
    } catch (error) {
      throw new ApiError('响应不是合法的 JSON', {
        status: response.status,
        code: 'BAD_JSON',
        data: text,
        cause: error,
      })
    }
  }
  return text
}

export const get = (path, options) => request(path, { ...options, method: 'GET' })
export const post = (path, body, options) => request(path, { ...options, method: 'POST', body })
export const put = (path, body, options) => request(path, { ...options, method: 'PUT', body })
export const del = (path, options) => request(path, { ...options, method: 'DELETE' })
