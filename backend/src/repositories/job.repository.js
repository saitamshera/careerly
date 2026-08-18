const { Job } = require('../models/Job');

async function createJob(jobData) {
  return Job.create(jobData);
}

async function findJobsByUserId(userId) {
  return Job.find({ userId }).sort({ createdAt: -1 });
}

async function findJobByIdAndUserId(jobId, userId) {
  return Job.findOne({ _id: jobId, userId });
}

async function updateJobByIdAndUserId(jobId, userId, updateData) {
  return Job.findOneAndUpdate({ _id: jobId, userId }, updateData, { new: true, runValidators: true });
}

async function deleteJobByIdAndUserId(jobId, userId) {
  return Job.findOneAndDelete({ _id: jobId, userId });
}

async function findUpcomingOAsByUserId(userId) {
  return Job.find({ userId, oaDate: { $gt: new Date() } }).sort({ oaDate: 1 });
}

async function findJobsBySkills(userId, skills) {
  return Job.find({ userId, skills: { $in: skills } }).sort({ updatedAt: -1 });
}

async function getJobAnalyticsByUserId(userId) {
  return Job.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
}

module.exports = {
  createJob,
  findJobsByUserId,
  findJobByIdAndUserId,
  updateJobByIdAndUserId,
  deleteJobByIdAndUserId,
  findUpcomingOAsByUserId,
  findJobsBySkills,
  getJobAnalyticsByUserId
};