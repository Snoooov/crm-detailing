import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';

const STATUSES = {
  inspection: { label: 'Oględziny', color: '#6b7280', bg: '#f3f4f6' },
  planned: { label: 'Zaplanowane', color: '#1d4ed8', bg: '#dbeafe' },
  in_progress: { label: 'W trakcie', color: '#92400e', bg: '#fef3c7' },
  done: { label: 'Gotowe', color: '#14532d', bg: '#dcfce7' },
  released: { label: 'Wydane', color: '#4c1d95', bg: '#ede9fe' },
  cancelled: { label: 'Anulowane', color: '#7f1d1d', bg: '#fee2e2' },
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
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.get('/orders').then(res => {
      setOrders(res.data);
      setLoading(false);
    });
  }, []);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getOrdersForDay = (date) => {
    const dateStr = toDateStr(date);
    return orders.filter(order => {
      if (!order.date_from) return false;
      const from = order.date_from.split('T')[0];
      const to = order.date_to ? order.date_to.split('T')[0] : from;
      return from <= dateStr && dateStr <= to && order.status !== 'cancelled';
    });
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
                background: 'white',
                borderRadius: 8,
                border: today ? '2px solid #2563eb' : '1px solid #e5e7eb',
                overflow: 'hidden',
                minHeight: 200,
              }}>
                {/* Nagłówek dnia */}
                <div style={{
                  padding: '10px 12px',
                  background: today ? '#2563eb' : '#f9fafb',
                  borderBottom: '1px solid #e5e7eb',
                }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: today ? 'white' : '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {DAY_NAMES[i]}
                  </div>
                  <div style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: today ? 'white' : '#111827',
                    lineHeight: 1.2,
                  }}>
                    {formatHeader(day)}
                  </div>
                </div>

                {/* Zlecenia */}
                <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {dayOrders.length === 0 ? (
                    <div style={{ color: '#d1d5db', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
                      brak zleceń
                    </div>
                  ) : (
                    dayOrders.map(order => {
                      const status = STATUSES[order.status] || STATUSES.inspection;
                      return (
                        <div
                          key={order.id}
                          onClick={() => navigate(`/orders/${order.id}`)}
                          style={{
                            background: status.bg,
                            borderLeft: `3px solid ${status.color}`,
                            borderRadius: 4,
                            padding: '6px 8px',
                            cursor: 'pointer',
                            transition: 'opacity 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          <div style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: status.color,
                            marginBottom: 2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {order.service_name}
                          </div>
                          <div style={{
                            fontSize: 11,
                            color: '#374151',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {order.client_name}
                          </div>
                          <div style={{
                            fontSize: 11,
                            color: '#6b7280',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {order.vehicle_brand} {order.vehicle_model}
                          </div>
                          {order.price && (
                            <div style={{ fontSize: 11, color: status.color, fontWeight: 600, marginTop: 2 }}>
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