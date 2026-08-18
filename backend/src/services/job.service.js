const mongoose = require('mongoose');
const { ApiError } = require('../utils/apiError');
const {
  createJob,
  findJobsByUserId,
  findJobByIdAndUserId,
  updateJobByIdAndUserId,
  deleteJobByIdAndUserId,
  findUpcomingOAsByUserId,
  findJobsBySkills
} = require('../repositories/job.repository');

function normalizeJobPayload(payload = {}) {
  return {
    ...payload,
    company: payload.company?.trim(),
    role: payload.role?.trim(),
    location: payload.location?.trim() || '',
    salary: payload.salary?.trim() || '',
    notes: payload.notes?.trim() || '',
    jobLink: payload.jobLink?.trim() || '',
    referral: payload.referral?.trim() || '',
    recruiterName: payload.recruiterName?.trim() || '',
    recruiterEmail: payload.recruiterEmail?.trim() || '',
    resumeVersion: payload.resumeVersion?.trim() || 'v1.0 (Master)',
    coverLetterVersion: payload.coverLetterVersion?.trim() || 'Standard Tech',
    oaPlatform: payload.oaPlatform?.trim() || 'HackerRank',
    skills: Array.isArray(payload.skills) ? payload.skills : [],
    source: payload.source || 'manual',
    status: (payload.status || 'applied').toLowerCase()
  };
}

function validateObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid job id');
  }
}

async function listUserJobs(userId) {
  return findJobsByUserId(userId);
}

async function createUserJob(userId, payload) {
  const normalized = normalizeJobPayload(payload);

  if (!normalized.company || !normalized.role) {
    throw new ApiError(400, 'Company and role are required');
  }

  const initialFeedback = [
    {
      title: '✓ Applied',
      description: `Job application for ${normalized.role} at ${normalized.company} logged.`,
      statusStage: normalized.status,
      timestamp: new Date()
    }
  ];

  return createJob({ ...normalized, userId, companyFeedback: initialFeedback });
}

async function updateUserJob(userId, jobId, payload) {
  validateObjectId(jobId);

  const existingJob = await findJobByIdAndUserId(jobId, userId);
  if (!existingJob) {
    throw new ApiError(404, 'Job not found');
  }

  const normalized = normalizeJobPayload(payload);

  if (normalized.status && normalized.status !== existingJob.status) {
    const feedbackTitle = `Stage Moved: ${normalized.status.toUpperCase()}`;
    const feedbackDesc = payload.feedbackNotes || `Application stage advanced from ${existingJob.status} to ${normalized.status}.`;

    normalized.companyFeedback = [
      ...(existingJob.companyFeedback || []),
      {
        title: feedbackTitle,
        description: feedbackDesc,
        statusStage: normalized.status,
        timestamp: new Date()
      }
    ];
  }

  return updateJobByIdAndUserId(jobId, userId, normalized);
}

async function addCompanyFeedbackEntry(userId, jobId, feedbackPayload) {
  validateObjectId(jobId);
  const existingJob = await findJobByIdAndUserId(jobId, userId);
  if (!existingJob) {
    throw new ApiError(404, 'Job not found');
  }

  const newEntry = {
    title: feedbackPayload.title || 'Recruiter Status Update',
    description: feedbackPayload.description || '',
    statusStage: feedbackPayload.statusStage || existingJob.status,
    timestamp: new Date()
  };

  const updatedFeedback = [...(existingJob.companyFeedback || []), newEntry];
  return updateJobByIdAndUserId(jobId, userId, { companyFeedback: updatedFeedback });
}

async function removeUserJob(userId, jobId) {
  validateObjectId(jobId);
  const deletedJob = await deleteJobByIdAndUserId(jobId, userId);
  if (!deletedJob) {
    throw new ApiError(404, 'Job not found');
  }
  return deletedJob;
}

async function getUserJobById(userId, jobId) {
  validateObjectId(jobId);
  const job = await findJobByIdAndUserId(jobId, userId);
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }
  return job;
}

async function getUpcomingOAs(userId) {
  return findUpcomingOAsByUserId(userId);
}

async function matchJobsBySkills(userId, skills) {
  return findJobsBySkills(userId, skills);
}

async function getJobPipeline(userId) {
  const jobs = await findJobsByUserId(userId);
  const pipeline = { wishlist: [], applied: [], OA: [], interview: [], HR: [], rejected: [], offer: [] };
  jobs.forEach((job) => {
    if (pipeline[job.status]) pipeline[job.status].push(job);
  });
  return pipeline;
}

async function getUserJobAnalytics(userId) {
  const jobs = await findJobsByUserId(userId);
  const total = jobs.length;

  if (!total) {
    return {
      total: 0,
      applied: 0,
      interviews: 0,
      offers: 0,
      rejections: 0,
      responseRate: 0,
      interviewRate: 0,
      offerRate: 0,
      rejectionRate: 0,
      avgResponseTimeDays: 0
    };
  }

  const responses = jobs.filter((j) => !['saved', 'applied', 'wishlist'].includes(j.status)).length;
  const interviews = jobs.filter((j) => ['technical_1', 'technical_2', 'system_design', 'manager', 'hr', 'interview'].includes(j.status)).length;
  const offers = jobs.filter((j) => ['offer', 'accepted'].includes(j.status)).length;
  const rejections = jobs.filter((j) => j.status === 'rejected').length;

  // Calculate real average response time from job feedback logs
  let totalResponseTimeMs = 0;
  let responseCount = 0;

  jobs.forEach((job) => {
    if (Array.isArray(job.companyFeedback) && job.companyFeedback.length > 1) {
      const appliedTime = new Date(job.createdAt).getTime();
      const firstResponse = job.companyFeedback.find((fb) => fb.statusStage && fb.statusStage !== 'applied' && fb.statusStage !== 'saved');
      if (firstResponse && firstResponse.timestamp) {
        const responseTime = new Date(firstResponse.timestamp).getTime();
        if (responseTime > appliedTime) {
          totalResponseTimeMs += (responseTime - appliedTime);
          responseCount++;
        }
      }
    }
  });

  const avgResponseTimeDays = responseCount > 0
    ? Math.max(1, Math.round((totalResponseTimeMs / (responseCount * 1000 * 60 * 60 * 24)) * 10) / 10)
    : 0;

  return {
    total,
    applied: jobs.filter((j) => j.status === 'applied').length,
    interviews,
    offers,
    rejections,
    responseRate: Math.round((responses / total) * 100),
    interviewRate: Math.round((interviews / total) * 100),
    offerRate: Math.round((offers / total) * 100),
    rejectionRate: Math.round((rejections / total) * 100),
    avgResponseTimeDays
  };
}

module.exports = {
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
};