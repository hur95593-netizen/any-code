<template>
  <section>
    <h2>关于</h2>
    <p>本页通过路由懒加载,构建后会成为独立的 chunk,首屏不会下载它。</p>
    <ul>
      <li>目录约定:<code>src/views</code> 放页面,<code>src/components</code> 放可复用组件,<code>src/router</code> 放路由表。</li>
      <li>路径别名:<code>@</code> 指向 <code>src</code>。</li>
      <li>路由模式:history 模式,部署时服务端需要把未匹配的路径回退到 <code>index.html</code>。</li>
    </ul>
  </section>
</template>
