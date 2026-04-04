import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import useDarkMode from '../hooks/useDarkMode.js';
import { ORDER_STATUSES as STATUSES } from '../constants/orderStatuses.js';

const StatBox = ({ label, value, sub, color, isDark }) => (
  <div style={{
    background: isDark ? '#263548' : '#f9fafb',
    border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
    borderTop: `3px solid ${color || '#2563eb'}`,
    borderRadius: 8,
    padding: '14px 16px',
  }}>
    <div style={{
      fontSize: 11,
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: 6
    }}>
      {label}
    </div>
    <div style={{
      fontSize: 22,
      fontWeight: 700,
      color: color || (isDark ? '#e2e8f0' : '#111')
    }}>
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
        {sub}
      </div>
    )}
  </div>
);

const ClientStats = ({ clientId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const isDark = useDarkMode();

  useEffect(() => {
    api.get(`/clients/${clientId}/stats`)
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [clientId]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(price);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pl-PL');
  };

  if (loading) return null;
  if (!stats) return null;

  const totalOrders = stats.statusBreakdown.reduce((sum, s) => sum + parseInt(s.count), 0);

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
        Statystyki klienta
      </h2>

      {/* Karty statystyk */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
        marginBottom: 20
      }}>
        <StatBox
          label="Łączna wartość usług"
          value={formatPrice(stats.totalSpent)}
          color="#2563eb"
          isDark={isDark}
        />
        <StatBox
          label="Liczba zleceń"
          value={stats.ordersCount}
          sub="bez anulowanych"
          color="#16a34a"
          isDark={isDark}
        />
        <StatBox
          label="Ostatnia wizyta"
          value={formatDate(stats.lastOrder?.date_from)}
          sub={stats.lastOrder?.service_name || '—'}
          color="#d97706"
          isDark={isDark}
        />
      </div>

      {/* Ulubiona usługa */}
      {stats.topService && (
        <div style={{
          background: isDark ? '#1e3a5f' : '#f0f9ff',
          border: `1px solid ${isDark ? '#1d4ed8' : '#bae6fd'}`,
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{ fontSize: 18 }}>⭐</div>
          <div>
            <div style={{
              fontSize: 11,
              color: isDark ? '#60a5fa' : '#0369a1',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Najczęstsza usługa
            </div>
            <div style={{
              fontWeight: 600,
              color: isDark ? '#93c5fd' : '#0c4a6e'
            }}>
              {stats.topService.service_name}
              <span style={{
                color: isDark ? '#60a5fa' : '#0369a1',
                fontWeight: 400,
                marginLeft: 8,
                fontSize: 13
              }}>
                ({stats.topService.count}x)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Podział według statusów */}
      {stats.statusBreakdown.length > 0 && (
        <div>
          <div style={{
            fontSize: 12,
            color: '#6b7280',
            fontWeight: 600,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Zlecenia według statusu
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {stats.statusBreakdown.map(s => {
              const pct = Math.round((parseInt(s.count) / totalOrders) * 100);
              const status = STATUSES[s.status] || { label: s.status, color: '#6b7280' };

              return (
                <div key={s.status}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 3
                  }}>
                    <span style={{
                      fontSize: 12,
                      color: status.color,
                      fontWeight: 500
                    }}>
                      {status.label}
                    </span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                      {s.count} ({pct}%)
                    </span>
                  </div>

                  <div style={{
                    background: isDark ? '#334155' : '#f3f4f6',
                    borderRadius: 4,
                    height: 5
                  }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: status.color,
                      borderRadius: 4,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientStats;