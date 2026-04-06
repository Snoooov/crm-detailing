const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const pool = require('../config/db');
const { logAction } = require('../utils/systemLog');
const getIp = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;

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
    await logAction({ userId: req.user.id, userName: req.user.name, action: 'note_added', entityType, entityId: parseInt(entityId), details: { content: content.trim().slice(0, 120) }, ipAddress: getIp(req) });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const noteResult = await pool.query('SELECT * FROM notes WHERE id = $1', [req.params.id]);
    const note = noteResult.rows[0];
    await pool.query('DELETE FROM notes WHERE id = $1', [req.params.id]);
    if (note) {
      await logAction({ userId: req.user.id, userName: req.user.name, action: 'note_deleted', entityType: note.entity_type, entityId: note.entity_id, details: { content: note.content?.slice(0, 120) }, ipAddress: getIp(req) });
    }
    res.json({ message: 'Notatka usunięta' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;