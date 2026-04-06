const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const pool = require('../config/db');
const { logAction } = require('../utils/systemLog');
const getIp = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;

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

    const assignedUser = result.rows.find(u => u.id === Number(user_id));
    await logAction({ userId: req.user.id, userName: req.user.name, action: 'assignment_added', entityType: 'order', entityId: parseInt(req.params.orderId), details: { assigned_user_id: Number(user_id), assigned_user_name: assignedUser?.name }, ipAddress: getIp(req) });

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

router.delete('/orders/:orderId/users/:userId', auth, async (req, res) => {
  try {
    const removedUser = await pool.query('SELECT u.id, u.name FROM users u WHERE u.id = $1', [req.params.userId]);
    await pool.query(
      'DELETE FROM order_assignments WHERE order_id = $1 AND user_id = $2',
      [req.params.orderId, req.params.userId]
    );
    await logAction({ userId: req.user.id, userName: req.user.name, action: 'assignment_removed', entityType: 'order', entityId: parseInt(req.params.orderId), details: { removed_user_id: parseInt(req.params.userId), removed_user_name: removedUser.rows[0]?.name }, ipAddress: getIp(req) });
    res.json({ message: 'Usunięto przypisanie' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;