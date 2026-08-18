const { getUnifiedJobReadiness } = require('../services/readiness.service');
const { User } = require('../models/User');
const { ApiResponse } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

const getReadiness = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId).lean();

  const targetOverride = {
    targetRole: req.query.role || user?.targetRole || 'Software Development Engineer',
    targetCompany: req.query.company || user?.targetCompany || 'General Tech',
    jobDescription: req.query.jobDescription || ''
  };

  const result = await getUnifiedJobReadiness(userId, targetOverride);
  return res.status(200).json(new ApiResponse(200, result, 'Unified job readiness fetched successfully'));
});

const updateTarget = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { targetRole, targetCompany, jobDescription } = req.body;

  await User.findByIdAndUpdate(userId, {
    targetRole: targetRole?.trim() || 'Software Development Engineer',
    targetCompany: targetCompany?.trim() || ''
  });

  const result = await getUnifiedJobReadiness(userId, {
    targetRole,
    targetCompany,
    jobDescription
  });

  return res.status(200).json(new ApiResponse(200, result, 'Target updated and readiness recalculated successfully'));
});

module.exports = {
  getReadiness,
  updateTarget
};
