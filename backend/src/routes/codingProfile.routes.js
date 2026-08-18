const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const { getProfiles, upsertProfile, deleteProfile } = require('../controllers/codingProfile.controller');

const codingProfileRoutes = express.Router();

codingProfileRoutes.use(protect);

codingProfileRoutes.get('/', getProfiles);
codingProfileRoutes.post('/', upsertProfile);
codingProfileRoutes.delete('/:profileId', deleteProfile);

module.exports = { codingProfileRoutes };
