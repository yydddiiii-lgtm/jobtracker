require('dotenv').config();
const app = require('./app');
const { init: initCron } = require('./jobs/notificationCron');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`[server] listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  initCron();
  console.log('[cron] notification jobs scheduled');
});
