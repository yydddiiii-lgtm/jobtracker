const { Pool } = require('pg');

// 尝试多个可能的环境变量名，包括 Railway 特有的
const getDatabaseUrl = () => {
  const possibleNames = [
    'DATABASE_URL',
    'DATABASE_PRIVATE_URL',
    'DATABASE_URL_PRIVATE',
    'DATABASE_PUBLIC_URL',
    'POSTGRES_URL',
    'POSTGRESQL_URL',
    'PG_URL',
    'RAILWAY_DATABASE_URL',
    'DATABASE_CONNECTION_URL',
    'NEON_DATABASE_URL',
    'SUPABASE_DB_URL'
  ];

  const foundNames = [];
  for (const name of possibleNames) {
    if (process.env[name]) {
      console.log(`[db] Found database URL in environment variable: ${name}`);
      foundNames.push(name);
    }
  }

  if (foundNames.length === 0) {
    console.error('[db] ❌ No database connection URL found in any expected variable!');
    console.error('[db] Checked variables:', possibleNames.join(', '));

    // 列出所有包含相关关键字的环境变量用于调试
    const allEnvVars = Object.keys(process.env);
    const relevantVars = allEnvVars.filter(k =>
      k.includes('URL') || k.includes('DATABASE') || k.includes('POSTGRES') ||
      k.includes('PG') || k.includes('CONNECTION') || k.includes('DB')
    );
    console.error('[db] Relevant environment variables found:', relevantVars.join(', '));

    return null;
  }

  const priorityOrder = [
    'DATABASE_URL', 'DATABASE_PRIVATE_URL', 'DATABASE_URL_PRIVATE',
    'POSTGRES_URL', 'POSTGRESQL_URL', 'PG_URL',
    'RAILWAY_DATABASE_URL', 'DATABASE_CONNECTION_URL', 'DATABASE_PUBLIC_URL'
  ];
  for (const name of priorityOrder) {
    if (foundNames.includes(name)) {
      console.log(`[db] Using database URL from: ${name}`);
      return process.env[name];
    }
  }

  // 使用找到的第一个变量
  const firstFound = foundNames[0];
  console.log(`[db] Using database URL from: ${firstFound}`);
  return process.env[firstFound];
};

// 调试信息：检查数据库连接字符串
const dbUrl = getDatabaseUrl();
console.log('[db] Initializing PostgreSQL connection...');

if (!dbUrl) {
  console.error('[db] ❌ No database connection URL found!');
  console.error('[db] Make sure Railway PostgreSQL plugin is properly configured and attached to this service.');
  console.error('[db] You may need to add PostgreSQL plugin in Railway dashboard or check service dependencies.');

  // 不创建连接池，让应用在首次查询时失败并提供明确错误
  const nullPool = {
    query: () => Promise.reject(new Error('Database connection not configured. Check Railway PostgreSQL plugin setup.')),
    connect: () => Promise.reject(new Error('Database connection not configured. Check Railway PostgreSQL plugin setup.'))
  };

  return {
    query: nullPool.query,
    getClient: nullPool.connect,
    pool: nullPool
  };
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
