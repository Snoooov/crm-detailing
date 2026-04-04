const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const pool = require('../config/db');

const VALID_ENTITY_TYPES = ['client', 'vehicle', 'order'];

router.get('/:entityType/:entityId', auth, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    if (!VALID_ENTITY_TYPES.includes(entityType)) return res.status(400).json({ error: 'Nieprawidłowy typ encji' });
    const result = await pool.query(
      `SELECT * FROM notes
       WHERE entity_type = $1 AND entity_id = $2
       ORDER BY created_at DESC`,
      [entityType, entityId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

router.post('/:entityType/:entityId', auth, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    if (!VALID_ENTITY_TYPES.includes(entityType)) return res.status(400).json({ error: 'Nieprawidłowy typ encji' });
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ error: 'Treść notatki jest wymagana' });
    }
    const result = await pool.query(
      `INSERT INTO notes (entity_type, entity_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [entityType, entityId, content.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM notes WHERE id = $1', [req.params.id]);
    res.json({ message: 'Notatka usunięta' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;