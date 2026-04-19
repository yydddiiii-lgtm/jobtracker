const db = require('../db');

const findByEmail = async (email) => {
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
};

const findById = async (id) => {
  const { rows } = await db.query(
    'SELECT id, email, name, avatar_url, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

const create = async ({ email, passwordHash, name }) => {
  const { rows } = await db.query(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, avatar_url, created_at, updated_at`,
    [email, passwordHash, name]
  );
  return rows[0];
};

module.exports = { findByEmail, findById, create };
