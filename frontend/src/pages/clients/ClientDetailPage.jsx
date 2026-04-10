import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';
import NotesSection from '../../components/NotesSection.jsx';
import ClientStats from '../../components/ClientStats.jsx';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import CollapsibleOrders from '../../components/CollapsibleOrders.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const STATUS_LABELS = {
  vip: { label: 'VIP', color: '#7c3aed' },
  regular: { label: 'Stały', color: '#2563eb' },
  normal: { label: 'Zwykły', color: '#6b7280' },
};

const ClientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  usePageTitle(client ? client.name : 'Klient');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const isPrivileged = ['admin', 'manager'].includes(currentUser?.role);

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
    const orderCount = client.orders?.length || 0;
    const confirmMsg = orderCount > 0
      ? `Ten klient ma ${orderCount} ${orderCount === 1 ? 'zlecenie' : orderCount < 5 ? 'zlecenia' : 'zleceń'}. Nie można go usunąć — najpierw usuń wszystkie zlecenia.`
      : 'Czy na pewno chcesz usunąć tego klienta? Usunięte zostaną też jego pojazdy.';
    if (orderCount > 0) {
      alert(confirmMsg);
      return;
    }
    if (!window.confirm(confirmMsg)) return;
    try {
      await api.delete(`/clients/${id}`);
      navigate('/clients');
    } catch (err) {
      const msg = err.response?.data?.error || 'Błąd podczas usuwania';
      alert(msg);
    }
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button className="btn-secondary" onClick={() => navigate('/clients')}>← Wróć</button>
        <h1 style={{ fontSize: isMobile ? 18 : 24, fontWeight: 700 }}>{client.full_name}</h1>
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

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24 }}>
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

        {isPrivileged && (
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
                  style={{ padding: '12px 0', borderBottom: '1px solid #e5e7eb', cursor: 'pointer' }}
                  onClick={() => navigate(`/vehicles`)}
                >
                  <div style={{ fontWeight: 500 }}>{v.brand} {v.model} ({v.year})</div>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>{v.plate_number} · {v.color}</div>
                </div>
              ))
            )}
          </div>

          <CollapsibleOrders
            orders={client.orders || []}
            title="Historia zleceń"
          />
        </div>
      )}
      </div>
      {isPrivileged && <ClientStats clientId={id} />}
      <NotesSection entityType="client" entityId={id} />
    </div>
  );
};

export default ClientDetailPage;