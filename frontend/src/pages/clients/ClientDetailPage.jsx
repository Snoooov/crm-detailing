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

const STATUS_LABELS = {
  vip: { label: 'VIP', color: '#7c3aed' },
  regular: { label: 'Stały', color: '#2563eb' },
  normal: { label: 'Zwykły', color: '#6b7280' },
};

const ClientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/clients/${id}`).then(res => {
      setClient(res.data);
      setForm(res.data);
      setLoading(false);
    });
  }, [id]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setError('');
    try {
      const res = await api.put(`/clients/${id}`, form);
      setClient(prev => ({ ...prev, ...res.data }));
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas zapisywania');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Czy na pewno chcesz usunąć tego klienta? Usunięte zostaną też jego pojazdy.')) return;
    await api.delete(`/clients/${id}`);
    navigate('/clients');
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
  if (!client) return <div>Nie znaleziono klienta</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button className="btn-secondary" onClick={() => navigate('/clients')}>← Wróć</button>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{client.full_name}</h1>
        <span style={{
          color: STATUS_LABELS[client.status]?.color,
          border: `1px solid ${STATUS_LABELS[client.status]?.color}`,
          borderRadius: 6,
          padding: '4px 10px',
          fontSize: 13,
          fontWeight: 600,
        }}>
          {STATUS_LABELS[client.status]?.label}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Dane klienta</h2>

          {!editing ? (
            <>
              <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Telefon', value: client.phone },
                  { label: 'Email', value: client.email },
                  { label: 'NIP', value: client.nip },
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
              <div className="form-group">
                <label>Imię i nazwisko *</label>
                <input name="full_name" value={form.full_name || ''} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Telefon</label>
                <input name="phone" value={form.phone || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={form.email || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>NIP</label>
                <input name="nip" value={form.nip || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={form.status} onChange={handleChange}>
                  <option value="normal">Zwykły</option>
                  <option value="regular">Stały</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
              {error && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-primary" onClick={handleSave}>Zapisz</button>
                <button className="btn-secondary" onClick={() => setEditing(false)}>Anuluj</button>
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              Pojazdy ({client.vehicles?.length || 0})
            </h2>
            {client.vehicles?.length === 0 ? (
              <div style={{ color: '#6b7280' }}>Brak pojazdów</div>
            ) : (
              client.vehicles?.map(v => (
                <div
                  key={v.id}
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid #e5e7eb',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/vehicles`)}
                >
                  <div style={{ fontWeight: 500 }}>{v.brand} {v.model} ({v.year})</div>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>{v.plate_number} · {v.color}</div>
                </div>
              ))
            )}
          </div>

          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              Historia zleceń ({client.orders?.length || 0})
            </h2>
            {client.orders?.length === 0 ? (
              <div style={{ color: '#6b7280' }}>Brak zleceń</div>
            ) : (
              client.orders?.map(o => (
                <div
                  key={o.id}
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid #e5e7eb',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/orders/${o.id}`)}
                >
                  <div style={{ fontWeight: 500 }}>{o.service_name}</div>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>
                    {o.vehicle_brand} {o.vehicle_model} · {formatDate(o.date_from)} · {formatPrice(o.price)}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                    {STATUSES[o.status]}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <NotesSection entityType="client" entityId={id} />
    </div>
  );
};

export default ClientDetailPage;