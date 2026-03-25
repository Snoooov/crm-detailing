import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';
import PaymentSection from '../../components/PaymentSection.jsx';

const OrderFormPage = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    client_id: '',
    vehicle_id: '',
    service_name: '',
    service_description: '',
    date_from: '',
    date_to: '',
    price: '',
    status: 'inspection',
    notes: '',
    is_paid: false,
    paid_cash: 0,
    paid_card: 0,
  });

  useEffect(() => {
    api.get('/clients').then(res => setClients(res.data));
  }, []);

  useEffect(() => {
    if (form.client_id) {
      api.get('/vehicles', { params: { client_id: form.client_id } })
        .then(res => setVehicles(res.data));
    } else {
      setVehicles([]);
      setForm(prev => ({ ...prev, vehicle_id: '' }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/orders', form);
      navigate('/orders');
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas zapisywania');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button className="btn-secondary" onClick={() => navigate('/orders')}>← Wróć</button>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Nowe zlecenie</h1>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Klient *</label>
            <select name="client_id" value={form.client_id} onChange={handleChange} required>
              <option value="">Wybierz klienta</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Pojazd *</label>
            <select name="vehicle_id" value={form.vehicle_id} onChange={handleChange} required disabled={!form.client_id}>
              <option value="">Wybierz pojazd</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.brand} {v.model} — {v.plate_number}</option>
              ))}
            </select>
            {form.client_id && vehicles.length === 0 && (
              <span style={{ color: '#6b7280', fontSize: 13 }}>Klient nie ma pojazdów</span>
            )}
          </div>

          <div className="form-group">
            <label>Nazwa usługi *</label>
            <input name="service_name" value={form.service_name} onChange={handleChange} placeholder="np. Detailing zewnętrzny" required />
          </div>

          <div className="form-group">
            <label>Opis usługi</label>
            <textarea name="service_description" value={form.service_description} onChange={handleChange} rows={3} placeholder="Opcjonalny opis..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label>Data od</label>
              <input type="date" name="date_from" value={form.date_from} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Data do</label>
              <input type="date" name="date_to" value={form.date_to} onChange={handleChange} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label>Cena (PLN)</label>
              <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="0.00" min="0" step="0.01" />
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
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder="Dodatkowe uwagi..." />
          </div>

          <PaymentSection form={form} onChange={handlePaymentChange} />

          {error && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Zapisywanie...' : 'Zapisz zlecenie'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/orders')}>
              Anuluj
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderFormPage;