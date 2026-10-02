const Notification = require("../models/Notification");
const { sendPushNotifications } = require("./pushNotifications");

async function sendNotificationToRecipients(recipients, notification) {
  const uniqueRecipients = [
    ...new Map(
      recipients.map((recipient) => [`${recipient.model}:${recipient.id}`, recipient])
    ).values(),
  ];

  if (uniqueRecipients.length > 0) {
    await Notification.insertMany(
      uniqueRecipients.map((recipient) => ({
        recipient: recipient.id,
        recipientModel: recipient.model,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl || "",
      }))
    );
  }

  const push = await sendPushNotifications(uniqueRecipients, notification);
  return { recipientCount: uniqueRecipients.length, push };
}

module.exports = { sendNotificationToRecipients };
