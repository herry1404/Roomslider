const { timingSafeEqual } = require("node:crypto");

const requireAdminKey = (req, res, next) => {
  const configuredKey = process.env.ADMIN_KEY;
  if (!configuredKey) {
    return res.status(503).json({ success: false, message: "Analytics admin access is not configured" });
  }

  const suppliedKey = req.get("x-admin-key") || "";
  const configuredBuffer = Buffer.from(configuredKey);
  const suppliedBuffer = Buffer.from(suppliedKey);
  const matches = configuredBuffer.length === suppliedBuffer.length
    && timingSafeEqual(configuredBuffer, suppliedBuffer);

  if (!matches) {
    return res.status(401).json({ success: false, message: "Invalid admin key" });
  }
  return next();
};

module.exports = { requireAdminKey };
