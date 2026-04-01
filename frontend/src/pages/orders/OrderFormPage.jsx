import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';
import PaymentSection from '../../components/PaymentSection.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const ClientSearch = ({ value, onChange, onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      const res = await api.get('/clients', { params: { search: query } });
      setResults(res.data);
      setOpen(true);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (client) => {
    setSelected(client);
    setQuery(client.full_name);
    setOpen(false);
    onSelect(client);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); if (!e.target.value) { setSelected(null); onSelect(null); } }}
        placeholder="Wpisz imię, nazwisko lub telefon..."
      />
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'white', border: '1px solid #e5e7eb', borderRadius: 6,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: 200, overflowY: 'auto',
        }}>
          {results.map(c => (
            <div
              key={c.id}
              onClick={() => handleSelect(c)}
              style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              <div style={{ fontWeight: 500, fontSize: 13 }}>{c.full_name}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{c.phone || c.email || ''}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const VehicleSearch = ({ clientId, value, onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!clientId) { setAllVehicles([]); setResults([]); return; }
    api.get('/vehicles', { params: { client_id: clientId } }).then(res => {
      setAllVehicles(res.data);
      setResults(res.data);
    });
  }, [clientId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = query.length < 1
    ? allVehicles
    : allVehicles.filter(v =>
        `${v.brand} ${v.model} ${v.plate_number}`.toLowerCase().includes(query.toLowerCase())
      );

  const handleSelect = (vehicle) => {
    setQuery(`${vehicle.brand} ${vehicle.model} — ${vehicle.plate_number}`);
    setOpen(false);
    onSelect(vehicle);
  };

  if (!clientId) return (
    <input disabled placeholder="Najpierw wybierz klienta" style={{ opacity: 0.5 }} />
  );

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Wpisz markę, model lub rejestrację..."
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'white', border: '1px solid #e5e7eb', borderRadius: 6,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: 200, overflowY: 'auto',
        }}>
          {filtered.map(v => (
            <div
              key={v.id}
              onClick={() => handleSelect(v)}
              style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              <div style={{ fontWeight: 500, fontSize: 13 }}>{v.brand} {v.model}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{v.plate_number} · {v.color}</div>
            </div>
          ))}
        </div>
      )}
      {open && filtered.length === 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'white', border: '1px solid #e5e7eb', borderRadius: 6,
          padding: 12, fontSize: 13, color: '#6b7280', zIndex: 100,
        }}>
          Klient nie ma pojazdów
        </div>
      )}
    </div>
  );
};

const OrderFormPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleClientSelect = (client) => {
    setForm(prev => ({ ...prev, client_id: client?.id || '', vehicle_id: '' }));
  };

  const handleVehicleSelect = (vehicle) => {
    setForm(prev => ({ ...prev, vehicle_id: vehicle?.id || '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client_id) return setError('Wybierz klienta');
    if (!form.vehicle_id) return setError('Wybierz pojazd');
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

  const isAdmin = user?.role === 'admin';

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
            <ClientSearch onSelect={handleClientSelect} />
          </div>

          <div className="form-group">
            <label>Pojazd *</label>
            <VehicleSearch clientId={form.client_id} onSelect={handleVehicleSelect} />
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

          {isAdmin && <PaymentSection form={form} onChange={handlePaymentChange} />}

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