# JobTracker 求职申请管理看板 — 产品需求文档（PRD）

**版本**：v1.0  
**日期**：2026-04-17  
**作者**：YangDi  
**状态**：草稿

---

## 目录

1. [产品概述](#1-产品概述)
2. [用户画像](#2-用户画像)
3. [用户故事与验收标准](#3-用户故事与验收标准)
4. [功能模块详细说明](#4-功能模块详细说明)
5. [UI/UX 说明](#5-uiux-说明)
6. [数据库设计](#6-数据库设计)
7. [API 规范](#7-api-规范)
8. [非功能性需求](#8-非功能性需求)
9. [部署与运维](#9-部署与运维)

---

## 1. 产品概述

### 1.1 背景

大学生在求职季（通常9月—次年4月）需同时管理数十家公司的申请，涉及网申截止日期、笔试安排、多轮面试、offer比较等复杂信息。现有工具（备忘录、Excel、日历App）彼此割裂，无法提供统一视图。

### 1.2 产品定位

**JobTracker** 是一款面向应届生/实习求职者的多用户 Web 应用，以看板（Kanban）为核心视图，集中管理申请进度、截止日期、面试安排和 Offer 对比。

### 1.3 核心价值主张

| 价值 | 描述 |
|------|------|
| 集中管理 | 所有申请在一个地方，不再分散在备忘录和 Excel |
| 视觉化进度 | 看板视图一眼看清每家公司到哪一步 |
| 截止日期预警 | 自动提醒，不漏投递/笔试/offer 截止 |
| 面试准备 | 面试记录和备注，帮助复盘和准备 |
| Offer 决策辅助 | 多 Offer 横向对比，辅助决策 |

### 1.4 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Tailwind CSS |
| 状态管理 | Zustand |
| 路由 | React Router v6 |
| 看板拖拽 | @hello-pangea/dnd |
| 日历 | FullCalendar React |
| 图表 | Recharts |
| 表单 | React Hook Form + Zod |
| HTTP | Axios |
| 后端 | Node.js + Express |
| 认证 | JWT（Access Token 2h + Refresh Token 7d） |
| 数据库 | PostgreSQL 15 |
| 缓存 | Redis（Session + 通知队列） |
| 定时任务 | node-cron（通知自动生成） |
| 部署 | Docker + Docker Compose |

---

## 2. 用户画像

### 2.1 主要用户：应届毕业生 / 实习求职者

**典型用户 A — 大四校招生**
- 年龄：22岁，理工科背景
- 场景：秋招/春招，同时投递 20-40 家公司，目标互联网/金融/制造业
- 行为：习惯使用手机，偶尔切换到桌面
- 痛点：截止日期密集，容易忘记；面试轮次多，需要快速切换复习准备材料
- 技术熟悉度：中等，熟悉主流 Web App

**典型用户 B — 大三实习求职者**
- 年龄：20岁，文科/商科背景
- 场景：暑期实习，投递 10-20 家，目标快消/咨询/互联网
- 行为：以桌面为主，有记笔记习惯
- 痛点：不知道每家要准备什么材料；拿到 Offer 不知道如何比较

### 2.2 用户核心痛点

| 优先级 | 痛点 | 当前解决方式 | 缺陷 |
|--------|------|------------|------|
| P0 | 申请太多记不住当前状态 | Excel 手动维护 | 不直观，更新麻烦 |
| P0 | 截止日期密集、容易漏投 | 手机备忘录 | 无法关联具体申请 |
| P1 | 面试时间冲突/忘记准备 | 日历 App | 无法关联公司信息和备注 |
| P1 | 材料准备状态混乱 | 无 | 完全靠记忆 |
| P2 | 多 Offer 难以决策 | 纸笔对比 | 效率低，无法量化 |
| P2 | 阶段推进没有记录 | 无 | 无法复盘 |

---

## 3. 用户故事与验收标准

### 3.1 用户认证

**US-01 注册账号**
> As a 求职学生, I want to 用邮箱和密码注册账号,  
> so that 我的申请数据能被保存并在多设备访问。

验收标准（AC）：
- AC1：邮箱格式校验，不合法时显示错误提示
- AC2：密码至少 8 位，不满足时阻止提交并提示
- AC3：邮箱已注册时，返回"该邮箱已被使用"提示
- AC4：注册成功后自动登录，跳转到看板页

**US-02 登录**
> As a 已注册用户, I want to 用邮箱密码登录,  
> so that 我能访问自己的申请数据。

验收标准（AC）：
- AC1：邮箱或密码错误时，显示"邮箱或密码不正确"（不区分哪个错，防枚举）
- AC2：登录成功后跳转到看板页
- AC3：勾选"记住我"时，Token 有效期延长到 7 天
- AC4：Token 过期后，访问受保护路由自动跳转登录页

---

### 3.2 看板核心功能

**US-03 新建申请**
> As a 求职学生, I want to 快速新建一条申请记录,  
> so that 我能开始跟踪这家公司的进度。

验收标准（AC）：
- AC1：点击"新建申请"按钮，弹出表单（公司名、岗位、类型为必填）
- AC2：提交后，卡片出现在对应阶段列的最顶部
- AC3：deadline 可以为空（滚动招聘场景）
- AC4：新建成功后，Toast 提示"申请已添加"
- AC5：公司名最长 100 字，岗位名最长 100 字，超出时阻止提交

**US-04 拖拽更新阶段**
> As a 求职学生, I want to 拖动申请卡片到不同阶段列,  
> so that 我能快速更新进度而不需要打开详情页。

验收标准（AC）：
- AC1：卡片可以拖拽到任意阶段（允许跨阶段、允许后退）
- AC2：拖拽完成后，阶段变更记录写入 stage_logs
- AC3：拖到"已拒绝"或"已放弃"时，卡片视觉置灰
- AC4：拖拽过程中，目标列高亮显示接受区域
- AC5：拖拽失败（网络错误）时，卡片回到原位并提示错误

**US-05 查看申请详情**
> As a 求职学生, I want to 点击卡片查看完整申请信息,  
> so that 我能看到面试记录、材料状态和历史轨迹。

验收标准（AC）：
- AC1：详情页展示公司名、岗位、阶段、截止日期、薪资范围、城市、备注
- AC2：展示该申请下所有面试记录（按时间排序）
- AC3：展示材料清单及提交状态
- AC4：展示阶段变更历史（时间线形式）
- AC5：所有信息支持在详情页直接编辑（内联编辑或编辑模式）

**US-06 截止日期颜色预警**
> As a 求职学生, I want to 看到截止日期的颜色预警,  
> so that 我能一眼识别紧急程度。

验收标准（AC）：
- AC1：距截止日期 ≤ 2 天：红色标签
- AC2：距截止日期 3-7 天：橙色标签
- AC3：距截止日期 > 7 天：绿色标签
- AC4：已过截止日期：灰色 + 划线文字
- AC5：deadline 为空时，不显示日期标签

---

### 3.3 面试管理

**US-07 添加面试安排**
> As a 求职学生, I want to 为一条申请添加面试安排,  
> so that 我能记录面试时间和准备事项。

验收标准（AC）：
- AC1：面试时间（必填）、轮次（必填）、形式（线上/线下）为必填
- AC2：面试时间不能早于当前时间（历史面试可以记录，但新建面试提醒用户）
- AC3：添加成功后，面试事件同步到日历视图
- AC4：同一申请下可添加多轮面试（无上限）

---

### 3.4 通知提醒

**US-08 截止日期提醒**
> As a 求职学生, I want to 在截止日期前收到站内提醒,  
> so that 我不会错过重要节点。

验收标准（AC）：
- AC1：截止日期前 3 天，系统自动生成一条站内通知
- AC2：截止日期前 1 天，系统自动生成一条站内通知（与3天提醒独立）
- AC3：截止日期当天，系统自动生成一条标记为"紧急"的站内通知
- AC4：通知已读后不再重复生成（同类型+同申请+同触发条件，幂等）
- AC5：铃铛图标显示未读通知数（最多显示 99+）

**US-09 面试提醒**
> As a 求职学生, I want to 在面试前收到提醒,  
> so that 我有时间准备。

验收标准（AC）：
- AC1：面试前 24 小时自动生成提醒通知
- AC2：面试前 2 小时自动生成标记为"紧急"的提醒通知
- AC3：如面试已被删除，对应提醒不再生成

---

### 3.5 Offer 对比

**US-10 对比多个 Offer**
> As a 求职学生, I want to 在一个页面横向对比所有 Offer,  
> so that 我能做出更理性的决策。

验收标准（AC）：
- AC1：页面展示所有状态为"Offer"的申请及其 Offer 详情
- AC2：对比维度：公司名、岗位、城市、基础薪资、部门、编制类型、Offer 截止日期
- AC3：Offer 截止日期临近时（≤7天），对应列标红提示
- AC4：可以在页面直接标记"接受"或"拒绝"某个 Offer
- AC5：没有任何 Offer 时，显示引导空状态

---

## 4. 功能模块详细说明

### 4.1 用户认证模块

**业务规则：**
- 密码使用 bcrypt（salt rounds=12）加密存储，明文不落库
- JWT Access Token 有效期 2 小时，Refresh Token 有效期 7 天
- Refresh Token 存于 HttpOnly Cookie，Access Token 存于内存（Zustand）
- 同一账号可在多设备同时登录（不限制 Session 数量，MVP 阶段）
- 登出时，仅清除客户端 Token（不做服务端黑名单，MVP 阶段）

**边界条件：**
- 用户已删除账号后，其 Token 仍可能有效——MVP 阶段不处理此情况
- 并发注册同一邮箱：数据库 email 字段设唯一约束，依赖 DB 层保证

---

### 4.2 申请管理模块

**申请阶段定义（stage ENUM）：**

| 值 | 中文 | 说明 |
|----|------|------|
| `pending` | 待投递 | 已记录但未投递 |
| `applied` | 已投递 | 简历/网申已提交 |
| `written_test` | 笔试/测评 | 收到笔试邀请 |
| `interview_1` | 一面 | 收到一面邀请 |
| `interview_2` | 二/三面 | 多轮面试阶段 |
| `hr_interview` | HR面 | 进入 HR 谈话阶段 |
| `offer` | Offer | 收到 Offer |
| `rejected` | 已拒绝 | 被公司拒绝 |
| `withdrawn` | 已放弃 | 主动放弃 |

**阶段流转规则：**
- 允许任意跨阶段跳转（如：applied → offer，对应直接通过的情况）
- 允许向前回退（如：interview_1 → applied，对应重新投递）
- `rejected` 和 `withdrawn` 是"软终态"——允许从终态回退（用户可能误操作）
- 每次阶段变更，自动写入 stage_logs 一条记录
- 同一时刻同一申请只能处于一个阶段

**优先级（priority）定义：**

| 值 | 含义 |
|----|------|
| 1 | 低 |
| 2 | 中（默认） |
| 3 | 高 |

**job_type（职位类型）ENUM：**
- `campus`：校园招聘
- `internship`：实习

**边界条件：**
- 删除申请：级联删除 interviews、documents、offers、stage_logs、notifications
- deadline 可以为 NULL（滚动招聘）
- salary_range 存为两个字段 `salary_min` 和 `salary_max`（整数，单位：元/月），均可为 NULL
- 同一用户下，不限制相同公司+岗位的申请数量（可多次投递同一岗位）

---

### 4.3 面试管理模块

**interview_type（面试形式）ENUM：**
- `online`：线上（视频面试）
- `onsite`：线下（需填写地址）
- `phone`：电话面试

**result（面试结果）ENUM：**
- `pending`：待出结果（默认）
- `passed`：通过
- `failed`：未通过
- `cancelled`：已取消

**业务规则：**
- 面试时间不做强校验（允许录入历史面试）
- 一条申请可以添加多轮面试，round 字段由用户手动填写（如"一面"、"技术面"）
- 面试被删除后，对应的通知提醒不再生成（通过 interviews 外键级联）

---

### 4.4 材料清单模块

**doc_type（材料类型）预设选项（可扩展）：**
- 简历、成绩单、英语成绩证明、推荐信、作品集、在校证明、其他

**业务规则：**
- 每条申请默认不预填材料（用户自行添加）
- is_submitted 切换为 true 时，自动记录 submitted_at 为当前时间
- is_submitted 切回 false 时，submitted_at 清空为 NULL

---

### 4.5 通知模块

**notification_type（通知类型）ENUM：**

| 类型 | 触发条件 | 触发时机 |
|------|---------|---------|
| `deadline_3d` | 申请 deadline 还有 3 天 | 每天 08:00 定时任务扫描 |
| `deadline_1d` | 申请 deadline 还有 1 天 | 每天 08:00 定时任务扫描 |
| `deadline_today` | 申请 deadline 是今天 | 每天 08:00 定时任务扫描 |
| `interview_24h` | 面试还有 24 小时 | 每小时定时任务扫描 |
| `interview_2h` | 面试还有 2 小时 | 每小时定时任务扫描 |
| `stage_changed` | 申请阶段变更 | 实时触发（API 调用时） |
| `offer_deadline` | Offer 截止日期还有 3 天 | 每天 08:00 定时任务扫描 |

**幂等保证：**
- 通知生成前，检查 `(user_id, type, related_id)` 是否已存在未读通知
- 若存在，不重复生成
- 用户已读后，下次触发条件满足时可以重新生成

**业务规则：**
- 通知列表按 created_at 倒序展示
- 支持"全部已读"操作
- 通知不做物理删除（便于历史查看），但仅展示最近 90 天

---

### 4.6 统计模块

**提供数据：**
- 各阶段申请数量（漏斗图）
- 投递数随时间变化（折线图，按周）
- 各 job_type 占比（饼图）
- 总投递数 / Offer 数 / Offer 率

---

## 5. UI/UX 说明

### 5.1 整体布局

```
┌─────────────────────────────────────────────────┐
│  LOGO   看板  日历  Offer对比  统计    🔔  头像  │  ← 顶部导航
├─────────────────────────────────────────────────┤
│                                                  │
│                  页面内容区域                     │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 5.2 看板视图

**卡片展示字段：**
```
┌──────────────────────────┐
│  字节跳动          [高]  │  ← 公司名 + 优先级标签
│  后端开发实习             │  ← 岗位名
│  📅 2026-04-20  🔴3天后 │  ← 截止日期 + 颜色预警
│  [校招]  [北京]          │  ← 标签
└──────────────────────────┘
```

**截止日期颜色规则：**

| 距截止天数 | 颜色 | 文字 |
|----------|------|------|
| 已过期 | 灰色 + 删除线 | "已过期" |
| ≤ 2 天 | 红色 | "X天后" / "今天" |
| 3 - 7 天 | 橙色 | "X天后" |
| > 7 天 | 绿色 | "X天后" |
| 无截止日期 | 不显示 | — |

**看板列头信息：**
- 列名 + 当前列申请数量，如：`一面 (3)`

### 5.3 空状态设计

| 场景 | 展示内容 |
|------|---------|
| 新用户首次进入看板 | 插画 + "还没有申请记录，开始添加第一条吧" + "新建申请"按钮 |
| 某阶段列为空 | 简单文字"暂无"，不显示引导（避免干扰） |
| Offer对比页无Offer | 插画 + "还没有收到 Offer，继续加油！" |
| 通知中心无通知 | 文字"暂无通知" |
| 统计页无数据 | 文字"还没有足够数据，多投几家吧~" |

### 5.4 错误状态设计

| 场景 | 处理方式 |
|------|---------|
| 网络错误 | Toast 提示"网络异常，请稍后重试" |
| 表单验证失败 | 字段下方红色错误文字，按钮不可点击 |
| 拖拽保存失败 | 卡片回到原位 + Toast 提示错误 |
| 登录 Token 过期 | 静默刷新 Token，失败则跳登录页 |
| 404 路由 | 展示 404 页，提供返回看板按钮 |
| 服务器 500 | Toast 提示"服务器错误，请联系支持" |

### 5.5 响应式设计

- 桌面端（≥1024px）：完整看板多列展示
- 平板端（768px-1023px）：看板横向滚动
- 移动端（<768px）：看板折叠为单列列表视图（不支持拖拽，改为下拉选择阶段）

---

## 6. 数据库设计

### 6.1 完整表结构（含约束）

```sql
-- ============ 用户表 ============
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name        VARCHAR(100) NOT NULL,
  avatar_url  VARCHAR(500),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ 申请主表 ============
CREATE TYPE job_type_enum AS ENUM ('campus', 'internship');
CREATE TYPE stage_enum AS ENUM (
  'pending', 'applied', 'written_test',
  'interview_1', 'interview_2', 'hr_interview',
  'offer', 'rejected', 'withdrawn'
);
CREATE TYPE priority_enum AS ENUM ('1', '2', '3');

CREATE TABLE applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name  VARCHAR(100) NOT NULL,
  position      VARCHAR(100) NOT NULL,
  job_type      job_type_enum NOT NULL DEFAULT 'campus',
  stage         stage_enum NOT NULL DEFAULT 'pending',
  city          VARCHAR(50),
  salary_min    INTEGER CHECK (salary_min >= 0),
  salary_max    INTEGER CHECK (salary_max >= 0),
  deadline      DATE,
  job_url       VARCHAR(500),
  notes         TEXT,
  priority      priority_enum NOT NULL DEFAULT '2',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT salary_range_check CHECK (
    salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min
  )
);

-- ============ 阶段变更日志 ============
CREATE TABLE stage_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  from_stage      stage_enum,           -- 初始创建时为 NULL
  to_stage        stage_enum NOT NULL,
  note            VARCHAR(500),
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ 面试表 ============
CREATE TYPE interview_type_enum AS ENUM ('online', 'onsite', 'phone');
CREATE TYPE interview_result_enum AS ENUM ('pending', 'passed', 'failed', 'cancelled');

CREATE TABLE interviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  round           VARCHAR(50) NOT NULL,        -- "一面"、"技术面" 等
  interview_time  TIMESTAMPTZ NOT NULL,
  interview_type  interview_type_enum NOT NULL DEFAULT 'online',
  location        VARCHAR(200),                -- 线下时填写地址
  interviewer     VARCHAR(100),
  prep_notes      TEXT,
  result          interview_result_enum NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ 材料清单 ============
CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  doc_type        VARCHAR(50) NOT NULL,
  is_submitted    BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at    TIMESTAMPTZ,
  notes           VARCHAR(200),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ Offer 详情 ============
CREATE TYPE headcount_type_enum AS ENUM ('regular', 'outsourced', 'contract');

CREATE TABLE offers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE UNIQUE,
  base_salary     INTEGER CHECK (base_salary >= 0),
  city            VARCHAR(50),
  department      VARCHAR(100),
  headcount_type  headcount_type_enum,
  offer_deadline  DATE,
  is_accepted     BOOLEAN,               -- NULL=未决定, TRUE=接受, FALSE=拒绝
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ 站内通知 ============
CREATE TYPE notification_type_enum AS ENUM (
  'deadline_3d', 'deadline_1d', 'deadline_today',
  'interview_24h', 'interview_2h',
  'stage_changed', 'offer_deadline'
);

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        notification_type_enum NOT NULL,
  title       VARCHAR(200) NOT NULL,
  content     VARCHAR(500) NOT NULL,
  related_id  UUID,                      -- 关联的 application_id 或 interview_id
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 6.2 索引设计

```sql
-- 高频查询：某用户的所有申请（看板主视图）
CREATE INDEX idx_applications_user_id ON applications(user_id);

-- 高频查询：按阶段过滤
CREATE INDEX idx_applications_user_stage ON applications(user_id, stage);

-- 高频查询：按截止日期排序（通知定时任务扫描）
CREATE INDEX idx_applications_deadline ON applications(deadline) WHERE deadline IS NOT NULL;

-- 高频查询：某申请的面试列表
CREATE INDEX idx_interviews_application_id ON interviews(application_id);

-- 高频查询：定时任务扫描即将到来的面试
CREATE INDEX idx_interviews_time ON interviews(interview_time);

-- 高频查询：用户的未读通知
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- 幂等检查：防止重复通知
CREATE UNIQUE INDEX idx_notifications_idempotent
  ON notifications(user_id, type, related_id)
  WHERE is_read = FALSE;
```

---

## 7. API 规范

### 7.1 通用规范

**Base URL：** `http://localhost:4000/api`（开发环境）

**统一响应格式：**
```json
// 成功
{
  "success": true,
  "data": { ... }
}

// 失败
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "公司名不能为空",
    "details": [{ "field": "company_name", "message": "不能为空" }]
  }
}
```

**统一错误码：**

| HTTP 状态码 | code | 含义 |
|------------|------|------|
| 400 | `VALIDATION_ERROR` | 请求参数校验失败 |
| 401 | `UNAUTHORIZED` | 未登录或 Token 无效 |
| 403 | `FORBIDDEN` | 无权限访问（如访问他人申请） |
| 404 | `NOT_FOUND` | 资源不存在 |
| 409 | `CONFLICT` | 冲突（如邮箱已注册） |
| 500 | `INTERNAL_ERROR` | 服务器内部错误 |

**分页规范：**
```
GET /applications?page=1&limit=20&sort=deadline&order=asc&stage=applied
```
响应中包含：
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

### 7.2 认证 API

**POST /auth/register**
```json
// 请求
{ "email": "user@example.com", "password": "password123", "name": "张三" }

// 响应 201
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "name": "张三" },
    "accessToken": "eyJ..."
  }
}
```

**POST /auth/login**
```json
// 请求
{ "email": "user@example.com", "password": "password123", "rememberMe": false }

// 响应 200（同上，accessToken 返回，refreshToken 写入 HttpOnly Cookie）
```

**POST /auth/refresh**
```json
// 请求：无 body，Refresh Token 从 Cookie 读取
// 响应 200
{ "success": true, "data": { "accessToken": "eyJ..." } }
```

**GET /auth/me**
```json
// 响应 200
{
  "success": true,
  "data": { "id": "uuid", "email": "user@example.com", "name": "张三", "avatar_url": null }
}
```

---

### 7.3 申请 API

**GET /applications**
```
查询参数：
  stage       - 过滤阶段（可多值：?stage=applied&stage=interview_1）
  job_type    - 过滤类型
  sort        - 排序字段（created_at / deadline / updated_at，默认 created_at）
  order       - asc / desc（默认 desc）
  page        - 页码（默认 1）
  limit       - 每页数量（默认 50，看板模式建议不分页直接返回所有）
```

```json
// 响应 200 - 看板视图用 no_pagination=true 返回所有
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "company_name": "字节跳动",
        "position": "后端开发实习",
        "job_type": "internship",
        "stage": "interview_1",
        "city": "北京",
        "salary_min": 400,
        "salary_max": 500,
        "deadline": "2026-04-20",
        "priority": "3",
        "created_at": "2026-04-01T10:00:00Z",
        "updated_at": "2026-04-10T15:30:00Z"
      }
    ],
    "total": 1
  }
}
```

**POST /applications**
```json
// 请求
{
  "company_name": "字节跳动",       // 必填，max 100字
  "position": "后端开发实习",        // 必填，max 100字
  "job_type": "internship",          // 必填
  "stage": "pending",                // 可选，默认 pending
  "city": "北京",                    // 可选
  "salary_min": 400,                 // 可选
  "salary_max": 500,                 // 可选
  "deadline": "2026-04-20",         // 可选
  "job_url": "https://...",         // 可选
  "notes": "需要准备算法题",         // 可选
  "priority": "3"                    // 可选，默认 2
}
// 响应 201：返回完整 application 对象
```

**PATCH /applications/:id**
```json
// 请求：只传需要更新的字段（Partial Update）
{ "stage": "interview_1" }
// 若 stage 发生变更，服务端自动写入 stage_logs
// 响应 200：返回更新后完整对象
```

**DELETE /applications/:id**
```json
// 响应 200
{ "success": true, "data": { "message": "申请已删除" } }
```

---

### 7.4 面试 API

**GET /applications/:id/interviews**
```json
// 响应 200
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "application_id": "uuid",
      "round": "一面",
      "interview_time": "2026-04-22T10:00:00Z",
      "interview_type": "online",
      "location": null,
      "interviewer": "李工",
      "prep_notes": "复习链表和动态规划",
      "result": "pending"
    }
  ]
}
```

**POST /applications/:id/interviews**
```json
// 请求
{
  "round": "一面",                         // 必填
  "interview_time": "2026-04-22T10:00:00Z", // 必填
  "interview_type": "online",               // 必填
  "location": null,
  "interviewer": "李工",
  "prep_notes": "复习链表"
}
// 响应 201：返回创建的面试对象
```

---

### 7.5 通知 API

**GET /notifications**
```
查询参数：is_read=false（只获取未读），page，limit（默认 20）
```

**PATCH /notifications/:id/read**
```json
// 响应 200
{ "success": true, "data": { "id": "uuid", "is_read": true } }
```

**PATCH /notifications/read-all**
```json
// 响应 200
{ "success": true, "data": { "updated_count": 5 } }
```

---

### 7.6 统计 API

**GET /stats/overview**
```json
// 响应 200
{
  "success": true,
  "data": {
    "total": 25,
    "offer_count": 2,
    "offer_rate": 0.08,
    "by_stage": {
      "pending": 2,
      "applied": 8,
      "written_test": 5,
      "interview_1": 4,
      "interview_2": 2,
      "hr_interview": 2,
      "offer": 2,
      "rejected": 6,
      "withdrawn": 2
    },
    "weekly_trend": [
      { "week": "2026-W14", "count": 8 },
      { "week": "2026-W15", "count": 12 }
    ]
  }
}
```

---

## 8. 非功能性需求

### 8.1 性能

| 指标 | 要求 |
|------|------|
| 接口响应时间（P95） | ≤ 500ms（正常负载） |
| 看板视图加载 | ≤ 1.5s（含前端渲染） |
| 单用户申请数据上限 | 500条（超出提示用户归档） |
| 并发用户数（MVP） | 支持 100 并发 |

### 8.2 安全

| 项目 | 要求 |
|------|------|
| 密码存储 | bcrypt，salt rounds=12 |
| SQL 注入 | 使用参数化查询（pg 库），禁止字符串拼接 SQL |
| XSS | 前端输出时统一使用 React 默认转义，不使用 dangerouslySetInnerHTML |
| CSRF | Refresh Token 使用 SameSite=Strict Cookie |
| 数据隔离 | 所有涉及 application 的查询，强制加 WHERE user_id = $currentUserId |
| JWT 密钥 | 从环境变量读取，不硬编码 |
| HTTPS | 生产环境强制 HTTPS（Nginx 反向代理处理） |

### 8.3 可用性

| 项目 | 要求 |
|------|------|
| 浏览器兼容 | Chrome 90+、Firefox 88+、Edge 90+、Safari 14+ |
| 移动端 | 响应式布局，iOS Safari / Android Chrome 可正常浏览 |
| 无障碍 | 表单控件提供 label，颜色预警不能仅靠颜色传达信息（同时显示文字） |

---

## 9. 部署与运维

### 9.1 环境变量清单

```env
# 服务器
PORT=4000
NODE_ENV=development

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/jobtracker

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_ACCESS_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d

# 前端
VITE_API_BASE_URL=http://localhost:4000/api
```

### 9.2 本地开发启动步骤

```bash
# 1. 克隆并安装依赖
git clone <repo>
cd jobtracker
cd server && npm install
cd ../client && npm install

# 2. 启动数据库（需要 Docker）
docker-compose up -d postgres redis

# 3. 数据库迁移
cd server && npm run migrate

# 4. 启动后端
npm run dev    # 监听 localhost:4000

# 5. 启动前端（新终端）
cd client && npm run dev    # 监听 localhost:5173
```

### 9.3 Docker Compose 配置（开发环境）

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: jobtracker
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### 9.4 开发顺序

```
Sprint 1：基础设施
  □ 项目初始化（前后端脚手架）
  □ 数据库连接 + 迁移脚本
  □ 用户注册/登录（JWT）

Sprint 2：核心功能
  □ 申请 CRUD API
  □ 看板视图前端（含拖拽）
  □ 申请详情页

Sprint 3：辅助功能
  □ 面试管理
  □ 材料清单
  □ 日历视图

Sprint 4：增值功能
  □ Offer 详情 + 对比页
  □ 站内通知（定时任务 + API）
  □ 统计页面

Sprint 5：收尾
  □ 数据导出（CSV）
  □ 响应式适配
  □ 性能优化 + 错误处理完善
```

---

*文档结束 — v1.0*
