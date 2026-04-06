const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const pool = require('../config/db');

router.get('/', auth, async (req, res) => {
  try {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`;
    const userId = req.user.id;
    const role = req.user.role;

    const isAdmin = role === 'admin';

    const [todayOrders, overdueOrders, readyOrders, tomorrowOrders] = await Promise.all([
      pool.query(
        `SELECT o.id, o.service_name, o.status, o.date_from,
                c.full_name as client_name,
                v.brand as vehicle_brand, v.model as vehicle_model
         FROM orders o
         JOIN clients c ON o.client_id = c.id
         JOIN vehicles v ON o.vehicle_id = v.id
         WHERE o.date_from = $1
           AND o.status NOT IN ('released', 'cancelled')
           AND ($2 OR o.id IN (SELECT order_id FROM order_assignments WHERE user_id = $3))
         ORDER BY o.created_at DESC`,
        [today, isAdmin, userId]
      ),
      pool.query(
        `SELECT o.id, o.service_name, o.status, o.date_to,
                c.full_name as client_name,
                v.brand as vehicle_brand, v.model as vehicle_model
         FROM orders o
         JOIN clients c ON o.client_id = c.id
         JOIN vehicles v ON o.vehicle_id = v.id
         WHERE o.date_to < $1
           AND o.status NOT IN ('released', 'cancelled', 'done')
           AND ($2 OR o.id IN (SELECT order_id FROM order_assignments WHERE user_id = $3))
         ORDER BY o.date_to ASC`,
        [today, isAdmin, userId]
      ),
      pool.query(
        `SELECT o.id, o.service_name, o.status, o.date_to,
                c.full_name as client_name,
                v.brand as vehicle_brand, v.model as vehicle_model
         FROM orders o
         JOIN clients c ON o.client_id = c.id
         JOIN vehicles v ON o.vehicle_id = v.id
         WHERE o.status = 'done'
           AND ($1 OR o.id IN (SELECT order_id FROM order_assignments WHERE user_id = $2))
         ORDER BY o.date_to ASC
         LIMIT 10`,
        [isAdmin, userId]
      ),
      pool.query(
        `SELECT o.id, o.service_name, o.status, o.date_from,
                c.full_name as client_name,
                v.brand as vehicle_brand, v.model as vehicle_model
         FROM orders o
         JOIN clients c ON o.client_id = c.id
         JOIN vehicles v ON o.vehicle_id = v.id
         WHERE o.date_from = $1
           AND o.status NOT IN ('released', 'cancelled')
           AND ($2 OR o.id IN (SELECT order_id FROM order_assignments WHERE user_id = $3))
         ORDER BY o.created_at DESC`,
        [tomorrow, isAdmin, userId]
      ),
    ]);

    const prefsResult = await pool.query('SELECT notification_prefs FROM users WHERE id = $1', [userId]);
    const rawPrefs = prefsResult.rows[0]?.notification_prefs || {};
    const prefs = {
      show_overdue:  rawPrefs.show_overdue  !== false,
      show_today:    rawPrefs.show_today    !== false,
      show_ready:    rawPrefs.show_ready    !== false,
      show_tomorrow: rawPrefs.show_tomorrow !== false,
    };

    const notifications = [
      ...(prefs.show_overdue ? overdueOrders.rows.map(o => ({
        id: `overdue-${o.id}`,
        orderId: o.id,
        type: 'overdue',
        priority: 1,
        title: 'Zlecenie przeterminowane',
        message: `${o.service_name} — ${o.client_name}`,
        sub: `${o.vehicle_brand} ${o.vehicle_model}`,
        color: '#ef4444',
      })) : []),
      ...(prefs.show_today ? todayOrders.rows.map(o => ({
        id: `today-${o.id}`,
        orderId: o.id,
        type: 'today',
        priority: 2,
        title: 'Zlecenie na dziś',
        message: `${o.service_name} — ${o.client_name}`,
        sub: `${o.vehicle_brand} ${o.vehicle_model}`,
        color: '#d97706',
      })) : []),
      ...(prefs.show_ready ? readyOrders.rows.map(o => ({
        id: `ready-${o.id}`,
        orderId: o.id,
        type: 'ready',
        priority: 3,
        title: 'Gotowe do wydania',
        message: `${o.service_name} — ${o.client_name}`,
        sub: `${o.vehicle_brand} ${o.vehicle_model}`,
        color: '#16a34a',
      })) : []),
      ...(prefs.show_tomorrow ? tomorrowOrders.rows.map(o => ({
        id: `tomorrow-${o.id}`,
        orderId: o.id,
        type: 'tomorrow',
        priority: 4,
        title: 'Zlecenie jutro',
        message: `${o.service_name} — ${o.client_name}`,
        sub: `${o.vehicle_brand} ${o.vehicle_model}`,
        color: '#2563eb',
      })) : []),
    ];

    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;