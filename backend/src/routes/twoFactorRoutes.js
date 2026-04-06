const express = require('express');
const router = express.Router();
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { auth } = require('../middleware/auth');
const pool = require('../config/db');
const { getCompany } = require('../utils/companySettings');

// Generuj sekret i kod QR
router.post('/setup', auth, async (req, res) => {
  try {
    const company = await getCompany();
    const secret = speakeasy.generateSecret({
      name: `${company.name} (${req.user.email})`,
      length: 20,
    });

    await pool.query(
      'UPDATE users SET totp_secret = $1 WHERE id = $2',
      [secret.base32, req.user.id]
    );

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Włącz 2FA po potwierdzeniu kodem
router.post('/enable', auth, async (req, res) => {
  try {
    const { token } = req.body;

    const result = await pool.query('SELECT totp_secret FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    if (!user?.totp_secret) {
      return res.status(400).json({ error: 'Najpierw wygeneruj kod QR' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ error: 'Nieprawidłowy kod — spróbuj ponownie' });
    }

    await pool.query('UPDATE users SET totp_enabled = TRUE WHERE id = $1', [req.user.id]);

    res.json({ message: '2FA zostało włączone' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Wyłącz 2FA
router.post('/disable', auth, async (req, res) => {
  try {
    const { token } = req.body;

    const result = await pool.query('SELECT totp_secret FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    const verified = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ error: 'Nieprawidłowy kod' });
    }

    await pool.query(
      'UPDATE users SET totp_enabled = FALSE, totp_secret = NULL WHERE id = $1',
      [req.user.id]
    );

    res.json({ message: '2FA zostało wyłączone' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Status 2FA
router.get('/status', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT totp_enabled FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json({ totp_enabled: result.rows[0]?.totp_enabled || false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;