const pool = require('../config/db');

const ORDER_JOINS = `
  FROM orders o
  JOIN clients c ON o.client_id = c.id
  JOIN vehicles v ON o.vehicle_id = v.id
  LEFT JOIN order_assignments oa ON o.id = oa.order_id
  LEFT JOIN users u ON oa.user_id = u.id
`;

const ORDER_SELECT = `
  SELECT o.*,
    c.full_name as client_name,
    c.nip as client_nip,
    v.brand as vehicle_brand,
    v.model as vehicle_model,
    v.plate_number,
    COALESCE(
      JSON_AGG(JSON_BUILD_OBJECT('id', u.id, 'name', u.name))
      FILTER (WHERE u.id IS NOT NULL), '[]'
    ) as assigned_users
`;

const getAllOrders = async (userId, role, dateFrom = null, dateTo = null) => {
  const params = [];
  let idx = 1;

  const isPrivileged = ['admin', 'manager'].includes(role);
  let where = !isPrivileged
    ? `WHERE o.id IN (SELECT order_id FROM order_assignments WHERE user_id = $${idx++})`
    : 'WHERE 1=1';

  if (!isPrivileged) params.push(userId);

  if (dateFrom) {
    where += ` AND o.date_to >= $${idx++}`;
    params.push(dateFrom);
  }
  if (dateTo) {
    where += ` AND o.date_from <= $${idx++}`;
    params.push(dateTo);
  }

  const query = `
    ${ORDER_SELECT}
    ${ORDER_JOINS}
    ${where}
    GROUP BY o.id, c.full_name, c.nip, v.brand, v.model, v.plate_number
    ORDER BY o.created_at DESC
  `;

  const result = await pool.query(query, params);
  return result.rows;
};

const getOrderById = async (id) => {
  const result = await pool.query(
    `SELECT o.*,
      c.full_name as client_name,
      c.phone as client_phone,
      c.email as client_email,
      c.nip as client_nip,
      v.brand as vehicle_brand,
      v.model as vehicle_model,
      v.plate_number,
      v.year as vehicle_year,
      v.color as vehicle_color,
      v.vin as vehicle_vin,
      COALESCE(
        JSON_AGG(JSON_BUILD_OBJECT('id', u.id, 'name', u.name))
        FILTER (WHERE u.id IS NOT NULL), '[]'
      ) as assigned_users
     FROM orders o
     JOIN clients c ON o.client_id = c.id
     JOIN vehicles v ON o.vehicle_id = v.id
     LEFT JOIN order_assignments oa ON o.id = oa.order_id
     LEFT JOIN users u ON oa.user_id = u.id
     WHERE o.id = $1
     GROUP BY o.id, c.full_name, c.phone, c.email, c.nip,
              v.brand, v.model, v.plate_number, v.year, v.color, v.vin`,
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

const createOrder = async ({ client_id, vehicle_id, service_catalog_id, service_name, service_description, date_from, date_to, price, status, notes, is_paid, paid_cash, paid_card, invoice_number }) => {
  const result = await pool.query(
    `INSERT INTO orders (client_id, vehicle_id, service_catalog_id, service_name, service_description, date_from, date_to, price, status, notes, is_paid, paid_cash, paid_card, invoice_number)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING *`,
    [client_id, vehicle_id, service_catalog_id || null, service_name, service_description, date_from, date_to, price, status || 'inspection', notes, is_paid || false, paid_cash || 0, paid_card || 0, invoice_number || null]
  );
  return result.rows[0];
};

const updateOrder = async (id, { client_id, vehicle_id, service_catalog_id, service_name, service_description, date_from, date_to, price, status, notes, is_paid, paid_cash, paid_card, invoice_number }) => {
  const result = await pool.query(
    `UPDATE orders
     SET client_id = $1, vehicle_id = $2, service_catalog_id = $3, service_name = $4,
         service_description = $5, date_from = $6, date_to = $7, price = $8,
         status = $9, notes = $10, is_paid = $11, paid_cash = $12, paid_card = $13,
         invoice_number = $14
     WHERE id = $15
     RETURNING *`,
    [client_id, vehicle_id, service_catalog_id || null, service_name, service_description, date_from, date_to, price, status, notes, is_paid || false, paid_cash || 0, paid_card || 0, invoice_number || null, id]
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
  const params = [term];
  let employeeFilter = '';
  if (!['admin', 'manager'].includes(role)) {
    params.push(userId);
    employeeFilter = `AND o.id IN (SELECT order_id FROM order_assignments WHERE user_id = $2)`;
  }

  const result = await pool.query(`
    ${ORDER_SELECT}
    ${ORDER_JOINS}
    WHERE (c.full_name ILIKE $1
      OR v.brand ILIKE $1
      OR v.model ILIKE $1
      OR v.plate_number ILIKE $1
      OR o.service_name ILIKE $1)
    ${employeeFilter}
    GROUP BY o.id, c.full_name, c.nip, v.brand, v.model, v.plate_number
    ORDER BY o.created_at DESC
  `, params);

  return result.rows;
};

const logHistory = async (orderId, userId, userName, changes) => {
  if (!changes.length) return;
  await pool.query(
    `INSERT INTO order_history (order_id, user_id, user_name, changes) VALUES ($1, $2, $3, $4)`,
    [orderId, userId, userName, JSON.stringify(changes)]
  );
};

const getOrderHistory = async (orderId) => {
  const result = await pool.query(
    `SELECT * FROM order_history WHERE order_id = $1 ORDER BY changed_at DESC`,
    [orderId]
  );
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
  logHistory,
  getOrderHistory,
};
