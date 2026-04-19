require('dotenv').config();

// 调试环境变量
console.log('[server] Starting JobTracker server...');
console.log(`[server] NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`[server] PORT: ${process.env.PORT || 4000}`);
console.log(`[server] DATABASE_URL: ${process.env.DATABASE_URL ? '*** set ***' : '❌ NOT SET!'}`);
console.log(`[server] JWT_SECRET: ${process.env.JWT_SECRET ? '*** set ***' : '❌ NOT SET!'}`);

const app = require('./app');
const { init: initCron } = require('./jobs/notificationCron');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`[server] ✅ Listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  initCron();
  console.log('[cron] ✅ Notification jobs scheduled');
});
