const express = require('express');
const { getProfile, getSubmissions, syncProfile } = require('../controllers/leetcode.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/profile/:username', getProfile);
router.get('/submissions/:username', getSubmissions);
router.post('/sync', protect, syncProfile);

module.exports = { leetcodeRoutes: router };
