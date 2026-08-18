const { asyncHandler } = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/apiResponse');
const {
  listUserProblems,
  createUserProblem,
  updateUserProblem,
  removeUserProblem,
  getUserProblemById,
  getUserDsaStats,
  getTodayProblems,
  getStreak
} = require('../services/dsa.service');

const getDsaProblemsHandler = asyncHandler(async (req, res) => {
  const problems = await listUserProblems(req.user.id);
  res.status(200).json(new ApiResponse(200, problems, 'DSA problems fetched successfully'));
});

const getDsaProblemByIdHandler = asyncHandler(async (req, res) => {
  const problem = await getUserProblemById(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, problem, 'DSA problem fetched successfully'));
});

const createDsaProblemHandler = asyncHandler(async (req, res) => {
  const problem = await createUserProblem(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, problem, 'DSA problem created successfully'));
});

const updateDsaProblemHandler = asyncHandler(async (req, res) => {
  const problem = await updateUserProblem(req.user.id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, problem, 'DSA problem updated successfully'));
});

const deleteDsaProblemHandler = asyncHandler(async (req, res) => {
  const problem = await removeUserProblem(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, problem, 'DSA problem deleted successfully'));
});

const getDsaStatsHandler = asyncHandler(async (req, res) => {
  const stats = await getUserDsaStats(req.user.id);
  res.status(200).json(new ApiResponse(200, stats, 'DSA stats fetched successfully'));
});

const getTodayProblemsHandler = asyncHandler(async (req, res) => {
  const data = await getTodayProblems(req.user.id);
  res.status(200).json(new ApiResponse(200, data, "Today's DSA problems fetched"));
});

const getStreakHandler = asyncHandler(async (req, res) => {
  const streak = await getStreak(req.user.id);
  res.status(200).json(new ApiResponse(200, streak, 'DSA streak fetched'));
});

module.exports = {
  getDsaProblemsHandler,
  getDsaProblemByIdHandler,
  createDsaProblemHandler,
  updateDsaProblemHandler,
  deleteDsaProblemHandler,
  getDsaStatsHandler,
  getTodayProblemsHandler,
  getStreakHandler
};