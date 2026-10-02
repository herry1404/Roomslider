const safeMsg = require("../utils/safeMsg");
const Room = require("../models/room.model");
const Notification = require("../models/Notification");
const User = require("../models/user.model");
const PushSubscription = require("../models/PushSubscription");
const { sendNotificationToRecipients } = require("../utils/notificationDelivery");
const ElectricityBill = require("../models/ElectricityBill");
const { computeRentStatus } = require("./room.controller");

const notificationAccountModel = (role) =>
  role === "hourlyManager" ? "HourlyRoomManager" : "User";

const getPushConfig = (req, res) => {
  res.status(200).json({
    success: true,
    publicKey: process.env.VAPID_PUBLIC_KEY || null,
  });
};

const savePushSubscription = async (req, res) => {
  try {
    const { endpoint, keys } = req.body || {};
    const role = req.user.role || "user";
    if (!["user", "admin", "hourlyManager"].includes(role)) {
      return res.status(403).json({ success: false, message: "Push notifications are not available for this account" });
    }
    if (
      typeof endpoint !== "string" ||
      !endpoint.startsWith("https://") ||
      !keys?.p256dh ||
      !keys?.auth
    ) {
      return res.status(400).json({ success: false, message: "A valid browser push subscription is required" });
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        recipient: req.user._id,
        recipientModel: notificationAccountModel(role),
        endpoint,
        keys: { p256dh: keys.p256dh, auth: keys.auth },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("SAVE PUSH SUBSCRIPTION ERROR:", error);
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const removePushSubscription = async (req, res) => {
  try {
    const { endpoint } = req.body || {};
    if (typeof endpoint !== "string" || !endpoint) {
      return res.status(400).json({ success: false, message: "Subscription endpoint is required" });
    }
    await PushSubscription.deleteOne({
      endpoint,
      recipient: req.user._id,
      recipientModel: notificationAccountModel(req.user.role || "user"),
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("REMOVE PUSH SUBSCRIPTION ERROR:", error);
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const sendBroadcast = async (req, res) => {
  try {
    if (!["admin", "hourlyManager"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Only admins and hourly room managers can send announcements" });
    }

    const body = req.body || {};
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!title || !message || title.length > 100 || message.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Title (1-100 characters) and message (1-500 characters) are required",
      });
    }

    const users = await User.find({}).select("_id");
    const result = await sendNotificationToRecipients(
      users.map((user) => ({ id: user._id, model: "User" })),
      { title, message }
    );

    res.status(200).json({
      success: true,
      recipientCount: result.recipientCount,
      push: result.push,
    });
  } catch (error) {
    console.error("SEND BROADCAST ERROR:", error);
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

// ============================
// Get all of the owner's currently overdue tenants, with enough info
// to build a WhatsApp reminder message and send in-app notifications.
// ============================
const getOverdueTenants = async (req, res) => {
  try {
    const rooms = await Room.find({
      owner: req.user._id,
      status: "occupied",
    });

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const overdue = [];

    for (const room of rooms) {
      const status = computeRentStatus(room.currentTenant?.nextDueDate);
      if (status !== "overdue") continue;

      const bill = await ElectricityBill.findOne({
        room: room._id,
        month,
        year,
      });

      overdue.push({
        roomId: room._id,
        tenantUserId: room.currentTenantUser,
        tenantName: room.currentTenant?.name || "",
        tenantPhone: room.currentTenant?.phone || "",
        roomTitle: room.title,
        rentAmount: room.price,
        nextDueDate: room.currentTenant?.nextDueDate,
        electricityDue: bill && bill.status === "pending" ? bill.amount : 0,
      });
    }

    res.status(200).json({ success: true, overdue });
  } catch (error) {
    console.error("GET OVERDUE TENANTS ERROR 👉", error);
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

// ============================
// Send an in-app notification to every currently overdue tenant, in one go.
// ============================
const sendBulkReminders = async (req, res) => {
  try {
    const rooms = await Room.find({
      owner: req.user._id,
      status: "occupied",
    });

    let sentCount = 0;

    for (const room of rooms) {
      const status = computeRentStatus(room.currentTenant?.nextDueDate);
      if (status !== "overdue" || !room.currentTenantUser) continue;

      await Notification.create({
        recipient: room.currentTenantUser,
        title: "Rent Payment Reminder",
        message: `Your rent of ₹${room.price} for ${room.title} was due on ${new Date(
          room.currentTenant.nextDueDate
        ).toLocaleDateString("en-IN")}. Please pay via your Tenant Portal.`,
      });

      sentCount += 1;
    }

    res.status(200).json({
      success: true,
      message: `Reminder sent to ${sentCount} tenant(s)`,
      sentCount,
    });
  } catch (error) {
    console.error("SEND BULK REMINDERS ERROR 👉", error);
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

// ============================
// Get the logged-in tenant's notifications (most recent first)
// ============================
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
      recipientModel: notificationAccountModel(req.user.role || "user"),
    })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      recipientModel: notificationAccountModel(req.user.role || "user"),
      read: false,
    });

    res.status(200).json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error("GET MY NOTIFICATIONS ERROR 👉", error);
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

// ============================
// Mark a notification as read
// ============================
const markNotificationRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipient: req.user._id,
        recipientModel: notificationAccountModel(req.user.role || "user"),
      },
      { read: true }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("MARK NOTIFICATION READ ERROR 👉", error);
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

module.exports = {
  getOverdueTenants,
  sendBulkReminders,
  getMyNotifications,
  markNotificationRead,
  getPushConfig,
  savePushSubscription,
  removePushSubscription,
  sendBroadcast,
};
