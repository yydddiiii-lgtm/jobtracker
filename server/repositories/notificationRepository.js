const db = require('../db');

const findAll = async (userId, isRead) => {
  const params = [userId];
  let sql = 'SELECT * FROM notifications WHERE user_id = $1';
  if (isRead !== undefined) {
    params.push(isRead);
    sql += ` AND is_read = $${params.length}`;
  }
  sql += ' ORDER BY created_at DESC';
  const { rows } = await db.query(sql, params);
  return rows;
};

const create = async ({ userId, type, title, content, relatedId }) => {
  const { rows } = await db.query(
    `INSERT INTO notifications (user_id, type, title, content, related_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [userId, type, title, content, relatedId || null]
  );
  return rows[0] || null;
};

const markRead = async (id, userId) => {
  const { rows } = await db.query(
    'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, userId]
  );
  return rows[0] || null;
};

const markAllRead = async (userId) => {
  const { rowCount } = await db.query(
    'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
    [userId]
  );
  return rowCount;
};

module.exports = { findAll, create, markRead, markAllRead };
