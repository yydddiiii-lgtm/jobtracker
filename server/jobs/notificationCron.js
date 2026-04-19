const cron = require('node-cron');
const db = require('../db');
const notifRepo = require('../repositories/notificationRepository');

const push = (userId, type, title, content, relatedId) =>
  notifRepo.create({ userId, type, title, content, relatedId });

const scanDeadlines = async () => {
  const today = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];
  const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

  const todayStr  = fmt(today);
  const in1dStr   = fmt(addDays(today, 1));
  const in3dStr   = fmt(addDays(today, 3));

  const activeFilter = `stage NOT IN ('offer','rejected','withdrawn')`;

  const [todayApps, in1dApps, in3dApps, offerApps] = await Promise.all([
    db.query(`SELECT id, user_id, company_name, position FROM applications WHERE deadline = $1 AND ${activeFilter}`, [todayStr]),
    db.query(`SELECT id, user_id, company_name, position FROM applications WHERE deadline = $1 AND ${activeFilter}`, [in1dStr]),
    db.query(`SELECT id, user_id, company_name, position FROM applications WHERE deadline = $1 AND ${activeFilter}`, [in3dStr]),
    db.query(
      `SELECT o.id, a.user_id, a.company_name, a.position
       FROM offers o JOIN applications a ON a.id = o.application_id
       WHERE o.offer_deadline = $1 AND o.is_accepted IS NULL`,
      [in3dStr]
    ),
  ]);

  const tasks = [
    ...todayApps.rows.map((a) => push(a.user_id, 'deadline_today',
      `截止日到期：${a.company_name}`,
      `${a.company_name} - ${a.position} 今天截止投递`, a.id)),
    ...in1dApps.rows.map((a) => push(a.user_id, 'deadline_1d',
      `截止提醒：${a.company_name}`,
      `${a.company_name} - ${a.position} 明天截止投递`, a.id)),
    ...in3dApps.rows.map((a) => push(a.user_id, 'deadline_3d',
      `截止提醒：${a.company_name}`,
      `${a.company_name} - ${a.position} 3天后截止投递`, a.id)),
    ...offerApps.rows.map((o) => push(o.user_id, 'offer_deadline',
      `Offer确认提醒：${o.company_name}`,
      `${o.company_name} - ${o.position} 的Offer需在3天内确认`, o.id)),
  ];

  await Promise.allSettled(tasks);
};

const scanInterviews = async () => {
  const now = Date.now();
  const window = 30 * 60 * 1000; // ±30 min around target time

  const target2h  = new Date(now + 2 * 60 * 60 * 1000);
  const target24h = new Date(now + 24 * 60 * 60 * 1000);

  const [res2h, res24h] = await Promise.all([
    db.query(
      `SELECT i.id, a.user_id, a.company_name, a.position, i.round
       FROM interviews i JOIN applications a ON a.id = i.application_id
       WHERE i.interview_time BETWEEN $1 AND $2 AND i.result = 'pending'`,
      [new Date(target2h - window), new Date(+target2h + window)]
    ),
    db.query(
      `SELECT i.id, a.user_id, a.company_name, a.position, i.round
       FROM interviews i JOIN applications a ON a.id = i.application_id
       WHERE i.interview_time BETWEEN $1 AND $2 AND i.result = 'pending'`,
      [new Date(target24h - window), new Date(+target24h + window)]
    ),
  ]);

  const tasks = [
    ...res2h.rows.map((r) => push(r.user_id, 'interview_2h',
      `面试提醒：${r.company_name}`,
      `${r.company_name} - ${r.position} ${r.round} 面试2小时后开始`, r.id)),
    ...res24h.rows.map((r) => push(r.user_id, 'interview_24h',
      `面试提醒：${r.company_name}`,
      `${r.company_name} - ${r.position} ${r.round} 面试24小时后开始`, r.id)),
  ];

  await Promise.allSettled(tasks);
};

const init = () => {
  cron.schedule('0 8 * * *', async () => {
    try { await scanDeadlines(); }
    catch (err) { console.error('[cron:deadline]', err); }
  });

  cron.schedule('0 * * * *', async () => {
    try { await scanInterviews(); }
    catch (err) { console.error('[cron:interview]', err); }
  });
};

module.exports = { init };
