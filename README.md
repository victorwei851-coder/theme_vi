# 主题样式演示（theme-style-vi）

一个 Vue 3 + TypeScript + Vite 的主题系统演示项目：**一套主题色板同时驱动 CSS、3D 场景、图表、表格、色卡与图标**，并在切换主题时同步更换对应的颜色与静态资源路径。

---

## 1. 快速开始

环境：Node ≥ 18（本项目使用 v24.11.1）

```bash
npm install
npm run dev        # 开发服务器
npm run build      # vue-tsc --noEmit && vite build
npm run preview    # 预览构建产物
```

> 修改 `vite.config.ts`、安装新依赖或新增 svg 后，需要**重启 dev server**。

技术栈：Vue 3.5 / TypeScript / Vite 6 / vue-router 4 / Pinia / Sass / ECharts 5 / Three.js 0.160 / vite-plugin-svg-icons。

---

## 2. 功能与页面

左侧悬浮导航由 `router.options.routes` 中带 `meta.title` 的路由自动生成，右上角是主题选择器；两者共用「玻璃轨道 + 滑动高亮块」样式。

| 路径 | 页面 | 功能 |
| --- | --- | --- |
| `/` | `views/home` | **主题色卡**：当前主题全部基础色 + 0~9 级透明度，棋盘底纹观察透明度；带背景图与毛玻璃质感 |
| `/canvas` | `views/canvas` | **ECharts 图表**：立体折线图 / 环形图 / 饼图 / 散点图，颜色取 `--color1`~`--color7` 及透明度层级 |
| `/tablePage` | `views/tablePage` | **主题色表格**：表头、边框、模糊阴影均用主题色变量 |
| `/three` | `views/three` | **Three.js 别墅庭院**：景物配色随主题切换（含白色材质改用 `color3`） |
| `/svgPage` | `views/svgPage` | **图标库**：展示全部 svg 图标，支持分组、搜索、点击复制用法 |

---

## 3. 主题系统（核心：`src/utils/themeKey.ts`）

> 项目里有两套独立机制：本节的**色板主题**（normal/blue/orange/custom，写入 `--colorN` 变量）是主力；另有 `styles/theme.css` 的**亮/暗色**（`--color-bg`、`--color-surface` 等，由 `stores/theme.ts` 的 `data-theme` 控制）。二者互不影响，当前页面主要使用色板主题。

### 3.1 色板定义

`styleThemeList` 内置 4 套主题：`normal`（青碧）、`blue`（海洋蓝）、`orange`（暖阳橙）、`custom`（自定义）。每套包含：

- `themeColor` 主色、`color1`~`color7`（由浅到深的主色阶）
- `white` / `black` / `gray1`~`gray6` 中性色
- `warning1`~`warning7`、`special1`~`special7`
- 功能色 `red` / `orange` / `yellow` / `green` / `lightBlue` / `deepBlue` / `purple` / `magenta`

`setOpacity()` 会为 `filterList` 中的颜色额外生成 **10 级透明度变量**：`color3_0` ~ `color3_9`，对应 alpha 十六进制 `00/1A/33/4D/66/80/99/B3/CC/E6`（约 0% → 90%）。

`setTheme()` 会把当前主题对象的**所有键**写成 `document.documentElement` 上的 CSS 变量，例如 `--color1`、`--color3_5`、`--gray6`。这就是全站配色的唯一数据源。

### 3.2 默认主题来源（优先级从高到低）

1. `window._CONFIG.styleTheme`（运行时注入，需在应用加载前设置）
2. `src/static/config.ts` 的 `themeKey`（当前为 `blue`）
3. `'normal'`

Vue 插件 `themeKey` 在 `main.ts` 中 `app.use()` 时会调用 `setTheme()` 应用默认主题，并挂载 `$themeColor` / `$getThemePath`。

### 3.3 切换与读取

| 操作 | 方式 |
| --- | --- |
| UI 切换 | 右上角主题选择器 → `window.setTheme(key)` |
| 代码切换 | `window.setTheme('orange')` |
| 自定义色板 | `window.setCustom('#FF8800')`（由单色生成 `color1`~`color7` 并切到 `custom`） |
| 改默认主题 | 编辑 `src/static/config.ts` 的 `themeKey` |
| 读取当前 key | `getThemeKey()`（导出） |
| 读取某个色值 | `themeColor('color3')`（导出）、`this.$themeColor(key)` |
| 全部主题定义 | `themeList`（导出）、`window.styleThemeList` |
| 3D 场景配色 | `getSceneColors()`（导出，按主题合并 `sceneBase` / `sceneOverrides`） |

### 3.4 切换时「颜色」如何生效

