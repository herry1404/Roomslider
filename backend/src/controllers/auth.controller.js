const User = require("../models/user.model");
const { registerSchema, loginSchema } = require("../validators/auth.validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// ======================
// CREATE JWT TOKEN
// ======================

const createToken = (user) => {

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET missing in .env");
  }

  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

};


// ======================
// REGISTER USER
// ======================

const register = async (req, res) => {

  try {

    const validatedData = registerSchema.parse(req.body);

    const existingUser = await User.findOne({
      $or: [
        { email: validatedData.email },
        { phone: validatedData.phone },
      ],
    });

    if (existingUser) {

      const conflictField =
        existingUser.email === validatedData.email ? "Email" : "Phone number";

      return res.status(409).json({
        success: false,
        message: `${conflictField} already registered`,
      });

    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const user = await User.create({
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone,
      password: hashedPassword,
      role: "user",
    });

    const token = createToken(user);

    return res.status(201).json({

      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },

    });

  } catch (error) {

    console.error("REGISTER ERROR 👉", error);

    if (error.name === "ZodError") {

      return res.status(400).json({
        success: false,
        message: error.issues[0]?.message || "Invalid input",
        errors: error.issues,
      });

    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};


// ======================
// LOGIN USER
// ======================

const login = async (req, res) => {

  try {

    const validatedData = loginSchema.parse(req.body);

    const user = await User.findOne({
      $or: [
        { email: validatedData.identifier.toLowerCase() },
        { phone: validatedData.identifier },
      ],
    });

    if (!user) {

      return res.status(404).json({
        success: false,
        message: "User not found",
      });

    }

    const isPasswordMatch = await bcrypt.compare(
      validatedData.password,
      user.password
    );

    if (!isPasswordMatch) {

      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });

    }

    const token = createToken(user);

    return res.status(200).json({

      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },

    });

  } catch (error) {

    console.error("LOGIN ERROR 👉", error);

    if (error.name === "ZodError") {

      return res.status(400).json({
        success: false,
        message: error.issues[0]?.message || "Invalid input",
        errors: error.issues,
      });

    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};


// ======================
// GOOGLE LOGIN
// ======================

const googleLogin = async (req, res) => {

  try {

    const { credential } = req.body;

    if (!credential) {

      return res.status(400).json({
        success: false,
        message: "Google credential missing",
      });

    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    if (user) {

      if (!user.googleId) {

        user.googleId = googleId;
        user.authProvider = "google";
        await user.save();

      }

    } else {

      user = await User.create({
        name: name || email.split("@")[0],
        email,
        googleId,
        authProvider: "google",
        role: "user",
      });

    }

    const token = createToken(user);

    return res.status(200).json({

      success: true,
      message: "Google login successful",
      token,
      needsPhone: !user.phone,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },

    });

  } catch (error) {

    console.error("GOOGLE LOGIN ERROR 👉", error);

    return res.status(500).json({
      success: false,
      message: "Google login failed",
    });

  }

};


// ======================
// GET MY TENANCY (Tenant Portal)
// Returns the logged-in user's currently rented room, owner contact,
// and full payment history — or null if they aren't renting anything.
// ======================

const getMyTenancy = async (req, res) => {

  try {

    const user = await User.findById(req.user._id);

    if (!user.activeRoom) {

      return res.status(200).json({
        success: true,
        isTenant: false,
        message: "You are not currently renting any room on RoomSlider",
      });

    }

    const Room = require("../models/room.model");
    const { computeRentStatus } = require("./room.controller");

    const room = await Room.findById(user.activeRoom).populate(
      "owner",
      "name email propertyName"
    );

    if (!room || room.status !== "occupied") {

      // Data got out of sync somehow — clean it up rather than error out
      user.activeRoom = null;
      await user.save();

      return res.status(200).json({
        success: true,
        isTenant: false,
        message: "You are not currently renting any room on RoomSlider",
      });

    }

    const openEntry = [...room.occupancyHistory]
      .reverse()
      .find((entry) => !entry.endDate);

    return res.status(200).json({

      success: true,
      isTenant: true,
      room: {
        id: room._id,
        title: room.title,
        location: room.location,
        images: room.images,
        category: room.category,
        roomNumber: room.roomNumber,
        price: room.price,
      },
      owner: room.owner
        ? {
            id: room.owner._id,
            name: room.owner.name,
            email: room.owner.email,
            propertyName: room.owner.propertyName,
          }
        : null,
      tenancy: {
        moveInDate: room.currentTenant?.moveInDate,
        advanceAmount: room.currentTenant?.advanceAmount,
        paymentStatus: computeRentStatus(room.currentTenant?.nextDueDate),
        nextDueDate: room.currentTenant?.nextDueDate,
        vacateNoticeDate: room.currentTenant?.vacateNoticeDate,
        leaseDocumentUrl: room.currentTenant?.leaseDocumentUrl || "",
        leaseDocumentName: room.currentTenant?.leaseDocumentName || "",
        payments: openEntry?.payments || [],
        totalPaid: openEntry?.totalPaid || 0,
      },

    });

  } catch (error) {

    console.error("GET MY TENANCY ERROR 👉", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};


// ======================
// GIVE VACATE NOTICE (Tenant)
// Tenant declares an intended move-out date. Does NOT vacate the room
// immediately - just flags it for the owner to see and eventually confirm.
// ======================

const giveVacateNotice = async (req, res) => {

  try {

    const user = await User.findById(req.user._id);

    if (!user.activeRoom) {
      return res.status(400).json({
        success: false,
        message: "You are not currently renting any room",
      });
    }

    const { vacateDate } = req.body;

    if (!vacateDate) {
      return res.status(400).json({
        success: false,
        message: "A vacate date is required",
      });
    }

    const Room = require("../models/room.model");
    const room = await Room.findById(user.activeRoom);

    if (!room || room.status !== "occupied") {
      return res.status(400).json({
        success: false,
        message: "No active tenancy found",
      });
    }

    room.currentTenant.vacateNoticeDate = new Date(vacateDate);
    await room.save();

    return res.status(200).json({
      success: true,
      message: "Vacate notice given",
      vacateNoticeDate: room.currentTenant.vacateNoticeDate,
    });

  } catch (error) {

    console.error("GIVE VACATE NOTICE ERROR 👉", error);
    return res.status(500).json({ success: false, message: error.message });

  }

};

// ======================
// CANCEL VACATE NOTICE (Tenant)
// Tenant changes their mind and wants to continue renting.
// ======================

const cancelVacateNotice = async (req, res) => {

  try {

    const user = await User.findById(req.user._id);

    if (!user.activeRoom) {
      return res.status(400).json({
        success: false,
        message: "You are not currently renting any room",
      });
    }

    const Room = require("../models/room.model");
    const room = await Room.findById(user.activeRoom);

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    room.currentTenant.vacateNoticeDate = null;
    await room.save();

    return res.status(200).json({
      success: true,
      message: "Vacate notice cancelled. You're continuing your stay.",
    });

  } catch (error) {

    console.error("CANCEL VACATE NOTICE ERROR 👉", error);
    return res.status(500).json({ success: false, message: error.message });

  }

};


// ======================
// UPDATE PHONE (post-Google-login binding)
// ======================

const updatePhone = async (req, res) => {

  try {

    const { phone } = req.body;

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {

      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit phone number",
      });

    }

    const existingPhone = await User.findOne({ phone });

    if (existingPhone && existingPhone._id.toString() !== req.user._id.toString()) {

      return res.status(409).json({
        success: false,
        message: "This phone number is already linked to another account",
      });

    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { phone },
      { new: true }
    );

    return res.status(200).json({

      success: true,
      message: "Phone number added successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },

    });

  } catch (error) {

    console.error("UPDATE PHONE ERROR 👉", error);
    return res.status(500).json({ success: false, message: error.message });

  }

};


module.exports = {
  register,
  login,
  googleLogin,
  getMyTenancy,
  giveVacateNotice,
  cancelVacateNotice,
  updatePhone,
};
