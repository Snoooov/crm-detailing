const orderModel = require('../models/orderModel');
const vehicleModel = require('../models/vehicleModel');
const { sendOrderEmail } = require('../services/emailService');
const pool = require('../config/db');

const VALID_STATUSES = ['inspection', 'planned', 'in_progress', 'done', 'released', 'cancelled'];

const TRACKED_FIELDS = [
  { key: 'status', label: 'Status' },
  { key: 'service_name', label: 'Usługa' },
  { key: 'price', label: 'Cena' },
  { key: 'date_from', label: 'Data od' },
  { key: 'date_to', label: 'Data do' },
  { key: 'is_paid', label: 'Opłacone' },
  { key: 'paid_cash', label: 'Gotówka' },
  { key: 'paid_card', label: 'Karta' },
  { key: 'invoice_number', label: 'Nr faktury' },
  { key: 'notes', label: 'Notatki' },
];

const diffChanges = (oldOrder, newData) => {
  const changes = [];
  for (const { key, label } of TRACKED_FIELDS) {
    const oldVal = oldOrder[key] === null ? '' : String(oldOrder[key] ?? '');
    const newVal = newData[key] === null || newData[key] === undefined ? '' : String(newData[key]);
    if (oldVal !== newVal) {
      changes.push({ field: label, from: oldVal, to: newVal });
    }
  }
  return changes;
};

