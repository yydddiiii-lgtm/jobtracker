const db = require('../db');

const create = async ({ applicationId, fromStage, toStage, note = null }) => {
  const { rows } = await db.query(
    `INSERT INTO stage_logs (application_id, from_stage, to_stage, note)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [applicationId, fromStage || null, toStage, note]
  );
  return rows[0];
};

const findByApplication = async (applicationId) => {
  const { rows } = await db.query(
    'SELECT * FROM stage_logs WHERE application_id = $1 ORDER BY changed_at ASC',
    [applicationId]
  );
  return rows;
};

module.exports = { create, findByApplication };
