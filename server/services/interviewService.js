const interviewRepo = require('../repositories/interviewRepository');
const appRepo = require('../repositories/applicationRepository');
const { Errors } = require('../utils/errors');

const ALLOWED_FIELDS = ['round', 'interview_time', 'interview_type', 'location', 'interviewer', 'prep_notes', 'result'];

const verifyAppOwnership = async (applicationId, userId) => {
  const app = await appRepo.findById(applicationId, userId);
  if (!app) throw Errors.notFound('Application not found');
  return app;
};

const verifyInterviewOwnership = async (interviewId, userId) => {
  const interview = await interviewRepo.findById(interviewId);
  if (!interview) throw Errors.notFound('Interview not found');
  await verifyAppOwnership(interview.application_id, userId);
  return interview;
};

const listForApplication = async (applicationId, userId) => {
  await verifyAppOwnership(applicationId, userId);
  return interviewRepo.findByApplication(applicationId);
};

const create = async (applicationId, userId, body) => {
  await verifyAppOwnership(applicationId, userId);
  if (!body.round || !body.interview_time) {
    throw Errors.validation('round and interview_time are required');
  }
  return interviewRepo.create({ applicationId, ...body });
};

const update = async (id, userId, body) => {
  await verifyInterviewOwnership(id, userId);
  const fields = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) fields[key] = body[key];
  }
  return interviewRepo.update(id, fields);
};

const remove = async (id, userId) => {
  await verifyInterviewOwnership(id, userId);
  await interviewRepo.remove(id);
};

const listAll = async (userId) => interviewRepo.findAllByUser(userId);

module.exports = { listForApplication, listAll, create, update, remove };
