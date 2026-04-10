const express = require('express');
const rateLimit = require('express-rate-limit');
const pool = require('../config/db');
const { auth, managerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Rate limit specyficzny dla publicznego formularza: 3 zgłoszenia / godzinę / IP
const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.ip,
  message: { error: 'Zbyt wiele zgłoszeń z tego adresu IP. Spróbuj za godzinę.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── POST /api/public/inquiries — publiczny formularz ze strony ──────────────
router.post('/inquiries', inquiryLimiter, async (req, res) => {
  try {
    const { name, email, phone, service, message, website: honeypot } = req.body;

    // Honeypot — jeśli wypełniony to bot
    if (honeypot) {
      return res.status(200).json({ ok: true }); // udajemy sukces żeby nie informować bota
    }

    // Walidacja wymaganych pól
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Podaj imię i nazwisko.' });
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Podaj poprawny adres e-mail.' });
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

    await pool.query(
      `INSERT INTO website_inquiries (name, email, phone, service, message, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        name.trim().slice(0, 255),
        email.trim().slice(0, 255),
        (phone || '').trim().slice(0, 50) || null,
        (service || '').trim().slice(0, 255) || null,
        (message || '').trim().slice(0, 2000) || null,
        ip,
      ]
    );

    res.json({ ok: true, message: 'Zgłoszenie zostało przyjęte.' });
  } catch (err) {
    console.error('Inquiry POST error:', err);
    res.status(500).json({ error: 'Błąd serwera. Spróbuj ponownie.' });
  }
});

// ─── GET /api/inquiries — lista zgłoszeń (manager/admin) ────────────────────
router.get('/', auth, managerOrAdmin, async (req, res) => {
  try {
    const { status, page = 0, limit = 50 } = req.query;
    const offset = parseInt(page) * parseInt(limit);

    let where = '';
    const params = [];

    if (status) {
      params.push(status);
      where = `WHERE status = $${params.length}`;
    }

    params.push(parseInt(limit), offset);

    const [rows, countRow] = await Promise.all([
      pool.query(
        `SELECT * FROM website_inquiries ${where}
         ORDER BY created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      ),
      pool.query(
        `SELECT COUNT(*) FROM website_inquiries ${where}`,
        status ? [status] : []
      ),
    ]);

    res.json({
      inquiries: rows.rows,
      total: parseInt(countRow.rows[0].count),
    });
  } catch (err) {
    console.error('Inquiry GET error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ─── PATCH /api/inquiries/:id/status — zmiana statusu ───────────────────────
router.patch('/:id/status', auth, managerOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const VALID = ['new', 'contacted', 'converted', 'spam'];
    if (!VALID.includes(status)) {
      return res.status(400).json({ error: 'Nieprawidłowy status.' });
    }

    const result = await pool.query(
      `UPDATE website_inquiries SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Zgłoszenie nie istnieje.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Inquiry PATCH error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ─── DELETE /api/inquiries/:id — usunięcie zgłoszenia (admin) ───────────────
router.delete('/:id', auth, managerOrAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM website_inquiries WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Nie znaleziono.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Inquiry DELETE error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;
