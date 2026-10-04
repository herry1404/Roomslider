const DonationRequest = require("../models/DonationRequest");
const FurnitureItem = require("../models/furnitureItem.model");
const User = require("../models/user.model");
const { notifyUser } = require("../utils/notificationDelivery");

const ITEM_TYPES = ["books", "clothes", "furniture", "utensils", "electronics", "bedding", "other"];
const CONDITIONS = ["good", "usable", "needs_repair"];
const SLOTS = ["morning", "afternoon", "evening"];
const STATUSES = ["new", "pickup_scheduled", "collected", "listed", "cancelled"];
const safe = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : "";
const runNotifications = async (recipients, notification, context) => {
  await Promise.all(recipients.map(async (recipient) => {
    try {
      await notifyUser(recipient._id || recipient, notification);
    } catch (error) {
      console.error(`${context} NOTIFICATION ERROR:`, error.message);
    }
  }));
};
const getAdminUsers = () => User.find({ role: "admin" }).select("_id").lean();

exports.createDonation = async (req, res) => {
  try {
    if (req.user.role !== "user") return res.status(403).json({ success: false, message: "Only user accounts can submit a donation" });
    const body = req.body || {};
    const itemType = safe(body.itemType, 30);
    const condition = safe(body.condition, 30);
    const timeSlot = safe(body.preferredTimeSlot, 20);
    const description = safe(body.description, 1500);
    const quantity = Number(body.quantity);
    const addressInput = typeof body.address === "string" ? JSON.parse(body.address) : body.address;
    const date = new Date(body.preferredDate);
    if (!ITEM_TYPES.includes(itemType) || !CONDITIONS.includes(condition) || !SLOTS.includes(timeSlot)) {
      return res.status(400).json({ success: false, message: "Choose a valid item type, condition, and pickup time" });
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return res.status(400).json({ success: false, message: "Quantity must be between 1 and 100" });
    }
    if (!Number.isFinite(date.getTime()) || date < new Date(new Date().toDateString())) {
      return res.status(400).json({ success: false, message: "Choose a valid future pickup date" });
    }
    if (!addressInput || typeof addressInput !== "object" || Array.isArray(addressInput)) {
      return res.status(400).json({ success: false, message: "Enter a pickup address" });
    }
    const flat = safe(addressInput.flat, 100);
    const building = safe(addressInput.building, 150);
    const area = safe(addressInput.area, 100);
    const landmark = safe(addressInput.landmark, 200);
    if (!flat || !area || !description) return res.status(400).json({ success: false, message: "Description, flat or house number, and area are required" });
    let location;
    const lat = addressInput.lat === "" || addressInput.lat === undefined ? null : Number(addressInput.lat);
    const lng = addressInput.lng === "" || addressInput.lng === undefined ? null : Number(addressInput.lng);
    if ((lat === null) !== (lng === null) || (lat !== null && (
      !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180
    ))) return res.status(400).json({ success: false, message: "Enter valid pickup coordinates" });
    if (lat !== null) location = { type: "Point", coordinates: [lng, lat] };
    const photos = (req.files || []).map((file) => file.path || file.secure_url || file.location).filter(Boolean).slice(0, 4);
    const donation = await DonationRequest.create({
      donor: req.user._id,
      itemType,
      description,
      quantity,
      condition,
      photos,
      address: { flat, building, area, landmark, ...(location ? { location } : {}) },
      preferredDate: date,
      preferredTimeSlot: timeSlot,
    });
    const admins = await getAdminUsers();
    await runNotifications(admins, {
      type: "service_request",
      title: "New donation request",
      body: `${quantity} ${itemType} item${quantity === 1 ? "" : "s"} submitted for pickup in ${area}.`,
      link: "/admin/service-requests?category=donation",
      data: { donationId: String(donation._id) },
    }, "DONATION ADMIN");
    res.status(201).json({ success: true, request: donation });
  } catch (error) {
    console.error("CREATE DONATION ERROR:", error?.name || "UnknownError");
    res.status(400).json({ success: false, message: error.message === "Unexpected end of JSON input" ? "Enter a valid pickup address" : "Donation request could not be submitted" });
  }
};

exports.getMyDonations = async (req, res) => {
  try {
    const requests = await DonationRequest.find({ donor: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, requests });
  } catch (error) {
    console.error("MY DONATIONS ERROR:", error?.name || "UnknownError");
    res.status(500).json({ success: false, message: "Donation requests could not be loaded" });
  }
};

