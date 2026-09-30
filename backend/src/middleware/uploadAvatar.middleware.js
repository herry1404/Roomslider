const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "roomslider/avatars",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 400, height: 400, crop: "fill", gravity: "face", quality: "auto" },
    ],
  },
});

const uploadAvatar = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB (phone camera photos can be big)
  },
});

module.exports = uploadAvatar;
