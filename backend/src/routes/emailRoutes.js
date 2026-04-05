const express = require('express');
const router = express.Router();
const { auth, adminOnly, managerOrAdmin } = require('../middleware/auth');
const pool = require('../config/db');
const { runEmailJobs, } = require('../services/emailScheduler');
const { sendOrderEmail } = require('../services/emailService');
const config = require('../config/appConfig');

// Lista szablonów
router.get('/templates', auth, managerOrAdmin, async (req, res) => {
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
router.get('/logs', auth, managerOrAdmin, async (req, res) => {
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

const VALID_EMAIL_TYPES = ['confirmation', 'ready', 'reminder_24h', 'followup_short', 'followup_long'];

// Wyślij mail ręcznie do zlecenia
router.post('/send/:orderId/:type', auth, adminOnly, async (req, res) => {
  try {
    const { orderId, type } = req.params;
    if (!VALID_EMAIL_TYPES.includes(type)) return res.status(400).json({ error: 'Nieprawidłowy typ maila' });
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

router.post('/test', auth, adminOnly, async (req, res) => {
  try {
    const { type } = req.body;

    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = userResult.rows[0];

    if (!user?.email) {
      return res.status(400).json({ error: 'Brak emaila na koncie użytkownika' });
    }

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: config.email.service,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });

    if (type) {
      // Testowy mail konkretnego szablonu
      const templateResult = await pool.query(
        'SELECT * FROM email_templates WHERE type = $1',
        [type]
      );
      const template = templateResult.rows[0];
      if (!template) return res.status(404).json({ error: 'Szablon nie znaleziony' });

      const testVars = {
        client_name: 'Jan',
        vehicle_brand: 'BMW',
        vehicle_model: 'E46',
        plate_number: 'KR12345',
        service_name: 'Detailing kompleksowy',
        date_from: new Date().toLocaleDateString('pl-PL'),
        date_to: new Date().toLocaleDateString('pl-PL'),
      };

      let subject = template.subject;
      let body = template.body;
      Object.entries(testVars).forEach(([key, value]) => {
        subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
        body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

      await transporter.sendMail({
        from: config.email.from,
        to: user.email,
        subject: `[TEST] ${subject}`,
        html: body,
      });

      return res.json({ message: `Mail testowy "${template.name}" wysłany na ${user.email}` });
    }

    // Ogólny mail testowy
    await transporter.sendMail({
      from: config.email.from,
      to: user.email,
      subject: `Test systemu mailowego — ${config.company.name}`,
      html: `Cześć ${user.name},\n\nTo jest testowa wiadomość z systemu CRM.\n\nJeśli widzisz tego maila — konfiguracja działa poprawnie!\n\nZespół ${config.company.name}`,
    });

    res.json({ message: `Mail testowy wysłany na ${user.email}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd wysyłania maila testowego' });
  }
});

module.exports = router;