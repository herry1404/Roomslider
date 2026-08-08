const Room = require("../models/room.model");
const User = require("../models/user.model");

// ============================
// Compute live rent-cycle status from nextDueDate.
// Not stored as a flat "always paid" flag - recalculated every time it's
// read, so it naturally goes pending/overdue again once nextDueDate passes.
// 5-day grace period before marking as "overdue".
// ============================
const GRACE_DAYS = 5;

function computeRentStatus(nextDueDate) {
  if (!nextDueDate) return "pending";

  const due = new Date(nextDueDate);
  const graceEnd = new Date(due);
  graceEnd.setDate(graceEnd.getDate() + GRACE_DAYS);

  const now = new Date();

  if (now < due) return "paid";
  if (now <= graceEnd) return "pending";
  return "overdue";
}

// Adds 1 calendar month to a date, keeping the same day-of-month
// (e.g. 15 Aug -> 15 Sep). Falls back gracefully for month-end edge cases.
function addOneMonth(date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  return d;
}

// ============================
// Create Room (Admin or Owner)
// ============================

const createRoom = async (req, res) => {
  try {
    const {
      title,
      price,
      deposit,
      location,
      description,
      category,
      rooms,
      bathrooms,
      furnished,
      ownerName,
      contact,
      whatsapp,
      amenities,
      nearby,
      priority,
    } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one room image is required",
      });
    }

    const images = req.files.map((file) => file.path);

    const parsedAmenities = amenities ? JSON.parse(amenities) : [];
    const parsedNearby = nearby ? JSON.parse(nearby) : [];

    const roomData = {
      title,
      price,
      deposit: deposit || 0,
      location,
      images,
      description,
      category,
      rooms: rooms || 1,
      bathrooms: bathrooms || 1,
      furnished: furnished === "true" || furnished === true,
      ownerName,
      contact,
      whatsapp,
      amenities: parsedAmenities,
      nearby: parsedNearby,
      priority: priority ? Number(priority) : 9999,
    };

    // If an owner (not admin) is creating this room, auto-tag it as theirs
    if (req.user.role === "owner") {
      roomData.owner = req.user._id;
    }

    const room = await Room.create(roomData);

    res.status(201).json({
      success: true,
      message: "Room added successfully",
      room,
    });
  } catch (error) {
    console.error("CREATE ROOM ERROR 👉", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================
// Get All Rooms
// Supports: ?category=Room/PG/Hostel/Flat
//           ?search=keyword (title/location/category ke against match karta hai)
// ============================

const getRooms = async (req, res) => {
  try {
    const filter = {};

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.search) {
      const regex = new RegExp(req.query.search, "i");
      filter.$or = [{ title: regex }, { location: regex }, { category: regex }];
    }

    // Public users should only ever see vacant rooms. Admin panel passes
    // ?includeOccupied=true so it can still manage occupied rooms too.
    if (req.query.includeOccupied !== "true") {
      filter.status = "vacant";
    }

    const rooms = await Room.find(filter).sort({
      priority: 1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      rooms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================
// Get Single Room
// ============================

const getSingleRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const roomObj = room.toObject();
    if (room.status === "occupied") {
      roomObj.liveRentStatus = computeRentStatus(room.currentTenant?.nextDueDate);
    }

    res.status(200).json({
      success: true,
      room: roomObj,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================
// Update Room (Admin, or Owner of this room)
// ============================

const updateRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Ownership check: owners can only edit their own rooms
    if (
      req.user.role === "owner" &&
      (!room.owner || room.owner.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. This is not your room.",
      });
    }

    const {
      title,
      price,
      deposit,
      location,
      description,
      category,
      rooms,
      bathrooms,
      furnished,
      ownerName,
      contact,
      whatsapp,
      amenities,
      nearby,
      priority,
    } = req.body;

    if (title !== undefined) room.title = title;
    if (price !== undefined) room.price = price;
    if (deposit !== undefined) room.deposit = deposit;
    if (location !== undefined) room.location = location;
    if (description !== undefined) room.description = description;
    if (category !== undefined) room.category = category;
    if (rooms !== undefined) room.rooms = rooms;
    if (bathrooms !== undefined) room.bathrooms = bathrooms;
    if (furnished !== undefined) room.furnished = furnished === "true" || furnished === true;
    if (ownerName !== undefined) room.ownerName = ownerName;
    if (contact !== undefined) room.contact = contact;
    if (whatsapp !== undefined) room.whatsapp = whatsapp;
    if (amenities !== undefined) room.amenities = JSON.parse(amenities);
    if (nearby !== undefined) room.nearby = JSON.parse(nearby);
    if (priority !== undefined) room.priority = Number(priority) || 9999;

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => file.path);
      room.images = [...room.images, ...newImages];
    }

    await room.save();

    res.status(200).json({
      success: true,
      message: "Room updated successfully",
      room,
    });
  } catch (error) {
    console.error("UPDATE ROOM ERROR 👉", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================
// Delete Room (Admin, or Owner of this room)
// ============================

const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Ownership check: owners can only delete their own rooms
    if (
      req.user.role === "owner" &&
      (!room.owner || room.owner.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. This is not your room.",
      });
    }

    await room.deleteOne();

    res.status(200).json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ============================
// Bulk Create Rooms (Admin or Owner)
// Creates multiple room documents sharing the same details,
// each with its own roomNumber (e.g. 101 to 110)
// ============================

const createBulkRooms = async (req, res) => {
  try {
    const {
      title,
      price,
      deposit,
      location,
      description,
      category,
      rooms,
      bathrooms,
      furnished,
      ownerName,
      contact,
      whatsapp,
      amenities,
      nearby,
      priority,
      roomNumberStart,
      roomNumberEnd,
    } = req.body;

    if (!roomNumberStart || !roomNumberEnd) {
      return res.status(400).json({
        success: false,
        message: "roomNumberStart and roomNumberEnd are required",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one room image is required",
      });
    }

    const images = req.files.map((file) => file.path);

    const parsedAmenities = amenities ? JSON.parse(amenities) : [];
    const parsedNearby = nearby ? JSON.parse(nearby) : [];

    const start = Number(roomNumberStart);
    const end = Number(roomNumberEnd);

    if (isNaN(start) || isNaN(end) || start > end) {
      return res.status(400).json({
        success: false,
        message: "Invalid room number range",
      });
    }

    if (end - start > 100) {
      return res.status(400).json({
        success: false,
        message: "Cannot create more than 100 rooms at once",
      });
    }

    const baseData = {
      title,
      price,
      deposit: deposit || 0,
      location,
      images,
      description,
      category,
      rooms: rooms || 1,
      bathrooms: bathrooms || 1,
      furnished: furnished === "true" || furnished === true,
      ownerName,
      contact,
      whatsapp,
      amenities: parsedAmenities,
      nearby: parsedNearby,
      priority: priority ? Number(priority) : 9999,
    };

    if (req.user.role === "owner") {
      baseData.owner = req.user._id;
    }

    const roomDocs = [];
    for (let num = start; num <= end; num++) {
      roomDocs.push({
        ...baseData,
        roomNumber: String(num),
      });
    }

    const createdRooms = await Room.insertMany(roomDocs);

    res.status(201).json({
      success: true,
      message: `${createdRooms.length} rooms added successfully`,
      rooms: createdRooms,
    });
  } catch (error) {
    console.error("BULK CREATE ROOM ERROR 👉", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// ============================
// Assign Tenant to Room (Admin, or Owner of this room)
// Fills current tenant info, sets status to occupied,
// opens a new occupancy history entry
// ============================

const assignTenant = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    if (
      req.user.role === "owner" &&
      (!room.owner || room.owner.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. This is not your room.",
      });
    }

    const { name, phone, moveInDate, advanceAmount, tenantEmail, tenantPhone } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Tenant name is required",
      });
    }

    if (!tenantEmail && !tenantPhone) {
      return res.status(400).json({
        success: false,
        message: "Tenant email or phone number is required to link their RoomSlider account",
      });
    }

    // Find the tenant's registered User account by email or phone
    const orConditions = [];
    if (tenantEmail) orConditions.push({ email: tenantEmail.trim().toLowerCase() });
    if (tenantPhone) orConditions.push({ phone: tenantPhone.trim() });

    const tenantUser = await User.findOne({ $or: orConditions });

    if (!tenantUser) {
      return res.status(404).json({
        success: false,
        message: "No RoomSlider account found with this email/phone. Ask the tenant to sign up first, then try again.",
      });
    }

    // If this user is already renting another room, block until vacated
    if (tenantUser.activeRoom && tenantUser.activeRoom.toString() !== room._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "This user is already assigned to another room. Vacate that room first.",
      });
    }

    const resolvedMoveInDate = moveInDate ? new Date(moveInDate) : new Date();

    room.currentTenant = {
      name,
      phone: phone || tenantPhone || "",
      moveInDate: resolvedMoveInDate,
      advanceAmount: advanceAmount ? Number(advanceAmount) : 0,
      nextDueDate: resolvedMoveInDate,
    };
    room.currentTenantUser = tenantUser._id;
    room.status = "occupied";
    room.paymentStatus = "pending";

    room.occupancyHistory.push({
      tenantName: name,
      startDate: room.currentTenant.moveInDate,
      totalPaid: 0,
      payments: [],
    });

    await room.save();

    tenantUser.activeRoom = room._id;
    await tenantUser.save();

    res.status(200).json({
      success: true,
      message: "Tenant assigned successfully",
      room,
    });
  } catch (error) {
    console.error("ASSIGN TENANT ERROR 👉", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================
// Vacate Room (Admin, or Owner of this room)
// Closes current occupancy entry, clears tenant, sets status to vacant
// ============================

const vacateTenant = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    if (
      req.user.role === "owner" &&
      (!room.owner || room.owner.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. This is not your room.",
      });
    }

    const openEntry = [...room.occupancyHistory]
      .reverse()
      .find((entry) => !entry.endDate);

    if (openEntry) {
      openEntry.endDate = req.body?.moveOutDate
        ? new Date(req.body.moveOutDate)
        : new Date();
    }

    // Clear the linked tenant's activeRoom so their portal stops showing this room
    if (room.currentTenantUser) {
      await User.findByIdAndUpdate(room.currentTenantUser, { activeRoom: null });
    }

    room.currentTenant = {
      name: "",
      phone: "",
      moveInDate: undefined,
      advanceAmount: 0,
    };
    room.currentTenantUser = null;
    room.status = "vacant";
    room.paymentStatus = "pending";

    await room.save();

    res.status(200).json({
      success: true,
      message: "Room vacated successfully",
      room,
    });
  } catch (error) {
    console.error("VACATE TENANT ERROR 👉", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================
// Record Payment (Admin, or Owner of this room)
// Logs a payment against the current occupancy entry
// ============================

const recordPayment = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    if (
      req.user.role === "owner" &&
      (!room.owner || room.owner.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. This is not your room.",
      });
    }

    const { amount, method } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid payment amount is required",
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

    openEntry.payments.push({
      amount: Number(amount),
      date: new Date(),
      method: method || "cash",
    });
    openEntry.totalPaid = (openEntry.totalPaid || 0) + Number(amount);

    // Advance the rent cycle: next payment is due 1 month after whichever
    // due date this payment is settling (falls back to today if unset).
    const baseDate = room.currentTenant?.nextDueDate || new Date();
    room.currentTenant.nextDueDate = addOneMonth(baseDate);

    room.paymentStatus = "paid";

    await room.save();

    res.status(200).json({
      success: true,
      message: "Payment recorded successfully",
      room,
    });
  } catch (error) {
    console.error("RECORD PAYMENT ERROR 👉", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createRoom,
  getRooms,
  getSingleRoom,
  updateRoom,
  deleteRoom,
  createBulkRooms,
  assignTenant,
  vacateTenant,
  recordPayment,
  computeRentStatus,
  addOneMonth,
};
