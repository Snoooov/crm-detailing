import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';
import PaymentSection from '../../components/PaymentSection.jsx';

const STATUSES = {
  inspection: { label: 'Oględziny / Wycena', color: '#6b7280' },
  planned: { label: 'Zaplanowane', color: '#2563eb' },
  in_progress: { label: 'W trakcie', color: '#d97706' },
  done: { label: 'Gotowe', color: '#16a34a' },
  released: { label: 'Wydane', color: '#7c3aed' },
  cancelled: { label: 'Anulowane', color: '#ef4444' },
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/orders/${id}`).then(res => {
      setOrder(res.data);
      setForm(res.data);
      setLoading(false);
    });
    api.get('/clients').then(res => setClients(res.data));
  }, [id]);

  useEffect(() => {
    if (form.client_id) {
      api.get('/vehicles', { params: { client_id: form.client_id } })
        .then(res => setVehicles(res.data));
    }
  }, [form.client_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'client_id') {
      setForm(prev => ({ ...prev, client_id: value, vehicle_id: '' }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePaymentChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setError('');
    try {
      const res = await api.put(`/orders/${id}`, form);
      setOrder(res.data);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas zapisywania');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Czy na pewno chcesz usunąć to zlecenie?')) return;
    await api.delete(`/orders/${id}`);
    navigate('/orders');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pl-PL');
  };

  const formatPrice = (price) => {
    if (!price) return '—';
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(price);
  };

  if (loading) return <div>Ładowanie...</div>;
  if (!order) return <div>Nie znaleziono zlecenia</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button className="btn-secondary" onClick={() => navigate('/orders')}>← Wróć</button>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Zlecenie #{order.id}</h1>
        <span style={{
          color: STATUSES[order.status]?.color,
          border: `1px solid ${STATUSES[order.status]?.color}`,
          borderRadius: 6,
          padding: '4px 10px',
          fontSize: 13,
          fontWeight: 600,
        }}>
          {STATUSES[order.status]?.label}
        </span>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        {!editing ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
              <div>
                <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 4 }}>Klient</div>
                <div style={{ fontWeight: 600 }}>{order.client_name}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 4 }}>Pojazd</div>
                <div style={{ fontWeight: 600 }}>{order.vehicle_brand} {order.vehicle_model}</div>
                <div style={{ color: '#6b7280', fontSize: 13 }}>{order.plate_number}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 4 }}>Usługa</div>
                <div style={{ fontWeight: 600 }}>{order.service_name}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 4 }}>Cena</div>
                <div style={{ fontWeight: 600 }}>{formatPrice(order.price)}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 4 }}>Data od</div>
                <div>{formatDate(order.date_from)}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 4 }}>Data do</div>
                <div>{formatDate(order.date_to)}</div>
              </div>
            </div>

            {order.service_description && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 4 }}>Opis usługi</div>
                <div>{order.service_description}</div>
              </div>
            )}

            {order.notes && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 4 }}>Notatki</div>
                <div>{order.notes}</div>
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 8 }}>Płatność</div>
              {order.is_paid ? (
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{
                    background: '#f0fdf4',
                    border: '1px solid #16a34a',
                    color: '#16a34a',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: 13,
                    fontWeight: 600,
                  }}>
                    ✓ Opłacone
                  </span>
                  {parseFloat(order.paid_cash) > 0 && (
                    <span style={{ fontSize: 13, color: '#374151' }}>
                      Gotówka: <strong>{parseFloat(order.paid_cash).toFixed(2)} zł</strong>
                    </span>
                  )}
                  {parseFloat(order.paid_card) > 0 && (
                    <span style={{ fontSize: 13, color: '#374151' }}>
                      Karta: <strong>{parseFloat(order.paid_card).toFixed(2)} zł</strong>
                    </span>
                  )}
                </div>
              ) : (
                <span style={{
                  background: '#fef2f2',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 13,
                  fontWeight: 600,
                }}>
                  ✗ Nieopłacone
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-primary" onClick={() => setEditing(true)}>Edytuj</button>
            <button
                className="btn-secondary"
                onClick={() => navigate(`/orders/${order.id}/reception`)}
            >
                Karta przyjęcia
            </button>
            <button className="btn-danger" onClick={handleDelete}>Usuń</button>
            </div>
          </>
        ) : (
          <>
            <div className="form-group">
              <label>Klient *</label>
              <select name="client_id" value={form.client_id} onChange={handleChange} required>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Pojazd *</label>
              <select name="vehicle_id" value={form.vehicle_id} onChange={handleChange} required>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.brand} {v.model} — {v.plate_number}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Nazwa usługi *</label>
              <input name="service_name" value={form.service_name || ''} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Opis usługi</label>
              <textarea name="service_description" value={form.service_description || ''} onChange={handleChange} rows={3} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Data od</label>
                <input type="date" name="date_from" value={form.date_from?.split('T')[0] || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Data do</label>
                <input type="date" name="date_to" value={form.date_to?.split('T')[0] || ''} onChange={handleChange} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Cena (PLN)</label>
                <input type="number" name="price" value={form.price || ''} onChange={handleChange} min="0" step="0.01" />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={form.status} onChange={handleChange}>
                  <option value="inspection">Oględziny / Wycena</option>
                  <option value="planned">Zaplanowane</option>
                  <option value="in_progress">W trakcie</option>
                  <option value="done">Gotowe</option>
                  <option value="released">Wydane</option>
                  <option value="cancelled">Anulowane</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Notatki</label>
              <textarea name="notes" value={form.notes || ''} onChange={handleChange} rows={3} />
            </div>

            <PaymentSection form={form} onChange={handlePaymentChange} />

            {error && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-primary" onClick={handleSave}>Zapisz</button>
              <button className="btn-secondary" onClick={() => setEditing(false)}>Anuluj</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderDetailPage;