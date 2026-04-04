const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const pool = require('../config/db');

router.get('/orders/:orderId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, oa.assigned_at
       FROM order_assignments oa
       JOIN users u ON oa.user_id = u.id
       WHERE oa.order_id = $1
       ORDER BY oa.assigned_at ASC`,
      [req.params.orderId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

router.post('/orders/:orderId', auth, async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id || !Number.isInteger(Number(user_id)) || Number(user_id) <= 0) {
      return res.status(400).json({ error: 'Nieprawidłowy user_id' });
    }

    await pool.query(
      `INSERT INTO order_assignments (order_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (order_id, user_id) DO NOTHING`,
      [req.params.orderId, user_id]
    );

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, oa.assigned_at
       FROM order_assignments oa
       JOIN users u ON oa.user_id = u.id
       WHERE oa.order_id = $1
       ORDER BY oa.assigned_at ASC`,
      [req.params.orderId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

router.delete('/orders/:orderId/users/:userId', auth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM order_assignments WHERE order_id = $1 AND user_id = $2',
      [req.params.orderId, req.params.userId]
    );
    res.json({ message: 'Usunięto przypisanie' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;