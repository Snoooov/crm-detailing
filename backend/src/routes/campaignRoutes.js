const express = require('express');
const router = express.Router();
const { auth, managerOrAdmin } = require('../middleware/auth');
const pool = require('../config/db');
const { sendEmail, logEmail, renderTemplate, wrapEmailHtml } = require('../services/emailService');
const { getCompany } = require('../utils/companySettings');

// Podgląd klientów pasujących do filtrów
router.get('/preview', auth, managerOrAdmin, async (req, res) => {
  try {
    const { days_inactive, status, min_orders } = req.query;

    const result = await pool.query(`
      WITH client_stats AS (
        SELECT
          c.id, c.full_name, c.email, c.phone, c.status,
          COUNT(o.id) as total_orders,
          MAX(o.date_from)::date as last_visit
        FROM clients c
        LEFT JOIN orders o ON o.client_id = c.id AND o.status != 'cancelled'
        WHERE c.email IS NOT NULL AND c.email != ''
        GROUP BY c.id, c.full_name, c.email, c.phone, c.status
      )
      SELECT * FROM client_stats
      WHERE
        ($1::int IS NULL OR last_visit IS NULL OR (CURRENT_DATE - last_visit) >= $1)
        AND ($2::varchar IS NULL OR status = $2)
        AND ($3::int IS NULL OR total_orders >= $3)
      ORDER BY full_name
    `, [
      days_inactive ? parseInt(days_inactive) : null,
      status || null,
      min_orders ? parseInt(min_orders) : null,
    ]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Wyślij kampanię do wybranych klientów
router.post('/send', auth, managerOrAdmin, async (req, res) => {
  try {
    const { subject, body, client_ids } = req.body;

    if (!subject?.trim() || !body?.trim()) {
      return res.status(400).json({ error: 'Temat i treść są wymagane' });
    }
    if (!Array.isArray(client_ids) || client_ids.length === 0) {
      return res.status(400).json({ error: 'Wybierz co najmniej jednego klienta' });
    }

    const clientsResult = await pool.query(
      `SELECT id, full_name, email FROM clients WHERE id = ANY($1) AND email IS NOT NULL AND email != ''`,
      [client_ids]
    );

    const results = { sent: 0, failed: 0, skipped: 0 };
    const company = await getCompany();

    for (const client of clientsResult.rows) {
      const firstName = client.full_name?.split(' ')[0] || client.full_name;
      const vars = { client_name: firstName };
      const renderedSubject = renderTemplate(subject, vars);
      const renderedBody = renderTemplate(body, vars);

      try {
        await sendEmail({ to: client.email, subject: renderedSubject, html: wrapEmailHtml(renderedBody, company) });
        await logEmail({
          orderId: null,
          clientId: client.id,
          type: 'campaign',
          email: client.email,
          subject: renderedSubject,
          status: 'sent',
        });
        results.sent++;
      } catch (err) {
        await logEmail({
          orderId: null,
          clientId: client.id,
          type: 'campaign',
          email: client.email,
          subject: renderedSubject,
          status: 'failed',
          error: err.message,
        });
        results.failed++;
      }
    }

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;
