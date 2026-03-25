const pool = require('../config/db');

const getAllVehicles = async () => {
  const result = await pool.query(
    `SELECT v.*, c.full_name as client_name
     FROM vehicles v
     JOIN clients c ON v.client_id = c.id
     ORDER BY v.created_at DESC`
  );
  return result.rows;
};

const getVehicleById = async (id) => {
  const result = await pool.query(
    `SELECT v.*, c.full_name as client_name
     FROM vehicles v
     JOIN clients c ON v.client_id = c.id
     WHERE v.id = $1`,
    [id]
  );
  return result.rows[0];
};

const getVehiclesByClient = async (client_id) => {
  const result = await pool.query(
    'SELECT * FROM vehicles WHERE client_id = $1 ORDER BY created_at DESC',
    [client_id]
  );
  return result.rows;
};

const createVehicle = async ({ client_id, brand, model, year, color, vin, plate_number }) => {
  const result = await pool.query(
    `INSERT INTO vehicles (client_id, brand, model, year, color, vin, plate_number)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [client_id, brand, model, year, color, vin, plate_number]
  );
  return result.rows[0];
};

const updateVehicle = async (id, { brand, model, year, color, vin, plate_number }) => {
  const result = await pool.query(
    `UPDATE vehicles
     SET brand = $1, model = $2, year = $3, color = $4, vin = $5, plate_number = $6
     WHERE id = $7
     RETURNING *`,
    [brand, model, year, color, vin, plate_number, id]
  );
  return result.rows[0];
};

const deleteVehicle = async (id) => {
  await pool.query('DELETE FROM vehicles WHERE id = $1', [id]);
};

const searchVehicles = async (query) => {
  const result = await pool.query(
    `SELECT v.*, c.full_name as client_name
     FROM vehicles v
     JOIN clients c ON v.client_id = c.id
     WHERE v.brand ILIKE $1 OR v.model ILIKE $1 OR v.plate_number ILIKE $1 OR v.vin ILIKE $1
     ORDER BY v.brand`,
    [`%${query}%`]
  );
  return result.rows;
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  getVehiclesByClient,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  searchVehicles,
};