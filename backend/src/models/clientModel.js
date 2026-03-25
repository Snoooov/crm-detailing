const pool = require('../config/db');

const getAllClients = async () => {
  const result = await pool.query(
    'SELECT * FROM clients ORDER BY created_at DESC'
  );
  return result.rows;
};

const getClientById = async (id) => {
  const result = await pool.query(
    'SELECT * FROM clients WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

const getClientWithDetails = async (id) => {
  const client = await pool.query(
    'SELECT * FROM clients WHERE id = $1',
    [id]
  );
  const vehicles = await pool.query(
    'SELECT * FROM vehicles WHERE client_id = $1 ORDER BY created_at DESC',
    [id]
  );
  const orders = await pool.query(
    `SELECT o.*, v.brand, v.model, v.plate_number 
     FROM orders o
     JOIN vehicles v ON o.vehicle_id = v.id
     WHERE o.client_id = $1
     ORDER BY o.created_at DESC`,
    [id]
  );
  return {
    ...client.rows[0],
    vehicles: vehicles.rows,
    orders: orders.rows,
  };
};

const createClient = async ({ full_name, phone, email, nip, status }) => {
  const result = await pool.query(
    `INSERT INTO clients (full_name, phone, email, nip, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [full_name, phone, email, nip, status || 'normal']
  );
  return result.rows[0];
};

const updateClient = async (id, { full_name, phone, email, nip, status }) => {
  const result = await pool.query(
    `UPDATE clients
     SET full_name = $1, phone = $2, email = $3, nip = $4, status = $5
     WHERE id = $6
     RETURNING *`,
    [full_name, phone, email, nip, status, id]
  );
  return result.rows[0];
};

const deleteClient = async (id) => {
  await pool.query('DELETE FROM clients WHERE id = $1', [id]);
};

const searchClients = async (query) => {
  const result = await pool.query(
    `SELECT * FROM clients
     WHERE full_name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1
     ORDER BY full_name`,
    [`%${query}%`]
  );
  return result.rows;
};

module.exports = {
  getAllClients,
  getClientById,
  getClientWithDetails,
  createClient,
  updateClient,
  deleteClient,
  searchClients,
};