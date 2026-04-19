const appRepo = require('../repositories/applicationRepository');
const stageLogRepo = require('../repositories/stageLogRepository');
const offerRepo = require('../repositories/offerRepository');
const { Errors } = require('../utils/errors');

const ALLOWED_FIELDS = ['company_name', 'position', 'job_type', 'stage', 'city',
  'salary_min', 'salary_max', 'deadline', 'job_url', 'notes', 'priority', 'referral_code'];

const list = async (userId, query) => {
  const { stage, job_type, sort, order, page, limit, no_pagination } = query;
  return appRepo.findAll({
    userId, stage, job_type, sort, order,
    page: parseInt(page) || 1,
    limit: Math.min(parseInt(limit) || 20, 100),
    noPagination: no_pagination === 'true',
  });
};

const create = async (userId, body) => {
  if (!body.company_name || !body.position) {
    throw Errors.validation('company_name and position are required');
  }
  const app = await appRepo.create({ userId, ...body });
  await stageLogRepo.create({ applicationId: app.id, fromStage: null, toStage: app.stage });
  return app;
};

const getById = async (id, userId) => {
  const app = await appRepo.findById(id, userId);
  if (!app) throw Errors.notFound('Application not found');
  return app;
};

const update = async (id, userId, body) => {
  const existing = await appRepo.findById(id, userId);
  if (!existing) throw Errors.notFound('Application not found');

  const fields = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) fields[key] = body[key];
  }

  if (Object.keys(fields).length === 0) return existing;

  const updated = await appRepo.update(id, userId, fields);
  if (!updated) throw Errors.notFound('Application not found');

  if (fields.stage && fields.stage !== existing.stage) {
    await stageLogRepo.create({
      applicationId: id,
      fromStage: existing.stage,
      toStage: fields.stage,
    });
    if (fields.stage === 'offer') {
      const existing_offer = await offerRepo.findByApplication(id);
      if (!existing_offer) {
        await offerRepo.create({ applicationId: id });
      }
    }
  }
  return updated;
};

const remove = async (id, userId) => {
  const deleted = await appRepo.remove(id, userId);
  if (!deleted) throw Errors.notFound('Application not found');
};

const getStageLogs = async (id, userId) => {
  const app = await appRepo.findById(id, userId);
  if (!app) throw Errors.notFound('Application not found');
  return stageLogRepo.findByApplication(id);
};

module.exports = { list, create, getById, update, remove, getStageLogs };