- **纯 CSS 消费方**（布局、表格、色卡、图标、毛玻璃、阴影）：直接写 `var(--colorN)` / `var(--colorN_M)`，浏览器自动重绘，**无需任何 JS 监听**。
- **JS 对象消费方**需要重新读值并重绘：
  - `views/three`：`getSceneColors()` + `themeColor('color3')` 设置材质颜色，白色/近白材质改为 `color3`。
  - `views/canvas`：ECharts 从 `getComputedStyle` 读取 CSS 变量后重新 `setOption(option, true)`。
  - `views/home` / 背景图：重新读取当前主题 key 与色值。
  - 三者统一用 `MutationObserver` 监听 `document.documentElement` 的 `style` 属性（`setTheme` 会改写 CSS 变量），配合 `requestAnimationFrame` 节流。

> 设计要点：`setTheme` 只改 CSS 变量，因此「改一次、全站联动」；3D 材质和 ECharts option 是普通 JS 对象，必须显式重读。

---

## 4. 静态资源路径随主题切换

### 4.1 资源目录

```
src/assets/imgs/
├── normal/        img1.png  img2.png  stacke.png
├── theme_blue/    img1.png  img2.png  stacke.png
└── theme_orange/  img1.png  img2.png  stacke.png
```

`img1.png` 用作首页背景，`img2.png` 为备选，`stacke.png` 为小横条素材。

### 4.2 构建期路径（由 `config.ts` 决定，编译期固定）

`src/static/config.ts` 的 `themeKey` → `themeKey.ts` 导出的 `styleThemePath`（如 `src/assets/imgs/theme_blue`）→ `vite.config.ts`：

- `resolve.alias['@style-theme']` 指向该目录的绝对路径
- `define.__STYLE_THEME_PATH__` 暴露路径字符串常量
- 插件的 `$getThemePath()` 返回同一片段

**注意**：这是**编译期**计算的，运行时调用 `window.setTheme()` 不会改变它；而且自定义别名写在 CSS `url(@style-theme/...)` 里解析不可靠（项目早期图片不显示就是这个原因），当前源码已不再用它取图。这三个入口保留给需要按构建期主题路径拼资源地址的场景。

### 4.3 运行时路径（真正随主题切换变化）

`src/views/home/index.vue` 使用 Vite 原生 `import.meta.glob` 一次性把三套主题目录的背景图打包，再按当前主题 key 选图：

```ts
const bgModules = import.meta.glob('../../assets/imgs/*/img1.png', {
  eager: true,
  import: 'default',
})
// getThemeKey() → normal / theme_blue / theme_orange（custom 回退 theme_blue）
```

选出的 URL 通过内联 `background-image` 绑定；主题切换时由 `MutationObserver` 触发重新计算，背景图随之换到对应主题目录（`cover` 居中 + `background-attachment: fixed`）。

**因此一次主题切换会同时发生两件事**：CSS 变量换成该主题的色板 + 背景图路径切到该主题的 `imgs/<theme>/` 目录。

### 4.4 图片格式与体积注意

- `img1.png` / `img2.png` 原本是 **HEIC 伪装成 `.png`**（浏览器无法解码，表现为图片不显示），已用 `sips -s format png` 转成真正的 PNG。新增图片请确认实际格式。
- 它们是 4032×3024 原图（单张约 12MB）。上线前建议压缩，文件名不变即可：

```bash
cd src/assets/imgs
for d in normal theme_blue theme_orange; do
  sips -Z 1920 "$d/img1.png" --out "$d/_c.png" && mv "$d/_c.png" "$d/img1.png"
done
```

---

## 5. 图标的主题管理库

### 5.1 组成

| 环节 | 位置 | 作用 |
| --- | --- | --- |
| 原始图标 | `src/assets/svg/*.svg`（28 个） | 图标形状 |
| 清洗脚本 | `src/assets/svg/node.js` | 递归移除 `fill` / `stroke`（含内联 style 中的），使图标可被 `currentColor` 上色 |
| Sprite 生成 | `vite.config.ts` → `vite-plugin-svg-icons` | `iconDirs: src/assets/svg`，`symbolId: 'icon-[name]'` |
| 运行时注入 | `src/main.ts` → `import 'virtual:svg-icons-register'` | 把 `<symbol>` 注入页面 |
| 名称清单 | `virtual:svg-icons-names` | 导出全部 symbol id，`svgPage` 用它枚举图标 |
| 全局组件 | `src/components/svgIcon.vue`，`main.ts` 注册为 `SvgIcon` | 统一渲染 `<svg><use href="#..."></svg>` |
| 展示页 | `src/views/svgPage/index.vue`（`/svgPage`） | 分组、搜索、点击复制用法 |

