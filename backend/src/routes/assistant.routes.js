const express = require("express");
const rateLimit = require("express-rate-limit");
const { postAssistantMessage } = require("../controllers/assistant.controller");

const router = express.Router();

router.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many assistant requests. Please try again in a minute.",
  },
}));

router.post("/", postAssistantMessage);

module.exports = router;
