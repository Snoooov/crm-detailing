import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';
import PaymentSection from '../../components/PaymentSection.jsx';
import NotesSection from '../../components/NotesSection.jsx';
import OrderAssignments from '../../components/OrderAssignments.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import useDarkMode from '../../hooks/useDarkMode.js';
import { ORDER_STATUSES as STATUSES } from '../../constants/orderStatuses.js';

const OrderDetailPage = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const isPrivileged = ['admin', 'manager'].includes(currentUser?.role);
  const isDark = useDarkMode();

  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [form, setForm] = useState({});
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

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

  useEffect(() => {
    if (activeTab === 'history' && isPrivileged && history.length === 0) {
      setHistoryLoading(true);
      api.get(`/orders/${id}/history`).then(res => {
        setHistory(res.data);
        setHistoryLoading(false);
      }).catch(() => setHistoryLoading(false));
    }
  }, [activeTab]);

  // When status changes to inspection in edit mode, clear price and payment
  useEffect(() => {
    if (!editing) return;
    if (form.status === 'inspection') {
      setForm(prev => ({ ...prev, price: '', is_paid: false, paid_cash: 0, paid_card: 0 }));
    }
  }, [form.status]);

  // Auto-mark as paid when price is 0 (and not inspection)
  useEffect(() => {
    if (!editing) return;
    if (form.status !== 'inspection' && form.price !== '' && form.price !== null && parseFloat(form.price) === 0) {
      setForm(prev => ({ ...prev, is_paid: true, paid_cash: 0, paid_card: 0 }));
    }
  }, [form.price]);

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
    if (form.date_from && form.date_to && form.date_to < form.date_from) {
      return setError('Data zakończenia nie może być wcześniejsza niż data rozpoczęcia');
    }
    if (form.price !== '' && form.price !== null && (isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0)) {
      return setError('Cena nie może być ujemna');
    }

    if (form.status === 'done' && order.status !== 'done') {
      const confirmed = window.confirm('Czy na pewno chcesz oznaczyć zlecenie jako gotowe? Klient otrzyma powiadomienie email.');
      if (!confirmed) return;
    }

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

  const handleDuplicate = async () => {
    if (!window.confirm('Czy chcesz zduplikować to zlecenie? Zostanie stworzone nowe zlecenie ze statusem "Oględziny / Wycena".')) return;
    setDuplicating(true);
    try {
      const payload = {
        client_id: order.client_id,
        vehicle_id: order.vehicle_id,
        service_catalog_id: order.service_catalog_id,
        service_name: order.service_name,
        service_description: order.service_description,
        price: order.price,
        status: 'inspection',
        notes: order.notes,
        is_paid: false,
        paid_cash: 0,
        paid_card: 0,
      };
      const res = await api.post('/orders', payload);
      navigate(`/orders/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas duplikowania');
    } finally {
      setDuplicating(false);
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

  const formatDateTime = (d) => d ? new Date(d).toLocaleString('pl-PL') : '—';

  if (loading) return <div>Ładowanie...</div>;
  if (!order) return <div>Nie znaleziono zlecenia</div>;

  const isAssigned = order.assigned_users?.some(u => u.id === currentUser?.id);
  const canEdit = isPrivileged || isAssigned;

  const tabStyle = (tab) => ({
    padding: '8px 16px',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
    background: 'none',
    cursor: 'pointer',
    fontWeight: activeTab === tab ? 600 : 400,
    color: activeTab === tab ? '#2563eb' : '#6b7280',
    fontSize: 14,
  });

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

      {/* Tabs */}
      <div style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`, marginBottom: 24, display: 'flex', gap: 8 }}>
        <button style={tabStyle('details')} onClick={() => setActiveTab('details')}>Szczegóły</button>
        {isPrivileged && <button style={tabStyle('history')} onClick={() => setActiveTab('history')}>Historia zmian</button>}
      </div>

      {activeTab === 'history' && isPrivileged && (
        <div className="card" style={{ maxWidth: 640 }}>
          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Ładowanie...</div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Brak historii zmian</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {history.map(entry => {
                const changes = typeof entry.changes === 'string' ? JSON.parse(entry.changes) : entry.changes;
                return (
                  <div key={entry.id} style={{
                    borderLeft: `3px solid #2563eb`,
                    paddingLeft: 12,
                  }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                      <strong>{entry.user_name}</strong> · {formatDateTime(entry.changed_at)}
                    </div>
                    {changes.map((c, i) => (
                      <div key={i} style={{ fontSize: 13, marginBottom: 2 }}>
                        <span style={{ color: isDark ? '#94a3b8' : '#6b7280' }}>{c.field}:</span>{' '}
                        <span style={{ color: '#ef4444', textDecoration: 'line-through' }}>{c.from || '—'}</span>
                        {' → '}
                        <span style={{ color: '#16a34a' }}>{c.to || '—'}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'details' && (
        <div className="card" style={{ maxWidth: 640 }}>
          {!editing ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <div>
                  <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 4 }}>Klient</div>
                  <div style={{ fontWeight: 600 }}>{order.client_name}</div>
                  {order.client_nip && <div style={{ color: '#6b7280', fontSize: 12 }}>NIP: {order.client_nip}</div>}
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
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{
                      background: isDark ? '#14532d33' : '#f0fdf4',
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
                      <span style={{ fontSize: 13, color: isDark ? '#cbd5e1' : '#374151' }}>
                        Gotówka: <strong>{parseFloat(order.paid_cash).toFixed(2)} zł</strong>
                      </span>
                    )}
                    {parseFloat(order.paid_card) > 0 && (
                      <span style={{ fontSize: 13, color: isDark ? '#cbd5e1' : '#374151' }}>
                        Karta: <strong>{parseFloat(order.paid_card).toFixed(2)} zł</strong>
                      </span>
                    )}
                    {order.invoice_number && (
                      <span style={{ fontSize: 13, color: isDark ? '#cbd5e1' : '#374151' }}>
                        Faktura: <strong>{order.invoice_number}</strong>
                      </span>
                    )}
                  </div>
                ) : (
                  <span style={{
                    background: isDark ? '#7f1d1d33' : '#fef2f2',
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

              <OrderAssignments orderId={id} />

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {canEdit && (
                  <button className="btn-primary" onClick={() => setEditing(true)}>Edytuj</button>
                )}
                {canEdit && (
                  <button
                    className="btn-secondary"
                    onClick={() => navigate(`/orders/${order.id}/reception`)}
                  >
                    Karta przyjęcia
                  </button>
                )}
                {isPrivileged && (
                  <button className="btn-secondary" onClick={handleDuplicate} disabled={duplicating}>
                    {duplicating ? 'Duplikowanie...' : 'Duplikuj'}
                  </button>
                )}
                {isAdmin && (
                  <button className="btn-danger" onClick={handleDelete}>Usuń</button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Klient *</label>
                <select name="client_id" value={form.client_id} onChange={handleChange} required disabled={!isPrivileged}>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Pojazd *</label>
                <select name="vehicle_id" value={form.vehicle_id} onChange={handleChange} required disabled={!isPrivileged}>
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
                  <input type="date" name="date_from" value={form.date_from?.split('T')[0] || ''} onChange={handleChange} disabled={!isPrivileged} />
                </div>
                <div className="form-group">
                  <label>Data do</label>
                  <input type="date" name="date_to" value={form.date_to?.split('T')[0] || ''} onChange={handleChange} disabled={!isPrivileged} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>
                    Cena (PLN)
                    {form.status === 'inspection' && <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 6 }}>— po wycenie</span>}
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={form.price || ''}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    disabled={!isPrivileged || form.status === 'inspection'}
                    style={{ opacity: form.status === 'inspection' ? 0.4 : 1 }}
                  />
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

              {isPrivileged && form.status !== 'inspection' && (
                <PaymentSection form={form} onChange={handlePaymentChange} clientNip={order.client_nip} />
              )}
              {isPrivileged && form.status === 'inspection' && (
                <div style={{
                  border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                  borderRadius: 8, padding: '12px 16px', marginBottom: 16,
                  background: isDark ? '#1e293b' : '#f9fafb',
                  color: isDark ? '#64748b' : '#9ca3af',
                  fontSize: 13,
                }}>
                  Płatność i cena zostaną uzupełnione po wycenie (zmień status, aby odblokować)
                </div>
              )}

              {error && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-primary" onClick={handleSave}>Zapisz</button>
                <button className="btn-secondary" onClick={() => { setEditing(false); setError(''); }}>Anuluj</button>
              </div>
            </>
          )}
        </div>
      )}
      <NotesSection entityType="order" entityId={id} />
    </div>
  );
};

export default OrderDetailPage;
