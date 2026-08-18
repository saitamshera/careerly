const express = require('express');
const { getProfile, updateProfile, syncLeetCode } = require('../controllers/profile.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', getProfile);
router.put('/', updateProfile);
router.post('/sync-leetcode', syncLeetCode);

module.exports = { profileRoutes: router };
