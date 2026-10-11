const multer = require("multer");

const MAX_VIDEO_BYTES = 20 * 1024 * 1024;
const allowedVideoTypes = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const parseVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO_BYTES },
  fileFilter: (req, file, callback) => {
    if (!allowedVideoTypes.has(file.mimetype)) {
      return callback(new Error("Upload an MP4, WebM, or MOV video"));
    }
    callback(null, true);
  },
}).single("video");

module.exports = (req, res, next) => {
  parseVideo(req, res, (error) => {
    if (!error) return next();

    const message = error.code === "LIMIT_FILE_SIZE"
      ? "Video must be 20 MB or smaller"
      : error.message;
    return res.status(400).json({ success: false, message });
  });
};
