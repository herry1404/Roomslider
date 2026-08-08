const Owner = require("../models/Owner");
const Room = require("../models/room.model");
const ElectricityBill = require("../models/ElectricityBill");

// ============================
// Set the owner's per-unit electricity rate
// ============================
const setRate = async (req, res) => {
  try {
    const { ratePerUnit } = req.body;

    if (ratePerUnit === undefined || Number(ratePerUnit) < 0) {
      return res.status(400).json({
        success: false,
        message: "A valid rate per unit is required",
      });
    }

    const owner = await Owner.findByIdAndUpdate(
      req.user._id,
      { ratePerUnit: Number(ratePerUnit) },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Rate updated successfully",
      owner,
    });
  } catch (error) {
    console.error("SET RATE ERROR 👉", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================
// Bulk update electricity units for all of the owner's rooms, for one
// billing month. Body: { month, year, entries: [{ roomId, unitsConsumed }] }
// Creates or updates one ElectricityBill per room for that month.
// ============================
const bulkUpdateUnits = async (req, res) => {
  try {
    const owner = await Owner.findById(req.user._id);

    if (!owner) {
      return res.status(404).json({ success: false, message: "Owner not found" });
    }

    if (!owner.ratePerUnit || owner.ratePerUnit <= 0) {
      return res.status(400).json({
        success: false,
        message: "Set your electricity rate per unit first",
      });
    }

    const { month, year, entries } = req.body;

    if (!month || !year || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        success: false,
        message: "month, year, and at least one room entry are required",
      });
    }

    const results = [];

    for (const entry of entries) {
      const { roomId, unitsConsumed } = entry;

      if (!roomId || unitsConsumed === undefined || Number(unitsConsumed) < 0) {
        continue; // skip invalid rows rather than failing the whole batch
      }

      const room = await Room.findOne({ _id: roomId, owner: owner._id });
      if (!room) continue; // ownership check - skip rooms that aren't this owner's

      const amount = Number(unitsConsumed) * owner.ratePerUnit;

      const bill = await ElectricityBill.findOneAndUpdate(
        { room: roomId, month, year },
        {
          room: roomId,
          owner: owner._id,
          tenantUser: room.currentTenantUser || null,
          month,
          year,
          unitsConsumed: Number(unitsConsumed),
          ratePerUnit: owner.ratePerUnit,
          amount,
          status: "pending",
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      results.push(bill);
    }

    res.status(200).json({
      success: true,
      message: `${results.length} bill(s) updated`,
      bills: results,
    });
  } catch (error) {
    console.error("BULK UPDATE UNITS ERROR 👉", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================
// Get the owner's rooms with their electricity rate + latest bill per room
// (used to render the bulk-update page)
// ============================
const getMyElectricitySetup = async (req, res) => {
  try {
    const owner = await Owner.findById(req.user._id).select("-password");
    const rooms = await Room.find({ owner: owner._id, status: "occupied" });

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const bills = await ElectricityBill.find({
      owner: owner._id,
      month,
      year,
    });

    const billsByRoom = {};
    bills.forEach((b) => {
      billsByRoom[b.room.toString()] = b;
    });

    const roomsWithBills = rooms.map((room) => ({
      _id: room._id,
      title: room.title,
      roomNumber: room.roomNumber,
      tenantName: room.currentTenant?.name || "",
      currentBill: billsByRoom[room._id.toString()] || null,
    }));

    res.status(200).json({
      success: true,
      ratePerUnit: owner.ratePerUnit || 0,
      month,
      year,
      rooms: roomsWithBills,
    });
  } catch (error) {
    console.error("GET ELECTRICITY SETUP ERROR 👉", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================
// Get the logged-in tenant's latest electricity bill (for Tenant Portal)
// ============================
const getMyBill = async (req, res) => {
  try {
    const bill = await ElectricityBill.findOne({
      tenantUser: req.user._id,
    }).sort({ year: -1, month: -1 });

    if (!bill) {
      return res.status(200).json({ success: true, bill: null });
    }

    res.status(200).json({ success: true, bill });
  } catch (error) {
    console.error("GET MY BILL ERROR 👉", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================
// Mark a bill as paid (owner action for now - matches the existing
// cash/manual payment pattern used for rent)
// ============================
const markBillPaid = async (req, res) => {
  try {
    const bill = await ElectricityBill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ success: false, message: "Bill not found" });
    }

    if (bill.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    bill.status = "paid";
    bill.paidAt = new Date();
    await bill.save();

    res.status(200).json({ success: true, message: "Bill marked as paid", bill });
  } catch (error) {
    console.error("MARK BILL PAID ERROR 👉", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  setRate,
  bulkUpdateUnits,
  getMyElectricitySetup,
  getMyBill,
  markBillPaid,
};
