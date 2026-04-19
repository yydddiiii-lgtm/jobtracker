const statsService = require('../services/statsService');
const { success } = require('../utils/response');

const overview = async (req, res, next) => {
  try {
    const data = await statsService.overview(req.user.id);
    success(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = { overview };
