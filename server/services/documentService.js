const documentRepo = require('../repositories/documentRepository');
const appRepo = require('../repositories/applicationRepository');
const { Errors } = require('../utils/errors');

const ALLOWED_FIELDS = ['doc_type', 'is_submitted', 'notes'];

const verifyAppOwnership = async (applicationId, userId) => {
  const app = await appRepo.findById(applicationId, userId);
  if (!app) throw Errors.notFound('Application not found');
  return app;
};

const verifyDocOwnership = async (docId, userId) => {
  const doc = await documentRepo.findById(docId);
  if (!doc) throw Errors.notFound('Document not found');
  await verifyAppOwnership(doc.application_id, userId);
  return doc;
};

const listForApplication = async (applicationId, userId) => {
  await verifyAppOwnership(applicationId, userId);
  return documentRepo.findByApplication(applicationId);
};

const create = async (applicationId, userId, body) => {
  await verifyAppOwnership(applicationId, userId);
  if (!body.doc_type) throw Errors.validation('doc_type is required');
  return documentRepo.create({ applicationId, ...body });
};

const update = async (id, userId, body) => {
  const doc = await verifyDocOwnership(id, userId);
  const fields = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) fields[key] = body[key];
  }
  return documentRepo.update(id, fields, doc.is_submitted);
};

const remove = async (id, userId) => {
  await verifyDocOwnership(id, userId);
  await documentRepo.remove(id);
};

module.exports = { listForApplication, create, update, remove };
