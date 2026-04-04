const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const pool = require('../config/db');

router.get('/', auth, async (req, res) => {
  try {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const userId = req.user.id;
    const role = req.user.role;
    const isAdmin = ['admin', 'manager'].includes(role);

    const [
      revenueThisMonth,
      ordersToday,
      upcomingOrders,
      monthlyRevenue,
      ordersByStatus,
      weeklyDailyRevenue,
    ] = await Promise.all([

      isAdmin ? pool.query(
        `SELECT COALESCE(SUM(price), 0) as total
         FROM orders
         WHERE EXTRACT(YEAR FROM date_from) = EXTRACT(YEAR FROM CURRENT_DATE)
           AND EXTRACT(MONTH FROM date_from) = EXTRACT(MONTH FROM CURRENT_DATE)
           AND status != 'cancelled'
           AND is_paid = TRUE`
      ) : Promise.resolve({ rows: [{ total: null }] }),

      pool.query(
        `SELECT COUNT(*) as count
         FROM orders o
         WHERE o.date_from = $1
           AND o.status NOT IN ('released', 'cancelled')
           AND ($2 OR o.id IN (SELECT order_id FROM order_assignments WHERE user_id = $3))`,
        [today, isAdmin, userId]
      ),

      pool.query(
        `SELECT o.id, o.service_name, o.status, o.date_from, o.price,
                c.full_name as client_name,
                v.brand as vehicle_brand, v.model as vehicle_model,
                v.plate_number
         FROM orders o
         JOIN clients c ON o.client_id = c.id
         JOIN vehicles v ON o.vehicle_id = v.id
         WHERE o.date_from >= $1
           AND o.status NOT IN ('released', 'cancelled')
           AND ($2 OR o.id IN (SELECT order_id FROM order_assignments WHERE user_id = $3))
         ORDER BY o.date_from ASC
         LIMIT 8`,
        [today, isAdmin, userId]
      ),

      isAdmin ? pool.query(
        `SELECT
           TO_CHAR(date_from, 'YYYY-MM') as month,
           COALESCE(SUM(price), 0) as total
         FROM orders
         WHERE date_from >= NOW() - INTERVAL '6 months'
           AND status != 'cancelled'
           AND is_paid = TRUE
         GROUP BY TO_CHAR(date_from, 'YYYY-MM')
         ORDER BY month ASC`
      ) : Promise.resolve({ rows: [] }),

      pool.query(
        `SELECT o.status, COUNT(*) as count
        FROM orders o
        WHERE o.status IN ('in_progress', 'done')
          AND ($1 OR o.id IN (SELECT order_id FROM order_assignments WHERE user_id = $2))
        GROUP BY o.status`,
        [isAdmin, userId]
      ),

      isAdmin ? pool.query(
        `SELECT
           date_from::date as day,
           COALESCE(SUM(price) FILTER (WHERE is_paid = TRUE AND status != 'cancelled'), 0) as revenue,
           COALESCE(SUM(paid_cash) FILTER (WHERE status != 'cancelled'), 0) as cash,
           COALESCE(SUM(paid_card) FILTER (WHERE status != 'cancelled'), 0) as card,
           COUNT(*) FILTER (WHERE status != 'cancelled') as orders
         FROM orders
         WHERE date_from >= DATE_TRUNC('week', CURRENT_DATE)
           AND date_from < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
         GROUP BY date_from::date
         ORDER BY day ASC`
      ) : Promise.resolve({ rows: [] }),
    ]);

    res.json({
      revenueThisMonth: isAdmin ? parseFloat(revenueThisMonth.rows[0].total) : null,
      ordersToday: parseInt(ordersToday.rows[0].count),
      upcomingOrders: upcomingOrders.rows,
      monthlyRevenue: isAdmin ? monthlyRevenue.rows : [],
      ordersByStatus: ordersByStatus.rows,
      weeklyDailyRevenue: isAdmin ? weeklyDailyRevenue.rows : [],
      isAdmin,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;