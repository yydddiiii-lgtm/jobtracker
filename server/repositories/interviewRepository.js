const db = require('../db');

const findByApplication = async (applicationId) => {
  const { rows } = await db.query(
    'SELECT * FROM interviews WHERE application_id = $1 ORDER BY interview_time ASC',
    [applicationId]
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await db.query('SELECT * FROM interviews WHERE id = $1', [id]);
  return rows[0] || null;
};

const create = async ({ applicationId, round, interview_time, interview_type, location, interviewer, prep_notes, result }) => {
  const { rows } = await db.query(
    `INSERT INTO interviews
       (application_id, round, interview_time, interview_type, location, interviewer, prep_notes, result)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [applicationId, round, interview_time, interview_type || 'online',
     location || null, interviewer || null, prep_notes || null, result || 'pending']
  );
  return rows[0];
};

const update = async (id, fields) => {
  const keys = Object.keys(fields);
  if (keys.length === 0) return findById(id);
  const sets = [...keys.map((k, i) => `${k} = $${i + 2}`), 'updated_at = NOW()'];
  const { rows } = await db.query(
    `UPDATE interviews SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    [id, ...keys.map((k) => fields[k])]
  );
  return rows[0] || null;
};

const remove = async (id) => {
  const { rowCount } = await db.query('DELETE FROM interviews WHERE id = $1', [id]);
  return rowCount > 0;
};

const findAllByUser = async (userId) => {
  const { rows } = await db.query(
    `SELECT i.* FROM interviews i
     JOIN applications a ON a.id = i.application_id
     WHERE a.user_id = $1
     ORDER BY i.interview_time ASC`,
    [userId]
  );
  return rows;
};

module.exports = { findByApplication, findAllByUser, findById, create, update, remove };
