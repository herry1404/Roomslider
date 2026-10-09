const safeMsg = require("../utils/safeMsg");
const Room = require("../models/room.model");
const { notifyUser } = require("../utils/notificationDelivery");
const { findNearestPlace, findPlaceByLocationText } = require("../data/nearbyPlaces");
require("../models/property.model"); // register model so populate("property") works
const User = require("../models/user.model");
const Property = require("../models/property.model");
const { createUniqueSlug, ensurePublicSlugs } = require("../utils/publicSlug");
const { maskPhoneNumbers, sanitizeRoomListing } = require("../utils/maskListingPhoneNumbers");
const { notifySavedSearchMatches } = require("../utils/savedSearchAlerts");
const { recordListingEngagement } = require("../utils/listingEngagement");
const SearchEvent = require("../models/SearchEvent");
const { uploadRentReceipt } = require("../utils/rentReceipt");
const { notifyAdmin } = require("../services/adminAlert.service");
const {
  applyHourlyRoomVisibility,
  buildPublicRoomFilter,
} = require("../services/publicRoomListings.service");
const { parseRoomHourlyFields } = require("../validators/roomHourly.validator");

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

async function attachPropertyAndBuilding(req, roomData) {
  const Property = require("../models/property.model");
  const { propertyId, buildingId } = req.body;

  if (buildingId && !propertyId) {
    return { error: { status: 400, message: "A property is required for this building" } };
  }

  if (!propertyId) {
    const property = await Property.create({
      name: (roomData.title || "").trim(),
      area: (roomData.location || "").trim(),
      owner: roomData.owner || null,
      propertyType: roomData.category || "Room",
    });
    roomData.property = property._id;
    return { createdProperty: property };
  }

  const property = await Property.findById(propertyId);
  if (!property) {
    return { error: { status: 404, message: "Property not found" } };
  }
  if (
    req.user.role === "owner" &&
    String(property.owner) !== String(req.user._id)
  ) {
    return {
      error: {
        status: 403,
        message: "You can only add rooms to your own property",
      },
    };
  }
  if (buildingId) {
    const building = property.buildings.id(buildingId);
    if (!building) {
      return {
        error: { status: 404, message: "Building not found in this property" },
      };
    }
    roomData.building = building._id;
  }

  roomData.property = property._id;
  if (!roomData.owner && property.owner) roomData.owner = property.owner;
  return { createdProperty: null };
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
      gender,
      rooms,
      bathrooms,
      furnished,
      ownerName,
      contact,
      whatsapp,
      amenities,
      nearby,
      priority,
      latitude,
      longitude,
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
    const hourlyFields = parseRoomHourlyFields(req.body);
    if (!hourlyFields.success) {
      return res.status(400).json({ success: false, message: hourlyFields.message });
    }

    const roomData = {
      title,
      price,
      deposit: deposit || 0,
      location,
      images,
      description,
      category,
      gender: gender || "Any",
      rooms: rooms || 1,
      bathrooms: bathrooms || 1,
      furnished: furnished === "true" || furnished === true,
      ownerName,
      contact,
      whatsapp,
      amenities: parsedAmenities,
      nearby: parsedNearby,
      priority: priority ? Number(priority) : 9999,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      ...hourlyFields.data,
    };

    // If an owner (not admin) is creating this room, auto-tag it as theirs
    if (req.user.role === "owner") {
      roomData.owner = req.user._id;
      roomData.ownerName = req.user.name || roomData.ownerName;
      roomData.contact = req.user.phone || roomData.contact;
      roomData.whatsapp = roomData.whatsapp || req.user.phone;
    }

    const { sharingType } = req.body;

    if (["Single", "Double", "Triple", "Other"].includes(sharingType)) {
      roomData.sharingType = sharingType;
    }

    roomData.slug = await createUniqueSlug(Room, roomData.title);
    const linkResult = await attachPropertyAndBuilding(req, roomData);
    if (linkResult.error) {
      return res.status(linkResult.error.status).json({
        success: false,
        message: linkResult.error.message,
      });
    }

    let room;
    try {
      room = await Room.create(roomData);
    } catch (err) {
      if (linkResult.createdProperty) {
        await linkResult.createdProperty.deleteOne();
      }
      throw err;
    }

    const { logActivity } = require("./activity.controller");
    await logActivity("room_added", `New room added: ${room.title || room.propertyName || "Untitled"}`, room._id, "Room");
    if (req.user.role === "owner") {
      notifyAdmin({
        type: "room_submission",
        title: "New room submission",
        message: "An owner submitted a new room listing.",
        link: "/admin/rooms",
      });
    }
    setImmediate(() => notifySavedSearchMatches([room]));

    res.status(201).json({
      success: true,
      message: "Room added successfully",
      room,
    });
  } catch (error) {
    console.error("CREATE ROOM ERROR 👉", error);

    res.status(500).json({
      success: false,
      message: safeMsg(error),
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
      const publicSearch = buildPublicRoomFilter({
        search: req.query.search,
        maxSearchLength: 100,
      });
      filter.$or = publicSearch.$or;
      setImmediate(() => {
        SearchEvent.create({
          userId: req.user?.role === "user" ? req.user._id : null,
        }).catch((error) => console.error("SEARCH ANALYTICS ERROR:", error));
      });
    }

    // Public users see vacant rooms; managers can inspect occupied listings.
    const canViewOccupied = req.query.includeOccupied === "true"
      && ["admin", "owner"].includes(req.user?.role);
    if (!canViewOccupied) {
      Object.assign(filter, buildPublicRoomFilter({
        category: req.query.category,
        search: req.query.search,
        maxSearchLength: 100,
      }));
    } else {
      if (req.user.role === "owner") filter.owner = req.user._id;
      if (req.query.status) filter.status = req.query.status;
    }

    if (req.query.owner && req.user?.role !== "owner") {
      filter.owner = req.query.owner;
    }

    const requestedIds = req.query.ids === undefined
      ? null
      : [...new Set(String(req.query.ids).split(",").filter((id) => /^[a-f\d]{24}$/i.test(id)))].slice(0, 10);
    if (requestedIds) {
      if (requestedIds.length === 0) return res.status(200).json({ success: true, rooms: [] });
      filter._id = { $in: requestedIds };
    }

    applyHourlyRoomVisibility(filter, req.query.hourly === "true");

    const grouped = req.query.grouped === "true";

    let query = Room.find(filter).populate("owner", "name slug isVerified");
    if (grouped || req.query.includeProperty === "true") {
      query = query.populate("property", "name slug area propertyType buildings");
    }

    let rooms = await query.sort({
      priority: 1,
      createdAt: -1,
    });
    if (requestedIds) {
      const order = new Map(requestedIds.map((id, index) => [id, index]));
      rooms.sort((first, second) => order.get(String(first._id)) - order.get(String(second._id)));
    }
    await ensurePublicSlugs(Room, rooms, (room) => room.title);
    const populatedProperties = [...new Map(
      rooms.map((room) => room.property).filter(Boolean)
        .map((property) => [String(property._id), property])
    ).values()];
    await ensurePublicSlugs(Property, populatedProperties, (property) => property.name);

    // Grouped mode (homepage): one card per distinct sharingType per property, max 3
    if (grouped) {
      const seen = new Map();
      const cards = [];
      for (const r of rooms) {
        const pid = r.property && r.property._id ? String(r.property._id) : "solo-" + r._id;
        const groupId = r.building ? `${pid}-${r.building}` : pid;
        const key = r.sharingType || "none";
        if (!seen.has(groupId)) seen.set(groupId, new Set());
        const keys = seen.get(groupId);
        if (keys.has(key) || keys.size >= 3) continue;
        keys.add(key);
        cards.push(r);
      }
      rooms = cards;

      const limit = parseInt(req.query.limit, 10);
      if (limit > 0) rooms = rooms.slice(0, Math.min(limit, 100));
    } else if (req.query.limit) {
      const limit = parseInt(req.query.limit, 10);
      if (limit > 0) rooms = rooms.slice(0, Math.min(limit, 100));
    }

    res.status(200).json({
      success: true,
      rooms: rooms.map((room) => sanitizeRoomListing(room)),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: safeMsg(error),
    });
  }
};

