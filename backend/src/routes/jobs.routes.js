const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createJobSchema, updateJobSchema } = require('../schemas/jobs.schema');
const {
  getJobsHandler,
  getJobByIdHandler,
  createJobHandler,
  updateJobHandler,
  addFeedbackHandler,
  deleteJobHandler,
  getUpcomingOAsHandler,
  matchSkillsHandler,
  getPipelineHandler,
  getAnalyticsHandler
} = require('../controllers/job.controller');

const jobRoutes = express.Router();

jobRoutes.use(protect);

jobRoutes.get('/', getJobsHandler);
jobRoutes.get('/upcoming-oas', getUpcomingOAsHandler);
jobRoutes.get('/match-skills', matchSkillsHandler);
jobRoutes.get('/pipeline', getPipelineHandler);
jobRoutes.get('/analytics', getAnalyticsHandler);
jobRoutes.get('/:id', getJobByIdHandler);
jobRoutes.post('/', validate(createJobSchema), createJobHandler);
jobRoutes.post('/:id/feedback', addFeedbackHandler);
jobRoutes.put('/:id', validate(updateJobSchema), updateJobHandler);
jobRoutes.delete('/:id', deleteJobHandler);

module.exports = { jobRoutes, jobsRoutes: jobRoutes };