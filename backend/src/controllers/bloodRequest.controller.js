const mongoose = require("mongoose");
const BloodRequest = require("../models/BloodRequest");
const User = require("../models/user.model");
const { notifyUser } = require("../utils/notificationDelivery");

const GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const STATUSES = ["pending", "approved", "fulfilled", "closed", "rejected", "expired"];
const DONOR_GROUPS_BY_RECIPIENT = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": GROUPS,
};
const safeText = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : "";
const safeMsg = (error, fallback) => {
  console.error("BLOOD REQUEST ERROR:", error?.name || "UnknownError");
  return fallback;
};
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const exactDayRange = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
  const midnight = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)) - 330 * 60 * 1000;
  return { start: new Date(midnight), end: new Date(midnight + 24 * 60 * 60 * 1000) };
};
const isExpired = (request, now = new Date()) => request.neededBy && now.getTime() > new Date(request.neededBy).getTime() + 24 * 60 * 60 * 1000;
const expireIfNeeded = async (request) => {
  if (!request || !["pending", "approved"].includes(request.status) || !isExpired(request)) return request;
  request.status = "expired";
  await request.save();
  return request;
};
const sendSafely = async (userId, notification, operation) => {
  try {
    return await notifyUser(userId, notification);
  } catch (error) {
    console.error(`${operation} NOTIFICATION ERROR:`, error?.name || "UnknownError");
    return null;
  }
};
const notifyAdmins = async (notification) => {
  const admins = await User.find({ role: "admin" }).select("_id").lean();
  return Promise.all(admins.map((admin) => sendSafely(admin._id, notification, "BLOOD ADMIN")));
};
const donorFilter = (request, selectedGroups) => {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const adultCutoff = new Date();
  adultCutoff.setFullYear(adultCutoff.getFullYear() - 18);
  const filter = {
    _id: { $ne: request.requester },
    role: "user",
    bloodGroup: { $in: selectedGroups },
    bloodDonorConsent: true,
    bloodDonorAvailable: true,
    bloodRequestsBlocked: { $ne: true },
    isActive: { $ne: false },
    isBlocked: { $ne: true },
    dob: { $lte: adultCutoff },
    $or: [{ lastDonatedAt: null }, { lastDonatedAt: { $lte: cutoff } }],
  };
  if (request.notifiedDonors?.length) filter._id.$nin = request.notifiedDonors;
  if (request.notAvailableDonors?.length) filter._id.$nin = [...(filter._id.$nin || []), ...request.notAvailableDonors];
  return filter;
};
const safeDonorRequest = (request) => ({
  _id: request._id,
  bloodGroup: request.bloodGroup,
  unitsNeeded: request.unitsNeeded,
  hospitalName: request.hospitalName,
  area: request.area,
  neededBy: request.neededBy,
  urgency: request.urgency,
  status: request.status,
  createdAt: request.createdAt,
  helperCount: request.helpers?.length ?? request.helperCount ?? 0,
  contactRevealed: false,
});
const requesterRequest = (request) => ({
  _id: request._id,
  patientName: request.patientName,
  bloodGroup: request.bloodGroup,
  unitsNeeded: request.unitsNeeded,
  hospitalName: request.hospitalName,
  area: request.area,
  address: request.address,
  neededBy: request.neededBy,
  urgency: request.urgency,
  contactName: request.contactName,
  contactNumber: request.contactNumber,
  note: request.note,
  status: request.status,
  approvedAt: request.approvedAt,
  rejectReason: request.rejectReason,
  notifiedCount: request.notifiedCount,
  helperCount: request.helpers?.length ?? 0,
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
});
const localDateText = (value) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" }).format(value);

