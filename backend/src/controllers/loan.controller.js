const Loan = require("../models/loan.model");
const cloudinary = require("../config/cloudinary");
const { notifyUser } = require("../utils/notificationDelivery");

const STATUS_MESSAGES = {
  submitted: "Your student loan application has been received.",
  under_review: "Your student loan application is now under review.",
  contacted: "Our team has marked your student loan application for contact.",
  approved: "Your student loan application has been approved. Our team will contact you with the next steps.",
  rejected: "Your student loan application was not approved. Contact our team if you need more information.",
};

const getAdultDateCutoff = (now = new Date()) => {
  const year = now.getUTCFullYear() - 18;
  const month = now.getUTCMonth();
  const day = Math.min(now.getUTCDate(), new Date(Date.UTC(year, month + 1, 0)).getUTCDate());
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const PAN_PATTERN = /^[A-Z]{3}[ABCFGHLJPT][A-Z][0-9]{4}[A-Z]$/;

// Student submits a loan lead.
const createLoanRequest = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      dob,
      address,
      addressDetails,
      amount,
      purpose,
      note,
      college,
      course,
      pan,
      guardianName,
      guardianPhone,
      guardianOccupation,
      familyIncomeRange,
      idType,
      consentGiven,
      currentLocation,
    } = req.body;

    const fail = async (message, status = 400) => {
      if (req.file && req.file.filename) {
        try {
          await cloudinary.uploader.destroy(req.file.filename, {
            resource_type: "image",
            type: "authenticated",
            invalidate: true,
          });
        } catch (e) {
          console.error("ORPHAN KYC PHOTO DELETE ERROR:", e);
        }
      }
      return res.status(status).json({ success: false, message });
    };

    const requiredFields = {
      name, phone, email, dob, address, amount, college, course, pan,
      guardianName, guardianPhone, guardianOccupation, familyIncomeRange, idType,
    };
    for (const [key, value] of Object.entries(requiredFields)) {
      if (value === undefined || value === null || !String(value).trim()) {
        return fail(`${key} is required`);
      }
    }

    if (!/^[6-9]\d{9}$/.test(phone)) return fail("Invalid phone number");
    if (!/^[6-9]\d{9}$/.test(guardianPhone)) return fail("Invalid guardian phone number");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Invalid email");
    const normalizedPan = String(pan).trim().toUpperCase();
    if (!PAN_PATTERN.test(normalizedPan)) {
      return fail("Enter a valid PAN format (for example, ABCPE1234F)");
    }
    if (!(Number(amount) > 0)) return fail("Invalid amount");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return fail("Enter a valid date of birth");
    const parsedDob = new Date(`${dob}T00:00:00.000Z`);
    if (
      Number.isNaN(parsedDob.getTime()) ||
      parsedDob.toISOString().slice(0, 10) !== dob
    ) {
      return fail("Enter a valid date of birth");
    }
    if (dob > getAdultDateCutoff()) {
      return fail("Applicants must be at least 18 years old");
    }
    if (!["below_2l", "2l_5l", "5l_10l", "above_10l"].includes(familyIncomeRange)) {
      return fail("Invalid family income range");
    }
    let parsedAddress;
    if (addressDetails) {
      try {
        parsedAddress = typeof addressDetails === "string"
          ? JSON.parse(addressDetails)
          : addressDetails;
      } catch {
        return fail("Address details are invalid");
      }
      if (
        !parsedAddress ||
        typeof parsedAddress !== "object" ||
        Array.isArray(parsedAddress)
      ) {
        return fail("Address details are invalid");
      }
      const fields = {
        houseNumber: 100,
        area: 100,
        nearby: 100,
        city: 80,
        state: 80,
        postalCode: 10,
      };
      for (const [field, maxLength] of Object.entries(fields)) {
        const value = parsedAddress[field];
        if (value !== undefined && (typeof value !== "string" || value.trim().length > maxLength)) {
          return fail(`Invalid address ${field}`);
        }
      }
      if (
        !parsedAddress.houseNumber?.trim() ||
        !parsedAddress.area?.trim() ||
        !parsedAddress.city?.trim() ||
        !parsedAddress.state?.trim() ||
        !/^\d{6}$/.test(parsedAddress.postalCode || "")
      ) {
        return fail("House / flat, area, city, state, and a valid 6-digit PIN code are required");
      }
    }
    if (!["aadhaar", "voter_id", "driving_license", "college_id"].includes(idType)) {
      return fail("Invalid ID type");
    }
    if (!req.file) return fail("ID photo is required");

    if (consentGiven !== "true" && consentGiven !== true) {
      return fail("Consent is required to submit this form");
    }

    let parsedLocation;
    if (currentLocation) {
      try {
        parsedLocation = typeof currentLocation === "string"
          ? JSON.parse(currentLocation)
          : currentLocation;
      } catch {
        return fail("Current location is invalid");
      }
      const { latitude, longitude } = parsedLocation || {};
      if (
        typeof latitude !== "number" ||
        typeof longitude !== "number" ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return fail("Current location is invalid");
      }
    }

    if (purpose && !["rent", "deposit", "fees", "other"].includes(purpose)) {
      return fail("Invalid loan purpose");
    }

    const existingForUser = await Loan.findOne({ user: req.user._id });
    if (existingForUser) {
      return fail("You have already submitted a loan request", 409);
    }
    const duplicateIdentity = await Loan.findOne({
      $or: [{ phone }, { pan: normalizedPan }],
    });
    if (duplicateIdentity) {
      return fail("You have already submitted a loan request");
    }

    const loan = await Loan.create({
      user: req.user._id,
      name,
      phone,
      email,
      dob: parsedDob,
      address,
      addressDetails: parsedAddress,
      currentLocation: parsedLocation,
      amount,
      purpose: purpose || "other",
      note,
      college,
      course,
      pan: normalizedPan,
      guardianName,
      guardianPhone,
      guardianOccupation,
      familyIncomeRange,
      idType,
      idPhotoUrl: req.file ? req.file.path : null,
      idPhotoPublicId: req.file ? req.file.filename : null,
      consentGiven: true,
      status: "submitted",
      statusHistory: [{
        status: "submitted",
        message: STATUS_MESSAGES.submitted,
      }],
    });

    try {
      await sendNotificationToRecipients(
        [{ id: req.user._id, model: "User" }],
        {
          title: "Student loan application received",
          message: "Your application has been submitted. We’ll notify you when its status changes.",
          actionUrl: "/profile?tab=activity",
        }
      );
    } catch (notificationError) {
      console.error("LOAN SUBMISSION NOTIFICATION ERROR:", notificationError);
      return res.status(500).json({
        success: false,
        loanSubmitted: true,
        message: "Application submitted, but we could not confirm delivery of its notification. Check your profile activity.",
      });
    }

    res.status(201).json({ success: true, loan });
  } catch (error) {
    if (error.code === 11000) {
      if (req.file?.filename) {
        try {
          await cloudinary.uploader.destroy(req.file.filename, {
            resource_type: "image",
            type: "authenticated",
            invalidate: true,
          });
        } catch (cleanupError) {
          console.error("DUPLICATE LOAN PHOTO CLEANUP ERROR:", cleanupError);
        }
      }
      return res.status(409).json({
        success: false,
        message: "You have already submitted a loan request",
      });
    }
    console.error("CREATE LOAN REQUEST ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit loan request. If you already received confirmation, check your profile activity.",
    });
  }
};

