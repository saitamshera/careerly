const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const { getUserActivity } = require('../controllers/activity.controller');

const router = express.Router();

router.use(protect);
router.get('/', getUserActivity);

module.exports = { activityRoutes: router };
