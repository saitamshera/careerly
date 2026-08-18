const { asyncHandler } = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/apiResponse');
const { ApiError } = require('../utils/apiError');
const gmailService = require('../services/gmail.service');
const { env } = require('../config/env');

const getAuthUrl = asyncHandler(async (req, res) => {
  const url = await gmailService.getAuthUrl(req.user.id);
  return res.status(200).json(new ApiResponse(200, { url }, 'Auth URL generated successfully'));
});

const handleCallback = asyncHandler(async (req, res) => {
  const { code, state } = req.query;
  if (!state) throw new ApiError(400, 'State (userId) missing from callback');
  
  await gmailService.handleCallback(code, state);
  return res.redirect(`${env.CLIENT_URL}/dashboard?gmail_connected=true`);
});

const syncEmails = asyncHandler(async (req, res) => {
  const emails = await gmailService.syncEmails(req.user.id);
  return res.status(200).json(new ApiResponse(200, emails, 'Emails synced successfully'));
});

const getUpdates = asyncHandler(async (req, res) => {
  const updates = await gmailService.getRecentUpdates(req.user.id);
  return res.status(200).json(new ApiResponse(200, updates, 'Recent updates fetched successfully'));
});

const disconnect = asyncHandler(async (req, res) => {
  await gmailService.disconnect(req.user.id);
  return res.status(200).json(new ApiResponse(200, {}, 'Gmail disconnected successfully'));
});

module.exports = {
  getAuthUrl,
  handleCallback,
  syncEmails,
  getUpdates,
  disconnect
};
