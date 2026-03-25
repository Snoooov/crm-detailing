const vehicleModel = require('../models/vehicleModel');
const clientModel = require('../models/clientModel');

const getVehicles = async (req, res) => {
  try {
    const { search, client_id } = req.query;
    let vehicles;
    if (search) {
      vehicles = await vehicleModel.searchVehicles(search);
    } else if (client_id) {
      vehicles = await vehicleModel.getVehiclesByClient(client_id);
    } else {
      vehicles = await vehicleModel.getAllVehicles();
    }
    res.json(vehicles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

const getVehicle = async (req, res) => {
  try {
    const vehicle = await vehicleModel.getVehicleById(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Pojazd nie znaleziony' });
    res.json(vehicle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

const createVehicle = async (req, res) => {
  try {
    const { client_id, brand, model, year, color, vin, plate_number } = req.body;

    if (!client_id || !brand || !model) {
      return res.status(400).json({ error: 'Klient, marka i model są wymagane' });
    }

    const client = await clientModel.getClientById(client_id);
    if (!client) return res.status(404).json({ error: 'Klient nie znaleziony' });

    const vehicle = await vehicleModel.createVehicle({ client_id, brand, model, year, color, vin, plate_number });
    res.status(201).json(vehicle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

const updateVehicle = async (req, res) => {
  try {
    const { brand, model, year, color, vin, plate_number } = req.body;

    if (!brand || !model) {
      return res.status(400).json({ error: 'Marka i model są wymagane' });
    }

    const vehicle = await vehicleModel.updateVehicle(req.params.id, { brand, model, year, color, vin, plate_number });
    if (!vehicle) return res.status(404).json({ error: 'Pojazd nie znaleziony' });
    res.json(vehicle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await vehicleModel.getVehicleById(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Pojazd nie znaleziony' });
    await vehicleModel.deleteVehicle(req.params.id);
    res.json({ message: 'Pojazd usunięty' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

module.exports = { getVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle };