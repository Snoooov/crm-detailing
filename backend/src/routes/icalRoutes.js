const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const os = require('os');
const pool = require('../config/db');
const config = require('../config/appConfig');

function makeToken(userId) {
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET + ':ical')
    .update(String(userId))
    .digest('hex');
}

// Zwraca lokalny adres IP sieci (np. 192.168.1.x) — iPhone na tym samym WiFi może go osiągnąć
function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

function getBaseUrl() {
  const envUrl = config.server.backendUrl;
  // Jeśli ustawiono BACKEND_URL i nie jest to localhost → używaj go (produkcja / ngrok)
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }
  // Inaczej → lokalny IP sieci żeby iPhone na tym samym WiFi mógł subskrybować
  return `http://${getLocalIp()}:${config.server.port}`;
}

// GET /api/ical/token  — zwraca token dla zalogowanego użytkownika (wymaga JWT)
const { auth } = require('../middleware/auth');
router.get('/token', auth, (req, res) => {
  const token = makeToken(req.user.id);
  const baseUrl = getBaseUrl();
  res.json({
    token,
    url: `${baseUrl}/api/ical/${req.user.id}/${token}`,
  });
});

// GET /api/ical/:userId/:token  — publiczny endpoint, iPhone subskrybuje ten URL
router.get('/:userId/:token', async (req, res) => {
  const { userId, token } = req.params;
  const expected = makeToken(userId);

  if (token !== expected) {
    return res.status(403).send('Nieprawidłowy token');
  }

  try {
    const userRes = await pool.query('SELECT id, name, role FROM users WHERE id = $1', [userId]);
    if (!userRes.rows[0]) return res.status(404).send('Nie znaleziono użytkownika');
    const userName = userRes.rows[0].name;

    const role = userRes.rows[0].role;
    const isPrivileged = ['admin', 'manager'].includes(role);

    let ordersRes;
    if (isPrivileged) {
      ordersRes = await pool.query(`
        SELECT o.id, o.service_name, o.date_from, o.date_to, o.status, o.notes,
               c.full_name as client_name, c.phone as client_phone,
               v.brand, v.model, v.plate_number
        FROM orders o
        JOIN clients c ON o.client_id = c.id
        JOIN vehicles v ON o.vehicle_id = v.id
        WHERE o.status NOT IN ('cancelled', 'released')
          AND o.date_from >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY o.date_from ASC
      `);
    } else {
      ordersRes = await pool.query(`
        SELECT o.id, o.service_name, o.date_from, o.date_to, o.status, o.notes,
               c.full_name as client_name, c.phone as client_phone,
               v.brand, v.model, v.plate_number
        FROM orders o
        JOIN clients c ON o.client_id = c.id
        JOIN vehicles v ON o.vehicle_id = v.id
        JOIN order_assignments oa ON o.id = oa.order_id
        WHERE oa.user_id = $1
          AND o.status NOT IN ('cancelled', 'released')
          AND o.date_from >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY o.date_from ASC
      `, [userId]);
    }

    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const STATUS_LABELS = {
      inspection: 'Ogledz.',
      planned: 'Zaplan.',
      in_progress: 'W trakcie',
      done: 'Gotowe',
    };

    // Format DATE (all-day): 20240404
    const toDateOnly = (dateStr) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}${m}${day}`;
    };

    // Next day for DTEND of all-day event
    const nextDay = (dateStr) => {
      const d = new Date(dateStr);
      d.setUTCDate(d.getUTCDate() + 1);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}${m}${day}`;
    };

    // RFC 5545 text escaping
    const escapeText = (str) =>
      (str || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

    // RFC 5545 line folding: max 75 octets, continuation with CRLF + SPACE
    const fold = (line) => {
      const bytes = Buffer.from(line, 'utf8');
      if (bytes.length <= 75) return line;
      const parts = [];
      let start = 0;
      let isFirst = true;
      while (start < bytes.length) {
        const limit = isFirst ? 75 : 74; // 74 because continuation line starts with a space
        // Find a safe split point (don't split multi-byte UTF-8)
        let end = start + limit;
        if (end >= bytes.length) {
          parts.push(bytes.slice(start).toString('utf8'));
          break;
        }
        // Back off until we're at a UTF-8 character boundary
        while (end > start && (bytes[end] & 0xC0) === 0x80) end--;
        parts.push(bytes.slice(start, end).toString('utf8'));
        start = end;
        isFirst = false;
      }
      return parts.join('\r\n ');
    };

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      `PRODID:-//${config.company.name}//${config.company.slug}//PL`,
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:CRM - ${escapeText(userName)}`,
      `X-WR-CALDESC:Harmonogram zlecen ${config.company.name}`,
    ];

    for (const order of ordersRes.rows) {
      const dtstart = toDateOnly(order.date_from);
      if (!dtstart) continue;
      // DTEND musi być > DTSTART dla all-day events (RFC 5545)
      const dateToCandidate = toDateOnly(order.date_to);
      const dtend = (dateToCandidate && dateToCandidate > dtstart) ? dateToCandidate : nextDay(order.date_from);
      const status = STATUS_LABELS[order.status] || order.status;
      const title = `[${status}] ${escapeText(order.service_name)} - ${escapeText(order.client_name)}`;
      const descParts = [
        `Klient: ${order.client_name}`,
        order.client_phone ? `Tel: ${order.client_phone}` : null,
        `Pojazd: ${order.brand} ${order.model} (${order.plate_number})`,
        order.notes ? `Notatki: ${order.notes}` : null,
      ].filter(Boolean);
      const desc = escapeText(descParts.join('\n'));

      lines.push(
        'BEGIN:VEVENT',
        `UID:crm-order-${order.id}@${config.company.slug}`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${dtstart}`,
        `DTEND;VALUE=DATE:${dtend}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${desc}`,
        'END:VEVENT',
      );
    }

    lines.push('END:VCALENDAR');

    const output = lines.map(fold).join('\r\n') + '\r\n';

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="crm-schedule.ics"');
    res.send(output);
  } catch (err) {
    console.error(err);
    res.status(500).send('Błąd serwera');
  }
});

module.exports = router;
