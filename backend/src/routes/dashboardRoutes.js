const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../config/db');

router.get('/', auth, async (req, res) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = now.toISOString().split('T')[0];

    const [
      revenueThisMonth,
      ordersToday,
      upcomingOrders,
      recentOrders,
      monthlyRevenue,
      ordersByStatus,
    ] = await Promise.all([

      // Przychód z bieżącego miesiąca (tylko zapłacone)
      pool.query(
        `SELECT COALESCE(SUM(price), 0) as total
         FROM orders
         WHERE date_from >= $1 AND status != 'cancelled'`,
        [firstDayOfMonth]
      ),

      // Zlecenia na dziś
      pool.query(
        `SELECT COUNT(*) as count
         FROM orders
         WHERE date_from = $1 AND status NOT IN ('released', 'cancelled')`,
        [today]
      ),

      // Nadchodzące zlecenia (od dziś, jeszcze nie wydane)
      pool.query(
        `SELECT o.id, o.service_name, o.status, o.date_from, o.price,
                c.full_name as client_name,
                v.brand as vehicle_brand, v.model as vehicle_model,
                v.plate_number
         FROM orders o
         JOIN clients c ON o.client_id = c.id
         JOIN vehicles v ON o.vehicle_id = v.id
         WHERE o.date_from >= $1 AND o.status NOT IN ('released', 'cancelled')
         ORDER BY o.date_from ASC
         LIMIT 8`,
        [today]
      ),

      // Ostatnie zlecenia
      pool.query(
        `SELECT o.id, o.service_name, o.status, o.date_from, o.price,
                c.full_name as client_name,
                v.brand as vehicle_brand, v.model as vehicle_model
         FROM orders o
         JOIN clients c ON o.client_id = c.id
         JOIN vehicles v ON o.vehicle_id = v.id
         ORDER BY o.created_at DESC
         LIMIT 5`
      ),

      // Przychód miesięczny z ostatnich 6 miesięcy
      pool.query(
        `SELECT
           TO_CHAR(date_from, 'YYYY-MM') as month,
           COALESCE(SUM(price), 0) as total
         FROM orders
         WHERE date_from >= NOW() - INTERVAL '6 months'
           AND status != 'cancelled'
         GROUP BY TO_CHAR(date_from, 'YYYY-MM')
         ORDER BY month ASC`
      ),

      // Zlecenia według statusu
      pool.query(
        `SELECT status, COUNT(*) as count
         FROM orders
         WHERE status NOT IN ('released', 'cancelled')
         GROUP BY status`
      ),
    ]);

    res.json({
      revenueThisMonth: parseFloat(revenueThisMonth.rows[0].total),
      ordersToday: parseInt(ordersToday.rows[0].count),
      upcomingOrders: upcomingOrders.rows,
      recentOrders: recentOrders.rows,
      monthlyRevenue: monthlyRevenue.rows,
      ordersByStatus: ordersByStatus.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;