const getMyLoanRequest = async (req, res) => {
  try {
    const loan = await Loan.findOne({ user: req.user._id })
      .select("amount purpose status statusHistory createdAt updatedAt")
      .lean();
    res.status(200).json({ success: true, loan });
  } catch (error) {
    console.error("GET MY LOAN REQUEST ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your loan request",
    });
  }
};

// Admin views all loan leads.
const getAllLoanRequests = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return getMyLoanRequest(req, res);
    }

    const loans = await Loan.find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("user", "name phone email avatar")
      .lean();

    const withSignedPhotos = loans.map((loan) => {
      if (!loan.idPhotoPublicId) return loan;
      const format = (loan.idPhotoUrl || "").split(".").pop() || "jpg";
      return {
        ...loan,
        idPhotoUrl: cloudinary.utils.private_download_url(
          loan.idPhotoPublicId,
          format,
          {
            resource_type: "image",
            type: "authenticated",
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          }
        ),
      };
    });

    res.status(200).json({ success: true, loans: withSignedPhotos });
  } catch (error) {
    console.error("GET LOAN REQUESTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch loan requests",
    });
  }
};

// Admin updates lead status.
const updateLoanStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["new", "submitted", "under_review", "contacted", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan request not found",
      });
    }

    if (loan.status === status) {
      return res.status(200).json({ success: true, loan });
    }

    loan.status = status;
    loan.statusHistory.push({
      status,
      message: STATUS_MESSAGES[status],
      changedAt: new Date(),
    });
    await loan.save();

    if (["approved", "rejected"].includes(status) && loan.idPhotoPublicId) {
      try {
        await cloudinary.uploader.destroy(loan.idPhotoPublicId, {
          resource_type: "image",
          type: "authenticated",
          invalidate: true,
        });
        loan.idPhotoUrl = null;
        loan.idPhotoPublicId = null;
        await loan.save();
      } catch (e) {
        console.error("KYC PHOTO DELETE ERROR:", e);
      }
    }

    try {
      await notifyUser(loan.user, {
        type: "loan_status",
        title: "Student loan application update",
        body: STATUS_MESSAGES[status],
        link: "/profile?tab=activity",
      });
    } catch (notificationError) {
      console.error("LOAN STATUS NOTIFICATION ERROR:", notificationError);
    }

    res.status(200).json({ success: true, loan });
  } catch (error) {
    console.error("UPDATE LOAN STATUS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
};

module.exports = {
  createLoanRequest,
  getMyLoanRequest,
  getAllLoanRequests,
  updateLoanStatus,
};
