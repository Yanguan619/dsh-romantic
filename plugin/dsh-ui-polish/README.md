# dsh-ui-polish

DSH 客户端插件：给「对话 / 轨迹」等视图标签切换加一段 170ms 的淡入位移，替掉现在的硬切。

不改任何对话内容、不拦截渲染、不注册工具，只注入一条 CSS 规则。

## 为什么这样能生效

宿主切标签时的结构与做法（DSH 0.1.x 实测）：

```jsx
<div className={ConversationRoot_module_css_default.viewArea}>
  {viewId !== undefined && renderSlot("conversation.view", {…}, { only: viewId })}
</div>
```

点标签执行 `selectView(id)` → `viewId` 变化 → React **卸载旧视图根、挂载新视图根**，两个视图之间没有过渡包装层，全仓库也搜不到
`startViewTransition` / `view-transition`。所以是硬切。

新挂载的那个子元素会重新跑一次 CSS 动画，这就够了——不需要碰 React：

```css
@media (prefers-reduced-motion: no-preference) {
  [class*="_viewArea"] > * {
    animation: dsh-ui-polish-view-enter 170ms cubic-bezier(0.4, 0, 0.2, 1) backwards;
  }
}
@keyframes dsh-ui-polish-view-enter {
  from { opacity: 0; transform: translate3d(0, 6px, 0); }
  to   { opacity: 1; transform: translate3d(0, 0, 0); }
}
```

要点：

- **选择器**：class 是 CSS Modules 哈希（`an3WzG_viewArea`、`WOwLGG_viewArea`…），哈希每次构建都变，
  所以匹配的是稳定的局部名后缀 `_viewArea`。
- **只用 opacity + transform**：两者都在合成层，不触发布局/重绘，170ms 的动画几乎不占 CPU。
- **不用 `forwards`**：动画结束后必须把 `transform` 收回去，否则它会一直当 `position: fixed`
  子元素的包含块，视图里的浮层/菜单定位会跑偏。
- **尊重 `prefers-reduced-motion`**：系统开了"减少动态效果"就完全不播。
- **曲线与曲线**：`cubic-bezier(0.4, 0, 0.2, 1)` 取自 app 自己的 chat flow-motion，视觉上和其它动画一致。

## 已知限制

硬切的另一半是「旧视图瞬间消失」。纯 CSS 做不到真正的交叉淡入（crossfade），因为旧节点在
新节点挂载前就卸载了。要交叉淡入得走 `document.startViewTransition()` 把 React 的提交包进去，
那需要 JS 钩子和 React 的 `flushSync`，风险大得多，v1 不做。

## 安装 / 停用

- 装：目录放到 `<profile>/node_modules/dsh-ui-polish`，并在 profile 的 `cordis.patch.yml` 里、
  或包自带的 `cordis.patch.yml` 通过 `insert` 挂上。
- 停用（任选其一，都不需要卸载文件）：
  - 把 `cordis.patch.yml` 里那段 `insert` 注释掉 → 插件不加载。
  - 或控制台执行 `document.getElementById('dsh-ui-polish-style')?.remove()` → 本次会话立即可关。
- 自检：控制台 `window.__dshUiPolish` 有值即表示插件跑起来了。

## 调整手感

`client/client.js` 顶部 `DURATION_MS` 改时长；`from` 里的 `translate3d(0, 6px, 0)` 改位移距离
（改成 `0` 就是纯淡入）；想更克制可把 `6px` 降到 `2px`。
