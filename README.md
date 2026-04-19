# JobTracker · 求职申请管理看板

> 一站式管理求职流程：投递记录、阶段追踪、面试安排、Offer 对比、截止日期提醒。

---

## 项目截图

| 看板视图 | 申请详情 | Offer 对比 |
|---------|---------|-----------|
| 拖拽卡片跨阶段 | 阶段时间线 + 面试记录 | 薪资/部门/编制横向对比 |

---

## 技术栈

### 前端
| 技术 | 用途 |
|------|------|
| React 19 + TypeScript | UI 框架 |
| Vite 5 | 构建工具 |
| Tailwind CSS 3 | 样式 |
| Zustand | 全局状态管理 |
| React Router v6 | 路由 |
| @hello-pangea/dnd | 看板拖拽 |
| React Hook Form + Zod | 表单校验 |
| Recharts | 统计图表 |
| FullCalendar | 日历视图 |
| Axios | HTTP 请求 + 自动 Token 刷新 |

### 后端
| 技术 | 用途 |
|------|------|
| Node.js + Express | Web 服务器 |
| PostgreSQL 15 | 主数据库 |
| pg | PostgreSQL 驱动 |
| bcrypt | 密码加密（12 轮） |
| jsonwebtoken | JWT 认证（Access 2h / Refresh 7d） |
| cookie-parser | HttpOnly Cookie 存储 Refresh Token |
| node-cron | 定时任务（截止日期 & 面试提醒） |
| Docker Compose | 本地数据库环境 |

### 架构分层
```
server/
├── routes/          # 路由注册
├── controllers/     # 请求/响应处理
├── services/        # 业务逻辑
├── repositories/    # 数据库查询（SQL 原生）
├── middleware/       # JWT 认证、错误处理
├── jobs/            # 定时通知任务
└── utils/           # 错误工厂、响应工具
```

---

## 功能列表

### 核心功能
- **看板视图**：拖拽卡片跨阶段（待投递 → 已投递 → 笔试 → 一/二面 → HR面 → Offer），乐观更新
- **申请详情**：内联编辑所有字段、阶段历史时间线、内推码记录
- **面试记录**：按轮次记录面试时间/形式/面试官/准备笔记，可标记结果
- **材料清单**：checkbox 管理简历/成绩单等材料提交状态
- **日历视图**：截止日期 & 面试时间可视化，点击跳转详情
- **Offer 对比**：薪资、城市、部门、编制横向对比，一键接受/拒绝
- **统计分析**：申请漏斗图、每周趋势折线图、校招/实习饼图

### 系统功能
- **JWT 双 Token 认证**：Access Token（2h）+ Refresh Token（HttpOnly Cookie，7d）
- **自动 Token 刷新**：Axios 拦截器在 401 时自动续期，无感知
- **截止日期提醒**：每天 08:00 自动扫描，提前 3天/1天/当天发送通知
- **面试提醒**：每小时扫描，提前 24h/2h 发送通知
- **通知幂等性**：PostgreSQL 唯一索引 + `ON CONFLICT DO NOTHING` 防止重复
- **铃铛通知**：60 秒轮询，未读计数徽章

---

## 本地启动

### 前置要求
- Node.js ≥ 20.16
- Docker Desktop（运行 PostgreSQL）

### 第一步：启动数据库

```bash
cd jobtracker
docker compose up -d
```

等待约 10 秒，PostgreSQL 就绪后继续。

### 第二步：初始化数据库表结构

```bash
cd server
# 连接数据库并执行 migration
docker exec -i jobtracker_postgres psql -U user -d jobtracker < db/migrations/001_create_enums_and_tables.sql
```

### 第三步：配置后端环境变量

在 `server/` 目录创建 `.env` 文件：

```env
DATABASE_URL=postgresql://user:password@localhost:5432/jobtracker
JWT_SECRET=jobtracker-dev-secret-key-32chars!!
NODE_ENV=development
PORT=4000
```

### 第四步：启动后端

```bash
cd server
npm install
node server.js
# 看到 "[server] listening on port 4000" 即为成功
```

### 第五步：启动前端

新开一个终端：

```bash
cd client
npm install
npm run dev
# 看到 "VITE ready" 即为成功
```

