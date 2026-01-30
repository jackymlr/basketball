# 🏀 篮球数据统计工具

一个用于管理篮球比赛、队伍、队员和比赛数据统计的 Web 应用。

## 功能特性

### 📋 队伍管理

- 创建、编辑、删除队伍
- 查看队伍下属队员数量

### 👥 队员管理

- 添加、编辑、删除队员
- 设置球衣号码和场上位置
- 按队伍筛选查看

### 🏀 比赛管理

- 创建新比赛（设置主客队、日期、地点）
- 管理比赛状态（未开始/进行中/已结束）
- 查看比赛列表

### 📊 比赛数据记录

- 实时记录每位队员的比赛数据
- 支持的统计项目：
  - 得分（自动计算）
  - 两分球命中/出手
  - 三分球命中/出手
  - 罚球命中/出手
  - 前场/后场篮板
  - 助攻、抢断、盖帽
  - 失误、犯规
- 快捷得分按钮（命中/不中）
- 实时数据汇总表格
- 自动更新比赛比分

## 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS 4
- **路由**: React Router DOM
- **数据存储**: LocalStorage（浏览器本地存储）

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 部署到 GitHub Pages

### 方式一：仓库根目录就是本项目（推荐）

1. **把代码推到 GitHub**
   - 在 GitHub 新建仓库（例如 `basketball-stats`）
   - 本地在项目目录执行：
   ```bash
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git branch -M main
   git push -u origin main
   ```

2. **开启 GitHub Pages**
   - 打开仓库 → **Settings** → 左侧 **Pages**
   - **Build and deployment** 里 **Source** 选 **GitHub Actions**

3. **触发部署**
   - 每次推送到 `main` 会自动部署
   - 或打开 **Actions** 页，选 “Deploy to GitHub Pages”，点 **Run workflow**

4. **访问网站**
   - 部署完成后（约 1–2 分钟）访问：
   - `https://<你的用户名>.github.io/<仓库名>/`
   - 例如：`https://ethan.github.io/basketball-stats/`

### 方式二：项目在父仓库的子目录（如 `basketball/basketball-stats`）

此时 GitHub 只会读取**仓库根目录**下的 `.github/workflows/`，需要把 workflow 放到根目录：

1. 在**仓库根目录**（即 `basketball`）下创建 `.github/workflows/deploy.yml`
2. 使用下面的内容（注意 `working-directory` 和 `BASE_PATH`）：

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: "pages"
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: basketball-stats/package-lock.json
      - name: Install
        run: npm ci
        working-directory: basketball-stats
      - name: Build
        working-directory: basketball-stats
        env:
          GITHUB_PAGES: "true"
          BASE_PATH: ${{ github.event.repository.name }}
        run: npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: basketball-stats/dist
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

3. 仓库 **Settings → Pages** 里 **Source** 选 **GitHub Actions**，然后推送代码到 `main` 触发部署。
4. 访问：`https://<你的用户名>.github.io/<父仓库名>/`（例如 `https://ethan.github.io/basketball/`）

## 使用说明

1. **创建队伍**: 首先在"队伍管理"中创建至少两支队伍
2. **添加队员**: 在"队员管理"中为每支队伍添加队员
3. **创建比赛**: 在"比赛管理"中创建新比赛，选择主客队
4. **开始记录**: 点击比赛进入详情页，开始比赛后即可记录数据
5. **记录数据**:
   - 使用 +/- 按钮或直接输入数字
   - 使用快捷得分按钮快速记录投篮
   - 点击"保存数据"保存当前记录
6. **结束比赛**: 记录完成后点击"结束比赛"

## 数据存储

所有数据保存在浏览器的 LocalStorage 中，清除浏览器数据会导致数据丢失。建议定期备份重要数据。

## 项目结构

```
src/
├── components/     # 通用组件
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Layout.tsx
│   └── Modal.tsx
├── contexts/       # React Context
│   └── AppContext.tsx
├── pages/          # 页面组件
│   ├── Home.tsx
│   ├── Teams.tsx
│   ├── Players.tsx
│   ├── Games.tsx
│   └── GameDetail.tsx
├── store/          # 数据存储
│   └── storage.ts
├── types/          # TypeScript 类型定义
│   └── index.ts
├── App.tsx
├── main.tsx
└── index.css
```

## License

MIT
