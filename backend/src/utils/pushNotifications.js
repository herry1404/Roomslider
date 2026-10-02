const webpush = require("web-push");
const PushSubscription = require("../models/PushSubscription");

const vapidConfigured = Boolean(
  process.env.VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_SUBJECT
);

if (vapidConfigured) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

async function sendPushNotifications(recipients, notification) {
  if (!vapidConfigured || recipients.length === 0) {
    return { configured: vapidConfigured, delivered: 0, failed: 0 };
  }

  const subscriptions = await PushSubscription.find({
    $or: recipients.map((recipient) => ({
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
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys,
          },
          JSON.stringify({
            title: notification.title,
            body: notification.message,
            url: notification.actionUrl || "/",
          })
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
