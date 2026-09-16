const express = require('express');
const router = express.Router();
const { getRecentActivities } = require('../controllers/activity.controller');
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');

router.get('/recent', protect, adminOnly, getRecentActivities);

module.exports = router;
