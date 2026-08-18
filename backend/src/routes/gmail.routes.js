const express = require('express');
const { getAuthUrl, handleCallback, syncEmails, getUpdates, disconnect } = require('../controllers/gmail.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/auth-url', protect, getAuthUrl);
router.get('/callback', handleCallback);
router.get('/sync', protect, syncEmails);
router.get('/updates', protect, getUpdates);
router.delete('/disconnect', protect, disconnect);

module.exports = { gmailRoutes: router };
