const { asyncHandler } = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/apiResponse');
const {
  listUserJobs,
  createUserJob,
  updateUserJob,
  addCompanyFeedbackEntry,
  removeUserJob,
  getUserJobById,
  getUpcomingOAs,
  matchJobsBySkills,
  getJobPipeline,
  getUserJobAnalytics
} = require('../services/job.service');
const { findUserById } = require('../repositories/user.repository');

const getJobsHandler = asyncHandler(async (req, res) => {
  const jobs = await listUserJobs(req.user.id);
  res.status(200).json(new ApiResponse(200, jobs, 'Jobs fetched successfully'));
});

const getJobByIdHandler = asyncHandler(async (req, res) => {
  const job = await getUserJobById(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, job, 'Job fetched successfully'));
});

const createJobHandler = asyncHandler(async (req, res) => {
  const job = await createUserJob(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, job, 'Job created successfully'));
});

const updateJobHandler = asyncHandler(async (req, res) => {
  const job = await updateUserJob(req.user.id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, job, 'Job updated successfully'));
});

const addFeedbackHandler = asyncHandler(async (req, res) => {
  const job = await addCompanyFeedbackEntry(req.user.id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, job, 'Feedback added successfully'));
});

const deleteJobHandler = asyncHandler(async (req, res) => {
  const job = await removeUserJob(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, job, 'Job deleted successfully'));
});

const getUpcomingOAsHandler = asyncHandler(async (req, res) => {
  const upcomingOAs = await getUpcomingOAs(req.user.id);
  res.status(200).json(new ApiResponse(200, upcomingOAs, 'Upcoming OAs fetched'));
});

const matchSkillsHandler = asyncHandler(async (req, res) => {
  let skills = req.query.skills ? req.query.skills.split(',') : null;
  if (!skills) {
    const user = await findUserById(req.user.id);
    skills = user?.skills || [];
  }
  const matchedJobs = await matchJobsBySkills(req.user.id, skills);
  res.status(200).json(new ApiResponse(200, matchedJobs, 'Jobs matched by skills fetched'));
});

const getPipelineHandler = asyncHandler(async (req, res) => {
  const pipeline = await getJobPipeline(req.user.id);
  res.status(200).json(new ApiResponse(200, pipeline, 'Job pipeline fetched'));
});

const getAnalyticsHandler = asyncHandler(async (req, res) => {
  const analytics = await getUserJobAnalytics(req.user.id);
  res.status(200).json(new ApiResponse(200, analytics, 'Job analytics fetched'));
});

module.exports = {
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
};