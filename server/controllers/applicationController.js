const appService = require('../services/applicationService');
const { success } = require('../utils/response');

const list = async (req, res, next) => {
  try {
    const result = await appService.list(req.user.id, req.query);
    success(res, result);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const app = await appService.create(req.user.id, req.body);
    success(res, { application: app }, 201);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const app = await appService.getById(req.params.id, req.user.id);
    success(res, { application: app });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const app = await appService.update(req.params.id, req.user.id, req.body);
    success(res, { application: app });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await appService.remove(req.params.id, req.user.id);
    success(res, null);
  } catch (err) {
    next(err);
  }
};

const getStageLogs = async (req, res, next) => {
  try {
    const logs = await appService.getStageLogs(req.params.id, req.user.id);
    success(res, { stage_logs: logs });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, getById, update, remove, getStageLogs };
