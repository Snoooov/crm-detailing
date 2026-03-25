const clientModel = require('../models/clientModel');

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
    await clientModel.deleteClient(req.params.id);
    res.json({ message: 'Klient usunięty' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

module.exports = { getClients, getClient, createClient, updateClient, deleteClient };