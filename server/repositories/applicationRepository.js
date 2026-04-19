const db = require('../db');

const findAll = async ({ userId, stage, job_type, sort = 'created_at', order = 'desc', page = 1, limit = 20, noPagination = false }) => {
  const conditions = ['user_id = $1'];
  const params = [userId];

  if (stage) {
    params.push(stage);
    conditions.push(`stage = $${params.length}`);
  }
  if (job_type) {
    params.push(job_type);
    conditions.push(`job_type = $${params.length}`);
  }

  const SORT_ALLOWLIST = ['company_name', 'position', 'deadline', 'created_at', 'updated_at', 'priority'];
  const sortCol = SORT_ALLOWLIST.includes(sort) ? sort : 'created_at';
  const sortDir = order === 'asc' ? 'ASC' : 'DESC';
  const where = conditions.join(' AND ');

  const { rows: countRows } = await db.query(
    `SELECT COUNT(*) FROM applications WHERE ${where}`,
    params
  );
  const total = parseInt(countRows[0].count);

  const baseQuery = `SELECT * FROM applications WHERE ${where} ORDER BY ${sortCol} ${sortDir}`;

  if (noPagination) {
    const { rows } = await db.query(baseQuery, params);
    return { rows, total: rows.length };
  }

  const offset = (page - 1) * limit;
  const paginatedParams = [...params, limit, offset];
  const { rows } = await db.query(
    `${baseQuery} LIMIT $${paginatedParams.length - 1} OFFSET $${paginatedParams.length}`,
    paginatedParams
  );

  return { rows, total };
};

const findById = async (id, userId) => {
  const { rows } = await db.query(
    'SELECT * FROM applications WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rows[0] || null;
};

const create = async ({ userId, company_name, position, job_type, stage, city, salary_min, salary_max, deadline, job_url, notes, priority, referral_code }) => {
  const { rows } = await db.query(
    `INSERT INTO applications
       (user_id, company_name, position, job_type, stage, city, salary_min, salary_max, deadline, job_url, notes, priority, referral_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [userId, company_name, position, job_type || 'daily_internship', stage || 'pending',
     city || null, salary_min || null, salary_max || null,
     deadline || null, job_url || null, notes || null, priority || '2', referral_code || null]
  );
  return rows[0];
};

const update = async (id, userId, fields) => {
  const keys = Object.keys(fields);
  if (keys.length === 0) return findById(id, userId);
  const sets = [...keys.map((k, i) => `${k} = $${i + 3}`), 'updated_at = NOW()'];
  const { rows } = await db.query(
    `UPDATE applications SET ${sets.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId, ...keys.map((k) => fields[k])]
  );
  return rows[0] || null;
};

const remove = async (id, userId) => {
  const { rowCount } = await db.query(
    'DELETE FROM applications WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rowCount > 0;
};

module.exports = { findAll, findById, create, update, remove };
