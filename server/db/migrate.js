const fs = require('fs');
const path = require('path');
const { query, getClient } = require('./index');

async function runMigration() {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 读取SQL文件
    const sqlPath = path.join(__dirname, 'migrations', '001_create_enums_and_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running database migration...');

    // 执行SQL（按语句分割，排除空行和注释）
    const statements = sql
      .split(';')
      .map(stmt => stmt.replace(/--[^\n]*/g, '').trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      await client.query('SAVEPOINT migration_step');
      try {
        await client.query(statement);
        await client.query('RELEASE SAVEPOINT migration_step');
        console.log(`✓ Executed: ${statement.split('\n')[0].substring(0, 80)}...`);
      } catch (err) {
        await client.query('ROLLBACK TO SAVEPOINT migration_step');
        if (err.message.includes('already exists') || err.message.includes('duplicate')) {
          console.log(`⚠  Already exists: ${statement.split('\n')[0].substring(0, 80)}...`);
        } else {
          throw err;
        }
      }
    }

    await client.query('COMMIT');
    console.log('✅ Database migration completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Database migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = runMigration;