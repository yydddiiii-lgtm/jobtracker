const fs = require('fs');
const path = require('path');
const { query, getClient } = require('./index');

async function runMigration() {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    console.log('Running database migration...');

    console.log(`[migrate] Found migration files: ${files.join(', ')}`);

    for (const file of files) {
      console.log(`[migrate] Running: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      const statements = sql
        .split(';')
        .map(stmt => stmt.replace(/--[^\n]*/g, '').trim())
        .filter(stmt => stmt.length > 0);

      // ALTER TYPE ... ADD VALUE cannot run inside a transaction block in PostgreSQL
      const needsNoTransaction = statements.some(s => /ALTER\s+TYPE.*ADD\s+VALUE/i.test(s));

      if (needsNoTransaction) {
        // Run outside the current transaction using the pool directly
        for (const statement of statements) {
          try {
            await query(statement);
            console.log(`✓ Executed: ${statement.split('\n')[0].substring(0, 80)}...`);
          } catch (err) {
            if (err.message.includes('already exists') || err.message.includes('duplicate')) {
              console.log(`⚠  Already exists: ${statement.split('\n')[0].substring(0, 80)}...`);
            } else {
              throw err;
            }
          }
        }
      } else {
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