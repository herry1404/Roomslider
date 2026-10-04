const webpush = require("web-push");
const PushSubscription = require("../models/PushSubscription");
const User = require("../models/user.model");

const publicKey = process.env.VAPID_PUBLIC || process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE || process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || process.env.VAPID_SUBJECT;
const vapidConfigured = Boolean(
  publicKey && privateKey && vapidEmail
);

if (vapidConfigured) {
  webpush.setVapidDetails(vapidEmail.startsWith("mailto:") ? vapidEmail : `mailto:${vapidEmail}`, publicKey, privateKey);
}

const preferenceForType = (type) => {
  if (type === "blood_request" || type.startsWith("blood_")) return "blood";
  if (type.startsWith("roommate_")) return "chat";
  if (type.includes("booking") || type.includes("payment") || type.includes("vacate") || type.includes("maintenance") || type.includes("service_") || type.includes("vehicle_") || type.includes("furniture_")) return "booking";
  if (type === "broadcast" || type === "offer") return "offers";
  if (type === "alert" || type === "saved_search") return "alerts";
  return null;
};

async function sendPushNotifications(recipients, notification) {
  if (!vapidConfigured || recipients.length === 0) {
    return { configured: vapidConfigured, delivered: 0, failed: 0 };
  }

  const preference = notification.preference || preferenceForType(notification.type || "");
  const userIds = recipients.filter((recipient) => recipient.model === "User").map((recipient) => recipient.id);
  const users = userIds.length
    ? await User.find({ _id: { $in: userIds } }).select("_id notificationPrefs preferredLanguage").lean()
    : [];
  const userById = new Map(users.map((user) => [String(user._id), user]));
  const allowedRecipients = recipients.filter((recipient) => {
    if (recipient.model !== "User" || !preference) return true;
    const prefs = userById.get(String(recipient.id))?.notificationPrefs;
    return prefs?.[preference] !== false;
  });
  if (allowedRecipients.length === 0) {
    return { configured: true, delivered: 0, failed: 0 };
  }

  const subscriptions = await PushSubscription.find({
    $or: allowedRecipients.map((recipient) => ({
      recipient: recipient.id,
      recipientModel: recipient.model,
    })),
  });

  const expiredIds = [];
  let delivered = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        const user = subscription.recipientModel === "User"
          ? userById.get(String(subscription.recipient))
          : null;
        const isHinglish = user?.preferredLanguage === "hi-en";
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys,
          },
          JSON.stringify({
            title: isHinglish && notification.hiTitle ? notification.hiTitle : notification.title,
            body: isHinglish && notification.hiMessage ? notification.hiMessage : notification.message,
            url: notification.actionUrl || "/",
            image: notification.image || "",
            icon: notification.icon || "/pwa-192x192.png",
            badge: notification.badge || "/pwa-192x192.png",
            requestId: notification.requestId || null,
            priority: notification.priority === "high" ? "high" : "normal",
            actions: Array.isArray(notification.actions) ? notification.actions.slice(0, 2) : [],
          }),
          { urgency: notification.priority === "high" ? "high" : "normal" }
        );
        delivered += 1;
      } catch (error) {
        failed += 1;
        if (error.statusCode === 404 || error.statusCode === 410) {
          expiredIds.push(subscription._id);
        } else {
          console.error("PUSH DELIVERY ERROR:", error.message);
        }
      }
    })
  );

  if (expiredIds.length > 0) {
    await PushSubscription.deleteMany({ _id: { $in: expiredIds } });
  }

  return { configured: true, delivered, failed };
}

module.exports = { sendPushNotifications };
