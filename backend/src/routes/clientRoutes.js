const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} = require('../controllers/clientController');

router.get('/', auth, getClients);
router.get('/:id', auth, getClient);
router.post('/', auth, createClient);
router.put('/:id', auth, updateClient);
router.delete('/:id', auth, deleteClient);

module.exports = router;