const { asyncHandler } = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/apiResponse');
const { getDashboardSummary } = require('../services/dashboard.service');

const getDashboard = asyncHandler(async (request, response) => {
  const summary = await getDashboardSummary(request.user.id);

  response.status(200).json(
    new ApiResponse(200, summary, 'Dashboard data loaded')
  );
});

module.exports = { getDashboard };