const pool = require('../config/db');

const getAllOrders = async (userId, role) => {
  const query = role === 'admin'
    ? `SELECT o.*,
        c.full_name as client_name,
        v.brand as vehicle_brand,
        v.model as vehicle_model,
        v.plate_number,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT('id', u.id, 'name', u.name)
          ) FILTER (WHERE u.id IS NOT NULL),
          '[]'
        ) as assigned_users
       FROM orders o
       JOIN clients c ON o.client_id = c.id
       JOIN vehicles v ON o.vehicle_id = v.id
       LEFT JOIN order_assignments oa ON o.id = oa.order_id
       LEFT JOIN users u ON oa.user_id = u.id
       GROUP BY o.id, c.full_name, v.brand, v.model, v.plate_number
       ORDER BY o.created_at DESC`
    : `SELECT o.*,
        c.full_name as client_name,
        v.brand as vehicle_brand,
        v.model as vehicle_model,
        v.plate_number,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT('id', u.id, 'name', u.name)
          ) FILTER (WHERE u.id IS NOT NULL),
          '[]'
        ) as assigned_users
       FROM orders o
       JOIN clients c ON o.client_id = c.id
       JOIN vehicles v ON o.vehicle_id = v.id
       LEFT JOIN order_assignments oa ON o.id = oa.order_id
       LEFT JOIN users u ON oa.user_id = u.id
       WHERE o.id IN (
         SELECT order_id FROM order_assignments WHERE user_id = $1
       )
       GROUP BY o.id, c.full_name, v.brand, v.model, v.plate_number
       ORDER BY o.created_at DESC`;

  const result = role === 'admin'
    ? await pool.query(query)
    : await pool.query(query, [userId]);

  return result.rows;
};

const getOrderById = async (id) => {
  const result = await pool.query(
    `SELECT o.*,
      c.full_name as client_name,
      c.phone as client_phone,
      c.email as client_email,
      v.brand as vehicle_brand,
      v.model as vehicle_model,
      v.plate_number,
      v.year as vehicle_year,
      v.color as vehicle_color,
      v.vin as vehicle_vin,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT('id', u.id, 'name', u.name)
        ) FILTER (WHERE u.id IS NOT NULL),
        '[]'
      ) as assigned_users
     FROM orders o
     JOIN clients c ON o.client_id = c.id
     JOIN vehicles v ON o.vehicle_id = v.id
     LEFT JOIN order_assignments oa ON o.id = oa.order_id
     LEFT JOIN users u ON oa.user_id = u.id
     WHERE o.id = $1
     GROUP BY o.id, c.full_name, c.phone, c.email, v.brand, v.model, v.plate_number, v.year, v.color, v.vin`,
    [id]
  );
  return result.rows[0];
};

const isAssigned = async (orderId, userId) => {
  const result = await pool.query(
    'SELECT id FROM order_assignments WHERE order_id = $1 AND user_id = $2',
    [orderId, userId]
  );
  return result.rows.length > 0;
};

const createOrder = async ({ client_id, vehicle_id, service_name, service_description, date_from, date_to, price, status, notes, is_paid, paid_cash, paid_card }) => {
  const result = await pool.query(
    `INSERT INTO orders (client_id, vehicle_id, service_name, service_description, date_from, date_to, price, status, notes, is_paid, paid_cash, paid_card)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [client_id, vehicle_id, service_name, service_description, date_from, date_to, price, status || 'inspection', notes, is_paid || false, paid_cash || 0, paid_card || 0]
  );
  return result.rows[0];
};

const updateOrder = async (id, { client_id, vehicle_id, service_name, service_description, date_from, date_to, price, status, notes, is_paid, paid_cash, paid_card }) => {
  const result = await pool.query(
    `UPDATE orders
     SET client_id = $1, vehicle_id = $2, service_name = $3, service_description = $4,
         date_from = $5, date_to = $6, price = $7, status = $8, notes = $9,
         is_paid = $10, paid_cash = $11, paid_card = $12
     WHERE id = $13
     RETURNING *`,
    [client_id, vehicle_id, service_name, service_description, date_from, date_to, price, status, notes, is_paid || false, paid_cash || 0, paid_card || 0, id]
  );
  return result.rows[0];
};

const updateOrderStatus = async (id, status) => {
  const result = await pool.query(
    `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return result.rows[0];
};

const deleteOrder = async (id) => {
  await pool.query('DELETE FROM orders WHERE id = $1', [id]);
};

const searchOrders = async (query, userId, role) => {
  const term = `%${query}%`;
  const baseQuery = `
    SELECT o.*,
      c.full_name as client_name,
      v.brand as vehicle_brand,
      v.model as vehicle_model,
      v.plate_number,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT('id', u.id, 'name', u.name)
        ) FILTER (WHERE u.id IS NOT NULL),
        '[]'
      ) as assigned_users
     FROM orders o
     JOIN clients c ON o.client_id = c.id
     JOIN vehicles v ON o.vehicle_id = v.id
     LEFT JOIN order_assignments oa ON o.id = oa.order_id
     LEFT JOIN users u ON oa.user_id = u.id
     WHERE (c.full_name ILIKE $1
       OR v.brand ILIKE $1
       OR v.model ILIKE $1
       OR v.plate_number ILIKE $1
       OR o.service_name ILIKE $1)
     ${role !== 'admin' ? 'AND o.id IN (SELECT order_id FROM order_assignments WHERE user_id = $2)' : ''}
     GROUP BY o.id, c.full_name, v.brand, v.model, v.plate_number
     ORDER BY o.created_at DESC`;

  const result = role === 'admin'
    ? await pool.query(baseQuery, [term])
    : await pool.query(baseQuery, [term, userId]);

  return result.rows;
};

module.exports = {
  getAllOrders,
  getOrderById,
  isAssigned,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  searchOrders,
};