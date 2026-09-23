# any-code

基于 Vue 3 + Vite 的单页面应用。

## 环境

Node 18 以上,npm 8 以上。

## 常用命令

```bash
npm install      # 安装依赖
npm run dev      # 开发服务器,默认 http://localhost:5173
npm run build    # 生产构建,产物在 dist/
npm run preview  # 本地预览已构建的产物
npm test         # 单元测试(Vitest + jsdom)
npm run test:watch  # 监听模式
npm run smoke    # 冒烟验收:在 Node 里渲染三个路由,校验挂载与路由是否正常
```

接口地址等配置见 `.env.example`,复制成 `.env.local` 后修改;只有 `VITE_` 前缀的变量会进前端产物,不要放密钥。

## 目录结构

```
index.html            入口 HTML,Vite 从这里开始打包
vite.config.js        构建配置,别名 @ 指向 src
src/
├── main.js           应用入口,装配 router 后挂载到 #app
├── App.vue           根组件:页头导航 + <RouterView> + 页脚
├── router/
│   ├── routes.js     路由表(应用、单元测试、冒烟脚本共用这一份)
│   └── index.js      用 web history 创建路由实例
├── api/http.js       请求层:拼地址、超时控制、错误归一成 ApiError
├── utils/bars.js     排序演示页的纯逻辑:生成、打乱、排序矩形
├── views/            页面级组件(Home、Sort、About、NotFound)
├── components/       可复用组件
└── assets/main.css   全局样式与 CSS 变量(含深色模式)
scripts/
└── smoke-render.mjs  服务端渲染冒烟脚本
vitest.config.js      测试配置,复用 vite.config.js 的插件与别名
```

单元测试就近放在被测代码旁边的 `__tests__/` 里,文件名 `*.spec.js`。

## 约定

- 页面放 `src/views`,可复用组件放 `src/components`,统一用 `<script setup>` 组合式 API。
- 引用内部模块用别名 `@`,例如 `import Foo from '@/components/Foo.vue'`,不写多层相对路径。
- 新增路由只改 `src/router/routes.js` 一处,测试与冒烟脚本自动跟上;除首页外的页面用 `() => import(...)` 懒加载。
- 调接口统一走 `@/api/http.js`,失败一律是 `ApiError`(带 `status`、`code`、`data`),不要在组件里散落 `res.ok` 判断。
- 部署时服务端需把未匹配的路径回退到 `index.html`,否则刷新子路由会 404(history 模式的固有要求)。
- `node_modules/` 与 `dist/` 不入库,`package-lock.json` 入库以保证依赖可复现。
