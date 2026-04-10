import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import useDarkMode from '../hooks/useDarkMode.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const ACTION_LABELS = {
  login:                 { label: 'Logowanie',              color: '#16a34a' },
  login_failed:          { label: 'Nieudane logowanie',     color: '#dc2626' },
  order_created:         { label: 'Nowe zlecenie',          color: '#2563eb' },
  order_updated:         { label: 'Edycja zlecenia',        color: '#7c3aed' },
  order_deleted:         { label: 'Usunięcie zlecenia',     color: '#dc2626' },
  order_status_changed:  { label: 'Zmiana statusu',         color: '#d97706' },
  damage_map_updated:    { label: 'Mapa uszkodzeń',         color: '#0891b2' },
  client_created:        { label: 'Nowy klient',            color: '#2563eb' },
  client_updated:        { label: 'Edycja klienta',         color: '#7c3aed' },
  client_deleted:        { label: 'Usunięcie klienta',      color: '#dc2626' },
  vehicle_created:       { label: 'Nowy pojazd',            color: '#2563eb' },
  vehicle_updated:       { label: 'Edycja pojazdu',         color: '#7c3aed' },
  vehicle_deleted:       { label: 'Usunięcie pojazdu',      color: '#dc2626' },
  user_created:          { label: 'Nowy użytkownik',        color: '#2563eb' },
  user_updated:          { label: 'Edycja użytkownika',     color: '#7c3aed' },
  user_deleted:          { label: 'Usunięcie użytkownika',  color: '#dc2626' },
  note_added:            { label: 'Dodanie notatki',        color: '#16a34a' },
  note_deleted:          { label: 'Usunięcie notatki',      color: '#dc2626' },
  assignment_added:      { label: 'Przypisanie pracownika', color: '#16a34a' },
  assignment_removed:    { label: 'Odpięcie pracownika',    color: '#dc2626' },
};

const ENTITY_LINKS = {
  order:   (id) => `/orders/${id}`,
  client:  (id) => `/clients/${id}`,
  vehicle: (id) => `/vehicles/${id}`,
};

const ENTITY_LABELS = {
  order:   'Zlecenie',
  client:  'Klient',
  vehicle: 'Pojazd',
  user:    'Użytkownik',
};

const PAGE_SIZE = 50;

