const LaundryVendor = require("../models/laundryVendor.model");

// Admin: add a vendor, linked to a specific owner (building)
const createVendor = async (req, res) => {
  try {
    const { ownerId, vendorName, phone, area } = req.body;

    if (!ownerId || !vendorName || !phone) {
      return res.status(400).json({
        success: false,
        message: "Owner, vendor name and phone are required",
      });
    }

    const vendor = await LaundryVendor.create({
      owner: ownerId,
      vendorName,
      phone,
      area,
    });

    res.status(201).json({ success: true, vendor });
  } catch (error) {
    console.error("CREATE LAUNDRY VENDOR ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add vendor",
    });
  }
};

// Admin: list all vendors with owner name
const getAllVendors = async (req, res) => {
  try {
    const vendors = await LaundryVendor.find()
      .populate("owner", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, vendors });
  } catch (error) {
    console.error("GET LAUNDRY VENDORS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vendors",
    });
  }
};

// Admin: update a vendor
const updateVendor = async (req, res) => {
  try {
    const { ownerId, vendorName, phone, area } = req.body;

    const update = { vendorName, phone, area };
    if (ownerId) update.owner = ownerId;

    const vendor = await LaundryVendor.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    res.status(200).json({ success: true, vendor });
  } catch (error) {
    console.error("UPDATE LAUNDRY VENDOR ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update vendor",
    });
  }
};

// Admin: delete a vendor
const deleteVendor = async (req, res) => {
  try {
    const vendor = await LaundryVendor.findByIdAndDelete(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    res.status(200).json({ success: true, message: "Vendor deleted" });
  } catch (error) {
    console.error("DELETE LAUNDRY VENDOR ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete vendor",
    });
  }
};

// Tenant: get the vendor for their own room's owner, plus full list as fallback
// if no vendor is set for that specific owner yet.
const getVendorForMyRoom = async (req, res) => {
  try {
    const { ownerId } = req.query;

    const allVendors = await LaundryVendor.find()
      .populate("owner", "name")
      .sort({ createdAt: -1 })
      .lean();

    let matched = [];
    if (ownerId) {
      matched = allVendors.filter(
        (v) => String(v.owner?._id) === String(ownerId)
      );
    }

    res.status(200).json({
      success: true,
      matched,
      all: allVendors,
    });
  } catch (error) {
    console.error("GET VENDOR FOR ROOM ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vendor",
    });
  }
};

module.exports = {
  createVendor,
  getAllVendors,
  updateVendor,
  deleteVendor,
  getVendorForMyRoom,
};
