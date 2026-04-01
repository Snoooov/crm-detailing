const orderModel = require('../models/orderModel');
const vehicleModel = require('../models/vehicleModel');
const { sendOrderEmail } = require('../services/emailService');

const VALID_STATUSES = ['inspection', 'planned', 'in_progress', 'done', 'released', 'cancelled'];

const getOrders = async (req, res) => {
  try {
    const { search } = req.query;
    const orders = search
      ? await orderModel.searchOrders(search, req.user.id, req.user.role)
      : await orderModel.getAllOrders(req.user.id, req.user.role);
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

    if (req.user.role !== 'admin') {
      const assigned = await orderModel.isAssigned(req.params.id, req.user.id);
      if (!assigned) return res.status(403).json({ error: 'Brak dostępu do tego zlecenia' });
    }

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
    if (!vehicle) return res.status(404).json({ error: 'Pojazd nie znaleziony' });
    if (vehicle.client_id !== parseInt(client_id)) {
      return res.status(400).json({ error: 'Pojazd nie należy do tego klienta' });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Nieprawidłowy status' });
    }

    const order = await orderModel.createOrder({ client_id, vehicle_id, service_name, service_description, date_from, date_to, price, status, notes, is_paid, paid_cash, paid_card });

    // Jeśli pracownik tworzy zlecenie — automatycznie przypisz go do zlecenia
    if (req.user.role !== 'admin') {
      const pool = require('../config/db');
      await pool.query(
        'INSERT INTO order_assignments (order_id, user_id) VALUES ($1, $2)',
        [order.id, req.user.id]
      );
    }

    // Wyślij potwierdzenie rezerwacji
    try {
      const pool = require('../config/db');
      const orderDetails = await pool.query(
        `SELECT o.*, c.full_name as client_name, c.email as client_email,
                v.brand as vehicle_brand, v.model as vehicle_model, v.plate_number
        FROM orders o
        JOIN clients c ON o.client_id = c.id
        JOIN vehicles v ON o.vehicle_id = v.id
        WHERE o.id = $1`,
        [order.id]
      );
      if (orderDetails.rows[0]) {
        await sendOrderEmail(orderDetails.rows[0], 'confirmation');
      }
    } catch (emailErr) {
      console.error('Błąd wysyłania maila potwierdzającego:', emailErr);
    }
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

    if (req.user.role !== 'admin') {
      const assigned = await orderModel.isAssigned(req.params.id, req.user.id);
      if (!assigned) return res.status(403).json({ error: 'Brak dostępu do tego zlecenia' });
    }

    const vehicle = await vehicleModel.getVehicleById(vehicle_id);
    if (!vehicle) return res.status(404).json({ error: 'Pojazd nie znaleziony' });
    if (vehicle.client_id !== parseInt(client_id)) {
      return res.status(400).json({ error: 'Pojazd nie należy do tego klienta' });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Nieprawidłowy status' });
    }

    const order = await orderModel.updateOrder(req.params.id, { client_id, vehicle_id, service_name, service_description, date_from, date_to, price, status, notes, is_paid, paid_cash, paid_card });
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

    if (req.user.role !== 'admin') {
      const assigned = await orderModel.isAssigned(req.params.id, req.user.id);
      if (!assigned) return res.status(403).json({ error: 'Brak dostępu do tego zlecenia' });
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
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Tylko administrator może usuwać zlecenia' });
    }

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