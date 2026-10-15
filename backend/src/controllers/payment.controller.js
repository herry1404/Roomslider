const crypto = require("crypto");
const Razorpay = require("razorpay");
const mongoose = require("mongoose");
const Room = require("../models/room.model");
const ElectricityBill = require("../models/ElectricityBill");
const Mess = require("../models/Mess");
const MessOrder = require("../models/MessOrder");
const User = require("../models/user.model");
const { notifyUser, sendNotificationToRecipients } = require("../utils/notificationDelivery");
const { addOneMonth } = require("./room.controller");
const { uploadRentReceipt } = require("../utils/rentReceipt");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const hasValidPaymentSignature = (orderId, paymentId, signature) => {
  if (typeof signature !== "string" || !/^[a-f\d]{64}$/i.test(signature)) return false;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest();
  const supplied = Buffer.from(signature, "hex");
  return supplied.length === expected.length && crypto.timingSafeEqual(expected, supplied);
};

// Create a Razorpay order. Amount is always derived server-side, never
// trusted from the client, to prevent tampering.
const createOrder = async (req, res) => {
  try {
    const { roomId, type, billId } = req.body;

    if (!roomId || type !== "rent") {
      return res.status(400).json({
        success: false,
        message: "Invalid payment request",
      });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    if (
      room.status !== "occupied" ||
      room.currentTenantUser?.toString() !== req.user._id.toString() ||
      req.user.activeRoom?.toString() !== room._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the current tenant can pay for this room",
      });
    }

    let amount = room.price;
    let bill = null;

    if (billId) {
      bill = await ElectricityBill.findOne({
        _id: billId,
        room: room._id,
        tenantUser: req.user._id,
        status: "pending",
      });

      if (!bill) {
        return res.status(400).json({
          success: false,
          message: "Invalid or already-paid electricity bill",
        });
      }

      amount += bill.amount;
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: "INR",
      receipt: `r_${roomId.slice(-8)}_${Date.now()}`.slice(0, 40),
      notes: {
        roomId: room._id.toString(),
        tenantUserId: req.user._id.toString(),
        billId: bill?._id.toString() || "",
      },
    });

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment order",
    });
  }
};

