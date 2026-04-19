const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { authenticate } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes         = require('./routes/auth');
const applicationRoutes  = require('./routes/applications');
const interviewRoutes    = require('./routes/interviews');
const documentRoutes     = require('./routes/documents');
const offerRoutes        = require('./routes/offers');
const notificationRoutes = require('./routes/notifications');
const statsRoutes        = require('./routes/stats');

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth',          authRoutes);
app.use('/api/applications',  authenticate, applicationRoutes);
app.use('/api/interviews',    authenticate, interviewRoutes);
app.use('/api/documents',     authenticate, documentRoutes);
app.use('/api/offers',        authenticate, offerRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);
app.use('/api/stats',         authenticate, statsRoutes);

// 生产环境下提供前端静态文件
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDistPath));

  // 处理前端路由：所有非API请求返回index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    }
  });
}

app.use(errorHandler);

module.exports = app;