// ============================
// Get Single Room
// ============================

const getSingleRoom = async (req, res) => {
  try {
    const identifier = req.params.id;
    const identity = /^[a-f\d]{24}$/i.test(identifier)
      ? { _id: identifier }
      : { slug: identifier.toLowerCase() };
    const room = await Room.findOne(identity).populate("owner", "name slug isVerified");

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    recordListingEngagement(room._id, req, "view").catch((error) => {
      console.error("LISTING VIEW TRACKING ERROR:", error);
    });
    await ensurePublicSlugs(Room, [room], (item) => item.title);

    const roomObj = room.toObject();
    roomObj.title = maskPhoneNumbers(roomObj.title);
    roomObj.description = maskPhoneNumbers(roomObj.description);
    roomObj.location = maskPhoneNumbers(roomObj.location);
    roomObj.ownerName = maskPhoneNumbers(roomObj.ownerName);
    roomObj.amenities = roomObj.amenities?.map(maskPhoneNumbers);
    roomObj.nearby = roomObj.nearby?.map(maskPhoneNumbers);
    roomObj.hasContact = Boolean(room.contact || room.whatsapp);
    roomObj.hasPhoneContact = Boolean(room.contact);
    roomObj.hasWhatsAppContact = Boolean(room.whatsapp || room.contact);
    const mayManageRoom = req.user?.role === "admin"
      || (req.user?.role === "owner" && String(room.owner?._id || room.owner || "") === String(req.user._id));
    if (!mayManageRoom) {
      delete roomObj.contact;
      delete roomObj.whatsapp;
      delete roomObj.currentTenant;
      delete roomObj.currentTenantUser;
      delete roomObj.occupancyHistory;
      delete roomObj.paymentStatus;
    }
    if (room.status === "occupied" && mayManageRoom) {
      roomObj.liveRentStatus = computeRentStatus(room.currentTenant?.nextDueDate);
    }

    res.status(200).json({
      success: true,
      room: roomObj,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: safeMsg(error),
    });
  }
};

