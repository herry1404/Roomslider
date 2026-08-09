const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "roomslider/maintenance",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, crop: "limit", quality: "auto" }],
  },
});

const uploadMaintenance = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

module.exports = uploadMaintenance;
