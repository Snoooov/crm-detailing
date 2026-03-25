const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} = require('../controllers/vehicleController');

router.get('/', auth, getVehicles);
router.get('/:id', auth, getVehicle);
router.post('/', auth, createVehicle);
router.put('/:id', auth, updateVehicle);
router.delete('/:id', auth, deleteVehicle);

module.exports = router;