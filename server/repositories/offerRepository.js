const db = require('../db');

const findAll = async (userId) => {
  const { rows } = await db.query(
    `SELECT o.*, a.company_name, a.position, a.job_type
     FROM offers o
     JOIN applications a ON a.id = o.application_id
     WHERE a.user_id = $1
     ORDER BY o.created_at DESC`,
    [userId]
  );
  return rows;
};

const findByApplication = async (applicationId) => {
  const { rows } = await db.query(
    'SELECT * FROM offers WHERE application_id = $1',
    [applicationId]
  );
  return rows[0] || null;
};

const findById = async (id) => {
  const { rows } = await db.query('SELECT * FROM offers WHERE id = $1', [id]);
  return rows[0] || null;
};

const create = async ({ applicationId, base_salary, city, department, headcount_type, offer_deadline, is_accepted, notes }) => {
  const { rows } = await db.query(
    `INSERT INTO offers
       (application_id, base_salary, city, department, headcount_type, offer_deadline, is_accepted, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [applicationId, base_salary || null, city || null, department || null,
     headcount_type || null, offer_deadline || null, is_accepted ?? null, notes || null]
  );
  return rows[0];
};

const update = async (id, fields) => {
  const keys = Object.keys(fields);
  if (keys.length === 0) return findById(id);
  const sets = [...keys.map((k, i) => `${k} = $${i + 2}`), 'updated_at = NOW()'];
  const { rows } = await db.query(
    `UPDATE offers SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    [id, ...keys.map((k) => fields[k])]
  );
  return rows[0] || null;
};

module.exports = { findAll, findByApplication, findById, create, update };
