import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';

const STATUS_LABELS = {
  inspection: 'Oględziny',
  planned: 'Zaplanowane',
  in_progress: 'W trakcie',
  done: 'Gotowe',
  released: 'Wydane',
  cancelled: 'Anulowane',
};

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.trim().length < 2 && !dateFrom && !dateTo) {
      setResults(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get('/search', {
          params: {
            q: query.trim() || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
          }
        });
        setResults(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, dateFrom, dateTo]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigate = (path) => {
    navigate(path);
    setQuery('');
    setDateFrom('');
    setDateTo('');
    setOpen(false);
    setResults(null);
  };

  const hasResults = results && (
    results.clients.length > 0 ||
    results.vehicles.length > 0 ||
    results.orders.length > 0
  );

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Szukaj..."
        onFocus={() => setOpen(true)}
        style={{ background: '#334155', border: 'none', color: 'white', borderRadius: 6 }}
      />

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          width: 320,
          background: 'white',
          borderRadius: 8,
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          zIndex: 1000,
          overflow: 'hidden',
          maxHeight: 520,
          overflowY: 'auto',
        }}>

          {/* Filtry dat wewnątrz panelu */}
          <div style={{
            padding: '10px 12px',
            borderBottom: '1px solid #e5e7eb',
            background: '#f9fafb',
            display: 'flex',
            gap: 6,
          }}>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              style={{
                flex: 1,
                fontSize: 11,
                padding: '5px 6px',
                border: '1px solid #d1d5db',
                borderRadius: 4,
                background: 'white',
                color: '#374151',
              }}
            />
            <span style={{ color: '#9ca3af', fontSize: 12, alignSelf: 'center' }}>—</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              style={{
                flex: 1,
                fontSize: 11,
                padding: '5px 6px',
                border: '1px solid #d1d5db',
                borderRadius: 4,
                background: 'white',
                color: '#374151',
              }}
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  fontSize: 16,
                  padding: '0 4px',
                  lineHeight: 1,
                }}
                title="Wyczyść daty"
              >
                ×
              </button>
            )}
          </div>

          {loading && (
            <div style={{ padding: 16, color: '#6b7280', textAlign: 'center' }}>Szukam...</div>
          )}

          {!loading && query.trim().length < 2 && !dateFrom && !dateTo && (
            <div style={{ padding: 16, color: '#9ca3af', textAlign: 'center', fontSize: 13 }}>
              Wpisz szukaną frazę lub wybierz zakres dat
            </div>
          )}

          {!loading && results && !hasResults && (
            <div style={{ padding: 16, color: '#6b7280', textAlign: 'center' }}>
              Brak wyników
            </div>
          )}

          {!loading && results?.clients.length > 0 && (
            <div>
              <div style={{ padding: '8px 16px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                Klienci
              </div>
              {results.clients.map(c => (
                <div
                  key={c.id}
                  onClick={() => handleNavigate(`/clients/${c.id}`)}
                  style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{c.full_name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{c.phone || c.email || ''}</div>
                  </div>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>klient</span>
                </div>
              ))}
            </div>
          )}

          {!loading && results?.vehicles.length > 0 && (
            <div>
              <div style={{ padding: '8px 16px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                Pojazdy
              </div>
              {results.vehicles.map(v => (
                <div
                  key={v.id}
                  onClick={() => handleNavigate(`/vehicles/${v.id}`)}
                  style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{v.brand} {v.model}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{v.plate_number} · {v.client_name}</div>
                  </div>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>pojazd</span>
                </div>
              ))}
            </div>
          )}

          {!loading && results?.orders.length > 0 && (
            <div>
              <div style={{ padding: '8px 16px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                Zlecenia
              </div>
              {results.orders.map(o => (
                <div
                  key={o.id}
                  onClick={() => handleNavigate(`/orders/${o.id}`)}
                  style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{o.service_name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {o.client_name} · {o.vehicle_brand} {o.vehicle_model}
                      {o.date_from && <span style={{ marginLeft: 4 }}>· {new Date(o.date_from).toLocaleDateString('pl-PL')}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>{STATUS_LABELS[o.status]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;