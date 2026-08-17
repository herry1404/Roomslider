const crypto = require("crypto");
const Razorpay = require("razorpay");
const Room = require("../models/room.model");
const ElectricityBill = require("../models/ElectricityBill");
const { addOneMonth } = require("./room.controller");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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

    let amount = room.price;

    if (billId) {
      const bill = await ElectricityBill.findById(billId);

      if (!bill || bill.room.toString() !== roomId || bill.status !== "pending") {
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

    if (type !== "rent") {
      return res.status(400).json({
        success: false,
        message: "Unsupported payment type",
      });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
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

    const amount = room.price;

    openEntry.payments.push({
      amount: Number(amount),
      date: new Date(),
      method: "razorpay",
      type: "rent",
    });
    openEntry.totalPaid = (openEntry.totalPaid || 0) + Number(amount);

    const baseDate = room.currentTenant?.nextDueDate || new Date();
    room.currentTenant.nextDueDate = addOneMonth(baseDate);
    room.paymentStatus = "paid";

    await room.save();

    let bill = null;

    if (billId) {
      bill = await ElectricityBill.findById(billId);

      if (bill && bill.room.toString() === roomId && bill.status !== "paid") {
        bill.status = "paid";
        bill.paidAt = new Date();
        await bill.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Payment verified and recorded",
      room,
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

module.exports = {
  createOrder,
  verifyPayment,
};
