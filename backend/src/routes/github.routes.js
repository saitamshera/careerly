const express = require('express');
const {
  getProfile,
  getRepos,
  getEvents,
  getContributions,
  syncProfile,
  togglePinRepo,
  handleWebhook
} = require('../controllers/github.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/profile/:username', getProfile);
router.get('/repos/:username', getRepos);
router.get('/events/:username', getEvents);
router.get('/contributions/:username', getContributions);
router.post('/sync', protect, syncProfile);
router.post('/pin-repo', protect, togglePinRepo);
router.post('/webhook', handleWebhook);

module.exports = { githubRoutes: router };
