const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { auth, adminOnly } = require('../middleware/auth');
const pool = require('../config/db');
const config = require('../config/appConfig');
const { logAction } = require('../utils/systemLog');
const { invalidateCache } = require('../utils/companySettings');

const getIp = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;

// ─── Zmiana hasła ──────────────────────────────────────────────────────────────

router.put('/password', auth, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Podaj aktualne i nowe hasło' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Nowe hasło musi mieć co najmniej 6 znaków' });
    }

    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'Użytkownik nie znaleziony' });

    const isValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Aktualne hasło jest nieprawidłowe' });
    }

    const password_hash = await bcrypt.hash(new_password, config.auth.bcryptRounds);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, req.user.id]);

    await logAction({ userId: req.user.id, userName: req.user.name, action: 'password_changed', entityType: 'user', entityId: req.user.id, details: {}, ipAddress: getIp(req) });

    res.json({ message: 'Hasło zostało zmienione' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ─── Dane firmy (admin) ────────────────────────────────────────────────────────

router.get('/company', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM company_settings WHERE id = 1');
    const row = result.rows[0];
    // Fallback do wartości z .env jeśli tabela jest pusta
    res.json({
      name:          row?.name          || config.company.name,
      address:       row?.address       || '',
      phone:         row?.phone         || '',
      email_contact: row?.email_contact || '',
      nip:           row?.nip           || '',
      website:       row?.website       || '',
      updated_at:    row?.updated_at    || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

router.put('/company', auth, adminOnly, async (req, res) => {
  try {
    const { name, address, phone, email_contact, nip, website } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Nazwa firmy jest wymagana' });
    }

    const result = await pool.query(
      `INSERT INTO company_settings (id, name, address, phone, email_contact, nip, website, updated_at)
       VALUES (1, $1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (id) DO UPDATE
       SET name = $1, address = $2, phone = $3, email_contact = $4, nip = $5, website = $6, updated_at = NOW()
       RETURNING *`,
      [name.trim(), address || '', phone || '', email_contact || '', nip || '', website || '']
    );

    invalidateCache();
    await logAction({ userId: req.user.id, userName: req.user.name, action: 'company_settings_updated', details: { name }, ipAddress: getIp(req) });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ─── Preferencje powiadomień ───────────────────────────────────────────────────

const DEFAULT_PREFS = {
  show_overdue:  true,
  show_today:    true,
  show_ready:    true,
  show_tomorrow: true,
};

router.get('/notifications', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT notification_prefs FROM users WHERE id = $1', [req.user.id]);
    const prefs = result.rows[0]?.notification_prefs || {};
    res.json({ ...DEFAULT_PREFS, ...prefs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

router.put('/notifications', auth, async (req, res) => {
  try {
    const { show_overdue, show_today, show_ready, show_tomorrow } = req.body;

    const prefs = {
      show_overdue:  show_overdue  !== false,
      show_today:    show_today    !== false,
      show_ready:    show_ready    !== false,
      show_tomorrow: show_tomorrow !== false,
    };

    await pool.query(
      'UPDATE users SET notification_prefs = $1 WHERE id = $2',
      [JSON.stringify(prefs), req.user.id]
    );

    res.json(prefs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;
