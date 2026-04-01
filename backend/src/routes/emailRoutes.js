const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const pool = require('../config/db');
const { runEmailJobs, } = require('../services/emailScheduler');
const { sendOrderEmail } = require('../services/emailService');

// Lista szablonów
router.get('/templates', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM email_templates ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Edytuj szablon
router.put('/templates/:id', auth, adminOnly, async (req, res) => {
  try {
    const { subject, body, enabled, delay_days } = req.body;
    const result = await pool.query(
      `UPDATE email_templates
       SET subject = $1, body = $2, enabled = $3, delay_days = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [subject, body, enabled, delay_days, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Historia wysłanych maili
router.get('/logs', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT el.*, c.full_name as client_name
       FROM email_logs el
       LEFT JOIN clients c ON el.client_id = c.id
       ORDER BY el.sent_at DESC
       LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Wyślij mail ręcznie do zlecenia
router.post('/send/:orderId/:type', auth, adminOnly, async (req, res) => {
  try {
    const { orderId, type } = req.params;
    const orderResult = await pool.query(
      `SELECT o.*, c.full_name as client_name, c.email as client_email,
              v.brand as vehicle_brand, v.model as vehicle_model, v.plate_number
       FROM orders o
       JOIN clients c ON o.client_id = c.id
       JOIN vehicles v ON o.vehicle_id = v.id
       WHERE o.id = $1`,
      [orderId]
    );
    const order = orderResult.rows[0];
    if (!order) return res.status(404).json({ error: 'Zlecenie nie znalezione' });
    if (!order.client_email) return res.status(400).json({ error: 'Klient nie ma emaila' });

    const result = await sendOrderEmail(order, type);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Uruchom scheduler ręcznie (test)
router.post('/run-jobs', auth, adminOnly, async (req, res) => {
  try {
    await runEmailJobs();
    res.json({ message: 'Zadania emailowe wykonane' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;