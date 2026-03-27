const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const orderModel = require('../models/orderModel');
const { generateReceptionCardPDF } = require('../services/pdfService');

router.get('/orders/:id/reception', auth, async (req, res) => {
  try {
    const order = await orderModel.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Zlecenie nie znalezione' });

    const pdf = await generateReceptionCardPDF(order);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="karta-przyjecia-${order.id}.pdf"`);
    res.send(pdf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd generowania PDF' });
  }
});

module.exports = router;