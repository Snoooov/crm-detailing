require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const PRICES = [120, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 1000, 1200, 1500, 2000];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateStr(date) {
  return date.toISOString().split('T')[0];
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Usuń wszystkie zlecenia i powiązane dane
    await client.query('DELETE FROM order_assignments');
    await client.query('DELETE FROM order_history');
    await client.query('DELETE FROM email_logs');
    await client.query('DELETE FROM orders');
    console.log('Usunięto stare zlecenia.');

    // Pobierz wszystkie pary klient-pojazd
    const { rows: pairs } = await client.query(`
      SELECT c.id AS client_id, v.id AS vehicle_id
      FROM clients c
      JOIN vehicles v ON v.client_id = c.id
    `);
    if (pairs.length === 0) {
      console.error('Brak klientów z pojazdami — dodaj najpierw klientów i pojazdy.');
      await client.query('ROLLBACK');
      return;
    }

    // Pobierz aktywne usługi
    const { rows: services } = await client.query(`
      SELECT id, name, description FROM service_catalog WHERE active = TRUE ORDER BY sort_order
    `);
    if (services.length === 0) {
      console.error('Brak usług w katalogu.');
      await client.query('ROLLBACK');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Poniedziałek pierwszego tygodnia (tydzień zaczynający się 5 stycznia 2026)
    let weekStart = new Date('2026-01-05');
    let totalInserted = 0;

    while (weekStart <= today) {
      for (let i = 0; i < 10; i++) {
        // Rozłóż 10 zleceń na pon–pt (po 2 dziennie)
        const dayOffset = i % 5;
        const orderDate = addDays(weekStart, dayOffset);

        const pair = randomItem(pairs);
        const service = randomItem(services);
        const price = randomItem(PRICES);

        const isPast = orderDate <= today;
        const status = isPast ? 'released' : 'planned';
        const isPaid = isPast;
        const paidCash = isPaid ? price : 0;

        const dateFrom = toDateStr(orderDate);
        const dateTo   = toDateStr(addDays(orderDate, 1));

        await client.query(`
          INSERT INTO orders
            (client_id, vehicle_id, service_catalog_id, service_name, service_description,
             date_from, date_to, price, status, is_paid, paid_cash, paid_card, created_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        `, [
          pair.client_id, pair.vehicle_id, service.id, service.name, service.description,
          dateFrom, dateTo, price, status, isPaid, paidCash, 0, dateFrom,
        ]);

        totalInserted++;
      }

      weekStart = addDays(weekStart, 7);
    }

    await client.query('COMMIT');
    console.log(`Dodano ${totalInserted} zleceń (10 na tydzień od 2026-01-05 do ${toDateStr(today)}).`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Błąd:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