exports.cancelDonation = async (req, res) => {
  try {
    const donation = await DonationRequest.findOne({ _id: req.params.id, donor: req.user._id });
    if (!donation) return res.status(404).json({ success: false, message: "Donation request not found" });
    if (!["new", "pickup_scheduled"].includes(donation.status)) {
      return res.status(409).json({ success: false, message: "This donation request can no longer be cancelled" });
    }
    donation.status = "cancelled";
    await donation.save();
    await runNotifications([donation.donor], {
      type: "service_status",
      title: "Donation request cancelled",
      body: `Your ${donation.itemType} donation pickup request was cancelled.`,
      link: "/donate",
      data: { donationId: String(donation._id), status: donation.status },
    }, "DONATION CANCELLATION");
    res.json({ success: true, request: donation });
  } catch {
    res.status(400).json({ success: false, message: "Donation request could not be cancelled" });
  }
};

exports.getAdminDonations = async (req, res) => {
  try {
    const filter = {};
    if (STATUSES.includes(req.query.status)) filter.status = req.query.status;
    const requests = await DonationRequest.find(filter)
      .populate("donor", "name phone")
      .populate("catalogItem", "name")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    res.json({ success: true, requests });
  } catch (error) {
    console.error("ADMIN DONATIONS ERROR:", error?.name || "UnknownError");
    res.status(500).json({ success: false, message: "Donation requests could not be loaded" });
  }
};

exports.updateDonationStatus = async (req, res) => {
  try {
    const status = safe(req.body?.status, 30);
    if (!STATUSES.includes(status) || status === "listed") {
      return res.status(400).json({ success: false, message: "Choose a valid donation status" });
    }
    const donation = await DonationRequest.findById(req.params.id);
    if (!donation) return res.status(404).json({ success: false, message: "Donation request not found" });
    if (donation.status === "listed" || donation.status === "cancelled") {
      return res.status(409).json({ success: false, message: "This donation request is already closed" });
    }
    if (donation.status === status) return res.json({ success: true, request: donation });
    donation.status = status;
    await donation.save();
    await runNotifications([donation.donor], {
      type: "service_status",
      title: "Donation pickup update",
      body: `Your ${donation.itemType} donation request is now ${status.replaceAll("_", " ")}.`,
      link: "/donate",
      data: { donationId: String(donation._id), status },
    }, "DONATION STATUS");
    res.json({ success: true, request: donation });
  } catch (error) {
    console.error("UPDATE DONATION STATUS ERROR:", error?.name || "UnknownError");
    res.status(500).json({ success: false, message: "Donation status could not be updated" });
  }
};

exports.addDonationToCatalog = async (req, res) => {
  try {
    const donation = await DonationRequest.findById(req.params.id);
    if (!donation) return res.status(404).json({ success: false, message: "Donation request not found" });
    if (donation.status === "listed" || donation.catalogItem) {
      return res.status(409).json({ success: false, message: "This donation is already in the furniture catalog" });
    }
    if (donation.status !== "collected") {
      return res.status(409).json({ success: false, message: "Mark the donation collected before adding it to the catalog" });
    }
    const category = safe(req.body?.category, 40);
    const monthlyRent = Number(req.body?.monthlyRent);
    if (!FurnitureItem.CATEGORIES.includes(category) || !Number.isFinite(monthlyRent) || monthlyRent <= 0) {
      return res.status(400).json({ success: false, message: "Choose a furniture category and enter a monthly rent greater than zero" });
    }
    const item = await FurnitureItem.create({
      name: `${donation.itemType.charAt(0).toUpperCase()}${donation.itemType.slice(1)} donation`,
      category,
      description: "",
      images: donation.photos,
      rentPlans: [{ months: 3, monthlyRent }],
      deposit: 0,
      buyPrice: null,
      secondHandPrice: null,
      deliveryFee: 0,
      isAvailable: true,
      isActive: false,
      badge: "Donated - low rent",
      isDonated: true,
      donatedBy: donation.donor,
    });
    donation.catalogItem = item._id;
    donation.status = "listed";
    await donation.save();
    await runNotifications([donation.donor], {
      type: "service_status",
      title: "Donation item added to catalog",
      body: "Your collected item has been added as a draft in the furniture catalog.",
      link: "/donate",
      data: { donationId: String(donation._id), status: "listed" },
    }, "DONATION CATALOG");
    res.status(201).json({ success: true, item: { _id: item._id, name: item.name }, request: donation });
  } catch (error) {
    console.error("ADD DONATION TO CATALOG ERROR:", error?.name || "UnknownError");
    res.status(500).json({ success: false, message: "Donation item could not be added to the catalog" });
  }
};
