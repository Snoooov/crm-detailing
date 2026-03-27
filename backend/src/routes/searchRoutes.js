const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const pool = require('../config/db');

router.get('/', auth, async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.json({ clients: [], vehicles: [], orders: [] });
  }

  const term = `%${q.trim()}%`;

  try {
    const [clients, vehicles, orders] = await Promise.all([
      pool.query(
        `SELECT id, full_name, phone, email, status
         FROM clients
         WHERE full_name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1
         LIMIT 5`,
        [term]
      ),
      pool.query(
        `SELECT v.id, v.brand, v.model, v.plate_number, c.full_name as client_name
         FROM vehicles v
         JOIN clients c ON v.client_id = c.id
         WHERE v.brand ILIKE $1 OR v.model ILIKE $1 OR v.plate_number ILIKE $1
         LIMIT 5`,
        [term]
      ),
      pool.query(
        `SELECT o.id, o.service_name, o.status, o.price,
                c.full_name as client_name,
                v.brand as vehicle_brand, v.model as vehicle_model
         FROM orders o
         JOIN clients c ON o.client_id = c.id
         JOIN vehicles v ON o.vehicle_id = v.id
         WHERE o.service_name ILIKE $1 OR c.full_name ILIKE $1 OR v.plate_number ILIKE $1
         LIMIT 5`,
        [term]
      ),
    ]);

    res.json({
      clients: clients.rows,
      vehicles: vehicles.rows,
      orders: orders.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;