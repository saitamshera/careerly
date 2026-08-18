const { DsaProblem } = require('../models/DsaProblem');

async function createDsaProblem(problemData) {
  return DsaProblem.create(problemData);
}

async function findDsaProblemsByUserId(userId) {
  return DsaProblem.find({ userId }).sort({ updatedAt: -1 });
}

async function findDsaProblemByIdAndUserId(problemId, userId) {
  return DsaProblem.findOne({ _id: problemId, userId });
}

async function updateDsaProblemByIdAndUserId(problemId, userId, updateData) {
  return DsaProblem.findOneAndUpdate({ _id: problemId, userId }, updateData, { new: true, runValidators: true });
}

async function deleteDsaProblemByIdAndUserId(problemId, userId) {
  return DsaProblem.findOneAndDelete({ _id: problemId, userId });
}

async function findTodayProblemsByUserId(userId, startOfDay, endOfDay) {
  return DsaProblem.find({
    userId,
    solvedAt: { $gte: startOfDay, $lte: endOfDay },
    status: 'solved'
  }).sort({ solvedAt: -1 });
}

async function getDsaAggregatesByUserId(userId) {
  return DsaProblem.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: { topic: '$topic', status: '$status', difficulty: '$difficulty' },
        count: { $sum: 1 },
        totalTime: { $sum: '$timeTaken' }
      }
    }
  ]);
}

module.exports = {
  createDsaProblem,
  findDsaProblemsByUserId,
  findDsaProblemByIdAndUserId,
  updateDsaProblemByIdAndUserId,
  deleteDsaProblemByIdAndUserId,
  findTodayProblemsByUserId,
  getDsaAggregatesByUserId
};