exports.createBloodRequest = async (req, res) => {
  try {
    if (req.user.role !== "user") return res.status(403).json({ success: false, message: "Only user accounts can request blood" });
    const currentUser = await User.findById(req.user._id).select("+bloodRequestsBlocked +isActive +isBlocked").lean();
    if (!currentUser || currentUser.bloodRequestsBlocked || currentUser.isActive === false || currentUser.isBlocked) {
      return res.status(403).json({ success: false, message: "This account cannot submit blood requests" });
    }
    const {
      patientName, bloodGroup, unitsNeeded, hospitalName, area, address, neededBy, urgency,
      contactName, contactNumber, note, contactConsent,
    } = req.body || {};
    const cleanPatient = safeText(patientName, 100);
    const cleanHospital = safeText(hospitalName, 180);
    const cleanArea = safeText(area, 100);
    const cleanContactName = safeText(contactName, 100);
    const cleanPhone = safeText(contactNumber, 25);
    const cleanNote = safeText(note, 1000);
    const units = Number(unitsNeeded);
    const needed = new Date(neededBy);
    const urgencyValue = safeText(urgency, 20);
    if (!cleanPatient || !GROUPS.includes(bloodGroup) || !Number.isInteger(units) || units < 1 || units > 20 ||
      !cleanHospital || !cleanArea || !cleanContactName ||
      !/^\+?[0-9()\s.-]{7,25}$/.test(cleanPhone) ||
      !["critical", "urgent", "planned"].includes(urgencyValue) ||
      !Number.isFinite(needed.getTime()) || needed <= new Date() ||
      contactConsent !== true) {
      return res.status(400).json({ success: false, message: "Complete the required request details and confirm that your contact number may be shared with donors who offer help" });
    }
    if (address !== undefined && (typeof address !== "string" || address.length > 500)) {
      return res.status(400).json({ success: false, message: "Enter a valid address" });
    }
    const { start, end } = exactDayRange();
    const dailyCount = await BloodRequest.countDocuments({ requester: req.user._id, createdAt: { $gte: start, $lt: end } });
    if (dailyCount >= 3) return res.status(429).json({ success: false, message: "You can submit up to 3 blood requests per day" });
    const request = await BloodRequest.create({
      requester: req.user._id,
      patientName: cleanPatient,
      bloodGroup,
      unitsNeeded: units,
      hospitalName: cleanHospital,
      area: cleanArea,
      address: safeText(address, 500),
      neededBy: needed,
      urgency: urgencyValue,
      contactName: cleanContactName,
      contactNumber: cleanPhone,
      contactShareConsent: true,
      contactShareConsentAt: new Date(),
      note: cleanNote,
    });
    await notifyAdmins({
      type: "blood_request",
      title: "Blood request submitted",
      body: `${bloodGroup} blood · ${units} unit(s) · ${cleanHospital}, ${cleanArea} · Needed by ${localDateText(needed)}.`,
      link: "/admin/blood-requests",
      data: { requestId: String(request._id) },
    });
    res.status(201).json({ success: true, request: requesterRequest(request) });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error, "Blood request could not be submitted") });
  }
};

exports.getMyBloodRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find({ requester: req.user._id }).select("+helpers").sort({ createdAt: -1 }).lean();
    for (const request of requests) {
      if (["pending", "approved"].includes(request.status) && isExpired(request)) {
        await BloodRequest.updateOne({ _id: request._id, status: request.status }, { $set: { status: "expired" } });
        request.status = "expired";
      }
    }
    res.json({ success: true, requests: requests.map(requesterRequest) });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error, "Blood requests could not be loaded") });
  }
};

exports.closeMyBloodRequest = async (req, res) => {
  try {
    const request = await BloodRequest.findOne({ _id: req.params.id, requester: req.user._id });
    if (!request) return res.status(404).json({ success: false, message: "Blood request not found" });
    await expireIfNeeded(request);
    if (!["pending", "approved"].includes(request.status)) return res.status(409).json({ success: false, message: "This request is already closed" });
    request.status = "closed";
    await request.save();
    res.json({ success: true, request: requesterRequest(request) });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error, "Blood request could not be closed") });
  }
};

