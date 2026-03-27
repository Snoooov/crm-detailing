import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';
import NotesSection from '../../components/NotesSection.jsx';

const STATUSES = {
  inspection: 'Oględziny / Wycena',
  planned: 'Zaplanowane',
  in_progress: 'W trakcie',
  done: 'Gotowe',
  released: 'Wydane',
  cancelled: 'Anulowane',
};

const VehicleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/vehicles/${id}`).then(res => {
      setVehicle(res.data);
      setForm(res.data);
    });
    api.get('/orders', { params: {} }).then(res => {
      const vehicleOrders = res.data.filter(o => o.vehicle_id === parseInt(id));
      setOrders(vehicleOrders);
      setLoading(false);
    });
  }, [id]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setError('');
    try {
      const res = await api.put(`/vehicles/${id}`, form);
      setVehicle(prev => ({ ...prev, ...res.data }));
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas zapisywania');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten pojazd?')) return;
    await api.delete(`/vehicles/${id}`);
    navigate('/vehicles');
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
  if (!vehicle) return <div>Nie znaleziono pojazdu</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button className="btn-secondary" onClick={() => navigate('/vehicles')}>← Wróć</button>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{vehicle.brand} {vehicle.model}</h1>
        {vehicle.plate_number && (
          <span style={{
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 13,
            fontWeight: 600,
          }}>
            {vehicle.plate_number}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Dane pojazdu</h2>

          {!editing ? (
            <>
              <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Właściciel', value: vehicle.client_name },
                  { label: 'Marka', value: vehicle.brand },
                  { label: 'Model', value: vehicle.model },
                  { label: 'Rok', value: vehicle.year },
                  { label: 'Kolor', value: vehicle.color },
                  { label: 'Nr rejestracyjny', value: vehicle.plate_number },
                  { label: 'VIN', value: vehicle.vin },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 2 }}>{label}</div>
                    <div>{value || '—'}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-primary" onClick={() => setEditing(true)}>Edytuj</button>
                <button className="btn-danger" onClick={handleDelete}>Usuń</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Marka *</label>
                  <input name="brand" value={form.brand || ''} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Model *</label>
                  <input name="model" value={form.model || ''} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Rok</label>
                  <input type="number" name="year" value={form.year || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Kolor</label>
                  <input name="color" value={form.color || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Nr rejestracyjny</label>
                  <input name="plate_number" value={form.plate_number || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>VIN</label>
                  <input name="vin" value={form.vin || ''} onChange={handleChange} />
                </div>
              </div>
              {error && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-primary" onClick={handleSave}>Zapisz</button>
                <button className="btn-secondary" onClick={() => setEditing(false)}>Anuluj</button>
              </div>
            </>
          )}
        </div>

        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            Historia usług ({orders.length})
          </h2>
          {orders.length === 0 ? (
            <div style={{ color: '#6b7280' }}>Brak historii usług</div>
          ) : (
            orders.map(o => (
              <div
                key={o.id}
                style={{ padding: '12px 0', borderBottom: '1px solid #e5e7eb', cursor: 'pointer' }}
                onClick={() => navigate(`/orders/${o.id}`)}
              >
                <div style={{ fontWeight: 500 }}>{o.service_name}</div>
                <div style={{ color: '#6b7280', fontSize: 13 }}>
                  {formatDate(o.date_from)} · {formatPrice(o.price)}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  {STATUSES[o.status]}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <NotesSection entityType="vehicle" entityId={id} />
    </div>
  );
};

export default VehicleDetailPage;