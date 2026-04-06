const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const pool = require('../config/db');

// GET /api/logs — wszystkie logi systemowe (tylko admin)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const { user_id, action, entity_type, date_from, date_to, limit = 200, offset = 0 } = req.query;

    const params = [];
    const conditions = [];
    let idx = 1;

    if (user_id)      { conditions.push(`user_id = $${idx++}`);                                  params.push(user_id); }
    if (action)       { conditions.push(`action = $${idx++}`);                                    params.push(action); }
    if (entity_type)  { conditions.push(`entity_type = $${idx++}`);                               params.push(entity_type); }
    if (date_from)    { conditions.push(`created_at >= $${idx++}`);                               params.push(date_from); }
    if (date_to)      { conditions.push(`created_at < ($${idx++}::date + interval '1 day')`);     params.push(date_to); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows, countRow] = await Promise.all([
      pool.query(
        `SELECT * FROM system_logs ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, parseInt(limit), parseInt(offset)]
      ),
      pool.query(`SELECT COUNT(*) FROM system_logs ${where}`, params),
    ]);

    res.json({
      logs: rows.rows,
      total: parseInt(countRow.rows[0].count),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// GET /api/logs/actions — lista unikalnych typów akcji (do filtrowania)
router.get('/actions', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT action FROM system_logs ORDER BY action`
    );
    res.json(result.rows.map(r => r.action));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;
