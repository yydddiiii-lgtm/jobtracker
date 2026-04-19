const { Pool } = require('pg');

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

  for (const name of possibleNames) {
    if (process.env[name]) {
      console.log(`[db] Using database URL from: ${name}`);
      return process.env[name];
    }
  }

  const allEnvVars = Object.keys(process.env);
  const relevantVars = allEnvVars.filter(k =>
    k.includes('URL') || k.includes('DATABASE') || k.includes('POSTGRES') ||
    k.includes('PG') || k.includes('CONNECTION') || k.includes('DB')
  );
  console.error('[db] ❌ No database connection URL found!');
  console.error('[db] Checked variables:', possibleNames.join(', '));
  console.error('[db] Relevant env vars found:', relevantVars.join(', '));
  return null;
};

const dbUrl = getDatabaseUrl();

const errorMsg = 'Database not configured. Add DATABASE_URL variable reference in Railway dashboard.';
const nullPool = {
  query: () => Promise.reject(new Error(errorMsg)),
  connect: () => Promise.reject(new Error(errorMsg))
};

let pool, query, getClient;

if (!dbUrl) {
  pool = nullPool;
  query = nullPool.query;
  getClient = nullPool.connect;
} else {
  const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
  console.log(`[db] Connecting to: ${maskedUrl}`);

  pool = new Pool({
    connectionString: dbUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err) => {
    console.error('[db] ❌ Pool error:', err.message);
  });

  (async () => {
    try {
      const client = await pool.connect();
      console.log('[db] ✅ Connection test passed');
      client.release();
    } catch (err) {
      console.error('[db] ❌ Connection test failed:', err.message);
    }
  })();

  query = (text, params) => pool.query(text, params);
  getClient = () => pool.connect();
}

module.exports = { query, getClient, pool };
