const express = require('express');
const router = express.Router();
const { auth, adminOnly, managerOrAdmin } = require('../middleware/auth');
const pool = require('../config/db');

// Lista aktywnych usług (dla wszystkich zalogowanych)
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM service_catalog WHERE active = TRUE ORDER BY sort_order, name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Wszystkie usługi — admin i manager
router.get('/all', auth, managerOrAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM service_catalog ORDER BY sort_order, name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Dodaj usługę
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, description, base_price, sort_order } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Nazwa usługi jest wymagana' });
    const result = await pool.query(
      `INSERT INTO service_catalog (name, description, base_price, sort_order)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name.trim(), description || null, base_price || null, sort_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Edytuj usługę
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, description, base_price, active, sort_order } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Nazwa usługi jest wymagana' });
    const result = await pool.query(
      `UPDATE service_catalog
       SET name = $1, description = $2, base_price = $3, active = $4, sort_order = $5
       WHERE id = $6 RETURNING *`,
      [name.trim(), description || null, base_price || null, active !== false, sort_order || 0, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Usługa nie znaleziona' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Usuń usługę
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM service_catalog WHERE id = $1', [req.params.id]);
    res.json({ message: 'Usługa usunięta' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;
