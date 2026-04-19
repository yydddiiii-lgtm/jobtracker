const notifRepo = require('../repositories/notificationRepository');
const { Errors } = require('../utils/errors');

const list = async (userId, query) => {
  let isRead;
  if (query.is_read === 'true') isRead = true;
  else if (query.is_read === 'false') isRead = false;
  return notifRepo.findAll(userId, isRead);
};

const markRead = async (id, userId) => {
  const notif = await notifRepo.markRead(id, userId);
  if (!notif) throw Errors.notFound('Notification not found');
  return notif;
};

const markAllRead = async (userId) => {
  const updated = await notifRepo.markAllRead(userId);
  return { updated };
};

module.exports = { list, markRead, markAllRead };
