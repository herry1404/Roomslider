const Loan = require("../models/loan.model");
const cloudinary = require("../config/cloudinary");

// Student submits a loan lead.
const createLoanRequest = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      dob,
      address,
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
    } = req.body;

    const fail = async (message) => {
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
      return res.status(400).json({ success: false, message });
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
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(pan)) return fail("Invalid PAN number");
    if (!(Number(amount) > 0)) return fail("Invalid amount");
    if (Number.isNaN(new Date(dob).getTime())) return fail("Invalid date of birth");
    if (!["below_2l", "2l_5l", "5l_10l", "above_10l"].includes(familyIncomeRange)) {
      return fail("Invalid family income range");
    }
    if (!["aadhaar", "voter_id", "driving_license", "college_id"].includes(idType)) {
      return fail("Invalid ID type");
    }
    if (!req.file) return fail("ID photo is required");

    if (consentGiven !== "true" && consentGiven !== true) {
      return res.status(400).json({
        success: false,
        message: "Consent is required to submit this form",
      });
    }

    const existing = await Loan.findOne({
      $or: [
        { user: req.user._id },
        { phone },
        { pan: new RegExp(`^${pan}$`, "i") },
      ],
    });
    if (existing) {
      return fail("You have already submitted a loan request");
    }

    const loan = await Loan.create({
      user: req.user._id,
      name,
      phone,
      email,
      dob: dob || undefined,
      address,
      amount,
      purpose: purpose || "other",
      note,
      college,
      course,
      pan,
      guardianName,
      guardianPhone,
      guardianOccupation,
      familyIncomeRange,
      idType,
      idPhotoUrl: req.file ? req.file.path : null,
      idPhotoPublicId: req.file ? req.file.filename : null,
      consentGiven: true,
    });

    res.status(201).json({ success: true, loan });
  } catch (error) {
    console.error("CREATE LOAN REQUEST ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit loan request",
    });
  }
};

// Admin views all loan leads.
const getAllLoanRequests = async (req, res) => {
  try {
    const loans = await Loan.find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("user", "name phone email")
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

    if (!["new", "contacted", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const loan = await Loan.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan request not found",
      });
    }

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
  getAllLoanRequests,
  updateLoanStatus,
};
