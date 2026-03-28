const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const pool = require('../config/db');

router.get('/', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

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
         ORDER BY o.created_at DESC`,
        [today]
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
         ORDER BY o.date_to ASC`,
        [today]
      ),
      pool.query(
        `SELECT o.id, o.service_name, o.status, o.date_to,
                c.full_name as client_name,
                v.brand as vehicle_brand, v.model as vehicle_model
         FROM orders o
         JOIN clients c ON o.client_id = c.id
         JOIN vehicles v ON o.vehicle_id = v.id
         WHERE o.status = 'done'
         ORDER BY o.date_to ASC
         LIMIT 10`,
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
         ORDER BY o.created_at DESC`,
        [tomorrow]
      ),
    ]);

    const notifications = [
      ...overdueOrders.rows.map(o => ({
        id: `overdue-${o.id}`,
        orderId: o.id,
        type: 'overdue',
        priority: 1,
        title: 'Zlecenie przeterminowane',
        message: `${o.service_name} — ${o.client_name}`,
        sub: `${o.vehicle_brand} ${o.vehicle_model}`,
        color: '#ef4444',
      })),
      ...todayOrders.rows.map(o => ({
        id: `today-${o.id}`,
        orderId: o.id,
        type: 'today',
        priority: 2,
        title: 'Zlecenie na dziś',
        message: `${o.service_name} — ${o.client_name}`,
        sub: `${o.vehicle_brand} ${o.vehicle_model}`,
        color: '#d97706',
      })),
      ...readyOrders.rows.map(o => ({
        id: `ready-${o.id}`,
        orderId: o.id,
        type: 'ready',
        priority: 3,
        title: 'Gotowe do wydania',
        message: `${o.service_name} — ${o.client_name}`,
        sub: `${o.vehicle_brand} ${o.vehicle_model}`,
        color: '#16a34a',
      })),
      ...tomorrowOrders.rows.map(o => ({
        id: `tomorrow-${o.id}`,
        orderId: o.id,
        type: 'tomorrow',
        priority: 4,
        title: 'Zlecenie jutro',
        message: `${o.service_name} — ${o.client_name}`,
        sub: `${o.vehicle_brand} ${o.vehicle_model}`,
        color: '#2563eb',
      })),
    ];

    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;