const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  updateStatus,
  deleteOrder,
  getOrderHistory,
  exportOrdersCsv,
} = require('../controllers/orderController');

router.get('/export/csv', auth, exportOrdersCsv);
router.get('/', auth, getOrders);
router.get('/:id', auth, getOrder);
router.get('/:id/history', auth, getOrderHistory);
router.post('/', auth, createOrder);
router.put('/:id', auth, updateOrder);
router.patch('/:id/status', auth, updateStatus);
router.delete('/:id', auth, deleteOrder);

module.exports = router;
