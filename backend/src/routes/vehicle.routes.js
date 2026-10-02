const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');
const {
  getVehicles,
  getAllVehicles,
  getVehicleById,
  getAdminVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  updateAvailability,
} = require('../controllers/vehicle.controller');

router.get('/admin/all', protect, adminOnly, getAllVehicles);
router.get('/admin/:id', protect, adminOnly, getAdminVehicleById);
router.post('/', protect, adminOnly, upload.array('photos', 10), createVehicle);
router.put('/:id', protect, adminOnly, upload.array('photos', 10), updateVehicle);
router.patch('/:id/availability', protect, adminOnly, updateAvailability);
router.delete('/:id', protect, adminOnly, deleteVehicle);
router.get('/', getVehicles);
router.get('/:id', getVehicleById);

module.exports = router;
