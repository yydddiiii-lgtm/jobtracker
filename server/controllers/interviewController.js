const interviewService = require('../services/interviewService');
const { success } = require('../utils/response');

const list = async (req, res, next) => {
  try {
    const interviews = await interviewService.listForApplication(req.params.id, req.user.id);
    success(res, { interviews });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const interview = await interviewService.create(req.params.id, req.user.id, req.body);
    success(res, { interview }, 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const interview = await interviewService.update(req.params.id, req.user.id, req.body);
    success(res, { interview });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await interviewService.remove(req.params.id, req.user.id);
    success(res, null);
  } catch (err) {
    next(err);
  }
};

const listAll = async (req, res, next) => {
  try {
    const interviews = await interviewService.listAll(req.user.id);
    success(res, { interviews });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, listAll, create, update, remove };
