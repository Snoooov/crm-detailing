const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const pool = require('../config/db');
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
router.put('/:id/damage', auth, async (req, res) => {
  try {
    const { damage_map } = req.body;
    await pool.query('UPDATE orders SET damage_map = $1 WHERE id = $2', [JSON.stringify(damage_map || []), req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});
router.put('/:id', auth, updateOrder);
router.patch('/:id/status', auth, updateStatus);
router.delete('/:id', auth, deleteOrder);

module.exports = router;
