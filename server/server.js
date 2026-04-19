require('dotenv').config();

// 调试环境变量
console.log('[server] Starting JobTracker server...');
console.log(`[server] NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`[server] PORT: ${process.env.PORT || 4000}`);

// 检查所有可能的数据连接环境变量
const dbVars = [
  // 私有连接变量
  'DATABASE_URL', 'POSTGRES_URL', 'POSTGRESQL_URL', 'PG_URL',
  'DATABASE_PRIVATE_URL', 'DATABASE_CONNECTION_URL', 'DATABASE_URL_PRIVATE',
  // Railway 特定变量
  'RAILWAY_DATABASE_URL',
  // 公网连接变量
  'DATABASE_PUBLIC_URL',
  // 其他常见变量
  'NEON_DATABASE_URL', 'SUPABASE_DB_URL'
];
let hasDbUrl = false;
for (const name of dbVars) {
  if (process.env[name]) {
    console.log(`[server] ${name}: *** set ***`);
    hasDbUrl = true;
  }
}
if (!hasDbUrl) {
  console.log('[server] ❌ No database URL environment variable found!');
  console.log('[server] This usually means PostgreSQL plugin is not attached to this service.');
  console.log('[server] Please check Railway dashboard -> Add PostgreSQL plugin.');
} else if (process.env.DATABASE_PUBLIC_URL) {
  console.log('[server] ⚠ Found DATABASE_PUBLIC_URL - using public endpoint (may incur egress fees)');
  console.log('[server] ⚠ Consider using private endpoint to avoid charges.');
}

console.log(`[server] JWT_SECRET: ${process.env.JWT_SECRET ? '*** set ***' : '❌ NOT SET!'}`);

// 列出所有包含URL、DATABASE、POSTGRES的环境变量用于调试
const relevantEnvVars = Object.keys(process.env).filter(k =>
  k.includes('URL') || k.includes('DATABASE') || k.includes('POSTGRES') ||
  k.includes('PG') || k.includes('CONNECTION') || k.includes('DB')
);
if (relevantEnvVars.length > 0) {
  console.log(`[server] Relevant environment variables: ${relevantEnvVars.join(', ')}`);
}

const app = require('./app');
const { init: initCron } = require('./jobs/notificationCron');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`[server] ✅ Listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  initCron();
  console.log('[cron] ✅ Notification jobs scheduled');
});
