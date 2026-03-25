import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';

const STATUSES = {
  inspection: { label: 'Oględziny / Wycena', color: '#6b7280' },
  planned: { label: 'Zaplanowane', color: '#2563eb' },
  in_progress: { label: 'W trakcie', color: '#d97706' },
  done: { label: 'Gotowe', color: '#16a34a' },
  released: { label: 'Wydane', color: '#7c3aed' },
  cancelled: { label: 'Anulowane', color: '#ef4444' },
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchOrders = async (q = '') => {
    try {
      const res = await api.get('/orders', { params: q ? { search: q } : {} });
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchOrders(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
      );
    } catch (err) {
      console.error(err);
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Zlecenia</h1>
        <button className="btn-primary" onClick={() => navigate('/orders/new')}>
          + Nowe zlecenie
        </button>
      </div>

      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <input
            placeholder="Szukaj po kliencie, pojeździe, usłudze..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Ładowanie...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Brak zleceń</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Klient</th>
                <th>Pojazd</th>
                <th>Usługa</th>
                <th>Cena</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr
                  key={order.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                <td style={{ whiteSpace: 'nowrap' }}>{formatDate(order.date_from)}</td>
                <td>{order.client_name}</td>
                <td>{order.vehicle_brand} {order.vehicle_model}
                <span style={{ color: '#6b7280', fontSize: 12, marginLeft: 6 }}>
                    {order.plate_number}
                </span>
                </td>
                <td>{order.service_name}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                {formatPrice(order.price)}
                {order.is_paid && (
                    <span style={{ marginLeft: 6, fontSize: 11, color: '#16a34a', fontWeight: 700 }}>✓</span>
                )}
                </td>
                <td onClick={e => e.stopPropagation()}>
                <select
                    value={order.status}
                    onChange={e => handleStatusChange(order.id, e.target.value)}
                    style={{
                    color: STATUSES[order.status]?.color,
                    fontWeight: 600,
                    border: `1px solid ${STATUSES[order.status]?.color}`,
                    borderRadius: 6,
                    padding: '4px 8px',
                    background: 'white',
                    width: 'auto',
                    }}
                >
                    {Object.entries(STATUSES).map(([value, { label }]) => (
                    <option key={value} value={value}>{label}</option>
                    ))}
                </select>
                </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;