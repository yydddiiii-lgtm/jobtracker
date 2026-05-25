# JobTracker 部署指南（阿里云 ECS）

## 服务器信息

| 项目 | 值 |
|------|-----|
| 公网 IP | `123.56.244.199` |
| 系统 | Ubuntu 22.04 64位 |
| 配置 | 2核 2G |
| 地域 | 华北2（北京） |
| 登录用户 | root |
| 登录密码 | Yangdi123 |
| 实例ID | i-2ze69xmhrsl1zb525cjw |

> ⚠️ 注意：这个文件包含密码，不要提交到 GitHub 公开仓库。

---

## 整体架构

```
用户浏览器
    ↓ 访问 http://123.56.244.199
Nginx（门卫，80端口）
    ├── /api/* 请求 → 转发给后端（localhost:4000）
    └── 其他请求   → 返回前端静态文件（client/dist/）
后端（Node.js + Express，4000端口，PM2管理，24小时运行）
    ↓
PostgreSQL 数据库（5432端口，只在服务器内部，外部访问不到）
```

**关键点：** 用户只跟Nginx打交道，后端和数据库藏在里面，外部看不到。

---

## 项目结构说明

```
jobtracker/
├── client/          → 前端（React + Vite + TypeScript）
│   └── dist/        → 构建后的静态文件，Nginx 从这里提供页面
├── server/          → 后端（Node.js + Express）
│   ├── db/          → 数据库相关
│   │   ├── index.js        → 数据库连接
│   │   ├── migrate.js      → 迁移脚本
│   │   └── migrations/     → SQL 迁移文件
│   ├── .env         → 环境变量（不提交 GitHub）
│   └── server.js    → 后端入口文件
└── railway.toml     → Railway 部署配置（暂不使用）
```

---

## 部署步骤（已全部完成）

### 1. 购买服务器
- 在阿里云申请免费试用 ECS
- 选择 Ubuntu 22.04 64位，不预装任何应用
- 重置密码后通过 SSH 连接

### 2. SSH 连接服务器
```bash
ssh root@123.56.244.199
# 输入密码：Yangdi123
```
SSH = 远程控制服务器的方式，就像远程桌面，但只有黑色终端，没有图形界面。

### 3. 安装环境
```bash
# 更新系统软件列表
apt update

# 安装 Node.js 20（让后端代码能运行）
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs

# 安装 PostgreSQL（数据库）
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# 安装 Nginx（入口管理，转发请求）
apt install -y nginx

# 安装 Git（从GitHub拉取代码用）
apt install -y git
```

### 4. 拉取代码
```bash
cd /root
git clone https://github.com/yydddiiii-lgtm/jobtracker.git
cd jobtracker
```

### 5. 配置数据库
```bash
# 切换到 postgres 用户
su - postgres
psql

# 在 psql 里执行：
CREATE USER jobtracker WITH PASSWORD 'jobtracker123';
CREATE DATABASE jobtracker OWNER jobtracker;
GRANT ALL PRIVILEGES ON DATABASE jobtracker TO jobtracker;
\q
exit
```

### 6. 手动执行数据库迁移
> 注意：migrate.js 脚本有 bug，改用 psql 直接执行 SQL 文件

```bash
cd /root/jobtracker/server

psql postgresql://jobtracker:jobtracker123@localhost:5432/jobtracker -f db/migrations/001_create_enums_and_tables.sql
psql postgresql://jobtracker:jobtracker123@localhost:5432/jobtracker -f db/migrations/002_add_referral_code.sql
psql postgresql://jobtracker:jobtracker123@localhost:5432/jobtracker -c "ALTER TYPE job_type_enum ADD VALUE IF NOT EXISTS 'summer_internship'; ALTER TYPE job_type_enum ADD VALUE IF NOT EXISTS 'winter_internship'; ALTER TYPE job_type_enum ADD VALUE IF NOT EXISTS 'fulltime';"
```

### 7. 配置后端环境变量
```bash
cd /root/jobtracker/server
nano .env
```

`.env` 文件内容：
```
PORT=4000
NODE_ENV=production
DATABASE_URL=postgresql://jobtracker:jobtracker123@localhost:5432/jobtracker
JWT_SECRET=your_super_secret_key_change_this
JWT_ACCESS_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d
```

### 8. 安装后端依赖并启动
```bash
cd /root/jobtracker/server
npm install

# 安装 PM2（让后端在后台持续运行，关掉SSH终端也不会停）
npm install -g pm2

# 用 PM2 启动后端
pm2 start server.js --name jobtracker

# 设置开机自启（服务器重启后自动重新运行）
pm2 startup
pm2 save
```

### 9. 构建前端
```bash
cd /root/jobtracker/client
npm install
npm run build
# 生成 dist/ 文件夹（把React代码翻译成浏览器能直接读的HTML/CSS/JS）
```