### 5.2 为什么是「主题管理」

图标文件本身**不含固定颜色**（清洗后无 `fill`/`stroke`），组件样式为 `fill: currentColor`。因此：

- 颜色完全由外层 `color` 决定，可直接传 `--color5` 等主题变量；
- 切换主题时 CSS 变量变化，图标颜色**自动跟随**，无需重新生成 svg 或改图标文件；
- 图标只负责形状，主题系统负责配色，两者解耦。

```vue
<SvgIcon icon-class="icon1_1" />
<SvgIcon icon-class="icon2_3" :size="24" color="var(--color5)" spin />
<SvgIcon icon-class="icon1_1" stroke title="首页" />
```

`symbolId: 'icon-[name]'` 与组件默认 `prefix: 'icon-'` 对应，所以 `icon-class` 传**文件名**（如 `icon1_1`）即可；若 sprite 的 id 与文件名一致，传 `prefix=""` 并写完整 id。

### 5.3 全局组件 Props

| Prop | 说明 | 默认 |
| --- | --- | --- |
| `iconClass` | symbol id 后缀（必填） | — |
| `prefix` | id 前缀 | `'icon-'` |
| `className` | 附加 class | `''` |
| `size` | 数字按 px，字符串原样 | CSS `1em` |
| `color` | 作用于 `currentColor` | 继承父级 |
| `stroke` | 线框模式（`fill:none` + `stroke:currentColor`） | `false` |
| `spin` | 旋转动画 | `false` |
| `title` | 可访问名称（提供后移除 `aria-hidden`） | `''` |

### 5.4 清洗脚本怎么跑

```bash
cd /path/to/themeStyle_vi/src/assets/svg && node node.js
```

**务必先 `cd` 到该目录**：脚本里 `SVG_DIR = './'` 取的是 `process.cwd()`，不是脚本所在目录；从项目根执行会递归扫描整个项目（含 `node_modules`）并改写其中的 svg。脚本会**原地覆写、不可逆**，执行前建议先备份或 `git commit`。它是纯 Node ESM 脚本（项目 `package.json` 有 `"type": "module"`），不要在 `.vue` 里 import。

### 5.5 新增图标流程

1. 把 `.svg` 放入 `src/assets/svg/`；
2. 若是彩色图标，先按 5.4 跑清洗脚本（注意它会处理目录下全部 svg）；
3. 重启 dev server，让 sprite 插件重新扫描；
4. 使用 `<SvgIcon icon-class="文件名" />`，对应 symbol id 为 `icon-文件名`；
5. `/svgPage` 会自动列出（数据来自 `virtual:svg-icons-names`）。

> `vite-plugin-svg-icons@2.0.1` 的 `dependencies` 漏声明了 `fast-glob`，项目已显式把它加入 `devDependencies`，请勿删除，否则构建会报 `ERR_MODULE_NOT_FOUND`。

---

## 6. 目录结构

```
src/
├── main.ts                 应用入口：插件、全局组件、sprite 注册
├── App.vue                 布局 + 左侧路由菜单 + 右上主题选择器
├── router/index.ts         路由表（菜单数据源）
├── static/config.ts        默认主题 key
├── utils/themeKey.ts       主题色板 / 透明度 / setTheme / 场景配色（核心）
├── stores/theme.ts         Pinia 亮/暗色状态
├── assets/
│   ├── imgs/<theme>/       按主题分目录的静态图片
│   └── svg/                svg 源文件 + node.js 清洗脚本
├── components/svgIcon.vue  全局图标组件
├── views/
│   ├── index.vue           父布局（承载 <router-view> 出口）
│   └── home / canvas / tablePage / three / svgPage
├── styles/theme.css        亮暗色基础变量
└── vite-env.d.ts           虚拟模块与 .vue 类型声明
```

---

## 7. 已知事项

- **Vetur 误报**：编辑器里 `Cannot find module 'vue'`、`defineProps/defineOptions` 等报错来自旧版 Vetur 扩展。项目使用 Volar / `vue-tsc`，`npm run build` 已通过；建议禁用 Vetur、启用 Vue - Official (Volar)。
- **构建体积**：`three` 与 `echarts` 的懒加载 chunk 超过 500KB 会给出警告，属正常，不影响使用。
- **背景图体积**：见 4.4，上线前建议压缩。
- **CSS 别名**：不要再写 `url(@style-theme/...)`；取图片请用 JS `import` / `import.meta.glob`，或把文件放到 `public/`。
- **构建脚本**：`npm run build` 为单工程类型检查 `vue-tsc --noEmit && vite build`（已移除有冲突的 project references 配置）。
