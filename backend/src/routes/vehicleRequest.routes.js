const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');
const {
  createRequest,
  getMyRequests,
  getAllRequests,
  updateRequestStatus,
} = require('../controllers/vehicleRequest.controller');

router.post('/', protect, createRequest);
router.get('/mine', protect, getMyRequests);
router.get('/', protect, adminOnly, getAllRequests);
router.put('/:id/status', protect, adminOnly, updateRequestStatus);

module.exports = router;
