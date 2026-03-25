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
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get('/search', { params: { q: query } });
        setResults(res.data);
        setOpen(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

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
    setOpen(false);
    setResults(null);
  };

  const hasResults = results && (
    results.clients.length > 0 ||
    results.vehicles.length > 0 ||
    results.orders.length > 0
  );

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Szukaj klientów, pojazdów, zleceń..."
        onFocus={() => results && setOpen(true)}
        style={{ background: '#334155', border: 'none', color: 'white', borderRadius: 6 }}
      />

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: 'white',
          borderRadius: 8,
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          zIndex: 1000,
          overflow: 'hidden',
          maxHeight: 480,
          overflowY: 'auto',
        }}>
          {loading && (
            <div style={{ padding: 16, color: '#6b7280', textAlign: 'center' }}>
              Szukam...
            </div>
          )}

          {!loading && !hasResults && (
            <div style={{ padding: 16, color: '#6b7280', textAlign: 'center' }}>
              Brak wyników dla „{query}"
            </div>
          )}

          {!loading && results?.clients.length > 0 && (
            <div>
              <div style={{
                padding: '8px 16px',
                fontSize: 11,
                fontWeight: 700,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: '#f9fafb',
                borderBottom: '1px solid #e5e7eb',
              }}>
                Klienci
              </div>
              {results.clients.map(c => (
                <div
                  key={c.id}
                  onClick={() => handleNavigate(`/clients/${c.id}`)}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{c.full_name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{c.phone || c.email || ''}</div>
                  </div>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>klient</span>
                </div>
              ))}
            </div>
          )}

          {!loading && results?.vehicles.length > 0 && (
            <div>
              <div style={{
                padding: '8px 16px',
                fontSize: 11,
                fontWeight: 700,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: '#f9fafb',
                borderBottom: '1px solid #e5e7eb',
              }}>
                Pojazdy
              </div>
              {results.vehicles.map(v => (
                <div
                  key={v.id}
                  onClick={() => handleNavigate(`/vehicles/${v.id}`)}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{v.brand} {v.model}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {v.plate_number} · {v.client_name}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>pojazd</span>
                </div>
              ))}
            </div>
          )}

          {!loading && results?.orders.length > 0 && (
            <div>
              <div style={{
                padding: '8px 16px',
                fontSize: 11,
                fontWeight: 700,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: '#f9fafb',
                borderBottom: '1px solid #e5e7eb',
              }}>
                Zlecenia
              </div>
              {results.orders.map(o => (
                <div
                  key={o.id}
                  onClick={() => handleNavigate(`/orders/${o.id}`)}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{o.service_name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {o.client_name} · {o.vehicle_brand} {o.vehicle_model}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>
                    {STATUS_LABELS[o.status]}
                  </span>
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