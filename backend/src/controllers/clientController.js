const clientModel = require('../models/clientModel');
const { logAction } = require('../utils/systemLog');
const getIp = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;

const getClients = async (req, res) => {
  try {
    const { search } = req.query;
    const clients = search
      ? await clientModel.searchClients(search)
      : await clientModel.getAllClients();
    res.json(clients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

const getClient = async (req, res) => {
  try {
    const client = await clientModel.getClientWithDetails(req.params.id);
    if (!client) return res.status(404).json({ error: 'Klient nie znaleziony' });
    res.json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

const createClient = async (req, res) => {
  try {
    const { full_name, phone, email, nip, status } = req.body;
    if (!full_name) {
      return res.status(400).json({ error: 'Imię i nazwisko jest wymagane' });
    }
    const client = await clientModel.createClient({ full_name, phone, email, nip, status });
    await logAction({ userId: req.user.id, userName: req.user.name, action: 'client_created', entityType: 'client', entityId: client.id, details: { full_name, phone, email }, ipAddress: getIp(req) });
    res.status(201).json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

const updateClient = async (req, res) => {
  try {
    const { full_name, phone, email, nip, status } = req.body;
    if (!full_name) {
      return res.status(400).json({ error: 'Imię i nazwisko jest wymagane' });
    }
    const client = await clientModel.updateClient(req.params.id, { full_name, phone, email, nip, status });
    if (!client) return res.status(404).json({ error: 'Klient nie znaleziony' });
    await logAction({ userId: req.user.id, userName: req.user.name, action: 'client_updated', entityType: 'client', entityId: parseInt(req.params.id), details: { full_name, phone, email }, ipAddress: getIp(req) });
    res.json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

const deleteClient = async (req, res) => {
  try {
    const client = await clientModel.getClientById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Klient nie znaleziony' });
    const pool = require('../config/db');
    const countResult = await pool.query('SELECT COUNT(*) FROM orders WHERE client_id = $1', [req.params.id]);
    const orderCount = parseInt(countResult.rows[0].count);
    if (orderCount > 0) {
      return res.status(409).json({ error: `Nie można usunąć klienta — ma ${orderCount} ${orderCount === 1 ? 'zlecenie' : orderCount < 5 ? 'zlecenia' : 'zleceń'}. Usuń najpierw zlecenia.`, orderCount });
    }
    await clientModel.deleteClient(req.params.id);
    await logAction({ userId: req.user.id, userName: req.user.name, action: 'client_deleted', entityType: 'client', entityId: parseInt(req.params.id), details: { full_name: client.full_name }, ipAddress: getIp(req) });
    res.json({ message: 'Klient usunięty' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

module.exports = { getClients, getClient, createClient, updateClient, deleteClient };