const { getNormalizedActivity } = require('../services/activity.service');
const { ApiError } = require('../utils/apiError');

async function getUserActivity(req, res, next) {
  try {
    const userId = req.user.id || req.user._id;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const events = await getNormalizedActivity(userId);
    
    res.status(200).json({
      success: true,
      data: {
        events
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getUserActivity
};
