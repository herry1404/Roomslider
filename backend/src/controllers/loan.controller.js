const Loan = require("../models/loan.model");

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

    if (!name || !phone || !amount) {
      return res.status(400).json({
        success: false,
        message: "Name, phone and amount are required",
      });
    }

    if (consentGiven !== "true" && consentGiven !== true) {
      return res.status(400).json({
        success: false,
        message: "Consent is required to submit this form",
      });
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

    res.status(200).json({ success: true, loans });
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
