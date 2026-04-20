const offerService = require('../services/offerService');
const { success } = require('../utils/response');

const list = async (req, res, next) => {
  try {
    const offers = await offerService.listAll(req.user.id);
    success(res, { offers });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const offer = await offerService.createForApplication(req.params.id, req.user.id, req.body);
    success(res, { offer }, 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const offer = await offerService.update(req.params.id, req.user.id, req.body);
    success(res, { offer });
  } catch (err) {
    next(err);
  }
};

const updateByApplication = async (req, res, next) => {
  try {
    const offer = await offerService.updateByApplication(req.params.id, req.user.id, req.body);
    success(res, { offer });
  } catch (err) {
    next(err);
  }
};

const getByApplication = async (req, res, next) => {
  try {
    const offer = await offerService.getByApplication(req.params.id, req.user.id);
    success(res, { offer: offer ?? null });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, getByApplication, update, updateByApplication };
