const db = require('../db');

const findByApplication = async (applicationId) => {
  const { rows } = await db.query(
    'SELECT * FROM documents WHERE application_id = $1 ORDER BY created_at ASC',
    [applicationId]
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await db.query('SELECT * FROM documents WHERE id = $1', [id]);
  return rows[0] || null;
};

const create = async ({ applicationId, doc_type, is_submitted = false, notes }) => {
  const submittedAt = is_submitted ? new Date() : null;
  const { rows } = await db.query(
    `INSERT INTO documents (application_id, doc_type, is_submitted, submitted_at, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [applicationId, doc_type, is_submitted, submittedAt, notes || null]
  );
  return rows[0];
};

const update = async (id, fields, previousIsSubmitted) => {
  if ('is_submitted' in fields) {
    if (fields.is_submitted && !previousIsSubmitted) {
      fields.submitted_at = new Date();
    } else if (!fields.is_submitted) {
      fields.submitted_at = null;
    }
  }
  const keys = Object.keys(fields);
  if (keys.length === 0) return findById(id);
  const sets = keys.map((k, i) => `${k} = $${i + 2}`);
  const { rows } = await db.query(
    `UPDATE documents SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    [id, ...keys.map((k) => fields[k])]
  );
  return rows[0] || null;
};

const remove = async (id) => {
  const { rowCount } = await db.query('DELETE FROM documents WHERE id = $1', [id]);
  return rowCount > 0;
};

module.exports = { findByApplication, findById, create, update, remove };
