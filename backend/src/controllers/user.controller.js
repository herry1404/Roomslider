const User = require("../models/user.model");
const { sanitizeRoommatePreferences } = require("../utils/roommatePreferences");
const { migrateLegacyForUser } = require("../utils/migrateRoommateProfile");

const USERNAME_REGEX = /^[a-z0-9_.]{3,20}$/;
const OCCUPATIONS = ["", "student", "working", "business", "other"];
const GENDERS = ["", "male", "female", "other"];
const BLOOD_GROUPS = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// free-text fields and their max lengths
const TEXT_FIELDS = {
  organization: 80,
  course: 100,
  subject: 100,
  studyYear: 40,
  city: 60,
  area: 60,
  hometown: 60,
};

const isUserAccount = (req) => ["user", "admin"].includes(req.user?.role);

const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

// GET /api/users/me
const getMyProfile = async (req, res) => {
  try {
    if (!isUserAccount(req)) {
      return fail(res, 403, "Ye profile sirf users ke liye hai");
    }
    const userDocument = await migrateLegacyForUser(req.user._id);
    if (!userDocument) {
      return fail(res, 404, "User nahi mila");
    }
    const user = userDocument.toObject();
    delete user.password;
    delete user.wishlist;
    delete user.villaWishlist;
    delete user.bloodRequestsBlocked;
    res.json({ success: true, user });
  } catch (error) {
    fail(res, 500, "Profile load nahi hua");
  }
};

// PUT /api/users/me
const updateMyProfile = async (req, res) => {
  try {
    if (!isUserAccount(req)) {
      return fail(res, 403, "Ye profile sirf users ke liye hai");
    }

    const { name, username, bio, occupation, gender, dob } = req.body;
    const update = {};

    if (name !== undefined) {
      const cleanName = String(name).trim();
      if (!cleanName) {
        return fail(res, 400, "Naam khali nahi ho sakta");
      }
      update.name = cleanName;
    }

    if (username !== undefined) {
      const cleanUsername = String(username).trim().toLowerCase();
      if (!USERNAME_REGEX.test(cleanUsername)) {
        return fail(res, 400, "Username 3-20 characters ka ho, sirf a-z, 0-9, _ aur . allowed");
      }
      const taken = await User.findOne({ username: cleanUsername, _id: { $ne: req.user._id } });
      if (taken) {
        return fail(res, 409, "Ye username pehle se le liya gaya hai");
      }
      update.username = cleanUsername;
    }

    if (bio !== undefined) {
      const cleanBio = String(bio).trim();
      if (cleanBio.length > 150) {
        return fail(res, 400, "Bio 150 characters se zyada nahi ho sakti");
      }
      update.bio = cleanBio;
    }

    if (occupation !== undefined) {
      const clean = String(occupation).trim().toLowerCase();
      if (!OCCUPATIONS.includes(clean)) {
        return fail(res, 400, "Occupation sahi nahi hai");
      }
      update.occupation = clean;
    }

    if (gender !== undefined) {
      const clean = String(gender).trim().toLowerCase();
      if (!GENDERS.includes(clean)) {
        return fail(res, 400, "Gender sahi nahi hai");
      }
      update.gender = clean;
    }

    if (dob !== undefined) {
      if (dob === null || dob === "") {
        update.dob = null;
      } else {
        const d = new Date(dob);
        if (isNaN(d.getTime()) || d > new Date() || d.getFullYear() < 1930) {
          return fail(res, 400, "Date of birth sahi nahi hai");
        }
        update.dob = d;
      }
    }

    for (const [field, max] of Object.entries(TEXT_FIELDS)) {
      if (req.body[field] !== undefined) {
        const clean = String(req.body[field]).trim();
        if (clean.length > max) {
          return fail(res, 400, field + " " + max + " characters se zyada nahi ho sakta");
        }
        update[field] = clean;
      }
    }

    if (req.body.bloodGroup !== undefined) {
      if (!BLOOD_GROUPS.includes(req.body.bloodGroup)) return fail(res, 400, "Choose a valid blood group");
      update.bloodGroup = req.body.bloodGroup;
    }
    if (req.body.bloodDonorConsent !== undefined) {
      if (typeof req.body.bloodDonorConsent !== "boolean") return fail(res, 400, "Donor consent must be selected");
      if (req.body.bloodDonorConsent) {
        const rawDob = req.body.dob !== undefined ? req.body.dob : req.user.dob;
        const dob = rawDob ? new Date(rawDob) : null;
        if (!dob || Number.isNaN(dob.getTime())) return fail(res, 400, "Add your date of birth before confirming donor eligibility");
        const adultDate = new Date(dob);
        adultDate.setFullYear(adultDate.getFullYear() + 18);
        if (adultDate > new Date()) return fail(res, 400, "Blood donors must be at least 18 years old");
        const group = req.body.bloodGroup !== undefined ? req.body.bloodGroup : req.user.bloodGroup;
        if (!BLOOD_GROUPS.includes(group) || !group) return fail(res, 400, "Select your blood group before enabling donor consent");
        update.bloodDonorConsent = true;
        update.bloodDonorConsentAt = req.user.bloodDonorConsentAt || new Date();
      } else {
        update.bloodDonorConsent = false;
        update.bloodDonorConsentAt = null;
      }
    }
    if (req.body.bloodDonorAvailable !== undefined) {
      if (typeof req.body.bloodDonorAvailable !== "boolean") return fail(res, 400, "Donor availability must be selected");
      update.bloodDonorAvailable = req.body.bloodDonorAvailable;
    }
    if (req.body.lastDonatedAt !== undefined) {
      if (req.body.lastDonatedAt === null || req.body.lastDonatedAt === "") {
        update.lastDonatedAt = null;
      } else {
        const donatedAt = new Date(req.body.lastDonatedAt);
        if (Number.isNaN(donatedAt.getTime()) || donatedAt > new Date()) return fail(res, 400, "Enter a valid last donation date");
        update.lastDonatedAt = donatedAt;
      }
    }

    if (req.body.roommatePreferences !== undefined) {
      if (
        !req.body.roommatePreferences ||
        typeof req.body.roommatePreferences !== "object" ||
        Array.isArray(req.body.roommatePreferences)
      ) {
        return fail(res, 400, "Roommate preferences are invalid");
      }
      const { updates: roommateUpdates, error } = sanitizeRoommatePreferences(
        req.body.roommatePreferences
      );
      if (error) return fail(res, 400, error);
      Object.assign(update, roommateUpdates);
      update["roommatePreferences.setupComplete"] = true;
    }

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true })
      .select("-password -wishlist");

    res.json({ success: true, user });
  } catch (error) {
    if (error.code === 11000) {
      return fail(res, 409, "Ye username pehle se le liya gaya hai");
    }
    fail(res, 500, "Profile update nahi hua");
  }
};

// PUT /api/users/me/avatar  (multipart, field name: avatar)
const updateAvatar = async (req, res) => {
  try {
    if (!isUserAccount(req)) {
      return fail(res, 403, "Ye profile sirf users ke liye hai");
    }
    if (!req.file || !req.file.path) {
      return fail(res, 400, "Photo select karo");
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: req.file.path },
      { new: true }
    ).select("-password -wishlist");

    res.json({ success: true, user });
  } catch (error) {
    fail(res, 500, "Photo save nahi hui");
  }
};

module.exports = { getMyProfile, updateMyProfile, updateAvatar };
