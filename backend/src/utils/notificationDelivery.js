const Notification = require("../models/Notification");
const { sendPushNotifications } = require("./pushNotifications");

const streams = new Map();
const safeText = (value, max) => String(value || "").trim().slice(0, max);
const serialize = (notification) => {
  const item = notification.toObject ? notification.toObject() : notification;
  return {
    _id: item._id,
    type: item.type || "system",
    title: item.title,
    body: item.body || item.message || "",
    link: item.link || item.actionUrl || "",
    data: item.data || {},
    priority: item.priority || "normal",
    isRead: Boolean(item.isRead || item.read),
    readAt: item.readAt || null,
    createdAt: item.createdAt,
  };
};

function emitToUser(userId, notification) {
  const clients = streams.get(String(userId));
  if (!clients) return;
  const payload = `event: notification\ndata: ${JSON.stringify(serialize(notification))}\n\n`;
  clients.forEach((res) => {
    try { res.write(payload); } catch { clients.delete(res); }
  });
  if (clients.size === 0) streams.delete(String(userId));
}

function addStream(userId, res) {
  const key = String(userId);
  const clients = streams.get(key) || new Set();
  // Keep a small per-user cap; close the oldest open connection first.
  if (clients.size >= 3) {
    const oldest = clients.values().next().value;
    try { oldest.end(); } catch { /* ignore */ }
    clients.delete(oldest);
  }
  clients.add(res);
  streams.set(key, clients);
  return () => {
    clients.delete(res);
    if (clients.size === 0) streams.delete(key);
  };
}

async function notifyUser(userId, { type = "system", title, body, link = "", data = {}, priority = "normal", actions = [] } = {}) {
  try {
    const payload = {
      user: userId,
      recipient: userId,
      recipientModel: "User",
      type,
      title: safeText(title, 120),
      body: safeText(body, 500),
      link: safeText(link, 300),
      data: data && typeof data === "object" ? data : {},
      priority: priority === "high" ? "high" : "normal",
      isRead: false,
      message: safeText(body, 500),
      actionUrl: safeText(link, 300),
      read: false,
    };
    if (!payload.title) return null;

    let notification;
    if (type === "roommate_message" && payload.data.senderId) {
      notification = await Notification.findOne({
        user: userId,
        type,
        isRead: false,
        read: false,
        "data.senderId": String(payload.data.senderId),
      }).sort({ createdAt: -1 });
      if (notification) {
        const count = Number(notification.data?.count || 1) + 1;
        notification.body = payload.body;
        notification.message = payload.body;
        notification.link = payload.link;
        notification.actionUrl = payload.link;
        notification.data = { ...notification.data, ...payload.data, count };
        await notification.save();
      }
    }
    if (!notification) notification = await Notification.create(payload);
    emitToUser(userId, notification);
    try {
      await sendPushNotifications([{ id: userId, model: "User" }], {
        title: notification.title,
        message: notification.body || notification.message,
        actionUrl: notification.link || notification.actionUrl,
        priority: notification.priority,
        actions,
        requestId: notification.data?.requestId || null,
        type: notification.type,
      });
    } catch (error) { console.error("NOTIFICATION PUSH ERROR:", error.message); }
    return notification;
  } catch (error) {
    console.error("NOTIFY USER ERROR:", error.message);
    return null;
  }
}

async function sendNotificationToRecipients(recipients, notification) {
  const uniqueRecipients = [...new Map(recipients.map((recipient) => [`${recipient.model}:${recipient.id}`, recipient])).values()];
  const created = await Promise.all(uniqueRecipients.map(async (recipient) => {
    if (recipient.model === "User") return notifyUser(recipient.id, {
      type: notification.type || "broadcast", title: notification.title, body: notification.message || notification.body, link: notification.actionUrl || notification.link, data: notification.data,
    });
    try {
      const body = safeText(notification.message || notification.body, 500);
      const link = safeText(notification.actionUrl || notification.link, 300);
      const createdNotification = await Notification.create({
        recipient: recipient.id,
        recipientModel: recipient.model,
        type: notification.type || "system",
        title: safeText(notification.title, 120),
        body,
        message: body,
        link,
        actionUrl: link,
        data: notification.data && typeof notification.data === "object" ? notification.data : {},
      });
      emitToUser(recipient.id, createdNotification);
      try {
        await sendPushNotifications([{ id: recipient.id, model: recipient.model }], {
          title: createdNotification.title,
          message: body,
          actionUrl: link,
          type: createdNotification.type,
          priority: notification.priority === "high" ? "high" : "normal",
          actions: Array.isArray(notification.actions) ? notification.actions.slice(0, 2) : [],
        });
      } catch (error) {
        console.error("NOTIFICATION PUSH ERROR:", error.message);
      }
      return createdNotification;
    } catch (error) { console.error("NOTIFY RECIPIENT ERROR:", error.message); return null; }
  }));
  return { recipientCount: created.filter(Boolean).length, push: { configured: Boolean(process.env.VAPID_PUBLIC || process.env.VAPID_PUBLIC_KEY), delivered: 0, failed: 0 } };
}

module.exports = { notifyUser, sendNotificationToRecipients, addStream, serialize };
