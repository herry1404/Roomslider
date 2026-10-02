const RoommateProfile = require("../models/roommateProfile.model");
const User = require("../models/user.model");
let migrationPromise;

const migrateLegacyProfile = async (legacy) => {
  const user = await User.findById(legacy.user);
  if (!user) {
    await RoommateProfile.deleteOne({ _id: legacy._id });
    return null;
  }

  const preferences = user.roommatePreferences?.toObject?.() || user.roommatePreferences || {};
  user.roommatePreferences = {
    ...preferences,
    setupComplete: true,
    active: preferences.active ?? legacy.active,
    seeking: preferences.seeking ?? legacy.seeking,
    budgetMin: preferences.budgetMin ?? legacy.budgetMin,
    budgetMax: preferences.budgetMax ?? legacy.budgetMax,
    moveInDate: preferences.moveInDate ?? legacy.moveInDate,
    sharingType: preferences.sharingType ?? legacy.sharingType,
    lifestyle: { ...legacy.lifestyle, ...(preferences.lifestyle || {}) },
    blockedUsers: [...new Set([
      ...(preferences.blockedUsers || []).map(String),
      ...(legacy.blockedUsers || []).map(String),
    ])],
  };
  if (!user.bio && legacy.bio) user.bio = legacy.bio.slice(0, 150);
  if (!user.city && legacy.city) user.city = legacy.city.slice(0, 60);
  if (!user.area && legacy.area) user.area = legacy.area.slice(0, 60);
  if (!user.organization && legacy.college) user.organization = legacy.college.slice(0, 80);
  await user.save();
  await RoommateProfile.deleteOne({ _id: legacy._id });
  return user;
};

const migrateLegacyForUser = async (userId) => {
  await migrateLegacyProfiles();
  return User.findById(userId);
};

const migrateLegacyProfiles = async () => {
  if (!migrationPromise) {
    migrationPromise = (async () => {
      const legacyProfiles = await RoommateProfile.find().lean();
      for (const legacy of legacyProfiles) await migrateLegacyProfile(legacy);
    })().catch((error) => {
      migrationPromise = null;
      throw error;
    });
  }
  await migrationPromise;
};

module.exports = { migrateLegacyForUser, migrateLegacyProfiles };