### 10. 配置 Nginx
```bash
nano /etc/nginx/sites-available/jobtracker
```

配置内容：
```nginx
server {
    listen 80;
    server_name 123.56.244.199;

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /root/jobtracker/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# 启用配置
ln -s /etc/nginx/sites-available/jobtracker /etc/nginx/sites-enabled/

# 给 Nginx 读取文件的权限
chmod 755 /root
chmod -R 755 /root/jobtracker/client/dist

# 测试配置是否正确
nginx -t

# 重启 Nginx
systemctl restart nginx
```

### 11. 开放阿里云安全组80端口 ✅
- 阿里云控制台 → ECS实例 → 安全组 → 添加入方向规则
- 选择「Web HTTP流量访问」快捷配置
- 访问来源填 `0.0.0.0/0`（允许所有人访问）
- 端口填 `80`，保存

---

## 更新代码的步骤

每次修改代码后，在服务器上执行：

```bash
ssh root@123.56.244.199

cd /root/jobtracker
git pull                   # 从GitHub拉取最新代码

cd client
npm run build              # 重新构建前端

cd ../server
pm2 restart jobtracker     # 重启后端
```

---

## 常用维护命令

```bash
# 查看后端运行状态
pm2 status

# 查看后端日志（排查问题用）
pm2 logs jobtracker

# 重启后端
pm2 restart jobtracker

# 查看 Nginx 状态
systemctl status nginx

# 重启 Nginx
systemctl restart nginx

# 查看 Nginx 错误日志
cat /var/log/nginx/error.log | tail -20
```

---

## 概念解释（从零开始）

### 端口是什么？
服务器就像一栋楼，IP地址是楼的门牌号，端口是楼里每个房间的编号。
不同程序住在不同房间：
- 80端口 = Nginx住在这里（网页默认入口）
- 4000端口 = 后端程序住在这里
- 5432端口 = PostgreSQL数据库住在这里

### 公网IP vs 私有IP
- **公网IP**：服务器在互联网上的专属地址，全球唯一，任何人都能访问（你的阿里云服务器有这个）
- **私有IP**：局域网内部编号（如192.168.x.x），只有同一个WiFi下的设备能互相访问，出了这个网络没用
- 你的电脑没有专属公网IP，你家所有设备共用路由器的一个公网IP

### 云服务器 vs 本地电脑
| | 本地电脑 | 云服务器（阿里云ECS）|
|---|---|---|
| 公网IP | 没有专属的 | 有，固定不变 |
| 开机时间 | 你用才开 | 24小时不关机 |
| 别人能访问 | 只有同WiFi | 全世界都能访问 |
| 操作方式 | 鼠标+键盘 | SSH远程打命令 |

### 反向代理（Nginx做的事）
用户只跟Nginx说话，Nginx判断请求类型：
- 访问网页 → 直接返回前端文件
- 访问/api → 转发给后端处理

用户不知道后端的存在，就像打电话给公司前台，前台再转给具体部门。

### 静态部署 vs 全栈部署
- **静态部署**：只有前端（HTML/CSS/JS文件），没有数据库，可以免费托管在GitHub Pages/Vercel上
- **全栈部署**：有前端+后端+数据库，必须有真实服务器（你这个项目就是全栈）

### npm run build 是什么？
把React写的代码（浏览器看不懂）翻译成普通HTML/CSS/JS（浏览器能直接读）。
翻译后的文件放在 `dist/` 文件夹，Nginx直接把这个文件夹里的内容发给用户。

### PM2 是什么？
让后端程序在服务器后台持续运行的工具。
不用PM2的话，你关掉SSH终端，后端程序就停了。用了PM2，程序一直跑着，服务器重启也会自动恢复。

### 安全组是什么？
阿里云给服务器装的门禁系统。默认所有端口都锁着，你要手动开放需要的端口。
开放80端口 = 告诉门禁允许所有人通过80号门进来访问网页。

### 为什么浏览器显示"不安全"？
因为用的是 `http://` 而不是 `https://`，没有加密。
要解决需要：① 有域名 ② 申请SSL证书。暂时用IP地址访问，这个提示不影响使用。

### 域名和备案
- **域名**：给IP地址起的好记名字（如baidu.com），需要花钱购买
- **备案**：国内服务器+域名必须向国家登记，纯IP访问不需要备案
- 境外服务器不需要备案，但可能被防火长城封锁（如Railway被封，需要翻墙）

### GitHub的作用
- 存代码的云端仓库（代码版的百度网盘）
- 服务器通过 `git pull` 一行命令就能获取最新代码，比手动传文件方便

---

## 下一步可以做的事

1. **买域名** → 让网址变成好记的名字（如 jobtracker.cn）
2. **申请SSL证书** → 让网址变成 `https://`，消除"不安全"提示
3. **迁移到实验室服务器** → 原理完全相同，如果实验室服务器有公网IP可以直接迁移
