const { asyncHandler } = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/apiResponse');
const {
  storeResume,
  listUserResumes,
  getUserResume,
  removeUserResume,
  analyzeResumeInput,
  listUserReports,
  getUserResumeReports,
  getLatestUserResumeReport
} = require('../services/resume.service');

const uploadResume = asyncHandler(async (request, response) => {
  console.log('[RESUME DEBUG] Upload request received');
  console.log('[RESUME DEBUG] User ID:', request.user?.id);
  console.log('[RESUME DEBUG] File name:', request.file?.originalname);
  console.log('[RESUME DEBUG] File size:', request.file?.size);
  console.log('[RESUME DEBUG] Mime type:', request.file?.mimetype);
  console.log('[RESUME DEBUG] Target JD present:', Boolean(request.body.targetJobDescription));
  console.log('[RESUME DEBUG] Extracted text length:', (request.body.extractedText || '').length);

  const extractedText = request.body.extractedText || '';
  const result = await storeResume(
    request.user.id,
    request.file,
    extractedText,
    request.body.targetJobDescription || ''
  );

  response.status(201).json(new ApiResponse(201, result, 'Resume uploaded and analyzed'));
});

const analyzeResume = asyncHandler(async (request, response) => {
  const result = await analyzeResumeInput({
    userId: request.user.id,
    resumeId: request.body.resumeId,
    file: request.file,
    extractedText: request.body.extractedText,
    targetJobDescription: request.body.targetJobDescription || ''
  });

  response.status(200).json(new ApiResponse(200, result, 'Resume analyzed'));
});

const listResumes = asyncHandler(async (request, response) => {
  const resumes = await listUserResumes(request.user.id);
  response.status(200).json(new ApiResponse(200, resumes, 'Resumes loaded'));
});

const getResume = asyncHandler(async (request, response) => {
  const resume = await getUserResume(request.user.id, request.params.id);
  response.status(200).json(new ApiResponse(200, resume, 'Resume loaded'));
});

const deleteResume = asyncHandler(async (request, response) => {
  await removeUserResume(request.user.id, request.params.id);
  response.status(200).json(new ApiResponse(200, {}, 'Resume deleted'));
});

const listReports = asyncHandler(async (request, response) => {
  const reports = await listUserReports(request.user.id);
  response.status(200).json(new ApiResponse(200, reports, 'Reports loaded'));
});

const getResumeReports = asyncHandler(async (request, response) => {
  const reports = await getUserResumeReports(request.user.id, request.params.id);
  response.status(200).json(new ApiResponse(200, reports, 'Resume reports loaded'));
});

const getLatestReport = asyncHandler(async (request, response) => {
  const report = await getLatestUserResumeReport(request.user.id);
  response.status(200).json(new ApiResponse(200, report, 'Latest report loaded'));
});

module.exports = {
  uploadResume,
  analyzeResume,
  listResumes,
  getResume,
  deleteResume,
  listReports,
  getResumeReports,
  getLatestReport
};