exports.getBloodRequest = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: "Blood request not found" });
    const request = await BloodRequest.findById(req.params.id).select("+helpers +notifiedDonors +notAvailableDonors").lean();
    if (!request) return res.status(404).json({ success: false, message: "Blood request not found" });
    const isAdmin = req.user.role === "admin";
    const isRequester = String(request.requester) === String(req.user._id);
    const isDonor = request.notifiedDonors.some((userId) => String(userId) === String(req.user._id));
    if (!isAdmin && !isRequester && !isDonor) return res.status(404).json({ success: false, message: "Blood request not found" });
    if (["pending", "approved"].includes(request.status) && isExpired(request)) {
      await BloodRequest.updateOne({ _id: request._id, status: request.status }, { $set: { status: "expired" } });
      request.status = "expired";
    }
    if (isRequester) return res.json({ success: true, request: requesterRequest(request), view: "requester" });
    if (isAdmin) {
      const requester = await User.findById(request.requester).select("name phone +bloodRequestsBlocked").lean();
      const helpers = await User.find({ _id: { $in: request.helpers.map((helper) => helper.user) } }).select("name phone").lean();
      return res.json({
        success: true,
        view: "admin",
        request: { ...request, requester, helpers, helperCount: request.helpers.length },
      });
    }
    res.json({
      success: true,
      view: "donor",
      request: safeDonorRequest({ ...request, helperCount: request.helpers.length }),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error, "Blood request could not be loaded") });
  }
};

exports.helpWithBloodRequest = async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    const request = await BloodRequest.findById(req.params.id).select("+helpers +notifiedDonors +notAvailableDonors");
    if (!request) return res.status(404).json({ success: false, message: "Blood request not found" });
    await expireIfNeeded(request);
    if (request.status !== "approved") return res.status(409).json({ success: false, message: "This blood request is not open for help" });
    if (!request.contactShareConsent) return res.status(403).json({ success: false, message: "The requester has not approved contact sharing" });
    if (!isAdmin) {
      if (req.user.role !== "user" || !request.notifiedDonors.some((id) => String(id) === String(req.user._id))) {
        return res.status(403).json({ success: false, message: "Only donors notified about this request can offer help" });
      }
      const donor = await User.findById(req.user._id).select("+isActive +isBlocked").lean();
      if (!donor?.bloodDonorConsent || !donor.bloodDonorAvailable || donor.isActive === false || donor.isBlocked) {
        return res.status(403).json({ success: false, message: "Enable donor consent and availability before offering help" });
      }
      const adultCutoff = new Date();
      adultCutoff.setFullYear(adultCutoff.getFullYear() - 18);
      if (!donor.dob || new Date(donor.dob) > adultCutoff) {
        return res.status(403).json({ success: false, message: "Blood donors must be at least 18 years old" });
      }
      if (donor.lastDonatedAt && new Date(donor.lastDonatedAt) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) {
        return res.status(403).json({ success: false, message: "Donors must wait at least 90 days after donating before responding to requests" });
      }
    }
    const alreadyHelped = request.helpers.some((helper) => String(helper.user) === String(req.user._id));
    if (!alreadyHelped) {
      request.helpers.push({ user: req.user._id, respondedAt: new Date() });
      request.notAvailableDonors = request.notAvailableDonors.filter((id) => String(id) !== String(req.user._id));
      await request.save();
      await sendSafely(request.requester, {
        type: "blood_request",
        title: "A donor offered to help",
        body: `A donor responded. Helpers: ${request.helpers.length}.`,
        link: `/blood/requests/${request._id}`,
        data: { requestId: String(request._id), helperCount: request.helpers.length },
      }, "BLOOD HELPER RESPONSE");
    }
    res.json({
      success: true,
      contact: { contactName: request.contactName, contactNumber: request.contactNumber },
      helperCount: request.helpers.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error, "Your response could not be recorded") });
  }
};

exports.markUnavailable = async (req, res) => {
  try {
    if (req.user.role !== "user") return res.status(403).json({ success: false, message: "Only notified donors can respond to this request" });
    const request = await BloodRequest.findById(req.params.id).select("+helpers +notifiedDonors +notAvailableDonors");
    if (!request) return res.status(404).json({ success: false, message: "Blood request not found" });
    await expireIfNeeded(request);
    if (request.status !== "approved" || !request.notifiedDonors.some((id) => String(id) === String(req.user._id))) {
      return res.status(404).json({ success: false, message: "Blood request not found" });
    }
    const alreadyResponded = request.helpers.some((helper) => String(helper.user) === String(req.user._id)) ||
      request.notAvailableDonors.some((id) => String(id) === String(req.user._id));
    if (!alreadyResponded) {
      request.notAvailableDonors.push(req.user._id);
      await request.save();
      await sendSafely(request.requester, {
        type: "blood_request",
        title: "A donor responded",
        body: `A donor responded. Helpers: ${request.helpers.length}.`,
        link: `/blood/requests/${request._id}`,
        data: { requestId: String(request._id), helperCount: request.helpers.length },
      }, "BLOOD UNAVAILABLE RESPONSE");
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error, "Your response could not be recorded") });
  }
};