const recordListingInquiry = async (req, res) => {
  try {
    const { type } = req.body;
    if (!["call", "whatsapp", "chat"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid engagement type" });
    }

    const room = await Room.findById(req.params.id).select("_id");
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    const tracked = await recordListingEngagement(room._id, req, type);
    if (tracked) {
      notifyAdmin({
        type: "contact_inquiry",
        title: "New contact inquiry",
        message: "A visitor contacted an owner about a room.",
        link: `/admin/rooms/${room._id}`,
      });
    }
    return res.status(200).json({ success: true, tracked });
  } catch (error) {
    console.error("LISTING INQUIRY TRACKING ERROR:", error);
    return res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

const getRoomContact = async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }
    const room = await Room.findById(req.params.id).select("contact whatsapp owner");
    if (!room) return res.status(404).json({ success: false, message: "Listing not found" });
    if (!["user", "admin", "owner"].includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: "Your account cannot access listing contact details" });
    }
    if (req.user.role === "owner" && String(room.owner || "") !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "You can only access contact details for your own listings" });
    }
    if (!room.contact && !room.whatsapp) {
      return res.status(404).json({ success: false, message: "Contact details are not available" });
    }
    res.json({ success: true, contact: room.contact || "", whatsapp: room.whatsapp || room.contact || "" });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error) });
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
      gender,
      rooms,
      bathrooms,
      furnished,
      ownerName,
      contact,
      whatsapp,
      amenities,
      nearby,
      priority,
      latitude,
      longitude,
    } = req.body;

    const hourlyFields = parseRoomHourlyFields(req.body, { partial: true });
    if (!hourlyFields.success) {
      return res.status(400).json({ success: false, message: hourlyFields.message });
    }

    if (title !== undefined) {
      if (title !== room.title) room.slug = await createUniqueSlug(Room, title, room._id);
      room.title = title;
    }
    if (price !== undefined) room.price = price;
    if (deposit !== undefined) room.deposit = deposit;
    if (location !== undefined) room.location = location;
    if (description !== undefined) room.description = description;
    if (category !== undefined) room.category = category;
    if (gender !== undefined) room.gender = gender;
    if (req.body.sharingType !== undefined) {
      const st = req.body.sharingType;
      if (st === "" || st === "null") {
        room.sharingType = null;
      } else if (["Single", "Double", "Triple", "Other"].includes(st)) {
        room.sharingType = st;
      }
    }
    if (rooms !== undefined) room.rooms = rooms;
    if (bathrooms !== undefined) room.bathrooms = bathrooms;
    if (furnished !== undefined) room.furnished = furnished === "true" || furnished === true;
    if (ownerName !== undefined) room.ownerName = ownerName;
    if (contact !== undefined) room.contact = contact;
    if (whatsapp !== undefined) room.whatsapp = whatsapp;
    if (amenities !== undefined) room.amenities = JSON.parse(amenities);
    if (nearby !== undefined) room.nearby = JSON.parse(nearby);
    if (priority !== undefined) room.priority = Number(priority) || 9999;
    if (latitude !== undefined) room.latitude = Number(latitude);
    if (longitude !== undefined) room.longitude = Number(longitude);
    Object.entries(hourlyFields.data).forEach(([key, value]) => {
      room[key] = value;
    });

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
      message: safeMsg(error),
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
      message: safeMsg(error),
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
      gender,
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
    const hourlyFields = parseRoomHourlyFields(req.body);
    if (!hourlyFields.success) {
      return res.status(400).json({ success: false, message: hourlyFields.message });
    }

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
      gender: gender || "Any",
      rooms: rooms || 1,
      bathrooms: bathrooms || 1,
      furnished: furnished === "true" || furnished === true,
      ownerName,
      contact,
      whatsapp,
      amenities: parsedAmenities,
      nearby: parsedNearby,
      priority: priority ? Number(priority) : 9999,
      ...hourlyFields.data,
    };

    if (req.user.role === "owner") {
      baseData.owner = req.user._id;
      baseData.ownerName = req.user.name || baseData.ownerName;
      baseData.contact = req.user.phone || baseData.contact;
      baseData.whatsapp = baseData.whatsapp || req.user.phone;
    }

    // ---- Property and building link: whole batch shares both ----
    const { sharingType } = req.body;

    if (["Single", "Double", "Triple", "Other"].includes(sharingType)) {
      baseData.sharingType = sharingType;
    }

    const linkResult = await attachPropertyAndBuilding(req, baseData);
    if (linkResult.error) {
      return res.status(linkResult.error.status).json({
        success: false,
        message: linkResult.error.message,
      });
    }

    const roomDocs = [];
    for (let num = start; num <= end; num++) {
      const roomData = {
        ...baseData,
        roomNumber: String(num),
      };
      roomData.slug = await createUniqueSlug(Room, roomData.title);
      roomDocs.push(roomData);
    }

    let createdRooms;
    try {
      createdRooms = await Room.insertMany(roomDocs);
    } catch (err) {
      if (linkResult.createdProperty) {
        await linkResult.createdProperty.deleteOne();
      }
      throw err;
    }
    setImmediate(() => notifySavedSearchMatches(createdRooms));

    res.status(201).json({
      success: true,
      message: `${createdRooms.length} rooms added successfully`,
      rooms: createdRooms,
    });
  } catch (error) {
    console.error("BULK CREATE ROOM ERROR 👉", error);

    res.status(500).json({
      success: false,
      message: safeMsg(error),
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
      message: safeMsg(error),
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
      message: safeMsg(error),
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

    const { amount, method, type } = req.body;

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

    const payment = openEntry.payments.create({
      amount: Number(amount),
      date: new Date(),
      method: method || "cash",
      type: type === "advance" ? "advance" : "rent",
    });
    openEntry.payments.push(payment);
    openEntry.totalPaid = (openEntry.totalPaid || 0) + Number(amount);

    // Only rent payments advance the rent cycle / mark this cycle paid.
    // Advance payments are a one-time deposit and should not affect the
    // rent due-date or payment-status tracking.
    if (type !== "advance") {
      const baseDate = room.currentTenant?.nextDueDate || new Date();
      room.currentTenant.nextDueDate = addOneMonth(baseDate);

      room.paymentStatus = "paid";
    }

    await room.save();

    let receiptAvailable = false;
    if (payment.type === "rent") {
      try {
        payment.receiptUrl = await uploadRentReceipt(room, payment, openEntry.tenantName);
        await room.save();
        receiptAvailable = true;
      } catch (receiptError) {
        console.error("RENT RECEIPT GENERATION ERROR:", receiptError);
      }
    }

    res.status(200).json({
      success: true,
      message: "Payment recorded successfully",
      receiptAvailable,
      room,
    });
  } catch (error) {
    console.error("RECORD PAYMENT ERROR 👉", error);

    res.status(500).json({
      success: false,
      message: safeMsg(error),
    });
  }
};

const getRentReceipt = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    const isAdmin = req.user.role === "admin";
    const isOwner = req.user.role === "owner"
      && room.owner?.toString() === req.user._id.toString();
    const isTenant = req.user.role === "user"
      && room.currentTenantUser?.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner && !isTenant) {
      return res.status(403).json({ success: false, message: "You cannot access this receipt" });
    }

    const paymentEntry = room.occupancyHistory.find((entry) =>
      entry.payments?.some((item) => item._id.toString() === req.params.paymentId)
    );
    if (isTenant && (!paymentEntry || paymentEntry.endDate)) {
      return res.status(403).json({ success: false, message: "You cannot access this receipt" });
    }
    const payment = paymentEntry?.payments.find((item) =>
      item._id.toString() === req.params.paymentId
    );
    if (!payment || payment.type !== "rent") {
      return res.status(404).json({ success: false, message: "Rent receipt not found" });
    }

    if (!payment.receiptUrl) {
      payment.receiptUrl = await uploadRentReceipt(room, payment, paymentEntry.tenantName);
      await room.save();
    }

    const receiptResponse = await fetch(payment.receiptUrl);
    if (!receiptResponse.ok) {
      throw new Error("Receipt file could not be downloaded from storage");
    }
    const buffer = Buffer.from(await receiptResponse.arrayBuffer());
    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `attachment; filename="rent-receipt-${payment._id}.pdf"`);
    return res.send(buffer);
  } catch (error) {
    console.error("DOWNLOAD RENT RECEIPT ERROR:", error);
    return res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

// ============================
// Confirm or decline a vacate notice once its date has arrived
// (Owner, or Admin). action: "confirm" -> vacates the room (reuses the
// same logic as vacateTenant). action: "decline" -> clears the notice,
// tenant continues as normal.
// ============================

const resolveVacateNotice = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
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

    const { action } = req.body; // "confirm" | "decline"

    if (action === "decline") {
      room.currentTenant.vacateNoticeDate = null;
      await room.save();

      try {
        if (room.currentTenantUser) {
          await notifyUser(room.currentTenantUser, {
            type: "vacate_notice",
            title: "Vacate notice acknowledged",
            body: "Your landlord reviewed your vacate notice; your tenancy remains active.",
            link: "/my-place",
          });
        }
      } catch (notificationError) {
        console.error("VACATE NOTICE ACKNOWLEDGEMENT ERROR:", notificationError);
      }

      return res.status(200).json({
        success: true,
        message: "Vacate notice declined. Tenant continues.",
        room,
      });
    }

    if (action === "confirm") {
      const openEntry = [...room.occupancyHistory]
        .reverse()
        .find((entry) => !entry.endDate);

      if (openEntry) {
        openEntry.endDate = new Date();
      }

      if (room.currentTenantUser) {
        await User.findByIdAndUpdate(room.currentTenantUser, { activeRoom: null });
      }

      room.currentTenant = {
        name: "",
        phone: "",
        moveInDate: undefined,
        advanceAmount: 0,
        nextDueDate: undefined,
        vacateNoticeDate: null,
      };
      room.currentTenantUser = null;
      room.status = "vacant";
      room.paymentStatus = "pending";

      await room.save();

      try {
        if (room.currentTenantUser) {
          await notifyUser(room.currentTenantUser, {
            type: "vacate_notice",
            title: "Vacate notice acknowledged",
            body: "Your landlord confirmed your vacate notice.",
            link: "/my-place",
          });
        }
      } catch (notificationError) {
        console.error("VACATE NOTICE ACKNOWLEDGEMENT ERROR:", notificationError);
      }

      return res.status(200).json({
        success: true,
        message: "Room vacated successfully",
        room,
      });
    }

    return res.status(400).json({
      success: false,
      message: "action must be 'confirm' or 'decline'",
    });
  } catch (error) {
    console.error("RESOLVE VACATE NOTICE ERROR 👉", error);
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

// ============================
// Upload a lease/agreement document for the current tenancy
// (Owner, or Admin). Requires the room to be occupied.
// ============================

const uploadLeaseDocument = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
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

    if (room.status !== "occupied") {
      return res.status(400).json({
        success: false,
        message: "Assign a tenant before uploading a lease document",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "A document file is required",
      });
    }

    room.currentTenant.leaseDocumentUrl = req.file.path;
    room.currentTenant.leaseDocumentName = req.file.originalname;

    await room.save();

    res.status(200).json({
      success: true,
      message: "Lease document uploaded",
      room,
    });
  } catch (error) {
    console.error("UPLOAD LEASE DOCUMENT ERROR 👉", error);
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

// ============================
// Get Nearby Rooms (same area, any category)
// Matches on the first part of the location string (before a comma)
// so "Vijaynagar" matches "Vijaynagar, Indore" etc. Falls back to latest
// vacant rooms if not enough area matches are found.
// ============================

const getNearbyRooms = async (req, res) => {
  try {
    const identifier = req.params.id;
    const identity = /^[a-f\d]{24}$/i.test(identifier)
      ? { _id: identifier }
      : { slug: identifier.toLowerCase() };
    const room = await Room.findOne(identity);

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    // Step 1: find nearest college/area to this room
    let nearestPlace = findNearestPlace(room.latitude, room.longitude);
    if (!nearestPlace) {
      nearestPlace = findPlaceByLocationText(room.location);
    }

    const areaName = room.location.split(",")[0].trim();
    const escaped = areaName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const areaRegex = new RegExp(escaped, "i");

    const allVacant = await Room.find({
      _id: { $ne: room._id },
      status: "vacant",
    })
      .select("title price location images category latitude longitude")
      .sort({ createdAt: -1 })
      .limit(50);

    let nearbyRooms = [];

    if (nearestPlace) {
      // Rooms with coordinates: keep ones within 4km of the nearest place
      const withCoords = allVacant.filter(
        (r) =>
          r.latitude != null &&
          r.longitude != null &&
          distanceKmHelper(r.latitude, r.longitude, nearestPlace.latitude, nearestPlace.longitude) <= 4
      );

      // Rooms without coordinates: fall back to text match on location
      const withoutCoords = allVacant.filter(
        (r) => (r.latitude == null || r.longitude == null) && areaRegex.test(r.location)
      );

      nearbyRooms = [...withCoords, ...withoutCoords].slice(0, 10);
    } else {
      nearbyRooms = allVacant.filter((r) => areaRegex.test(r.location)).slice(0, 10);
    }

    if (nearbyRooms.length < 4) {
      const excludeIds = [room._id, ...nearbyRooms.map((r) => r._id)];
      const extra = allVacant
        .filter((r) => !excludeIds.some((id) => id.equals(r._id)))
        .slice(0, 10 - nearbyRooms.length);
      nearbyRooms = [...nearbyRooms, ...extra];
    }

    res.status(200).json({
      success: true,
      rooms: nearbyRooms.map((nearbyRoom) => sanitizeRoomListing(nearbyRoom)),
      nearestPlace: nearestPlace ? nearestPlace.name : null,
    });
  } catch (error) {
    console.error("GET NEARBY ROOMS ERROR 👉", error);
    res.status(500).json({ success: false, message: safeMsg(error) });
  }
};

function distanceKmHelper(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

module.exports = {
  createRoom,
  getRooms,
  getSingleRoom,
  getRoomContact,
  recordListingInquiry,
  getRentReceipt,
  updateRoom,
  deleteRoom,
  createBulkRooms,
  assignTenant,
  vacateTenant,
  recordPayment,
  computeRentStatus,
  addOneMonth,
  resolveVacateNotice,
  uploadLeaseDocument,
  getNearbyRooms,
};
