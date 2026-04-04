const cron = require('node-cron');
const pool = require('../config/db');
const { sendOrderEmail } = require('./emailService');

const getOrderWithDetails = async (orderId) => {
  const result = await pool.query(
    `SELECT o.*,
            c.full_name as client_name,
            c.email as client_email,
            v.brand as vehicle_brand,
            v.model as vehicle_model,
            v.plate_number
     FROM orders o
     JOIN clients c ON o.client_id = c.id
     JOIN vehicles v ON o.vehicle_id = v.id
     WHERE o.id = $1`,
    [orderId]
  );
  return result.rows[0];
};

let isRunning = false;

const runEmailJobs = async () => {
  if (isRunning) {
    console.log('[Email Scheduler] Poprzednie zadanie jeszcze trwa, pomijam.');
    return;
  }
  isRunning = true;
  console.log('[Email Scheduler] Sprawdzam maile do wysłania...');

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];

  try {
    // 1. Przypomnienie 24h przed wizytą
    const reminderOrders = await pool.query(
      `SELECT o.id FROM orders o
       JOIN clients c ON o.client_id = c.id
       WHERE o.date_from = $1
         AND o.status NOT IN ('cancelled', 'released')
         AND c.email IS NOT NULL
         AND c.email != ''
         AND o.id NOT IN (
           SELECT order_id FROM email_logs
           WHERE email_type = 'reminder_24h' AND order_id IS NOT NULL
         )`,
      [tomorrow]
    );

    for (const row of reminderOrders.rows) {
      const order = await getOrderWithDetails(row.id);
      const result = await sendOrderEmail(order, 'reminder_24h');
      console.log(`[reminder_24h] Zlecenie #${row.id}:`, result);
    }

    // 2. Auto gotowe — status zmieniony na 'done'
    const readyOrders = await pool.query(
      `SELECT o.id FROM orders o
       JOIN clients c ON o.client_id = c.id
       WHERE o.status = 'done'
         AND c.email IS NOT NULL
         AND c.email != ''
         AND o.id NOT IN (
           SELECT order_id FROM email_logs
           WHERE email_type = 'ready' AND order_id IS NOT NULL
         )`
    );

    for (const row of readyOrders.rows) {
      const order = await getOrderWithDetails(row.id);
      const result = await sendOrderEmail(order, 'ready');
      console.log(`[ready] Zlecenie #${row.id}:`, result);
    }

    // 3. Follow-up krótki (4 dni po wydaniu)
    const followupShortOrders = await pool.query(
      `SELECT o.id FROM orders o
       JOIN clients c ON o.client_id = c.id
       WHERE o.status = 'released'
         AND o.date_to <= CURRENT_DATE - INTERVAL '4 days'
         AND o.date_to >= CURRENT_DATE - INTERVAL '5 days'
         AND c.email IS NOT NULL
         AND c.email != ''
         AND o.id NOT IN (
           SELECT order_id FROM email_logs
           WHERE email_type = 'followup_short' AND order_id IS NOT NULL
         )`
    );

    for (const row of followupShortOrders.rows) {
      const order = await getOrderWithDetails(row.id);
      const result = await sendOrderEmail(order, 'followup_short');
      console.log(`[followup_short] Zlecenie #${row.id}:`, result);
    }

    // 4. Follow-up długi (30 dni po wydaniu)
    const followupLongOrders = await pool.query(
      `SELECT o.id FROM orders o
       JOIN clients c ON o.client_id = c.id
       WHERE o.status = 'released'
         AND o.date_to <= CURRENT_DATE - INTERVAL '30 days'
         AND o.date_to >= CURRENT_DATE - INTERVAL '31 days'
         AND c.email IS NOT NULL
         AND c.email != ''
         AND o.id NOT IN (
           SELECT order_id FROM email_logs
           WHERE email_type = 'followup_long' AND order_id IS NOT NULL
         )
         AND o.client_id NOT IN (
           SELECT client_id FROM orders
           WHERE status NOT IN ('cancelled')
             AND created_at > NOW() - INTERVAL '30 days'
             AND id != o.id
         )`
    );

    for (const row of followupLongOrders.rows) {
      const order = await getOrderWithDetails(row.id);
      const result = await sendOrderEmail(order, 'followup_long');
      console.log(`[followup_long] Zlecenie #${row.id}:`, result);
    }

    console.log('[Email Scheduler] Gotowe.');
  } catch (err) {
    console.error('[Email Scheduler] Błąd:', err);
  } finally {
    isRunning = false;
  }
};

const startScheduler = () => {
  // Co godzinę
  cron.schedule('0 * * * *', runEmailJobs);
  // Uruchom też od razu przy starcie serwera
  setTimeout(runEmailJobs, 5000);
  console.log('[Email Scheduler] Uruchomiony — sprawdza co godzinę');
};

module.exports = { startScheduler, runEmailJobs };