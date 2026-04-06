const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const pool = require('../config/db');
const { logAction } = require('../utils/systemLog');
const orderModel = require('../models/orderModel');
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  updateStatus,
  deleteOrder,
  getOrderHistory,
  exportOrdersCsv,
} = require('../controllers/orderController');

const getIp = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;

const DAMAGE_TYPE_LABELS = { scratch: 'Zarysowanie', dent: 'Wgniecenie', other: 'Inne' };

router.get('/export/csv', auth, exportOrdersCsv);
router.get('/', auth, getOrders);
router.get('/:id', auth, getOrder);
router.get('/:id/history', auth, getOrderHistory);
router.post('/', auth, createOrder);
router.put('/:id/damage', auth, async (req, res) => {
  try {
    const { damage_map } = req.body;
    const newPoints = Array.isArray(damage_map) ? damage_map : [];
    const orderId = parseInt(req.params.id);

    // Pobierz stary stan mapy przed zapisem
    const oldResult = await pool.query('SELECT damage_map FROM orders WHERE id = $1', [orderId]);
    if (!oldResult.rows[0]) return res.status(404).json({ error: 'Zlecenie nie znalezione' });

    const oldRaw = oldResult.rows[0].damage_map;
    const oldPoints = Array.isArray(oldRaw) ? oldRaw : (typeof oldRaw === 'string' ? JSON.parse(oldRaw) : []);

    await pool.query('UPDATE orders SET damage_map = $1 WHERE id = $2', [JSON.stringify(newPoints), orderId]);

    // Oblicz różnicę: dodane/usunięte punkty
    const added   = newPoints.filter(np => !oldPoints.some(op => op.id === np.id));
    const removed = oldPoints.filter(op => !newPoints.some(np => np.id === op.id));
    const changed = newPoints.filter(np => {
      const op = oldPoints.find(o => o.id === np.id);
      return op && (op.type !== np.type || op.note !== np.note);
    });

    const historyChanges = [];
    if (added.length > 0) {
      historyChanges.push({
        field: 'Mapa uszkodzeń',
        from: '',
        to: `Dodano ${added.length} punkt${added.length === 1 ? '' : added.length < 5 ? 'y' : 'ów'}: ${added.map((p, i) => `#${oldPoints.length + i + 1} ${DAMAGE_TYPE_LABELS[p.type] || p.type}`).join(', ')}`,
      });
    }
    if (removed.length > 0) {
      historyChanges.push({
        field: 'Mapa uszkodzeń',
        from: `Usunięto ${removed.length} punkt${removed.length === 1 ? '' : removed.length < 5 ? 'y' : 'ów'}: ${removed.map(p => DAMAGE_TYPE_LABELS[p.type] || p.type).join(', ')}`,
        to: '',
      });
    }
    if (changed.length > 0) {
      historyChanges.push({
        field: 'Mapa uszkodzeń',
        from: '',
        to: `Zmieniono ${changed.length} punkt${changed.length === 1 ? '' : changed.length < 5 ? 'y' : 'ów'}`,
      });
    }
    if (oldPoints.length === 0 && newPoints.length === 0) {
      // nic się nie zmieniło — nie loguj
    } else if (historyChanges.length === 0 && oldPoints.length !== newPoints.length) {
      historyChanges.push({
        field: 'Mapa uszkodzeń',
        from: `${oldPoints.length} punktów`,
        to: `${newPoints.length} punktów`,
      });
    }

    if (historyChanges.length > 0) {
      await orderModel.logHistory(orderId, req.user.id, req.user.name, historyChanges);
    }

    await logAction({
      userId: req.user.id,
      userName: req.user.name,
      action: 'damage_map_updated',
      entityType: 'order',
      entityId: orderId,
      details: {
        added: added.length,
        removed: removed.length,
        changed: changed.length,
        total_points: newPoints.length,
      },
      ipAddress: getIp(req),
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});
router.put('/:id', auth, updateOrder);
router.patch('/:id/status', auth, updateStatus);
router.delete('/:id', auth, deleteOrder);

module.exports = router;
