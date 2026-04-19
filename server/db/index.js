const { Pool } = require('pg');

// 尝试多个可能的环境变量名
const getDatabaseUrl = () => {
  const possibleNames = [
    'DATABASE_URL',
    'POSTGRES_URL',
    'POSTGRESQL_URL',
    'NEON_DATABASE_URL',
    'PG_URL'
  ];

  for (const name of possibleNames) {
    if (process.env[name]) {
      console.log(`[db] Using database URL from environment variable: ${name}`);
      return process.env[name];
    }
  }

  return null;
};

// 调试信息：检查数据库连接字符串
const dbUrl = getDatabaseUrl();
console.log('[db] Initializing PostgreSQL connection...');

if (!dbUrl) {
  console.error('[db] ❌ No database connection URL found!');
  console.error('[db] Checked environment variables: DATABASE_URL, POSTGRES_URL, POSTGRESQL_URL, NEON_DATABASE_URL, PG_URL');
  console.error('[db] Make sure Railway PostgreSQL plugin is properly configured.');
  console.error('[db] Current environment variables:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('POSTGRES') || k.includes('PG') || k.includes('URL')));
} else {
  // 显示连接信息（隐藏密码）
  const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
  console.log(`[db] Connecting to: ${maskedUrl}`);
}

const pool = new Pool({
  connectionString: dbUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // 增加到10秒
});

pool.on('connect', () => {
  console.log('[db] ✅ Connected to PostgreSQL successfully');
});

pool.on('error', (err) => {
  console.error('[db] ❌ Unexpected PostgreSQL pool error:', err.message);
  console.error('[db] Connection string:', dbUrl ? dbUrl.replace(/:[^:@]+@/, ':****@') : 'not set');
});

// 测试连接
(async () => {
  try {
    const client = await pool.connect();
    console.log('[db] ✅ Connection test passed');
    client.release();
  } catch (err) {
    console.error('[db] ❌ Connection test failed:', err.message);
  }
})();

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
