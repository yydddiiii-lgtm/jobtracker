const notifService = require('../services/notificationService');
const { success } = require('../utils/response');

const list = async (req, res, next) => {
  try {
    const notifications = await notifService.list(req.user.id, req.query);
    success(res, { notifications });
  } catch (err) {
    next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    const notification = await notifService.markRead(req.params.id, req.user.id);
    success(res, { notification });
  } catch (err) {
    next(err);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    const result = await notifService.markAllRead(req.user.id);
    success(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = { list, markRead, markAllRead };
