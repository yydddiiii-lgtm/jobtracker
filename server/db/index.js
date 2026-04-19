const { Pool } = require('pg');

// 调试信息：检查数据库连接字符串
const dbUrl = process.env.DATABASE_URL;
console.log('[db] Initializing PostgreSQL connection...');
if (!dbUrl) {
  console.error('[db] ❌ DATABASE_URL environment variable is not set!');
  console.error('[db] Make sure Railway PostgreSQL plugin is properly configured.');
  // 不立即退出，让应用启动但会在首次查询时失败
} else {
  // 显示连接信息（隐藏密码）
  const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
  console.log(`[db] Connecting to: ${maskedUrl}`);
}

const pool = new Pool({
  connectionString: dbUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  console.log('[db] ✅ Connected to PostgreSQL successfully');
});

pool.on('error', (err) => {
  console.error('[db] ❌ Unexpected PostgreSQL pool error:', err.message);
  console.error('[db] Connection string:', dbUrl ? dbUrl.replace(/:[^:@]+@/, ':****@') : 'not set');
});

/**
 * Execute a parameterized query. Always use $1, $2, ... placeholders — never string-concatenate SQL.
 * @param {string} text  - SQL string with $N placeholders
 * @param {Array}  params - Parameter values
 */
const query = (text, params) => pool.query(text, params);

/**
 * Acquire a client for multi-statement transactions.
 * Caller must call client.release() in a finally block.
 */
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
