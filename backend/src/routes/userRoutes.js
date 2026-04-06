const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { auth, adminOnly, managerOrAdmin } = require('../middleware/auth');
const pool = require('../config/db');
const { logAction } = require('../utils/systemLog');
const getIp = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;

// Lista użytkowników
router.get('/', auth, managerOrAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, totp_enabled, created_at FROM users ORDER BY created_at ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Dodaj użytkownika
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, hasło i imię są wymagane' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Hasło musi mieć co najmniej 6 znaków' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Użytkownik z tym emailem już istnieje' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, created_at`,
      [email, password_hash, name, role || 'employee']
    );

    await logAction({ userId: req.user.id, userName: req.user.name, action: 'user_created', entityType: 'user', entityId: result.rows[0].id, details: { name, email, role: role || 'employee' }, ipAddress: getIp(req) });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Edytuj użytkownika
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, email, role, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Imię i email są wymagane' });
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Hasło musi mieć co najmniej 6 znaków' });
      }
      const password_hash = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE users SET name = $1, email = $2, role = $3, password_hash = $4 WHERE id = $5',
        [name, email, role, password_hash, req.params.id]
      );
    } else {
      await pool.query(
        'UPDATE users SET name = $1, email = $2, role = $3 WHERE id = $4',
        [name, email, role, req.params.id]
      );
    }

    const result = await pool.query(
      'SELECT id, email, name, role, totp_enabled, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    await logAction({ userId: req.user.id, userName: req.user.name, action: 'user_updated', entityType: 'user', entityId: parseInt(req.params.id), details: { name, email, role, password_changed: !!password }, ipAddress: getIp(req) });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Usuń użytkownika
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Nie możesz usunąć własnego konta' });
    }
    const targetUser = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [req.params.id]);
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    await logAction({ userId: req.user.id, userName: req.user.name, action: 'user_deleted', entityType: 'user', entityId: parseInt(req.params.id), details: { name: targetUser.rows[0]?.name, email: targetUser.rows[0]?.email }, ipAddress: getIp(req) });
    res.json({ message: 'Użytkownik usunięty' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;