import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import useDarkMode from '../hooks/useDarkMode.js';
import { usePageTitle } from '../hooks/usePageTitle.js';


const STATUSES = {
  inspection: { label: 'Oględziny', color: '#6b7280', colorDark: '#94a3b8', bg: '#f3f4f6', bgDark: '#1e293b' },
  planned: { label: 'Zaplanowane', color: '#1d4ed8', colorDark: '#60a5fa', bg: '#dbeafe', bgDark: '#1e3a5f' },
  in_progress: { label: 'W trakcie', color: '#92400e', colorDark: '#fbbf24', bg: '#fef3c7', bgDark: '#2d1f07' },
  done: { label: 'Gotowe', color: '#14532d', colorDark: '#4ade80', bg: '#dcfce7', bgDark: '#0f2a1a' },
  released: { label: 'Wydane', color: '#4c1d95', colorDark: '#c084fc', bg: '#ede9fe', bgDark: '#1e1435' },
  cancelled: { label: 'Anulowane', color: '#7f1d1d', colorDark: '#f87171', bg: '#fee2e2', bgDark: '#2a0f0f' },
};

const DAY_NAMES = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const toDateStr = (date) => date.toISOString().split('T')[0];

const formatHeader = (date) => {
  return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
};

const formatWeekRange = (monday) => {
  const sunday = addDays(monday, 6);
  const opts = { day: 'numeric', month: 'long' };
  return `${monday.toLocaleDateString('pl-PL', opts)} — ${sunday.toLocaleDateString('pl-PL', { ...opts, year: 'numeric' })}`;
};

const SchedulePage = () => {
  usePageTitle('Harmonogram');
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isDark = useDarkMode();

  const STATUS_PRIORITY = { in_progress: 0, planned: 1, inspection: 2, done: 3, released: 4, cancelled: 5 };

  useEffect(() => {
    setLoading(true);
    const dateFrom = toDateStr(weekStart);
    const dateTo = toDateStr(addDays(weekStart, 6));
    api.get('/orders', { params: { date_from: dateFrom, date_to: dateTo } }).then(res => {
      setOrders(res.data);
      setLoading(false);
    });
  }, [weekStart]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getOrdersForDay = (date) => {
    const dateStr = toDateStr(date);
    return orders
      .filter(order => {
        if (!order.date_from) return false;
        const from = order.date_from.split('T')[0];
        const to = order.date_to ? order.date_to.split('T')[0] : from;
        return from <= dateStr && dateStr <= to && order.status !== 'cancelled';
      })
      .sort((a, b) => (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99));
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
  };

  const goToPrevWeek = () => setWeekStart(prev => addDays(prev, -7));
  const goToNextWeek = () => setWeekStart(prev => addDays(prev, 7));
  const goToCurrentWeek = () => setWeekStart(getMonday(new Date()));

  const formatPrice = (price) => {
    if (!price) return null;
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(price);
  };

  return (
    <div>
      {/* Nagłówek */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Harmonogram</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn-secondary" onClick={goToPrevWeek}>←</button>
          <button className="btn-secondary" onClick={goToCurrentWeek} style={{ fontSize: 13 }}>
            Dziś
          </button>
          <button className="btn-secondary" onClick={goToNextWeek}>→</button>
        </div>
      </div>

      {/* Zakres tygodnia */}
      <div style={{ fontSize: 15, color: '#6b7280', marginBottom: 16, fontWeight: 500 }}>
        {formatWeekRange(weekStart)}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>Ładowanie...</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 8,
        }}>
          {days.map((day, i) => {
            const dayOrders = getOrdersForDay(day);
            const today = isToday(day);

            return (
              <div key={i} style={{
                background: isDark ? '#1e293b' : 'white',
                borderRadius: 8,
                border: today
                  ? '2px solid #2563eb'
                  : `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                overflow: 'hidden',
                minHeight: 200,
              }}>
                <div style={{
                  padding: '10px 12px',
                  background: today ? '#2563eb' : (isDark ? '#263548' : '#f9fafb'),
                  borderBottom: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: today ? 'white' : (isDark ? '#94a3b8' : '#6b7280'),
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {DAY_NAMES[i]}
                  </div>
                  <div style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: today ? 'white' : (isDark ? '#e2e8f0' : '#111827'),
                    lineHeight: 1.2,
                  }}>
                    {formatHeader(day)}
                  </div>
                </div>

                <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {dayOrders.length === 0 ? (
                    <div style={{
                      color: isDark ? '#475569' : '#d1d5db',
                      fontSize: 12,
                      textAlign: 'center',
                      padding: '16px 0'
                    }}>
                      brak zleceń
                    </div>
                  ) : (
                    dayOrders.map(order => {
                      const status = STATUSES[order.status] || STATUSES.inspection;
                      const statusColor = isDark ? status.colorDark : status.color;
                      const statusBg = isDark ? status.bgDark : status.bg;
                      return (
                        <div
                          key={order.id}
                          onClick={() => navigate(`/orders/${order.id}`)}
                          style={{
                            background: statusBg,
                            borderLeft: `3px solid ${statusColor}`,
                            borderRadius: 4,
                            padding: '6px 8px',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          <div style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: statusColor,
                            marginBottom: 2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {order.service_name}
                          </div>

                          <div style={{
                            fontSize: 11,
                            color: isDark ? '#e2e8f0' : '#374151',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {order.client_name}
                          </div>

                          <div style={{
                            fontSize: 11,
                            color: isDark ? '#94a3b8' : '#6b7280',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {order.vehicle_brand} {order.vehicle_model}
                          </div>

                          {order.price && (
                            <div style={{
                              fontSize: 11,
                              color: statusColor,
                              fontWeight: 600,
                              marginTop: 2
                            }}>
                              {formatPrice(order.price)}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SchedulePage;