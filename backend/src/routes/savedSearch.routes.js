const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const {
  listSavedSearches,
  createSavedSearch,
  deleteSavedSearch,
} = require("../controllers/savedSearch.controller");

router.use(protect, (req, res, next) => {
  if (!["user", "admin"].includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: "Saved searches are only available to user accounts" });
  }
  next();
});

router.get("/", listSavedSearches);
router.post("/", createSavedSearch);
router.delete("/:id", deleteSavedSearch);

module.exports = router;
