export default function roommateNotificationLink(notification) {
  if (notification?.type === "roommate_request") return "/roommates/requests";
  if (notification?.type === "roommate_accepted") return "/roommates/messages";
  if (notification?.type === "roommate_message") {
    const senderId = notification.data?.senderId;
    return senderId ? `/roommates/chat/${senderId}` : notification.link || "/roommates/messages";
  }
  return notification?.link || "";
}
