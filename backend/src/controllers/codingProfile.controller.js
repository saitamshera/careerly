const {
  getUserCodingProfiles,
  upsertUserCodingProfile,
  syncSingleProfile,
  syncAllUserProfiles,
  removeUserCodingProfile
} = require('../services/codingProfile.service');

async function getProfiles(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    const profiles = await getUserCodingProfiles(userId);
    return res.json({ status: 'success', data: profiles });
  } catch (error) {
    return next(error);
  }
}

async function upsertProfile(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    const profile = await upsertUserCodingProfile(userId, req.body);
    return res.status(200).json({ status: 'success', data: profile });
  } catch (error) {
    return next(error);
  }
}

async function syncProfileHandler(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    const { profileId } = req.params;
    const profile = await syncSingleProfile(userId, profileId);
    return res.status(200).json({ status: 'success', data: profile, message: 'Profile synced successfully.' });
  } catch (error) {
    return next(error);
  }
}

async function syncAllProfilesHandler(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    const profiles = await syncAllUserProfiles(userId);
    return res.status(200).json({ status: 'success', data: profiles, message: 'All profiles synced successfully.' });
  } catch (error) {
    return next(error);
  }
}

async function deleteProfile(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    const { profileId } = req.params;
    await removeUserCodingProfile(userId, profileId);
    return res.json({ status: 'success', message: 'Coding profile removed.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getProfiles,
  upsertProfile,
  syncProfileHandler,
  syncAllProfilesHandler,
  deleteProfile
};
