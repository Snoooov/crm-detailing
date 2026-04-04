const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const pool = require('../config/db');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

router.get('/', auth, async (req, res) => {
  const { q, date_from, date_to } = req.query;

  if (date_from && !DATE_RE.test(date_from)) return res.status(400).json({ error: 'Nieprawidłowy format date_from' });
  if (date_to && !DATE_RE.test(date_to)) return res.status(400).json({ error: 'Nieprawidłowy format date_to' });
  if (q && q.trim().length > 200) return res.status(400).json({ error: 'Zapytanie zbyt długie' });

  if ((!q || q.trim().length < 2) && !date_from && !date_to) {
    return res.json({ clients: [], vehicles: [], orders: [] });
  }

  const term = q ? `%${q.trim()}%` : null;

  try {
    let ordersQuery = `
      SELECT o.id, o.service_name, o.status, o.price, o.date_from,
             c.full_name as client_name,
             v.brand as vehicle_brand, v.model as vehicle_model, v.plate_number
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      JOIN vehicles v ON o.vehicle_id = v.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (term) {
      ordersQuery += ` AND (o.service_name ILIKE $${paramIndex} OR c.full_name ILIKE $${paramIndex} OR v.plate_number ILIKE $${paramIndex} OR v.brand ILIKE $${paramIndex} OR v.model ILIKE $${paramIndex})`;
      params.push(term);
      paramIndex++;
    }

    if (date_from) {
      ordersQuery += ` AND o.date_from >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      ordersQuery += ` AND o.date_from <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }

    ordersQuery += ` ORDER BY o.date_from DESC LIMIT 10`;

    const [clients, vehicles, orders] = await Promise.all([
      term ? pool.query(
        `SELECT id, full_name, phone, email, status
         FROM clients
         WHERE full_name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1
         ORDER BY full_name LIMIT 5`,
        [term]
      ) : Promise.resolve({ rows: [] }),
      term ? pool.query(
        `SELECT v.id, v.brand, v.model, v.plate_number, c.full_name as client_name
         FROM vehicles v
         JOIN clients c ON v.client_id = c.id
         WHERE v.brand ILIKE $1 OR v.model ILIKE $1 OR v.plate_number ILIKE $1 OR v.vin ILIKE $1
         ORDER BY v.brand LIMIT 5`,
        [term]
      ) : Promise.resolve({ rows: [] }),
      pool.query(ordersQuery, params),
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