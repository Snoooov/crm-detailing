import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useDarkMode from '../hooks/useDarkMode.js';
import { ORDER_STATUSES } from '../constants/orderStatuses.js';

const PER_PAGE = 10;

const fmt = (price) => {
  if (!price) return '—';
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(price);
};

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pl-PL');
};

const CollapsibleOrders = ({ orders = [], title = 'Historia zleceń' }) => {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const isDark = useDarkMode();
  const navigate = useNavigate();

  const sorted = [...orders].sort((a, b) => {
    const da = a.date_from ? new Date(a.date_from) : new Date(0);
    const db = b.date_from ? new Date(b.date_from) : new Date(0);
    return da - db;
  });

  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const slice = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const from = (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, sorted.length);

  const border = `1px solid ${isDark ? 'var(--border)' : 'var(--border)'}`;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Nagłówek — klikalny */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          borderRadius: 0,
          color: 'inherit',
          boxShadow: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
          <span style={{
            background: isDark ? 'var(--surface-2)' : 'var(--bg)',
            border,
            borderRadius: 99,
            padding: '1px 9px',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--text-2)',
          }}>
            {orders.length}
          </span>
        </div>
        <span style={{
          fontSize: 18,
          color: 'var(--text-3)',
          transition: 'transform 0.2s',
          display: 'inline-block',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          ⌄
        </span>
      </button>

      {/* Zawartość */}
      {expanded && (
        <div style={{ borderTop: border }}>
          {sorted.length === 0 ? (
            <div style={{ padding: '20px', color: 'var(--text-3)', fontSize: 13 }}>
              Brak zleceń
            </div>
          ) : (
            <>
              {slice.map((o, i) => {
                const status = ORDER_STATUSES[o.status];
                return (
                  <div
                    key={o.id}
                    onClick={() => navigate(`/orders/${o.id}`)}
                    style={{
                      padding: '12px 20px',
                      borderBottom: i < slice.length - 1 ? border : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isDark ? 'var(--accent-light)' : 'var(--accent-light)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>
                        {o.service_name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                        {o.vehicle_brand && `${o.vehicle_brand} ${o.vehicle_model || ''} · `}
                        {fmtDate(o.date_from)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
                        {fmt(o.price)}
                      </span>
                      {status && (
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          color: status.color,
                          border: `1px solid ${status.color}`,
                          borderRadius: 5,
                          padding: '2px 7px',
                          whiteSpace: 'nowrap',
                        }}>
                          {status.label}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Paginacja */}
              {totalPages > 1 && (
                <div style={{
                  padding: '12px 20px',
                  borderTop: border,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {from}–{to} z {sorted.length}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn-secondary"
                      style={{ padding: '5px 12px', fontSize: 12 }}
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      ← Poprzednie
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ padding: '5px 12px', fontSize: 12 }}
                      disabled={page === totalPages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Pokaż więcej →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CollapsibleOrders;
