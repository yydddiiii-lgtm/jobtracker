const { Pool } = require('pg');

// 尝试多个可能的环境变量名，包括 Railway 特有的
const getDatabaseUrl = () => {
  const possibleNames = [
    // 标准私有连接变量（首选，无出口费用）
    'DATABASE_URL',
    'DATABASE_PRIVATE_URL',
    'DATABASE_URL_PRIVATE',
    'POSTGRES_URL',
    'POSTGRESQL_URL',
    'PG_URL',
    // Railway 特定变量
    'RAILWAY_DATABASE_URL',
    'DATABASE_CONNECTION_URL',
    // 公网连接变量（可能有出口费用）
    'DATABASE_PUBLIC_URL',
    // 其他常见变量
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

  // 优先使用私有连接变量（避免出口费用）
  const privatePriority = [
    'DATABASE_URL',
    'DATABASE_PRIVATE_URL',
    'DATABASE_URL_PRIVATE',
    'POSTGRES_URL',
    'POSTGRESQL_URL',
    'PG_URL'
  ];

  for (const name of privatePriority) {
    if (foundNames.includes(name)) {
      console.log(`[db] ✅ Using private database URL from: ${name} (no egress fees)`);
      return process.env[name];
    }
  }

  // 其次考虑 Railway 特定变量
  const railwayPriority = ['RAILWAY_DATABASE_URL', 'DATABASE_CONNECTION_URL'];
  for (const name of railwayPriority) {
    if (foundNames.includes(name)) {
      console.log(`[db] ⚠ Using Railway database URL from: ${name}`);
      return process.env[name];
    }
  }

  // 最后使用公网连接（可能有出口费用）
  if (foundNames.includes('DATABASE_PUBLIC_URL')) {
    console.log(`[db] ⚠⚠ Using PUBLIC database URL: DATABASE_PUBLIC_URL (may incur egress fees)`);
    console.log(`[db] ⚠⚠ Consider switching to a private endpoint to avoid charges.`);
    return process.env.DATABASE_PUBLIC_URL;
  }

  // 使用找到的第一个变量
  const firstFound = foundNames[0];
  console.log(`[db] ⚠ Using database URL from: ${firstFound}`);
  return process.env[firstFound];
};

const { Pool } = require('pg');

// 获取数据库连接URL
const dbUrl = getDatabaseUrl();
console.log('[db] Initializing PostgreSQL connection...');

let pool, query, getClient;

if (!dbUrl) {
  console.error('[db] ❌ No database connection URL found!');
  console.error('[db] Make sure Railway PostgreSQL plugin is properly configured and attached to this service.');
  console.error('[db] You may need to add PostgreSQL plugin in Railway dashboard or check service dependencies.');

  // 创建模拟连接池，提供明确的错误信息
  const nullPool = {
    query: (text, params) => Promise.reject(new Error('Database connection not configured. Check Railway PostgreSQL plugin setup.')),
    connect: () => Promise.reject(new Error('Database connection not configured. Check Railway PostgreSQL plugin setup.'))
  };

  pool = nullPool;
  query = nullPool.query;
  getClient = nullPool.connect;
} else {
  // 显示连接信息（隐藏密码）
  const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
  console.log(`[db] Connecting to: ${maskedUrl}`);

  // 创建真实的连接池
  pool = new Pool({
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

  // 定义查询函数
  query = (text, params) => pool.query(text, params);

  // 定义获取客户端函数
  getClient = () => pool.connect();
}

/**
 * Execute a parameterized query. Always use $1, $2, ... placeholders — never string-concatenate SQL.
 * @param {string} text  - SQL string with $N placeholders
 * @param {Array}  params - Parameter values
 */
module.exports = { query, getClient, pool };
