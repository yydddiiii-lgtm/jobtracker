# JobTracker · 求职申请管理看板

> 面向校招 & 实习场景的全流程求职管理工具，告别 Excel 表格，一站式追踪投递进度、面试日程与 Offer 决策。

**线上体验 →** https://jobtracker-production-8934.up.railway.app/

**在线体验：[http://123.56.244.199](http://123.56.244.199)**

---

## 功能截图

### 申请看板（Kanban Board）
9 阶段拖拽看板，实时呈现所有投递的全局状态，支持优先级标记与截止日期预警。

![申请看板](docs/screenshots/03-kanban-board.png)

### 新建申请
填写公司、岗位、类型（日常 / 暑期 / 寒假实习 / 正式岗位）、薪资范围、内推码、优先级，一键创建。

![新建申请](docs/screenshots/02-new-application.png)

### 申请详情 & 阶段历史
完整的阶段流转时间线、面试记录、材料清单，支持接受 / 拒绝 Offer 一键操作。

![申请详情](docs/screenshots/07-application-detail.png)

### Offer 对比
多个 Offer 并排展示，横向比较月薪、城市、部门、编制类型与截止日期，辅助最终决策。

![Offer对比](docs/screenshots/04-offer-comparison.png)

### 日历视图
将投递截止日和面试安排可视化到月历，点击事件直达对应申请详情。

![日历视图](docs/screenshots/05-calendar.png)

### 数据统计
申请漏斗图、每周投递趋势、校招 vs 实习占比、Offer 转化率，量化投递效率。

![数据统计](docs/screenshots/06-stats.png)

### 用户登录 / 注册
邮箱 + 密码注册登录，支持「记住我（7天）」免登。

![登录页](docs/screenshots/01-login.png)

---

## 核心功能

| 功能模块 | 说明 |
|---|---|
| **Kanban 看板** | 9 阶段拖拽（待投递 → Offer / 已拒绝），移动端降级为列表+下拉 |
| **智能提醒** | 投递截止前 3天/1天/当天，面试前 24h/2h 自动通知 |
| **阶段历史** | 每次状态变更自动记录时间戳，完整还原申请轨迹 |
| **面试管理** | 支持多轮面试（时间/形式/结果），与日历联动 |
| **材料清单** | 跟踪简历/成绩单/推荐信等材料的提交状态 |
| **Offer 对比** | 多 Offer 并排，月薪/城市/编制/截止日一目了然 |
| **数据看板** | 漏斗图 + 趋势折线 + 职位类型饼图 + Offer 率 |
| **通知中心** | 铃铛图标 + 未读红点，60 秒轮询更新 |

---

## 技术栈

**前端**
- React 19 + TypeScript + Vite
- Zustand（状态管理）· React Router 6（路由）
- Tailwind CSS · @hello-pangea/dnd（拖拽）· FullCalendar · Recharts
- React Hook Form + Zod（表单校验）· Axios（自动 401 刷新）

**后端**
- Node.js + Express · PostgreSQL 15（原生 SQL，无 ORM）
- JWT 双 Token（2h Access + 7d Refresh HttpOnly Cookie）
- node-cron（定时提醒任务）· bcrypt（密码加密）

**部署**
- Railway（云端 PostgreSQL + 自动构建）
- Docker Compose（本地开发环境）

---

## 本地运行

**前置要求**：Node.js ≥ 20.16、Docker Desktop

```bash
# 1. 启动数据库
docker compose up -d

# 2. 安装依赖 & 初始化数据库
cd server && npm install
docker exec -i jobtracker_postgres psql -U user -d jobtracker < db/migrations/001_create_enums_and_tables.sql

# 3. 配置环境变量（server/.env）
DATABASE_URL=postgresql://user:password@localhost:5432/jobtracker
JWT_SECRET=your-32-char-secret-key
NODE_ENV=development
PORT=4000

# 4. 启动后端
node server.js

# 5. 启动前端（新终端）
cd client && npm install && npm run dev
```

浏览器访问 **http://localhost:5173**，注册账号后即可使用。

---

## 设计亮点

- **通知幂等**：数据库唯一约束 `(user_id, type, related_id)` + `ON CONFLICT DO NOTHING`，定时任务重复扫描不产生重复提醒
- **乐观更新**：拖拽状态前端即时响应，失败时自动回滚，体验流畅
- **行为轨迹**：`stage_logs` 表完整记录阶段变更历史，为后续 AI 功能（投递成功率预测、个性化建议）预留数据基础
- **Offer 自动关联**：申请进入 Offer 阶段时自动创建 Offer 记录，无需手动维护
- **严格分层**：Route → Controller → Service → Repository，业务逻辑与数据访问完全解耦

---

*本项目使用 [Claude Code](https://claude.ai/code) AI 编程助手辅助开发。*
