const Room = require("../models/room.model");
const Notification = require("../models/Notification");
const ElectricityBill = require("../models/ElectricityBill");
const { computeRentStatus } = require("./room.controller");

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
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================
// Get the logged-in tenant's notifications (most recent first)
// ============================
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    res.status(200).json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error("GET MY NOTIFICATIONS ERROR 👉", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================
// Mark a notification as read
// ============================
const markNotificationRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("MARK NOTIFICATION READ ERROR 👉", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getOverdueTenants,
  sendBulkReminders,
  getMyNotifications,
  markNotificationRead,
};
