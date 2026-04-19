const documentService = require('../services/documentService');
const { success } = require('../utils/response');

const list = async (req, res, next) => {
  try {
    const documents = await documentService.listForApplication(req.params.id, req.user.id);
    success(res, { documents });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const document = await documentService.create(req.params.id, req.user.id, req.body);
    success(res, { document }, 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const document = await documentService.update(req.params.id, req.user.id, req.body);
    success(res, { document });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await documentService.remove(req.params.id, req.user.id);
    success(res, null);
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, update, remove };