### 第六步：访问应用

浏览器打开 **http://localhost:5173**，注册账号后即可使用。

---

## API 路由总览

```
POST   /api/auth/register          注册
POST   /api/auth/login             登录
POST   /api/auth/refresh           刷新 Token
GET    /api/auth/me                获取当前用户
POST   /api/auth/logout            退出

GET    /api/applications           获取申请列表（支持分页/筛选）
POST   /api/applications           新建申请
GET    /api/applications/:id       申请详情
PATCH  /api/applications/:id       更新申请
DELETE /api/applications/:id       删除申请
GET    /api/applications/:id/stage-logs   阶段历史
GET    /api/applications/:id/interviews   面试列表
POST   /api/applications/:id/interviews   添加面试
GET    /api/applications/:id/documents    材料列表
POST   /api/applications/:id/documents    添加材料
POST   /api/applications/:id/offer        创建 Offer
PATCH  /api/applications/:id/offer        更新 Offer 决定

PATCH  /api/interviews/:id         更新面试结果
DELETE /api/interviews/:id         删除面试
GET    /api/interviews             获取全部面试（日历使用）

PATCH  /api/documents/:id          更新材料状态
DELETE /api/documents/:id          删除材料

GET    /api/offers                 Offer 列表
PATCH  /api/offers/:id             更新 Offer 详情

GET    /api/notifications          通知列表
PATCH  /api/notifications/:id/read 标记已读
PATCH  /api/notifications/read-all 全部已读

GET    /api/stats/overview         统计概览
```

---

## 数据库设计

核心表关系：

```
users
  └── applications (user_id)
        ├── stage_logs      (application_id)  阶段变更记录
        ├── interviews      (application_id)  面试记录
        ├── documents       (application_id)  材料清单
        └── offers          (application_id)  Offer 详情

notifications (user_id + related_id)          系统通知
```

---

## 项目亮点

1. **严格分层架构**：Route → Controller → Service → Repository，业务逻辑与数据访问完全解耦
2. **SQL 原生查询**：不使用 ORM，全部参数化查询（防 SQL 注入），动态 SET 语句支持增量更新
3. **乐观更新**：拖拽看板时先更新 UI 再请求后端，失败自动回滚
4. **通知幂等**：数据库层保证同类型通知不重复，无需业务层判断
5. **Token 自动续期**：Axios 响应拦截器统一处理 401，并发请求队列化等待续期完成

---

## Railway 部署指南

### 第一步：准备代码仓库
1. 在项目根目录初始化 Git：
   ```bash
   cd jobtracker
   git init
   git add .
   git commit -m "Initial commit"
   ```
2. 在 GitHub 创建新仓库（如 `jobtracker`）
3. 推送代码到 GitHub：
   ```bash
   git remote add origin https://github.com/你的用户名/jobtracker.git
   git branch -M main
   git push -u origin main
   ```

### 第二步：Railway 部署
1. 访问 [Railway](https://railway.app) 并注册账号（推荐使用 GitHub 登录）
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择你的 `jobtracker` 仓库
4. Railway 会自动检测 `railway.toml` 并开始部署

### 第三步：设置环境变量
部署完成后，在 Railway 项目面板：
1. 进入 "Variables" 标签页
2. 添加以下环境变量：
   - `JWT_SECRET`：生成一个至少32字符的随机字符串
     - **生成命令（任选其一）**：
       ```bash
       # Linux/Mac
       openssl rand -base64 32
       
       # Node.js
       node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
       
       # PowerShell (Windows)
       [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
       ```
   - （可选）调整其他变量如 `JWT_ACCESS_EXPIRES_IN`、`JWT_REFRESH_EXPIRES_IN`

### 第四步：访问应用
1. 部署完成后，Railway 会提供一个公开 URL（如 `https://jobtracker.up.railway.app`）
2. 点击该链接即可访问应用
3. 首次访问请注册账号开始使用

### 注意事项
- 首次部署可能需要 5-10 分钟完成构建
- 数据库由 Railway PostgreSQL 插件自动提供
- 应用重启后数据会保留（数据库持久化）
- 如需自定义域名，可在 Railway 的 "Settings" 中配置

---

## 作者

杨迪 · 求职申请管理工具（个人项目）
