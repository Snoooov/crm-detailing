const express = require('express');
const router = express.Router();
const { auth, managerOrAdmin } = require('../middleware/auth');
const pool = require('../config/db');

router.get('/', auth, managerOrAdmin, async (req, res) => {
  try {
    const { from, to } = req.query;

    const now = new Date();
    const dateFrom = from || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const dateTo = to || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Poprzedni okres tej samej długości
    const fromDate = new Date(dateFrom + 'T00:00:00Z');
    const toDate = new Date(dateTo + 'T00:00:00Z');
    const periodDays = Math.round((toDate - fromDate) / 86400000);
    const prevTo = new Date(fromDate); prevTo.setUTCDate(prevTo.getUTCDate() - 1);
    const prevFrom = new Date(prevTo); prevFrom.setUTCDate(prevFrom.getUTCDate() - periodDays);
    const prevDateFrom = prevFrom.toISOString().split('T')[0];
    const prevDateTo = prevTo.toISOString().split('T')[0];

    const [summary, revenueByDay, topServices, employeeStats, paymentBreakdown, prevSummary] = await Promise.all([

      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status != 'cancelled') as total_orders,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
          COALESCE(SUM(price) FILTER (WHERE is_paid = TRUE AND status != 'cancelled'), 0) as total_revenue,
          COALESCE(SUM(paid_cash) FILTER (WHERE status != 'cancelled'), 0) as total_cash,
          COALESCE(SUM(paid_card) FILTER (WHERE status != 'cancelled'), 0) as total_card,
          COALESCE(AVG(price) FILTER (WHERE is_paid = TRUE AND status != 'cancelled'), 0) as avg_order_value
        FROM orders
        WHERE date_from BETWEEN $1 AND $2
      `, [dateFrom, dateTo]),

      pool.query(`
        SELECT
          date_from::date as day,
          COALESCE(SUM(price) FILTER (WHERE is_paid = TRUE AND status != 'cancelled'), 0) as revenue,
          COALESCE(SUM(paid_cash) FILTER (WHERE status != 'cancelled'), 0) as cash,
          COALESCE(SUM(paid_card) FILTER (WHERE status != 'cancelled'), 0) as card,
          COUNT(*) FILTER (WHERE status != 'cancelled') as orders
        FROM orders
        WHERE date_from BETWEEN $1 AND $2
        GROUP BY date_from::date
        ORDER BY day ASC
      `, [dateFrom, dateTo]),

      pool.query(`
        SELECT
          service_name,
          COUNT(*) as count,
          COALESCE(SUM(price), 0) as total_value,
          COALESCE(AVG(price), 0) as avg_value
        FROM orders
        WHERE date_from BETWEEN $1 AND $2
          AND status != 'cancelled'
        GROUP BY service_name
        ORDER BY count DESC
        LIMIT 10
      `, [dateFrom, dateTo]),

      pool.query(`
        SELECT
          u.id,
          u.name,
          COUNT(DISTINCT oa.order_id) as orders_count,
          COALESCE(SUM(o.price), 0) as total_value
        FROM users u
        JOIN order_assignments oa ON u.id = oa.user_id
        JOIN orders o ON oa.order_id = o.id
        WHERE o.date_from BETWEEN $1 AND $2
          AND o.status != 'cancelled'
        GROUP BY u.id, u.name
        ORDER BY orders_count DESC
      `, [dateFrom, dateTo]),

      pool.query(`
        SELECT
          is_paid,
          COUNT(*) as count,
          COALESCE(SUM(price), 0) as value
        FROM orders
        WHERE date_from BETWEEN $1 AND $2
          AND status != 'cancelled'
        GROUP BY is_paid
      `, [dateFrom, dateTo]),

      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status != 'cancelled') as total_orders,
          COALESCE(SUM(price) FILTER (WHERE is_paid = TRUE AND status != 'cancelled'), 0) as total_revenue,
          COALESCE(AVG(price) FILTER (WHERE is_paid = TRUE AND status != 'cancelled'), 0) as avg_order_value
        FROM orders
        WHERE date_from BETWEEN $1 AND $2
      `, [prevDateFrom, prevDateTo]),
    ]);

    res.json({
      period: { from: dateFrom, to: dateTo },
      prevPeriod: { from: prevDateFrom, to: prevDateTo },
      summary: summary.rows[0],
      prevSummary: prevSummary.rows[0],
      revenueByDay: revenueByDay.rows,
      topServices: topServices.rows,
      employeeStats: employeeStats.rows,
      paymentBreakdown: paymentBreakdown.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

router.get('/employee/:userId', auth, managerOrAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { from, to } = req.query;

    const now = new Date();
    const dateFrom = from || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const dateTo = to || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [userInfo, summary, topServices, statusBreakdown, recentOrders] = await Promise.all([
      pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [userId]),

      pool.query(`
        SELECT
          COUNT(DISTINCT oa.order_id) as total_orders,
          COALESCE(SUM(o.price) FILTER (WHERE o.is_paid = TRUE), 0) as total_revenue,
          COALESCE(AVG(o.price) FILTER (WHERE o.is_paid = TRUE), 0) as avg_order_value
        FROM order_assignments oa
        JOIN orders o ON oa.order_id = o.id
        WHERE oa.user_id = $1
          AND o.date_from BETWEEN $2 AND $3
          AND o.status != 'cancelled'
      `, [userId, dateFrom, dateTo]),

      pool.query(`
        SELECT
          o.service_name,
          COUNT(*) as count,
          COALESCE(SUM(o.price), 0) as total_value
        FROM order_assignments oa
        JOIN orders o ON oa.order_id = o.id
        WHERE oa.user_id = $1
          AND o.date_from BETWEEN $2 AND $3
          AND o.status != 'cancelled'
        GROUP BY o.service_name
        ORDER BY count DESC
        LIMIT 5
      `, [userId, dateFrom, dateTo]),

      pool.query(`
        SELECT
          o.status,
          COUNT(*) as count
        FROM order_assignments oa
        JOIN orders o ON oa.order_id = o.id
        WHERE oa.user_id = $1
          AND o.date_from BETWEEN $2 AND $3
        GROUP BY o.status
      `, [userId, dateFrom, dateTo]),

      pool.query(`
        SELECT
          o.id, o.service_name, o.status, o.price, o.date_from, o.is_paid,
          c.full_name as client_name
        FROM order_assignments oa
        JOIN orders o ON oa.order_id = o.id
        LEFT JOIN clients c ON o.client_id = c.id
        WHERE oa.user_id = $1
          AND o.date_from BETWEEN $2 AND $3
        ORDER BY o.date_from DESC
        LIMIT 10
      `, [userId, dateFrom, dateTo]),
    ]);

    if (!userInfo.rows[0]) return res.status(404).json({ error: 'Użytkownik nie znaleziony' });

    res.json({
      user: userInfo.rows[0],
      period: { from: dateFrom, to: dateTo },
      summary: summary.rows[0],
      topServices: topServices.rows,
      statusBreakdown: statusBreakdown.rows,
      recentOrders: recentOrders.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;
