const pool = require('../config/db');

const getAllOrders = async () => {
  const result = await pool.query(
    `SELECT o.*, 
      c.full_name as client_name,
      v.brand as vehicle_brand,
      v.model as vehicle_model,
      v.plate_number
     FROM orders o
     JOIN clients c ON o.client_id = c.id
     JOIN vehicles v ON o.vehicle_id = v.id
     ORDER BY o.created_at DESC`
  );
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
      v.vin as vehicle_vin
     FROM orders o
     JOIN clients c ON o.client_id = c.id
     JOIN vehicles v ON o.vehicle_id = v.id
     WHERE o.id = $1`,
    [id]
  );
  return result.rows[0];
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

const searchOrders = async (query) => {
  const result = await pool.query(
    `SELECT o.*,
      c.full_name as client_name,
      v.brand as vehicle_brand,
      v.model as vehicle_model,
      v.plate_number
     FROM orders o
     JOIN clients c ON o.client_id = c.id
     JOIN vehicles v ON o.vehicle_id = v.id
     WHERE c.full_name ILIKE $1 
       OR v.brand ILIKE $1 
       OR v.model ILIKE $1 
       OR v.plate_number ILIKE $1
       OR o.service_name ILIKE $1
     ORDER BY o.created_at DESC`,
    [`%${query}%`]
  );
  return result.rows;
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  searchOrders,
};