const getOrders = async (req, res) => {
  try {
    const { search, date_from, date_to } = req.query;
    const orders = search
      ? await orderModel.searchOrders(search, req.user.id, req.user.role)
      : await orderModel.getAllOrders(req.user.id, req.user.role, date_from || null, date_to || null);
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

    if (!['admin', 'manager'].includes(req.user.role)) {
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
    const { client_id, vehicle_id, service_catalog_id, service_name, service_description, date_from, date_to, price, status, notes, is_paid, paid_cash, paid_card, invoice_number } = req.body;

    if (!client_id || !vehicle_id || !service_name) {
      return res.status(400).json({ error: 'Klient, pojazd i nazwa usługi są wymagane' });
    }

    if (date_from && date_to && date_to < date_from) {
      return res.status(400).json({ error: 'Data do nie może być wcześniejsza niż data od' });
    }

    if (price !== undefined && price !== '' && (isNaN(parseFloat(price)) || parseFloat(price) < 0)) {
      return res.status(400).json({ error: 'Nieprawidłowa cena' });
    }

    if ((paid_cash !== undefined && parseFloat(paid_cash) < 0) || (paid_card !== undefined && parseFloat(paid_card) < 0)) {
      return res.status(400).json({ error: 'Kwoty płatności nie mogą być ujemne' });
    }

    const vehicle = await vehicleModel.getVehicleById(vehicle_id);
    if (!vehicle) return res.status(404).json({ error: 'Pojazd nie znaleziony' });
    if (vehicle.client_id !== parseInt(client_id)) {
      return res.status(400).json({ error: 'Pojazd nie należy do tego klienta' });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Nieprawidłowy status' });
    }

    const order = await orderModel.createOrder({ client_id, vehicle_id, service_catalog_id, service_name, service_description, date_from, date_to, price, status, notes, is_paid, paid_cash, paid_card, invoice_number });

    if (req.user.role !== 'admin') {
      // pool imported at top
      await pool.query('INSERT INTO order_assignments (order_id, user_id) VALUES ($1, $2)', [order.id, req.user.id]);
    }

    try {
      // pool imported at top
      const orderDetails = await pool.query(
        `SELECT o.*, c.full_name as client_name, c.email as client_email,
                v.brand as vehicle_brand, v.model as vehicle_model, v.plate_number
         FROM orders o JOIN clients c ON o.client_id = c.id JOIN vehicles v ON o.vehicle_id = v.id
         WHERE o.id = $1`,
        [order.id]
      );
      if (orderDetails.rows[0]) await sendOrderEmail(orderDetails.rows[0], 'confirmation');
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
    const { client_id, vehicle_id, service_catalog_id, service_name, service_description, date_from, date_to, price, status, notes, is_paid, paid_cash, paid_card, invoice_number } = req.body;

    if (!client_id || !vehicle_id || !service_name) {
      return res.status(400).json({ error: 'Klient, pojazd i nazwa usługi są wymagane' });
    }

    if (date_from && date_to && date_to < date_from) {
      return res.status(400).json({ error: 'Data do nie może być wcześniejsza niż data od' });
    }

    if (price !== undefined && price !== '' && (isNaN(parseFloat(price)) || parseFloat(price) < 0)) {
      return res.status(400).json({ error: 'Nieprawidłowa cena' });
    }

    if ((paid_cash !== undefined && parseFloat(paid_cash) < 0) || (paid_card !== undefined && parseFloat(paid_card) < 0)) {
      return res.status(400).json({ error: 'Kwoty płatności nie mogą być ujemne' });
    }

    if (!['admin', 'manager'].includes(req.user.role)) {
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

    const oldOrder = await orderModel.getOrderById(req.params.id);
    if (!oldOrder) return res.status(404).json({ error: 'Zlecenie nie znalezione' });

    const order = await orderModel.updateOrder(req.params.id, { client_id, vehicle_id, service_catalog_id, service_name, service_description, date_from, date_to, price, status, notes, is_paid, paid_cash, paid_card, invoice_number });

    const changes = diffChanges(oldOrder, { ...req.body, is_paid: is_paid || false, paid_cash: paid_cash || 0, paid_card: paid_card || 0 });
    await orderModel.logHistory(req.params.id, req.user.id, req.user.name, changes);

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

    if (!['admin', 'manager'].includes(req.user.role)) {
      const assigned = await orderModel.isAssigned(req.params.id, req.user.id);
      if (!assigned) return res.status(403).json({ error: 'Brak dostępu do tego zlecenia' });
    }

    const oldOrder = await orderModel.getOrderById(req.params.id);
    if (!oldOrder) return res.status(404).json({ error: 'Zlecenie nie znalezione' });

    const order = await orderModel.updateOrderStatus(req.params.id, status);

    await orderModel.logHistory(req.params.id, req.user.id, req.user.name, [
      { field: 'Status', from: oldOrder.status, to: status }
    ]);

    if (status === 'done') {
      try {
        // pool imported at top
        const orderDetails = await pool.query(
          `SELECT o.*, c.full_name as client_name, c.email as client_email,
                  v.brand as vehicle_brand, v.model as vehicle_model, v.plate_number
           FROM orders o JOIN clients c ON o.client_id = c.id JOIN vehicles v ON o.vehicle_id = v.id
           WHERE o.id = $1`,
          [req.params.id]
        );
        if (orderDetails.rows[0]?.client_email) {
          await sendOrderEmail(orderDetails.rows[0], 'ready');
        }
      } catch (emailErr) {
        console.error('Błąd wysyłania maila o gotowości:', emailErr);
      }
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

const deleteOrder = async (req, res) => {
  try {
    if (!['admin'].includes(req.user.role)) {
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

const getOrderHistory = async (req, res) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Brak dostępu' });
    }
    const history = await orderModel.getOrderHistory(req.params.id);
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

const exportOrdersCsv = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Brak dostępu' });
    }

    const { date_from, date_to, status } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    let idx = 1;

    if (date_from) { where += ` AND o.date_from >= $${idx++}`; params.push(date_from); }
    if (date_to) { where += ` AND o.date_from <= $${idx++}`; params.push(date_to); }
    if (status) { where += ` AND o.status = $${idx++}`; params.push(status); }

    const result = await require('../config/db').query(
      `SELECT o.id, o.service_name, o.status, o.date_from, o.date_to, o.price,
              o.is_paid, o.paid_cash, o.paid_card, o.invoice_number, o.created_at,
              c.full_name as client_name, c.phone, c.email, c.nip,
              v.brand, v.model, v.plate_number
       FROM orders o
       JOIN clients c ON o.client_id = c.id
       JOIN vehicles v ON o.vehicle_id = v.id
       ${where}
       ORDER BY o.date_from DESC`,
      params
    );

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('pl-PL') : '';
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

    const headers = ['ID','Klient','Telefon','Email','NIP','Pojazd','Rejestracja','Usługa','Status','Data od','Data do','Cena','Opłacone','Gotówka','Karta','Nr faktury','Utworzone'];
    const rows = result.rows.map(r => [
      r.id, r.client_name, r.phone, r.email, r.nip,
      `${r.brand} ${r.model}`, r.plate_number, r.service_name, r.status,
      formatDate(r.date_from), formatDate(r.date_to), r.price,
      r.is_paid ? 'Tak' : 'Nie', r.paid_cash, r.paid_card,
      r.invoice_number, formatDate(r.created_at),
    ].map(esc).join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="zlecenia-${Date.now()}.csv"`);
    res.send('\uFEFF' + csv); // BOM dla Excel
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

module.exports = { getOrders, getOrder, createOrder, updateOrder, updateStatus, deleteOrder, getOrderHistory, exportOrdersCsv };
