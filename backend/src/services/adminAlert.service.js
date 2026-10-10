const AdminAlert = require("../models/adminAlert.model");
const AdminAlertRateLimit = require("../models/adminAlertRateLimit.model");
const User = require("../models/user.model");
const { sendPushNotifications } = require("../utils/pushNotifications");

async function sendAdminPush(alert) {
  if (
    !(process.env.VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC) ||
    !(process.env.VAPID_PRIVATE_KEY || process.env.VAPID_PRIVATE) ||
    !(process.env.VAPID_SUBJECT || process.env.VAPID_EMAIL)
  ) return;

  const admins = await User.find({ role: "admin" }).select("_id").lean();
  await sendPushNotifications(
    admins.map(({ _id }) => ({ id: _id, model: "User" })),
    {
      type: "admin_alert",
      title: alert.title,
      message: alert.message,
      actionUrl: alert.link,
      priority: "high",
      requireInteraction: true,
      vibrate: [300, 100, 300],
    }
  );
}

async function canSendToChannel(channel, eventType) {
  const now = new Date();
  await AdminAlertRateLimit.init();
  try {
    await AdminAlertRateLimit.findOneAndUpdate(
      {
        channel,
        eventType,
        lastSentAt: { $lte: new Date(now.getTime() - 30000) },
      },
      { $set: { lastSentAt: now } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return true;
  } catch (error) {
    if (error.code === 11000) return false;
    throw error;
  }
}

function getAdminLink(link) {
  const baseUrl = (process.env.ADMIN_APP_URL || "https://roomslider.in").replace(/\/+$/, "");
  const path = typeof link === "string" && link.startsWith("/admin/")
    ? link
    : "/admin/dashboard";
  return new URL(path, `${baseUrl}/`).toString();
}

async function sendTelegramAlert(alert) {
  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_ADMIN_CHAT_ID: chatId } = process.env;
  if (!token || !chatId || !(await canSendToChannel("telegram", alert.type))) return;

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: `${alert.title}\n${alert.message}\n${getAdminLink(alert.link)}`,
      disable_web_page_preview: true,
    }),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(`Telegram API HTTP ${response.status}`);
  }
}

async function sendWhatsAppAlert(alert) {
  const {
    WHATSAPP_ENABLED,
    WHATSAPP_TOKEN: token,
    WHATSAPP_PHONE_NUMBER_ID: phoneNumberId,
    WHATSAPP_ADMIN_NUMBER: adminNumber,
    WHATSAPP_TEMPLATE_NAME: templateName,
  } = process.env;
  if (
    WHATSAPP_ENABLED !== "true" ||
    !token ||
    !phoneNumberId ||
    !adminNumber ||
    !templateName ||
    !(await canSendToChannel("whatsapp", alert.type))
  ) return;

  const response = await fetch(
    `https://graph.facebook.com/v22.0/${encodeURIComponent(phoneNumberId)}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: adminNumber,
        type: "template",
        template: {
          name: templateName,
          language: { code: "en" },
          components: [{
            type: "body",
            parameters: [
              { type: "text", text: alert.title },
              { type: "text", text: `${alert.message} Review: ${getAdminLink(alert.link)}` },
            ],
          }],
        },
      }),
    }
  );
  if (!response.ok) throw new Error(`WhatsApp API HTTP ${response.status}`);
}

async function notifyAdmin({ type, title, message, link, details }) {
  try {
    const alert = await AdminAlert.create({ type, title, message, link, details, isRead: false });
    const results = await Promise.allSettled([
      sendAdminPush(alert),
      sendTelegramAlert(alert),
      sendWhatsAppAlert(alert),
    ]);
    results.forEach((result) => {
      if (result.status === "rejected") {
        console.error("ADMIN ALERT CHANNEL ERROR:", String(result.reason?.message || "push failed").slice(0, 160));
      }
    });
  } catch (error) {
    console.error("ADMIN ALERT ERROR:", String(error.message || "save failed").slice(0, 160));
  }
}

// TODO: Add Capacitor FCM delivery for native Android admin alerts.

module.exports = { notifyAdmin };
