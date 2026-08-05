const adminOnly = (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const adminOrOwner = (req, res, next) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin or Owner only.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { adminOnly, adminOrOwner };
