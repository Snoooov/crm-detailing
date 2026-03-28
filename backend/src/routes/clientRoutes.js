const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} = require('../controllers/clientController');

router.get('/', auth, getClients);
router.get('/:id', auth, getClient);
router.post('/', auth, createClient);
router.put('/:id', auth, updateClient);
router.delete('/:id', auth, deleteClient);

module.exports = router;

router.get('/:id/stats', auth, async (req, res) => {
  const pool = require('../config/db');
  try {
    const { id } = req.params;

    const [totalSpent, ordersCount, lastOrder, topService, statusBreakdown] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(price), 0) as total
         FROM orders
         WHERE client_id = $1 AND status != 'cancelled'`,
        [id]
      ),
      pool.query(
        `SELECT COUNT(*) as count
         FROM orders
         WHERE client_id = $1 AND status != 'cancelled'`,
        [id]
      ),
      pool.query(
        `SELECT date_from, service_name, status
         FROM orders
         WHERE client_id = $1 AND status != 'cancelled'
         ORDER BY date_from DESC
         LIMIT 1`,
        [id]
      ),
      pool.query(
        `SELECT service_name, COUNT(*) as count
         FROM orders
         WHERE client_id = $1 AND status != 'cancelled'
         GROUP BY service_name
         ORDER BY count DESC
         LIMIT 1`,
        [id]
      ),
      pool.query(
        `SELECT status, COUNT(*) as count
         FROM orders
         WHERE client_id = $1
         GROUP BY status`,
        [id]
      ),
    ]);

    res.json({
      totalSpent: parseFloat(totalSpent.rows[0].total),
      ordersCount: parseInt(ordersCount.rows[0].count),
      lastOrder: lastOrder.rows[0] || null,
      topService: topService.rows[0] || null,
      statusBreakdown: statusBreakdown.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});