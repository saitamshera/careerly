const express = require('express');
const { getProfile, getRepos, getEvents, syncProfile, togglePinRepo } = require('../controllers/github.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/profile/:username', getProfile);
router.get('/repos/:username', getRepos);
router.get('/events/:username', getEvents);
router.post('/sync', protect, syncProfile);
router.post('/pin-repo', protect, togglePinRepo);

module.exports = { githubRoutes: router };