exports.getAdminBloodRequests = async (req, res) => {
  try {
    const filter = {};
    if (STATUSES.includes(req.query.status)) filter.status = req.query.status;
    if (GROUPS.includes(req.query.bloodGroup)) filter.bloodGroup = req.query.bloodGroup;
    if (req.query.area) filter.area = new RegExp(escapeRegex(safeText(req.query.area, 100)), "i");
    if (["critical", "urgent", "planned"].includes(req.query.urgency)) filter.urgency = req.query.urgency;
    const requests = await BloodRequest.find(filter)
      .select("+helpers")
      .populate("requester", "name phone +bloodRequestsBlocked")
      .populate("helpers.user", "name phone")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    for (const request of requests) {
      if (["pending", "approved"].includes(request.status) && isExpired(request)) {
        request.status = "expired";
        await BloodRequest.updateOne({ _id: request._id, status: { $in: ["pending", "approved"] } }, { $set: { status: "expired" } });
      }
      request.helperCount = request.helpers.length;
    }
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error, "Blood requests could not be loaded") });
  }
};

exports.getPendingCount = async (_req, res) => {
  try {
    const expirationCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await BloodRequest.updateMany(
      { status: "pending", neededBy: { $lte: expirationCutoff } },
      { $set: { status: "expired" } }
    );
    res.json({ success: true, count: await BloodRequest.countDocuments({ status: "pending" }) });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error, "Pending blood request count could not be loaded") });
  }
};

exports.approveBloodRequest = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: "Blood request not found" });
    await expireIfNeeded(request);
    if (request.status !== "pending") return res.status(409).json({ success: false, message: "Only pending requests can be approved" });
    request.status = "approved";
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    await request.save();
    await sendSafely(request.requester, {
      type: "blood_request",
      title: "Blood request approved",
      body: "Your blood request was approved. We are notifying eligible donors.",
      link: `/blood/requests/${request._id}`,
      data: { requestId: String(request._id), status: request.status },
    }, "BLOOD REQUEST APPROVAL");
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error, "Blood request could not be approved") });
  }
};

exports.rejectBloodRequest = async (req, res) => {
  try {
    const reason = safeText(req.body?.reason, 500);
    if (reason.length < 2) return res.status(400).json({ success: false, message: "A rejection reason is required" });
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: "Blood request not found" });
    if (request.status !== "pending") return res.status(409).json({ success: false, message: "Only pending requests can be rejected" });
    request.status = "rejected";
    request.rejectReason = reason;
    await request.save();
    await sendSafely(request.requester, {
      type: "blood_request",
      title: "Blood request not approved",
      body: `Your blood request was not approved: ${reason}`,
      link: `/blood/requests/${request._id}`,
      data: { requestId: String(request._id), status: request.status },
    }, "BLOOD REQUEST REJECTION");
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error, "Blood request could not be rejected") });
  }
};

const audienceGroups = (request, audience) => {
  if (audience === "exact") return [request.bloodGroup];
  if (audience === "compatible") return DONOR_GROUPS_BY_RECIPIENT[request.bloodGroup];
  return GROUPS;
};
const eligibleDonors = async (request, audience) => {
  const filter = donorFilter(request, audienceGroups(request, audience));
  if (audience === "area") filter.area = new RegExp(`^${escapeRegex(request.area)}$`, "i");
  return User.find(filter).select("_id bloodGroup").lean();
};

exports.estimateRecipients = async (req, res) => {
  try {
    const audience = safeText(req.query.audience, 20);
    if (!["exact", "compatible", "area"].includes(audience)) return res.status(400).json({ success: false, message: "Choose a valid donor audience" });
    const request = await BloodRequest.findById(req.params.id).select("+notifiedDonors +notAvailableDonors");
    if (!request) return res.status(404).json({ success: false, message: "Blood request not found" });
    await expireIfNeeded(request);
    if (request.status !== "approved") return res.status(409).json({ success: false, message: "Approve the request before broadcasting" });
    const donors = await eligibleDonors(request, audience);
    res.json({ success: true, estimatedRecipientCount: donors.length });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error, "Recipient estimate could not be loaded") });
  }
};

