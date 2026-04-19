const offerRepo = require('../repositories/offerRepository');
const appRepo = require('../repositories/applicationRepository');
const { Errors } = require('../utils/errors');

const ALLOWED_FIELDS = ['base_salary', 'city', 'department', 'headcount_type', 'offer_deadline', 'is_accepted', 'notes'];

const verifyOfferOwnership = async (offerId, userId) => {
  const offer = await offerRepo.findById(offerId);
  if (!offer) throw Errors.notFound('Offer not found');
  const app = await appRepo.findById(offer.application_id, userId);
  if (!app) throw Errors.forbidden('Access denied');
  return offer;
};

const listAll = async (userId) => offerRepo.findAll(userId);

const createForApplication = async (applicationId, userId, body) => {
  const app = await appRepo.findById(applicationId, userId);
  if (!app) throw Errors.notFound('Application not found');
  const existing = await offerRepo.findByApplication(applicationId);
  if (existing) throw Errors.conflict('Offer already exists for this application');
  return offerRepo.create({ applicationId, ...body });
};

const update = async (id, userId, body) => {
  await verifyOfferOwnership(id, userId);
  const fields = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) fields[key] = body[key];
  }
  return offerRepo.update(id, fields);
};

const updateByApplication = async (applicationId, userId, body) => {
  const app = await appRepo.findById(applicationId, userId);
  if (!app) throw Errors.notFound('Application not found');
  const offer = await offerRepo.findByApplication(applicationId);
  if (!offer) throw Errors.notFound('Offer not found for this application');
  const fields = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) fields[key] = body[key];
  }
  return offerRepo.update(offer.id, fields);
};

module.exports = { listAll, createForApplication, update, updateByApplication };
