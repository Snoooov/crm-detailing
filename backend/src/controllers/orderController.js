const orderModel = require('../models/orderModel');
const vehicleModel = require('../models/vehicleModel');

const VALID_STATUSES = ['inspection', 'planned', 'in_progress', 'done', 'released', 'cancelled'];

const getOrders = async (req, res) => {
  try {
    const { search } = req.query;
    const orders = search
      ? await orderModel.searchOrders(search)
      : await orderModel.getAllOrders();
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

const getOrder = async (req, res) => {
  try {
    const order = await orderModel.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Zlecenie nie znalezione' });
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

const createOrder = async (req, res) => {
  try {
    const { client_id, vehicle_id, service_name, service_description, date_from, date_to, price, status, notes, is_paid, paid_cash, paid_card } = req.body;

    if (!client_id || !vehicle_id || !service_name) {
      return res.status(400).json({ error: 'Klient, pojazd i nazwa usługi są wymagane' });
    }

    const vehicle = await vehicleModel.getVehicleById(vehicle_id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Pojazd nie znaleziony' });
    }
    if (vehicle.client_id !== parseInt(client_id)) {
      return res.status(400).json({ error: 'Pojazd nie należy do tego klienta' });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Nieprawidłowy status' });
    }

    const order = await orderModel.createOrder({
      client_id, vehicle_id, service_name, service_description,
      date_from, date_to, price, status, notes,
      is_paid, paid_cash, paid_card
    });
    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

const updateOrder = async (req, res) => {
  try {
    const { client_id, vehicle_id, service_name, service_description, date_from, date_to, price, status, notes, is_paid, paid_cash, paid_card } = req.body;

    if (!client_id || !vehicle_id || !service_name) {
      return res.status(400).json({ error: 'Klient, pojazd i nazwa usługi są wymagane' });
    }

    const vehicle = await vehicleModel.getVehicleById(vehicle_id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Pojazd nie znaleziony' });
    }
    if (vehicle.client_id !== parseInt(client_id)) {
      return res.status(400).json({ error: 'Pojazd nie należy do tego klienta' });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Nieprawidłowy status' });
    }

    const order = await orderModel.updateOrder(req.params.id, {
      client_id, vehicle_id, service_name, service_description,
      date_from, date_to, price, status, notes,
      is_paid, paid_cash, paid_card
    });
    if (!order) return res.status(404).json({ error: 'Zlecenie nie znalezione' });
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Nieprawidłowy status' });
    }

    const order = await orderModel.updateOrderStatus(req.params.id, status);
    if (!order) return res.status(404).json({ error: 'Zlecenie nie znalezione' });
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const order = await orderModel.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Zlecenie nie znalezione' });
    await orderModel.deleteOrder(req.params.id);
    res.json({ message: 'Zlecenie usunięte' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

module.exports = { getOrders, getOrder, createOrder, updateOrder, updateStatus, deleteOrder };