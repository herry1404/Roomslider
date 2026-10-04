const jwt = require("jsonwebtoken");
const safeMsg = require("../utils/safeMsg");
const Room = require("../models/room.model");
const Notification = require("../models/Notification");
const User = require("../models/user.model");
const PushSubscription = require("../models/PushSubscription");
const PushHistory = require("../models/PushHistory");
const Owner = require("../models/Owner");
const HourlyRoomManager = require("../models/HourlyRoomManager");
const ElectricityBill = require("../models/ElectricityBill");
const { computeRentStatus } = require("./room.controller");
const { notifyUser, sendNotificationToRecipients, addStream, serialize } = require("../utils/notificationDelivery");
const { sendPushNotifications } = require("../utils/pushNotifications");

const notificationAccountModel = (role) => role === "hourlyManager" ? "HourlyRoomManager" : role === "owner" ? "Owner" : "User";
const ownFilter = (req) => ({ $or: [{ user: req.user._id }, { recipient: req.user._id, recipientModel: notificationAccountModel(req.user.role || "user") }] });
const unreadQuery = { $or: [{ isRead: false }, { read: false }] };
const getVapidPublicKey = () => process.env.VAPID_PUBLIC || process.env.VAPID_PUBLIC_KEY || null;

const getPushConfig = (req, res) => res.json({ success: true, publicKey: getVapidPublicKey() });

const savePushSubscription = async (req, res) => {
  try {
    const { endpoint, keys } = req.body || {};
    const role = req.user.role || "user";
    if (!["user", "admin", "owner", "hourlyManager"].includes(role) || !endpoint?.startsWith("https://") || !keys?.p256dh || !keys?.auth) return res.status(400).json({ success: false, message: "A valid browser push subscription is required" });
    await PushSubscription.findOneAndUpdate({ endpoint }, { recipient: req.user._id, recipientModel: notificationAccountModel(role), endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, message: safeMsg(error) }); }
};

const removePushSubscription = async (req, res) => {
  try {
    if (!req.body?.endpoint) return res.status(400).json({ success: false, message: "Subscription endpoint is required" });
    await PushSubscription.deleteOne({ endpoint: req.body.endpoint, recipient: req.user._id, recipientModel: notificationAccountModel(req.user.role || "user") });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, message: safeMsg(error) }); }
};

const sendPushBroadcast = async (req, res) => {
  try {
    const { title, message, hiTitle = "", hiMessage = "", audience, link = "/" } = req.body || {};
    const cleanTitle = String(title || "").trim();
    const cleanMessage = String(message || "").trim();
    const cleanHiTitle = String(hiTitle || "").trim();
    const cleanHiMessage = String(hiMessage || "").trim();
    const cleanLink = String(link || "/").trim();
    if (!cleanTitle || !cleanMessage || cleanTitle.length > 100 || cleanMessage.length > 500) {
      return res.status(400).json({ success: false, message: "Title (1-100 characters) and message (1-500 characters) are required" });
    }
    if (!["all", "owners", "students"].includes(audience)) {
      return res.status(400).json({ success: false, message: "Choose a valid audience" });
    }
    if (cleanHiTitle.length > 100 || cleanHiMessage.length > 500 || cleanLink.length > 300) {
      return res.status(400).json({ success: false, message: "Hinglish content or link is too long" });
    }

    let recipients;
    if (audience === "owners") {
      const owners = await Owner.find({}).select("_id").lean();
      recipients = owners.map(({ _id }) => ({ id: _id, model: "Owner" }));
    } else if (audience === "students") {
      const students = await User.find({ occupation: { $regex: /^student$/i } }).select("_id").lean();
      recipients = students.map(({ _id }) => ({ id: _id, model: "User" }));
    } else {
      const [users, owners, managers] = await Promise.all([
        User.find({}).select("_id").lean(),
        Owner.find({}).select("_id").lean(),
        HourlyRoomManager.find({}).select("_id").lean(),
      ]);
      recipients = [
        ...users.map(({ _id }) => ({ id: _id, model: "User" })),
        ...owners.map(({ _id }) => ({ id: _id, model: "Owner" })),
        ...managers.map(({ _id }) => ({ id: _id, model: "HourlyRoomManager" })),
      ];
    }

    const push = await sendPushNotifications(recipients, {
      type: "broadcast",
      preference: "offers",
      title: cleanTitle,
      message: cleanMessage,
      hiTitle: cleanHiTitle,
      hiMessage: cleanHiMessage,
      actionUrl: cleanLink,
      image: req.file?.path || "",
    });
    const history = await PushHistory.create({
      title: cleanTitle,
      message: cleanMessage,
      hiTitle: cleanHiTitle,
      hiMessage: cleanHiMessage,
      link: cleanLink,
      image: req.file?.path || "",
      audience,
      recipientCount: recipients.length,
      delivered: push.delivered,
      failed: push.failed,
      sentBy: req.user._id,
    });
    res.status(201).json({ success: true, history, recipientCount: recipients.length, push });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const listPushHistory = async (req, res) => {
  try {
    const history = await PushHistory.find({}).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const sendBroadcast = async (req, res) => {
  try {
    if (!["admin", "hourlyManager"].includes(req.user.role)) return res.status(403).json({ success: false, message: "Only admins and hourly room managers can send announcements" });
    const title = String(req.body?.title || "").trim();
    const message = String(req.body?.message || "").trim();
    if (!title || !message || title.length > 100 || message.length > 500) return res.status(400).json({ success: false, message: "Title (1-100 characters) and message (1-500 characters) are required" });
    const users = await User.find({}).select("_id");
    const result = await sendNotificationToRecipients(users.map((user) => ({ id: user._id, model: "User" })), { type: "broadcast", title, message, actionUrl: "/notifications" });
    res.json({ success: true, recipientCount: result.recipientCount, push: result.push });
  } catch (error) { res.status(500).json({ success: false, message: safeMsg(error) }); }
};

const getOverdueTenants = async (req, res) => {
  try {
    const rooms = await Room.find({ owner: req.user._id, status: "occupied" });
    const month = new Date().getMonth() + 1; const year = new Date().getFullYear(); const overdue = [];
    for (const room of rooms) {
      if (computeRentStatus(room.currentTenant?.nextDueDate) !== "overdue") continue;
      const bill = await ElectricityBill.findOne({ room: room._id, month, year });
      overdue.push({ roomId: room._id, tenantUserId: room.currentTenantUser, tenantName: room.currentTenant?.name || "", tenantPhone: room.currentTenant?.phone || "", roomTitle: room.title, rentAmount: room.price, nextDueDate: room.currentTenant?.nextDueDate, electricityDue: bill?.status === "pending" ? bill.amount : 0 });
    }
    res.json({ success: true, overdue });
  } catch (error) { res.status(500).json({ success: false, message: safeMsg(error) }); }
};

const sendBulkReminders = async (req, res) => {
  try {
    const rooms = await Room.find({ owner: req.user._id, status: "occupied" }); let sentCount = 0;
    for (const room of rooms) if (computeRentStatus(room.currentTenant?.nextDueDate) === "overdue" && room.currentTenantUser) { await notifyUser(room.currentTenantUser, { type: "payment", title: "Rent payment reminder", body: `Your rent payment for ${room.title} is overdue.`, link: "/my-place" }); sentCount += 1; }
    res.json({ success: true, message: `Reminder sent to ${sentCount} tenant(s)`, sentCount });
  } catch (error) { res.status(500).json({ success: false, message: safeMsg(error) }); }
};

const listNotifications = async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const filter = ownFilter(req);
    if (req.query.cursor && !Number.isNaN(new Date(req.query.cursor).getTime())) filter.createdAt = { $lt: new Date(req.query.cursor) };
    if (req.query.unread === "true") filter.$and = [unreadQuery];
    if (req.query.type) filter.type = req.query.type;
    const rows = await Notification.find(filter).sort({ createdAt: -1 }).limit(limit + 1).lean();
    const hasMore = rows.length > limit; const notifications = rows.slice(0, limit).map(serialize);
    res.json({ notifications, nextCursor: hasMore ? notifications.at(-1)?.createdAt : null, hasMore });
  } catch (error) { res.status(500).json({ success: false, message: safeMsg(error) }); }
};

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find(ownFilter(req)).sort({ createdAt: -1 }).limit(20).lean();
    const unreadCount = await Notification.countDocuments({ ...ownFilter(req), $and: [unreadQuery] });
    res.json({ success: true, notifications: notifications.map(serialize), unreadCount });
  } catch (error) { res.status(500).json({ success: false, message: safeMsg(error) }); }
};

const getUnreadCount = async (req, res) => {
  try { res.json({ count: await Notification.countDocuments({ ...ownFilter(req), $and: [unreadQuery] }) }); }
  catch (error) { res.status(500).json({ success: false, message: safeMsg(error) }); }
};

const markNotificationRead = async (req, res) => {
  try { const row = await Notification.findOneAndUpdate({ _id: req.params.id, ...ownFilter(req) }, { isRead: true, read: true, readAt: new Date() }, { new: true }); if (!row) return res.status(404).json({ success: false, message: "Notification not found" }); res.json({ success: true, notification: serialize(row) }); }
  catch (error) { res.status(500).json({ success: false, message: safeMsg(error) }); }
};
const markAllRead = async (req, res) => { try { await Notification.updateMany({ ...ownFilter(req), $and: [unreadQuery] }, { isRead: true, read: true, readAt: new Date() }); res.json({ success: true }); } catch (error) { res.status(500).json({ success: false, message: safeMsg(error) }); } };
const deleteNotification = async (req, res) => { try { const row = await Notification.findOneAndDelete({ _id: req.params.id, ...ownFilter(req) }); if (!row) return res.status(404).json({ success: false, message: "Notification not found" }); res.json({ success: true }); } catch (error) { res.status(500).json({ success: false, message: safeMsg(error) }); } };

const createStreamToken = (req, res) => { try { res.json({ token: jwt.sign({ id: req.user._id, role: req.user.role || "user", purpose: "notifications" }, process.env.JWT_SECRET, { expiresIn: "2m" }) }); } catch (error) { res.status(500).json({ success: false, message: safeMsg(error) }); } };
const notificationStream = (req, res) => {
  try {
    const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
    if (decoded.purpose !== "notifications") return res.status(401).end();
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" });
    res.write("event: ready\ndata: {}\n\n");
    const remove = addStream(decoded.id, res); const ping = setInterval(() => res.write("event: ping\ndata: {}\n\n"), 25000);
    req.on("close", () => { clearInterval(ping); remove(); });
  } catch { res.status(401).end(); }
};

module.exports = { getOverdueTenants, sendBulkReminders, getMyNotifications, listNotifications, getUnreadCount, markNotificationRead, markAllRead, deleteNotification, getPushConfig, savePushSubscription, removePushSubscription, sendBroadcast, sendPushBroadcast, listPushHistory, createStreamToken, notificationStream };