exports.broadcastBloodRequest = async (req, res) => {
  try {
    const audience = safeText(req.body?.audience, 20);
    if (!["exact", "compatible", "area"].includes(audience)) return res.status(400).json({ success: false, message: "Choose a valid donor audience" });
    const request = await BloodRequest.findById(req.params.id).select("+notifiedDonors +notAvailableDonors");
    if (!request) return res.status(404).json({ success: false, message: "Blood request not found" });
    await expireIfNeeded(request);
    if (request.status !== "approved") return res.status(409).json({ success: false, message: "Approve the request before broadcasting" });
    const donors = await eligibleDonors(request, audience);
    const donorIds = donors.map((donor) => donor._id);
    if (donorIds.length) {
      await BloodRequest.updateOne({ _id: request._id }, { $addToSet: { notifiedDonors: { $each: donorIds } } });
    }
    const exactIds = new Set(donors.filter((donor) => donor.bloodGroup === request.bloodGroup).map((donor) => String(donor._id)));
    const delivered = await Promise.all(donors.map(async (donor) => {
      const exact = exactIds.has(String(donor._id));
      const notification = await sendSafely(donor._id, {
        type: "blood_request",
        title: exact ? `Urgent: ${request.bloodGroup} blood needed` : `Blood request: ${request.bloodGroup} needed`,
        body: `${request.bloodGroup} · ${request.unitsNeeded} unit(s) · ${request.hospitalName}, ${request.area} · Needed by ${localDateText(request.neededBy)}.`,
        link: `/blood/requests/${request._id}`,
        data: { requestId: String(request._id), exactMatch: exact, canHelp: true },
        requestId: String(request._id),
        priority: exact ? "high" : "normal",
        actions: [{ action: "help", title: "I can help" }],
      }, "BLOOD DONOR");
      return notification ? donor._id : null;
    }));
    const deliveredIds = delivered.filter(Boolean);
    const deliveredKeys = new Set(deliveredIds.map(String));
    const failedIds = donors.filter((donor) => !deliveredKeys.has(String(donor._id))).map((donor) => donor._id);
    if (failedIds.length) {
      await BloodRequest.updateOne({ _id: request._id }, { $pull: { notifiedDonors: { $in: failedIds } } });
    }
    if (donorIds.length) {
      const updated = await BloodRequest.findById(request._id).select("+notifiedDonors").lean();
      await BloodRequest.updateOne({ _id: request._id }, { $set: { notifiedCount: updated.notifiedDonors.length } });
    }
    res.json({ success: true, recipientCount: deliveredIds.length });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error, "Blood request could not be broadcast") });
  }
};

exports.updateAdminBloodStatus = async (req, res) => {
  try {
    const status = safeText(req.body?.status, 20);
    if (!["fulfilled", "closed"].includes(status)) return res.status(400).json({ success: false, message: "Choose fulfilled or closed" });
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: "Blood request not found" });
    if (!["pending", "approved"].includes(request.status)) return res.status(409).json({ success: false, message: "This request is already closed" });
    request.status = status;
    await request.save();
    await sendSafely(request.requester, {
      type: "blood_request",
      title: status === "fulfilled" ? "Blood request fulfilled" : "Blood request closed",
      body: status === "fulfilled" ? "Your blood request has been marked fulfilled." : "Your blood request has been closed.",
      link: `/blood/requests/${request._id}`,
      data: { requestId: String(request._id), status },
    }, "BLOOD REQUEST STATUS");
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error, "Blood request status could not be updated") });
  }
};

exports.setRequestBlock = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.userId) || typeof req.body?.blocked !== "boolean") {
      return res.status(400).json({ success: false, message: "A user and block status are required" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { bloodRequestsBlocked: req.body.blocked },
      { new: true, runValidators: true }
    ).select("name +bloodRequestsBlocked");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user: { _id: user._id, name: user.name, bloodRequestsBlocked: user.bloodRequestsBlocked } });
  } catch (error) {
    res.status(500).json({ success: false, message: safeMsg(error, "Request access could not be updated") });
  }
};