const LogsPage = () => {
  usePageTitle('Logi systemu');
  const isDark = useDarkMode();
  const navigate = useNavigate();

  const [logs, setLogs]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(false);
  const [page, setPage]           = useState(0);
  const [actions, setActions]     = useState([]);

  const [filters, setFilters] = useState({
    action: '',
    entity_type: '',
    date_from: '',
    date_to: '',
  });

  const fetchLogs = useCallback(async (pageNum = 0, f = filters) => {
    setLoading(true);
    try {
      const params = {
        limit: PAGE_SIZE,
        offset: pageNum * PAGE_SIZE,
        ...(f.action      && { action:      f.action }),
        ...(f.entity_type && { entity_type: f.entity_type }),
        ...(f.date_from   && { date_from:   f.date_from }),
        ...(f.date_to     && { date_to:     f.date_to }),
      };
      const res = await api.get('/logs', { params });
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs(0, filters);
    api.get('/logs/actions').then(res => setActions(res.data)).catch(() => {});
  }, []);

  const handleFilter = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setPage(0);
    fetchLogs(0, filters);
  };

  const resetFilters = () => {
    const empty = { action: '', entity_type: '', date_from: '', date_to: '' };
    setFilters(empty);
    setPage(0);
    fetchLogs(0, empty);
  };

  const goPage = (p) => {
    setPage(p);
    fetchLogs(p, filters);
  };

  const formatDateTime = (d) => d ? new Date(d).toLocaleString('pl-PL') : '—';

  const renderDetails = (action, details) => {
    if (!details || typeof details !== 'object') return null;
    const d = typeof details === 'string' ? JSON.parse(details) : details;

    if (action === 'order_status_changed') {
      return <span style={{ fontSize: 12 }}>{d.from} → <strong>{d.to}</strong></span>;
    }
    if (action === 'damage_map_updated') {
      const parts = [];
      if (d.added)   parts.push(`+${d.added} dodano`);
      if (d.removed) parts.push(`-${d.removed} usunięto`);
      if (d.changed) parts.push(`${d.changed} zmieniono`);
      if (!parts.length) parts.push(`${d.total_points} punktów`);
      return <span style={{ fontSize: 12 }}>{parts.join(', ')}</span>;
    }
    if (action === 'login' || action === 'login_failed') {
      return <span style={{ fontSize: 12 }}>{d.email}{d.reason ? ` — ${d.reason}` : ''}{d.role ? ` (${d.role})` : ''}</span>;
    }
    if (action === 'order_updated' && Array.isArray(d.changes) && d.changes.length > 0) {
      return (
        <span style={{ fontSize: 12 }}>
          {d.changes.map((c, i) => (
            <span key={i} style={{ marginRight: 8 }}>
              {c.field}: <span style={{ color: '#ef4444', textDecoration: 'line-through' }}>{c.from || '—'}</span>
              {' → '}
              <span style={{ color: '#16a34a' }}>{c.to || '—'}</span>
            </span>
          ))}
        </span>
      );
    }
    if (action === 'note_added' && d.content) {
      return <span style={{ fontSize: 12 }}>„{d.content}"</span>;
    }
    if (action === 'assignment_added' && d.assigned_user_name) {
      return <span style={{ fontSize: 12 }}>Przypisano: <strong>{d.assigned_user_name}</strong></span>;
    }
    if (action === 'assignment_removed' && d.removed_user_name) {
      return <span style={{ fontSize: 12 }}>Odpięto: <strong>{d.removed_user_name}</strong></span>;
    }

    // Generyczny wyświetlacz
    const interesting = Object.entries(d).filter(([k]) =>
      !['changes'].includes(k) && d[k] !== null && d[k] !== undefined && d[k] !== ''
    );
    if (!interesting.length) return null;
    return (
      <span style={{ fontSize: 12 }}>
        {interesting.slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' · ')}
      </span>
    );
  };

  const border  = isDark ? '#334155' : '#e5e7eb';
  const bg      = isDark ? '#0f172a' : '#ffffff';
  const rowBg   = isDark ? '#1e293b' : '#f9fafb';
  const textSub = isDark ? '#64748b' : '#9ca3af';

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Logi systemowe</h1>
          <div style={{ color: textSub, fontSize: 14 }}>
            Wszystkie akcje wykonane w systemie · łącznie {total.toLocaleString('pl-PL')} wpisów
          </div>
        </div>
      </div>

      {/* Filtry */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ margin: 0, minWidth: 160 }}>
          <label style={{ fontSize: 12 }}>Typ akcji</label>
          <select name="action" value={filters.action} onChange={handleFilter}>
            <option value="">— wszystkie —</option>
            {actions.map(a => (
              <option key={a} value={a}>{ACTION_LABELS[a]?.label || a}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ margin: 0, minWidth: 140 }}>
          <label style={{ fontSize: 12 }}>Typ obiektu</label>
          <select name="entity_type" value={filters.entity_type} onChange={handleFilter}>
            <option value="">— wszystkie —</option>
            <option value="order">Zlecenie</option>
            <option value="client">Klient</option>
            <option value="vehicle">Pojazd</option>
            <option value="user">Użytkownik</option>
          </select>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: 12 }}>Data od</label>
          <input type="date" name="date_from" value={filters.date_from} onChange={handleFilter} />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: 12 }}>Data do</label>
          <input type="date" name="date_to" value={filters.date_to} onChange={handleFilter} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-primary" onClick={applyFilters} style={{ fontSize: 13, padding: '7px 16px' }}>
            Filtruj
          </button>
          <button className="btn-secondary" onClick={resetFilters} style={{ fontSize: 13, padding: '7px 14px' }}>
            Resetuj
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: textSub }}>Ładowanie...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: textSub }}>Brak logów</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: rowBg, borderBottom: `2px solid ${border}` }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: textSub, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Czas</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: textSub, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Akcja</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: textSub, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Użytkownik</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: textSub, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Obiekt</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: textSub, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Szczegóły</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: textSub, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const actionMeta = ACTION_LABELS[log.action] || { label: log.action, color: '#6b7280' };
                  const entityLink = log.entity_type && log.entity_id && ENTITY_LINKS[log.entity_type]
                    ? ENTITY_LINKS[log.entity_type](log.entity_id)
                    : null;
                  const details = typeof log.details === 'string' ? JSON.parse(log.details) : (log.details || {});

                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: `1px solid ${border}`,
                        background: i % 2 === 0 ? bg : rowBg,
                      }}
                    >
                      <td style={{ padding: '10px 16px', color: textSub, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        {formatDateTime(log.created_at)}
                      </td>
                      <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          background: actionMeta.color + '20',
                          color: actionMeta.color,
                          borderRadius: 99,
                          padding: '2px 10px',
                          fontSize: 12,
                          fontWeight: 600,
                          border: `1px solid ${actionMeta.color}40`,
                        }}>
                          {actionMeta.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                        {log.user_name || <span style={{ color: textSub }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                        {log.entity_type && log.entity_id ? (
                          entityLink ? (
                            <button
                              onClick={() => navigate(entityLink)}
                              style={{
                                background: 'none', border: 'none', padding: 0,
                                cursor: 'pointer', color: '#2563eb', fontSize: 13,
                                textDecoration: 'underline', textUnderlineOffset: 2,
                              }}
                            >
                              {ENTITY_LABELS[log.entity_type] || log.entity_type} #{log.entity_id}
                            </button>
                          ) : (
                            <span style={{ color: textSub }}>
                              {ENTITY_LABELS[log.entity_type] || log.entity_type} #{log.entity_id}
                            </span>
                          )
                        ) : (
                          <span style={{ color: textSub }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 16px', maxWidth: 360 }}>
                        <div style={{ color: isDark ? '#94a3b8' : '#374151' }}>
                          {renderDetails(log.action, details)}
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px', color: textSub, fontFamily: 'monospace', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {log.ip_address || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginacja */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderTop: `1px solid ${border}`,
          }}>
            <div style={{ color: textSub, fontSize: 13 }}>
              Strona {page + 1} z {totalPages} · {total} wpisów
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn-secondary"
                style={{ fontSize: 12, padding: '5px 12px' }}
                onClick={() => goPage(page - 1)}
                disabled={page === 0}
              >
                ← Poprzednia
              </button>
              <button
                className="btn-secondary"
                style={{ fontSize: 12, padding: '5px 12px' }}
                onClick={() => goPage(page + 1)}
                disabled={page >= totalPages - 1}
              >
                Następna →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsPage;
