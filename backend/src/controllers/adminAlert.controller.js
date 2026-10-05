const mongoose = require("mongoose");
const AdminAlert = require("../models/adminAlert.model");
const PushSubscription = require("../models/PushSubscription");

const getAdminAlerts = async (req, res) => {
  try {
    const filter = req.query.unread === "true" ? { isRead: false } : {};
    const [alerts, unreadCount] = await Promise.all([
      AdminAlert.find(filter).sort({ createdAt: -1 }).limit(50).lean(),
      AdminAlert.countDocuments({ isRead: false }),
    ]);
    res.status(200).json({ success: true, alerts, unreadCount });
  } catch (error) {
    console.error("GET ADMIN ALERTS ERROR:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch alerts" });
  }
};

const markAdminAlertRead = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid alert ID" });
    }
    const alert = await AdminAlert.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    ).lean();
    if (!alert) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }
    res.status(200).json({ success: true, alert });
  } catch (error) {
    console.error("MARK ADMIN ALERT READ ERROR:", error.message);
    res.status(500).json({ success: false, message: "Failed to update alert" });
  }
};

const markAllAdminAlertsRead = async (req, res) => {
  try {
    await AdminAlert.updateMany({ isRead: false }, { $set: { isRead: true } });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("MARK ALL ADMIN ALERTS READ ERROR:", error.message);
    res.status(500).json({ success: false, message: "Failed to update alerts" });
  }
};

const subscribeAdminPush = async (req, res) => {
  try {
    const { endpoint, keys } = req.body || {};
    if (!endpoint?.startsWith("https://") || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ success: false, message: "A valid browser push subscription is required" });
    }
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        recipient: req.user._id,
        recipientModel: "User",
        endpoint,
        keys: { p256dh: keys.p256dh, auth: keys.auth },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("ADMIN PUSH SUBSCRIBE ERROR:", error.message);
    res.status(500).json({ success: false, message: "Could not enable admin push alerts" });
  }
};

const unsubscribeAdminPush = async (req, res) => {
  try {
    const endpoint = req.body?.endpoint;
    if (!endpoint) {
      return res.status(400).json({ success: false, message: "Subscription endpoint is required" });
    }
    await PushSubscription.deleteOne({
      endpoint,
      recipient: req.user._id,
      recipientModel: "User",
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("ADMIN PUSH UNSUBSCRIBE ERROR:", error.message);
    res.status(500).json({ success: false, message: "Could not disable admin push alerts" });
  }
};

module.exports = {
  getAdminAlerts,
  markAdminAlertRead,
  markAllAdminAlertsRead,
  subscribeAdminPush,
  unsubscribeAdminPush,
};
