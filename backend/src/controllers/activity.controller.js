const safeMsg = require("../utils/safeMsg");
const Activity = require('../models/activity.model');

const logActivity = async (type, message, refId = null, refModel = null, meta = {}) => {
  try {
    await Activity.create({ type, message, refId, refModel, meta });
  } catch (err) {
    console.error('Activity log failed:', err.message);
  }
};

const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const activities = await Activity.find().sort({ createdAt: -1 }).limit(limit);
    res.json({ success: true, activities });
  } catch (err) {
    res.status(500).json({ success: false, message: safeMsg(err) });
  }
};

module.exports = { logActivity, getRecentActivities };