// Verify Razorpay's signature, then record the payment the same way
// recordPayment does (occupancyHistory push + nextDueDate advance).
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      roomId,
      type,
      billId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification fields",
      });
    }

    if (!hasValidPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    if (type !== "rent") {
      return res.status(400).json({
        success: false,
        message: "Unsupported payment type",
      });
    }

    if (!mongoose.isValidObjectId(roomId)) {
      return res.status(400).json({ success: false, message: "Invalid room" });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    if (
      room.status !== "occupied" ||
      room.currentTenantUser?.toString() !== req.user._id.toString() ||
      req.user.activeRoom?.toString() !== room._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the current tenant can confirm payment for this room",
      });
    }

    let bill = null;
    if (billId) {
      bill = await ElectricityBill.findOne({
        _id: billId,
        room: room._id,
        tenantUser: req.user._id,
        status: "pending",
      });
      if (!bill) {
        return res.status(400).json({
          success: false,
          message: "Invalid or already-paid electricity bill",
        });
      }
    }

    const expectedAmount = Math.round((Number(room.price) + Number(bill?.amount || 0)) * 100);
    const [gatewayOrder, gatewayPayment] = await Promise.all([
      razorpay.orders.fetch(razorpay_order_id),
      razorpay.payments.fetch(razorpay_payment_id),
    ]);
    if (
      gatewayOrder.id !== razorpay_order_id ||
      gatewayOrder.amount !== expectedAmount ||
      gatewayOrder.currency !== "INR" ||
      gatewayOrder.notes?.roomId !== room._id.toString() ||
      gatewayOrder.notes?.tenantUserId !== req.user._id.toString() ||
      gatewayOrder.notes?.billId !== (bill?._id.toString() || "") ||
      gatewayPayment.id !== razorpay_payment_id ||
      gatewayPayment.order_id !== razorpay_order_id ||
      gatewayPayment.amount !== expectedAmount ||
      gatewayPayment.currency !== "INR" ||
      gatewayPayment.status !== "captured"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment does not match this room, tenant, and amount",
      });
    }

    const openEntry = [...room.occupancyHistory]
      .reverse()
      .find((entry) => !entry.endDate);

    if (!openEntry) {
      return res.status(400).json({
        success: false,
        message: "No active tenancy found for this room",
      });
    }

    const amount = Number(room.price);
    const baseDate = room.currentTenant?.nextDueDate || new Date();
    const paymentDate = new Date();
    const paymentRecord = {
      amount,
      date: paymentDate,
      method: "razorpay",
      type: "rent",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    };
    const updateResult = await Room.updateOne(
      {
        _id: room._id,
        status: "occupied",
        currentTenantUser: req.user._id,
        occupancyHistory: {
          $elemMatch: {
            _id: openEntry._id,
            endDate: null,
            "payments.razorpayOrderId": { $ne: razorpay_order_id },
          },
        },
      },
      {
        $push: { "occupancyHistory.$[entry].payments": paymentRecord },
        $inc: { "occupancyHistory.$[entry].totalPaid": amount },
        $set: {
          "currentTenant.nextDueDate": addOneMonth(baseDate),
          paymentStatus: "paid",
        },
      },
      { arrayFilters: [{ "entry._id": openEntry._id, "entry.endDate": null }] }
    );
    if (!updateResult.modifiedCount) {
      return res.status(409).json({
        success: false,
        message: "This payment was already recorded or the tenancy has changed",
      });
    }

    const updatedRoom = await Room.findById(room._id);
    const updatedEntry = [...updatedRoom.occupancyHistory]
      .reverse()
      .find((entry) => !entry.endDate);
    const payment = updatedEntry?.payments.find(
      (entry) => entry.razorpayOrderId === razorpay_order_id
    );

    let receiptAvailable = false;
    try {
      payment.receiptUrl = await uploadRentReceipt(updatedRoom, payment, updatedEntry.tenantName);
      await Room.updateOne(
        { _id: room._id },
        { $set: { "occupancyHistory.$[entry].payments.$[payment].receiptUrl": payment.receiptUrl } },
        {
          arrayFilters: [
            { "entry._id": updatedEntry._id },
            { "payment.razorpayOrderId": razorpay_order_id },
          ],
        }
      );
      receiptAvailable = true;
    } catch (receiptError) {
      console.error("RENT RECEIPT GENERATION ERROR:", receiptError);
    }

    if (billId) {
      bill = await ElectricityBill.findOneAndUpdate(
        { _id: bill._id, room: room._id, tenantUser: req.user._id, status: "pending" },
        { $set: { status: "paid", paidAt: paymentDate } },
        { new: true }
      );
    }

    try {
      const alerts = [
        notifyUser(req.user._id, {
          type: "payment",
          title: "Rent payment received",
          body: "Your rent payment was recorded successfully.",
          link: "/my-place",
        }),
      ];
      if (room.owner) {
        alerts.push(sendNotificationToRecipients([{ id: room.owner, model: "Owner" }], {
          type: "payment",
          title: "Rent payment received",
          message: "A rent payment was recorded for one of your properties.",
          actionUrl: "/owner/dashboard",
        }));
      }
      const admins = await User.find({ role: "admin" }).select("_id").lean();
      alerts.push(sendNotificationToRecipients(admins.map((admin) => ({ id: admin._id, model: "User" })), {
        type: "payment",
        title: "Rent payment received",
        message: "A rent payment was recorded.",
        actionUrl: "/admin/rooms",
      }));
      await Promise.all(alerts);
    } catch (notificationError) {
      console.error("RENT PAYMENT NOTIFICATION ERROR:", notificationError);
    }

    res.status(200).json({
      success: true,
      message: receiptAvailable
        ? "Payment verified and recorded. Your receipt is ready."
        : "Payment verified and recorded. The receipt is not available yet.",
      receiptAvailable,
      room: updatedRoom,
      bill,
    });
  } catch (error) {
    console.error("VERIFY PAYMENT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};


// ===============================
// Mess meal order — calculate saved meal and add-on prices server-side.
// ===============================
const createMessOrder = async (req, res) => {
  try {
    if (!["user", "admin"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Customer account required to place an order." });
    }
    const { messId, thaliCount, addOns = [], deliveryAddress } = req.body;
    const count = Number(thaliCount);

    if (!messId || !Number.isInteger(count) || count < 1 || count > 50 || !Array.isArray(addOns)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order request",
      });
    }
    const recipientName = String(deliveryAddress?.recipientName || "").trim();
    const deliveryPhone = String(deliveryAddress?.phone || "").replace(/\D/g, "");
    const addressText = String(deliveryAddress?.address || "").trim();
    const latitude = deliveryAddress?.latitude == null ? null : Number(deliveryAddress.latitude);
    const longitude = deliveryAddress?.longitude == null ? null : Number(deliveryAddress.longitude);
    const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude)
      && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
    const noCoordinates = latitude === null && longitude === null;
    if (
      !recipientName ||
      recipientName.length > 100 ||
      !/^[6-9]\d{9}$/.test(deliveryPhone) ||
      !addressText ||
      addressText.length > 500 ||
      (!hasCoordinates && !noCoordinates)
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid delivery name, 10-digit phone number, and complete address.",
      });
    }
    const cleanDeliveryAddress = {
      recipientName,
      phone: deliveryPhone,
      address: addressText,
      latitude: hasCoordinates ? latitude : null,
      longitude: hasCoordinates ? longitude : null,
      mapLink: hasCoordinates
        ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`,
    };

    const mess = await Mess.findById(messId);

    if (!mess || !mess.isActive) {
      return res.status(404).json({
        success: false,
        message: "Mess not found",
      });
    }

    const selectedAddOns = [];
    const seenAddOnIds = new Set();
    for (const selection of addOns) {
      if (!selection || typeof selection !== "object") {
        return res.status(400).json({ success: false, message: "Invalid add-on selection" });
      }
      const addOnId = String(selection.addOnId || "");
      const quantity = Number(selection.quantity);
      if (
        !mongoose.Types.ObjectId.isValid(addOnId) ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 50 ||
        seenAddOnIds.has(addOnId)
      ) {
        return res.status(400).json({ success: false, message: "Invalid add-on selection" });
      }

      const addOn = mess.addOns.find(
        (item) => item._id.toString() === addOnId && item.isAvailable
      );
      if (!addOn) {
        return res.status(400).json({ success: false, message: "One or more add-ons are unavailable" });
      }

      seenAddOnIds.add(addOnId);
      selectedAddOns.push({
        name: addOn.name,
        unitPrice: addOn.price,
        quantity,
      });
    }

    const addOnTotal = selectedAddOns.reduce(
      (total, item) => total + item.unitPrice * item.quantity,
      0
    );
    const totalAmount = mess.pricePerPerson * count + addOnTotal;

    const order = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // paise
      currency: "INR",
      receipt: `m_${messId.slice(-8)}_${Date.now()}`.slice(0, 40),
    });

    await MessOrder.create({
      mess: mess._id,
      user: req.user._id,
      thaliCount: count,
      mealType: mess.mealType || "thali",
      pricePerPerson: mess.pricePerPerson,
      addOns: selectedAddOns,
      totalAmount,
      deliveryAddress: cleanDeliveryAddress,
      paymentStatus: "pending",
      razorpayOrderId: order.id,
      orderStatus: "placed",
    });

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("CREATE MESS ORDER ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment order",
    });
  }
};

// ===============================
// Mess meal order — verify payment against the persisted order snapshot.
// ===============================
const verifyMessOrder = async (req, res) => {
  try {
    if (!["user", "admin"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Customer account required to confirm an order." });
    }
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification fields",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    const messOrder = await MessOrder.findOne({
      razorpayOrderId: razorpay_order_id,
      user: req.user._id,
    });
    if (!messOrder) {
      return res.status(404).json({ success: false, message: "Payment order not found" });
    }
    if (messOrder.paymentStatus === "paid") {
      if (messOrder.razorpayPaymentId !== razorpay_payment_id) {
        return res.status(409).json({ success: false, message: "Payment order was already completed" });
      }
      return res.status(200).json({
        success: true,
        message: "Order already confirmed",
        order: messOrder,
      });
    }

    const gatewayOrder = await razorpay.orders.fetch(razorpay_order_id);
    if (
      gatewayOrder.amount !== Math.round(messOrder.totalAmount * 100) ||
      gatewayOrder.currency !== "INR"
    ) {
      return res.status(400).json({ success: false, message: "Payment amount does not match the order." });
    }

    const updatedOrder = await MessOrder.findOneAndUpdate(
      { _id: messOrder._id, paymentStatus: "pending" },
      {
        $set: {
          paymentStatus: "paid",
          razorpayPaymentId: razorpay_payment_id,
          paidAt: new Date(),
        },
      },
      { new: true }
    );
    if (!updatedOrder) {
      const latestOrder = await MessOrder.findById(messOrder._id);
      if (latestOrder?.paymentStatus === "paid" && latestOrder.razorpayPaymentId === razorpay_payment_id) {
        return res.status(200).json({
          success: true,
          message: "Order already confirmed",
          order: latestOrder,
        });
      }
      return res.status(409).json({ success: false, message: "This order could not be confirmed." });
    }

    res.status(200).json({
      success: true,
      message: "Order placed successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("VERIFY MESS ORDER ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  createMessOrder,
  verifyMessOrder,
};
