const db = require('../db');

const stageCounts = async (userId) => {
  const { rows } = await db.query(
    `SELECT stage, COUNT(*)::int AS count
     FROM applications
     WHERE user_id = $1
     GROUP BY stage`,
    [userId]
  );
  return rows;
};

const offerRate = async (userId) => {
  const { rows } = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE stage NOT IN ('pending', 'withdrawn'))::int AS total_applied,
       COUNT(*) FILTER (WHERE stage = 'offer')::int                      AS total_offers
     FROM applications
     WHERE user_id = $1`,
    [userId]
  );
  return rows[0];
};

const weeklyTrend = async (userId) => {
  const { rows } = await db.query(
    `SELECT DATE_TRUNC('week', created_at) AS week, COUNT(*)::int AS count
     FROM applications
     WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '12 weeks'
     GROUP BY week
     ORDER BY week ASC`,
    [userId]
  );
  return rows;
};

const byJobType = async (userId) => {
  const { rows } = await db.query(
    `SELECT job_type, COUNT(*)::int AS count
     FROM applications
     WHERE user_id = $1
     GROUP BY job_type`,
    [userId]
  );
  return rows;
};

module.exports = { stageCounts, offerRate, weeklyTrend, byJobType };
