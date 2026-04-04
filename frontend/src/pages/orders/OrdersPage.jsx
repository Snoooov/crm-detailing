import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { ORDER_STATUSES as STATUSES } from '../../constants/orderStatuses.js';
import useDarkMode from '../../hooks/useDarkMode.js';

const SortIcon = ({ field, sortField, sortDir }) => {
  if (sortField !== field) return <span style={{ color: '#d1d5db', marginLeft: 4 }}>↕</span>;
  return <span style={{ color: '#2563eb', marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
};

const PER_GROUP = 10;
const STATUS_ORDER = ['inspection', 'planned', 'in_progress', 'done', 'released', 'cancelled'];

const StatusGroup = ({ status, orders, onNavigate, isDark, isAdmin, onStatusChange, selectedIds, onSelectOne }) => {
  const [page, setPage] = useState(1);

  const sorted = [...orders].sort((a, b) => {
    const da = a.date_from ? new Date(a.date_from) : new Date(0);
    const db = b.date_from ? new Date(b.date_from) : new Date(0);
    return da - db;
  });

  const totalPages = Math.ceil(sorted.length / PER_GROUP);
  const slice = sorted.slice((page - 1) * PER_GROUP, page * PER_GROUP);
  const from = (page - 1) * PER_GROUP + 1;
  const to = Math.min(page * PER_GROUP, sorted.length);
  const { label, color } = STATUSES[status];

  const fmt = (price) => price
    ? new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(price)
    : '—';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pl-PL') : '—';

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
      {/* Nagłówek grupy */}
      <div style={{
        padding: '12px 20px',
        borderBottom: `1px solid var(--border)`,
        display: 'flex', alignItems: 'center', gap: 10,
        borderTop: `3px solid ${color}`,
      }}>
        <span style={{ fontWeight: 700, fontSize: 14, color }}>{label}</span>
        <span style={{
          background: color + '18',
          color,
          borderRadius: 99,
          padding: '1px 9px',
          fontSize: 12,
          fontWeight: 700,
        }}>
          {orders.length}
        </span>
        {totalPages > 1 && (
          <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 'auto' }}>
            {from}–{to} z {sorted.length}
          </span>
        )}
      </div>

      {/* Tabela */}
      <table>
        <thead>
          <tr>
            {isAdmin && <th style={{ width: 32 }} />}
            <th>Data</th>
            <th>Klient</th>
            <th>Pojazd</th>
            <th>Usługa</th>
            <th>Cena</th>
            <th>Pracownicy</th>
            {isAdmin && <th>Zmień status</th>}
          </tr>
        </thead>
        <tbody>
          {slice.map(order => (
            <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => onNavigate(`/orders/${order.id}`)}>
              {isAdmin && (
                <td onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedIds.includes(order.id)} onChange={() => onSelectOne(order.id)} />
                </td>
              )}
              <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(order.date_from)}</td>
              <td>{order.client_name}</td>
              <td>
                {order.vehicle_brand} {order.vehicle_model}
                <span style={{ color: 'var(--text-3)', fontSize: 12, marginLeft: 6 }}>{order.plate_number}</span>
              </td>
              <td>{order.service_name}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                {fmt(order.price)}
                {order.is_paid && <span style={{ marginLeft: 6, fontSize: 11, color: '#16a34a', fontWeight: 700 }}>✓</span>}
              </td>
              <td onClick={e => e.stopPropagation()}>
                {order.assigned_users?.length > 0 ? (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {order.assigned_users.map(u => (
                      <span key={u.id} style={{
                        background: 'var(--accent-light)', color: 'var(--accent)',
                        borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 600,
                      }}>
                        {u.name.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                ) : <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>}
              </td>
              {isAdmin && (
                <td onClick={e => e.stopPropagation()}>
                  <select
                    value={order.status}
                    onChange={e => onStatusChange(order.id, e.target.value)}
                    style={{
                      color: STATUSES[order.status]?.color,
                      fontWeight: 600,
                      border: `1px solid ${STATUSES[order.status]?.color}`,
                      borderRadius: 6, padding: '4px 8px',
                      background: isDark ? 'var(--surface)' : 'white',
                      width: 'auto',
                    }}
                  >
                    {Object.entries(STATUSES).map(([v, { label: l }]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Nawigacja stron */}
      {totalPages > 1 && (
        <div style={{
          padding: '10px 20px',
          borderTop: `1px solid var(--border)`,
          display: 'flex', gap: 8, justifyContent: 'flex-end',
        }}>
          <button
            className="btn-secondary"
            style={{ padding: '5px 14px', fontSize: 12 }}
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            ← Poprzednie 10
          </button>
          <button
            className="btn-secondary"
            style={{ padding: '5px 14px', fontSize: 12 }}
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Pokaż więcej →
          </button>
        </div>
      )}
    </div>
  );
};

const KANBAN_STATUSES = ['inspection', 'planned', 'in_progress', 'done', 'released'];
const KANBAN_PER_COL = 10;

const KanbanColumn = ({ col, dragOver, onDragOver, onDragLeave, onDrop, dragOrder, onNavigate, isDark }) => {
  const [page, setPage] = useState(1);

  const sorted = [...col.orders].sort((a, b) => {
    const da = a.date_from ? new Date(a.date_from) : new Date(0);
    const db = b.date_from ? new Date(b.date_from) : new Date(0);
    return da - db;
  });

  const totalPages = Math.ceil(sorted.length / KANBAN_PER_COL);
  const slice = sorted.slice((page - 1) * KANBAN_PER_COL, page * KANBAN_PER_COL);

  const formatPrice = (price) => {
    if (!price) return null;
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(price);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
  };

  const isOver = dragOver === col.status;

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        minWidth: 220,
        width: 220,
        flexShrink: 0,
        background: isOver
          ? (isDark ? '#1e3a5f' : '#eff6ff')
          : (isDark ? '#1e293b' : '#f8fafc'),
        border: `2px solid ${isOver ? '#2563eb' : (isDark ? '#334155' : '#e2e8f0')}`,
        borderTop: `3px solid ${col.color}`,
        borderRadius: 8,
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <div style={{
        padding: '10px 12px',
        borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: col.color }}>{col.label}</span>
        <span style={{
          background: col.color + '22',
          color: col.color,
          borderRadius: 99,
          padding: '2px 8px',
          fontSize: 12,
          fontWeight: 700,
        }}>{col.orders.length}</span>
      </div>

      <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 80 }}>
        {slice.map(order => (
          <div
            key={order.id}
            draggable
            onDragStart={() => { dragOrder.current = order; }}
            onDragEnd={() => { dragOrder.current = null; }}
            onClick={() => onNavigate(`/orders/${order.id}`)}
            style={{
              background: isDark ? '#263548' : 'white',
              border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
              borderRadius: 6,
              padding: '10px 12px',
              cursor: 'pointer',
              userSelect: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
              transition: 'box-shadow 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.07)'}
          >
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{order.client_name}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
              {order.vehicle_brand} {order.vehicle_model}
              {order.plate_number && <span style={{ marginLeft: 6, color: '#94a3b8' }}>{order.plate_number}</span>}
            </div>
            <div style={{ fontSize: 12, color: '#374151', marginBottom: 6 }}>{order.service_name}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {formatDate(order.date_from) && (
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{formatDate(order.date_from)}</span>
              )}
              {formatPrice(order.price) && (
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: order.is_paid ? '#16a34a' : '#d97706',
                }}>
                  {formatPrice(order.price)}
                  {order.is_paid && <span style={{ marginLeft: 3, fontSize: 10 }}>✓</span>}
                </span>
              )}
            </div>
            {order.assigned_users?.length > 0 && (
              <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {order.assigned_users.map(u => (
                  <span key={u.id} style={{
                    background: '#dbeafe', color: '#1d4ed8',
                    borderRadius: 99, padding: '1px 6px', fontSize: 10, fontWeight: 600,
                  }}>
                    {u.name.split(' ')[0]}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{
          padding: '8px',
          borderTop: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          display: 'flex', gap: 4, justifyContent: 'space-between',
        }}>
          <button
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: 11, flex: 1 }}
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            ←
          </button>
          <span style={{ fontSize: 11, color: 'var(--text-3)', alignSelf: 'center' }}>
            {(page - 1) * KANBAN_PER_COL + 1}–{Math.min(page * KANBAN_PER_COL, sorted.length)} / {sorted.length}
          </span>
          <button
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: 11, flex: 1 }}
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
};

const KanbanBoard = ({ orders, onStatusChange, onNavigate, isDark }) => {
  const dragOrder = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  const columns = KANBAN_STATUSES.map(status => ({
    status,
    ...STATUSES[status],
    orders: orders.filter(o => o.status === status),
  }));

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOver(null);
    const order = dragOrder.current;
    if (!order || order.status === targetStatus) return;
    await onStatusChange(order.id, targetStatus, order);
  };

  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, alignItems: 'flex-start' }}>
      {columns.map(col => (
        <KanbanColumn
          key={col.status}
          col={col}
          dragOver={dragOver}
          onDragOver={e => { e.preventDefault(); setDragOver(col.status); }}
          onDragLeave={() => setDragOver(null)}
          onDrop={e => handleDrop(e, col.status)}
          dragOrder={dragOrder}
          onNavigate={onNavigate}
          isDark={isDark}
        />
      ))}
    </div>
  );
};

const OrdersPage = () => {
  const isDark = useDarkMode();
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('ordersView') || 'list');

  useEffect(() => { localStorage.setItem('ordersView', viewMode); }, [viewMode]);

  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const isPrivileged = ['admin', 'manager'].includes(currentUser?.role);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

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
    if (newStatus === 'done') {
      const confirmed = window.confirm('Czy na pewno chcesz oznaczyć zlecenie jako gotowe? Klient otrzyma powiadomienie email.');
      if (!confirmed) return;
    }
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
  };

  const clearFilters = () => {
    setFilters({ status: '', date_from: '', date_to: '', price_min: '', price_max: '', is_paid: '' });
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = async () => {
    if (!bulkStatus || selectedIds.length === 0) return;
    if (bulkStatus === 'done') {
      const confirmed = window.confirm(`Oznaczyć ${selectedIds.length} zleceń jako gotowe? Klienci otrzymają powiadomienia email.`);
      if (!confirmed) return;
    }
    setBulkLoading(true);
    try {
      await Promise.all(selectedIds.map(id => api.patch(`/orders/${id}/status`, { status: bulkStatus })));
      setOrders(prev => prev.map(o => selectedIds.includes(o.id) ? { ...o, status: bulkStatus } : o));
      setSelectedIds([]);
      setBulkStatus('');
    } catch (err) {
      console.error(err);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExportCsv = () => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (filters.date_from) params.set('date_from', filters.date_from);
    if (filters.date_to) params.set('date_to', filters.date_to);
    if (filters.status) params.set('status', filters.status);
    const url = `http://localhost:5000/api/orders/export/csv?${params.toString()}`;
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', '');
    // For auth: use fetch approach
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.click();
        URL.revokeObjectURL(objectUrl);
      });
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
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Toggle widoku */}
          <div style={{ display: 'flex', border: '1px solid #d1d5db', borderRadius: 6, overflow: 'hidden' }}>
            {['list', 'kanban'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '6px 14px', fontSize: 13, border: 'none', cursor: 'pointer',
                  background: viewMode === mode ? '#2563eb' : 'transparent',
                  color: viewMode === mode ? 'white' : 'inherit',
                  fontWeight: viewMode === mode ? 600 : 400,
                }}
              >
                {mode === 'list' ? 'Lista' : 'Kanban'}
              </button>
            ))}
          </div>
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
            <button className="btn-secondary" onClick={handleExportCsv} title="Eksportuj do CSV">
              ↓ CSV
            </button>
          )}
          {isPrivileged && (
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

      {/* Wyszukiwarka — widoczna w obu widokach */}
      <div style={{ marginBottom: 16 }}>
        <input
          placeholder="Szukaj po kliencie, pojeździe, usłudze..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Kanban view */}
      {viewMode === 'kanban' && (
        <div className="card" style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Ładowanie...</div>
          ) : (
            <KanbanBoard
              orders={filteredAndSorted}
              onStatusChange={async (id, status) => {
                if (status === 'done') {
                  const ok = window.confirm('Oznaczyć jako gotowe? Klient otrzyma email.');
                  if (!ok) return;
                }
                await api.patch(`/orders/${id}/status`, { status });
                setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
              }}
              onNavigate={navigate}
              isDark={isDark}
            />
          )}
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <div>
          {/* Licznik wyników */}
          {!loading && (
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
              {filteredAndSorted.length === orders.length
                ? `${orders.length} zleceń`
                : `${filteredAndSorted.length} z ${orders.length} zleceń`
              }
            </div>
          )}

          {/* Bulk actions */}
          {isAdmin && selectedIds.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: isDark ? '#1e3a5f' : '#eff6ff',
              border: `1px solid ${isDark ? '#2563eb' : '#bfdbfe'}`,
              borderRadius: 6, padding: '8px 12px', marginBottom: 12,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>
                Zaznaczono: {selectedIds.length}
              </span>
              <select
                value={bulkStatus}
                onChange={e => setBulkStatus(e.target.value)}
                style={{ fontSize: 13, padding: '4px 8px' }}
              >
                <option value="">— zmień status —</option>
                {Object.entries(STATUSES).map(([v, { label }]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
              <button
                className="btn-primary"
                style={{ fontSize: 13, padding: '4px 12px' }}
                disabled={!bulkStatus || bulkLoading}
                onClick={handleBulkStatusChange}
              >
                {bulkLoading ? 'Zapisywanie...' : 'Zastosuj'}
              </button>
              <button
                className="btn-secondary"
                style={{ fontSize: 13, padding: '4px 12px' }}
                onClick={() => setSelectedIds([])}
              >
                Odznacz
              </button>
            </div>
          )}

          {loading ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Ładowanie...</div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
              {activeFiltersCount > 0 ? 'Brak zleceń spełniających filtry' : 'Brak zleceń'}
            </div>
          ) : (
            STATUS_ORDER
              .filter(status => filteredAndSorted.some(o => o.status === status))
              .map(status => (
                <StatusGroup
                  key={status}
                  status={status}
                  orders={filteredAndSorted.filter(o => o.status === status)}
                  onNavigate={navigate}
                  isDark={isDark}
                  isAdmin={isAdmin}
                  onStatusChange={handleStatusChange}
                  selectedIds={selectedIds}
                  onSelectOne={handleSelectOne}
                />
              ))
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;