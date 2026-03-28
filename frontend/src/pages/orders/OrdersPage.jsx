import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Pagination from '../../components/Pagination.jsx';

const STATUSES = {
  inspection: { label: 'Oględziny / Wycena', color: '#6b7280' },
  planned: { label: 'Zaplanowane', color: '#2563eb' },
  in_progress: { label: 'W trakcie', color: '#d97706' },
  done: { label: 'Gotowe', color: '#16a34a' },
  released: { label: 'Wydane', color: '#7c3aed' },
  cancelled: { label: 'Anulowane', color: '#ef4444' },
};

const SortIcon = ({ field, sortField, sortDir }) => {
  if (sortField !== field) return <span style={{ color: '#d1d5db', marginLeft: 4 }}>↕</span>;
  return <span style={{ color: '#2563eb', marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
};

const OrdersPage = () => {

  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 20;

  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  const [filters, setFilters] = useState({
    status: '',
    date_from: '',
    date_to: '',
    price_min: '',
    price_max: '',
    is_paid: '',
  });

  const navigate = useNavigate();

  const fetchOrders = useCallback(async (q = '') => {
    try {
      const res = await api.get('/orders', { params: q ? { search: q } : {} });
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, []);

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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ status: '', date_from: '', date_to: '', price_min: '', price_max: '', is_paid: '' });
    setCurrentPage(1);
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  const filteredAndSorted = orders
    .filter(o => {
      if (filters.status && o.status !== filters.status) return false;
      if (filters.date_from && o.date_from?.split('T')[0] < filters.date_from) return false;
      if (filters.date_to && o.date_from?.split('T')[0] > filters.date_to) return false;
      if (filters.price_min && parseFloat(o.price) < parseFloat(filters.price_min)) return false;
      if (filters.price_max && parseFloat(o.price) > parseFloat(filters.price_max)) return false;
      if (filters.is_paid === 'true' && !o.is_paid) return false;
      if (filters.is_paid === 'false' && o.is_paid) return false;
      return true;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'price') {
        valA = parseFloat(valA) || 0;
        valB = parseFloat(valB) || 0;
      } else if (sortField === 'date_from' || sortField === 'created_at') {
        valA = new Date(valA || 0);
        valB = new Date(valB || 0);
      } else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const paginated = filteredAndSorted.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pl-PL');
  };

  const formatPrice = (price) => {
    if (!price) return '—';
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(price);
  };

  const thStyle = {
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Zlecenia</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-secondary"
            onClick={() => setShowFilters(!showFilters)}
            style={{ position: 'relative' }}
          >
            Filtry
            {activeFiltersCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -6,
                right: -6,
                background: '#2563eb',
                color: 'white',
                borderRadius: 99,
                width: 18,
                height: 18,
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {activeFiltersCount}
              </span>
            )}
          </button>
          {isAdmin && (
            <button className="btn-primary" onClick={() => navigate('/orders/new')}>
              + Nowe zlecenie
            </button>
          )}
        </div>
      </div>

      {/* Panel filtrów */}
      {showFilters && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Status</label>
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">Wszystkie</option>
                {Object.entries(STATUSES).map(([value, { label }]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Płatność</label>
              <select name="is_paid" value={filters.is_paid} onChange={handleFilterChange}>
                <option value="">Wszystkie</option>
                <option value="true">Opłacone</option>
                <option value="false">Nieopłacone</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Data od</label>
              <input type="date" name="date_from" value={filters.date_from} onChange={handleFilterChange} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Data do</label>
              <input type="date" name="date_to" value={filters.date_to} onChange={handleFilterChange} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Cena od (PLN)</label>
              <input type="number" name="price_min" value={filters.price_min} onChange={handleFilterChange} placeholder="0" min="0" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Cena do (PLN)</label>
              <input type="number" name="price_max" value={filters.price_max} onChange={handleFilterChange} placeholder="99999" min="0" />
            </div>
          </div>
          {activeFiltersCount > 0 && (
            <button className="btn-secondary" onClick={clearFilters} style={{ fontSize: 13 }}>
              Wyczyść filtry ({activeFiltersCount})
            </button>
          )}
        </div>
      )}

      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <input
            placeholder="Szukaj po kliencie, pojeździe, usłudze..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Licznik wyników */}
        {!loading && (
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
            {filteredAndSorted.length === orders.length
              ? `${orders.length} zleceń`
              : `${filteredAndSorted.length} z ${orders.length} zleceń`
            }
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Ładowanie...</div>
        ) : filteredAndSorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
            {activeFiltersCount > 0 ? 'Brak zleceń spełniających filtry' : 'Brak zleceń'}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={thStyle} onClick={() => handleSort('date_from')}>
                  Data <SortIcon field="date_from" sortField={sortField} sortDir={sortDir} />
                </th>
                <th style={thStyle} onClick={() => handleSort('client_name')}>
                  Klient <SortIcon field="client_name" sortField={sortField} sortDir={sortDir} />
                </th>
                <th>Pojazd</th>
                <th style={thStyle} onClick={() => handleSort('service_name')}>
                  Usługa <SortIcon field="service_name" sortField={sortField} sortDir={sortDir} />
                </th>
                <th style={thStyle} onClick={() => handleSort('price')}>
                  Cena <SortIcon field="price" sortField={sortField} sortDir={sortDir} />
                </th>
                <th>Pracownicy</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(order => (
                <tr
                  key={order.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(order.date_from)}</td>
                  <td>{order.client_name}</td>
                  <td>
                    {order.vehicle_brand} {order.vehicle_model}
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
                    {order.assigned_users?.length > 0 ? (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {order.assigned_users.map(u => (
                          <span key={u.id} style={{
                            background: '#dbeafe',
                            color: '#1d4ed8',
                            borderRadius: 99,
                            padding: '2px 8px',
                            fontSize: 11,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}>
                            {u.name.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>
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
        <Pagination
          total={filteredAndSorted.length}
          perPage={PER_PAGE}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default OrdersPage;