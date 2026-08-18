const { Resume } = require('../models/Resume');
const { ResumeReport } = require('../models/ResumeReport');

async function createResume(resumeData) {
  return Resume.create(resumeData);
}

async function findResumesByUserId(userId) {
  return Resume.find({ userId }).sort({ createdAt: -1 });
}

async function findResumeByIdAndUserId(resumeId, userId) {
  return Resume.findOne({ _id: resumeId, userId });
}

async function deleteResumeByIdAndUserId(resumeId, userId) {
  return Resume.findOneAndDelete({ _id: resumeId, userId });
}

async function updateResumeScore(resumeId, userId, atsScore, extractedText) {
  return Resume.findOneAndUpdate(
    { _id: resumeId, userId },
    { atsScore, extractedText },
    { new: true, runValidators: true }
  );
}

async function createResumeReport(reportData) {
  return ResumeReport.create(reportData);
}

async function findReportsByUserId(userId) {
  return ResumeReport.find({ userId }).sort({ createdAt: -1 });
}

async function findLatestReportByUserId(userId) {
  return ResumeReport.findOne({ userId }).sort({ createdAt: -1 });
}

async function findReportsByResumeId(resumeId, userId) {
  return ResumeReport.find({ resumeId, userId }).sort({ createdAt: -1 });
}

module.exports = {
  createResume,
  findResumesByUserId,
  findResumeByIdAndUserId,
  deleteResumeByIdAndUserId,
  updateResumeScore,
  createResumeReport,
  findReportsByUserId,
  findLatestReportByUserId,
  findReportsByResumeId
};