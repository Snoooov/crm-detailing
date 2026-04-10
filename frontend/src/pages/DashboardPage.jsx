import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ORDER_STATUSES as STATUSES } from '../constants/orderStatuses.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const formatPrice = (price) => {
  if (!price && price !== 0) return '—';
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(price);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pl-PL');
};

const formatMonth = (yyyymm) => {
  const [year, month] = yyyymm.split('-');
  return new Date(year, month - 1).toLocaleDateString('pl-PL', { month: 'short' });
};

const BarChart = ({ data }) => {
  const values = data.map(d => parseFloat(d.total));
  const max = Math.max(...values, 1);
  const maxIndex = values.indexOf(Math.max(...values));

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160 }}>
      {data.map((d, i) => {
        const pct = (parseFloat(d.total) / max) * 100;
        const isMax = i === maxIndex;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 4 }}>
            <div style={{ fontSize: 10, color: isMax ? '#16a34a' : '#6b7280', textAlign: 'center', fontWeight: isMax ? 700 : 400 }}>
              {Math.round(parseFloat(d.total))} zł
            </div>
            <div style={{ width: '100%', height: `${pct}%`, minHeight: 4, background: isMax ? '#16a34a' : '#bfdbfe', borderRadius: '4px 4px 0 0' }} />
            <div style={{ fontSize: 11, color: isMax ? '#16a34a' : '#6b7280', fontWeight: isMax ? 700 : 400 }}>
              {formatMonth(d.month)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const StatCard = ({ label, value, sub, color }) => (
  <div className="card" style={{ borderTop: `3px solid ${color}` }}>
    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{sub}</div>}
  </div>
);

const QuickAction = ({ label, color, onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: color,
      color: 'white',
      border: 'none',
      borderRadius: 8,
      padding: '14px 20px',
      fontSize: 14,
      fontWeight: 600,
      cursor: 'pointer',
      flex: 1,
      textAlign: 'left',
    }}
  >
    + {label}
  </button>
);

const DashboardPage = () => {
  usePageTitle('Strona główna');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    api.get('/dashboard').then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Ładowanie...</div>;
  if (!data) return <div>Błąd ładowania danych</div>;

  const activeOrders = data.ordersByStatus.reduce((sum, s) => sum + parseInt(s.count), 0);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Dashboard</h1>

      {/* Szybkie akcje */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <QuickAction label="Nowe zlecenie" color="#2563eb" onClick={() => navigate('/orders/new')} />
        <QuickAction label="Nowy klient" color="#16a34a" onClick={() => navigate('/clients')} />
        <QuickAction label="Nowy pojazd" color="#7c3aed" onClick={() => navigate('/vehicles')} />
      </div>

      {/* Karty statystyk */}
      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
        {isAdmin && (
          <StatCard
            label="Przychód w tym miesiącu"
            value={formatPrice(data.revenueThisMonth)}
            sub="tylko opłacone zlecenia"
            color="#2563eb"
          />
        )}
        <StatCard
          label={isAdmin ? 'Zlecenia dziś' : 'Moje zlecenia dziś'}
          value={data.ordersToday}
          sub={isAdmin ? 'aktywnych na dziś' : 'przypisanych do mnie'}
          color="#d97706"
        />
        <StatCard
          label={isAdmin ? 'Aktywne zlecenia' : 'Moje aktywne zlecenia'}
          value={activeOrders}
          sub="w toku (bez wydanych)"
          color="#16a34a"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 1fr' : '1fr', gap: 24, marginBottom: 24 }}>
        {/* Wykres przychodów — tylko admin */}
        {isAdmin && (
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              Przychody — ostatnie 6 miesięcy
            </h2>
            {data.monthlyRevenue.length === 0 ? (
              <div style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>Brak danych</div>
            ) : (
              <BarChart data={data.monthlyRevenue} />
            )}
          </div>
        )}

        {/* Zlecenia według statusu */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            {isAdmin ? 'Aktywne zlecenia według statusu' : 'Moje zlecenia według statusu'}
          </h2>
          {data.ordersByStatus.length === 0 ? (
            <div style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>Brak aktywnych zleceń</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.ordersByStatus.map(s => {
                const pct = Math.round((parseInt(s.count) / activeOrders) * 100);
                return (
                  <div key={s.status}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: STATUSES[s.status]?.color, fontWeight: 500 }}>
                        {STATUSES[s.status]?.label}
                      </span>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>{s.count}</span>
                    </div>
                    <div style={{ background: '#f3f4f6', borderRadius: 4, height: 6 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: STATUSES[s.status]?.color, borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tygodniowy breakdown kasy — tylko admin */}
      {isAdmin && data.weeklyDailyRevenue && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Kasa — ten tydzień</h2>
          {data.weeklyDailyRevenue.length === 0 ? (
            <div style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>Brak danych w tym tygodniu</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Dzień</th>
                  <th style={{ textAlign: 'right' }}>Zlecenia</th>
                  <th style={{ textAlign: 'right' }}>Gotówka</th>
                  <th style={{ textAlign: 'right' }}>Karta</th>
                  <th style={{ textAlign: 'right' }}>Razem</th>
                </tr>
              </thead>
              <tbody>
                {data.weeklyDailyRevenue.map((d, i) => (
                  <tr key={i}>
                    <td>{new Date(d.day).toLocaleDateString('pl-PL', { weekday: 'long', day: '2-digit', month: '2-digit' })}</td>
                    <td style={{ textAlign: 'right', color: '#6b7280' }}>{d.orders}</td>
                    <td style={{ textAlign: 'right', color: '#16a34a' }}>{formatPrice(d.cash)}</td>
                    <td style={{ textAlign: 'right', color: '#2563eb' }}>{formatPrice(d.card)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatPrice(d.revenue)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid #e5e7eb', fontWeight: 700 }}>
                  <td>Razem</td>
                  <td style={{ textAlign: 'right' }}>
                    {data.weeklyDailyRevenue.reduce((s, d) => s + parseInt(d.orders), 0)}
                  </td>
                  <td style={{ textAlign: 'right', color: '#16a34a' }}>
                    {formatPrice(data.weeklyDailyRevenue.reduce((s, d) => s + parseFloat(d.cash), 0))}
                  </td>
                  <td style={{ textAlign: 'right', color: '#2563eb' }}>
                    {formatPrice(data.weeklyDailyRevenue.reduce((s, d) => s + parseFloat(d.card), 0))}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {formatPrice(data.weeklyDailyRevenue.reduce((s, d) => s + parseFloat(d.revenue), 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Nadchodzące zlecenia */}
      <div className="card">
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          {isAdmin ? 'Nadchodzące zlecenia' : 'Moje nadchodzące zlecenia'}
        </h2>
        {data.upcomingOrders.length === 0 ? (
          <div style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>Brak nadchodzących zleceń</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Klient</th>
                <th>Pojazd</th>
                <th>Usługa</th>
                {isAdmin && <th>Cena</th>}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.upcomingOrders.map(order => (
                <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/orders/${order.id}`)}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(order.date_from)}</td>
                  <td>{order.client_name}</td>
                  <td>
                    {order.vehicle_brand} {order.vehicle_model}
                    <span style={{ color: '#6b7280', fontSize: 12, marginLeft: 6 }}>{order.plate_number}</span>
                  </td>
                  <td>{order.service_name}</td>
                  {isAdmin && <td style={{ whiteSpace: 'nowrap' }}>{formatPrice(order.price)}</td>}
                  <td>
                    <span style={{
                      color: STATUSES[order.status]?.color,
                      border: `1px solid ${STATUSES[order.status]?.color}`,
                      borderRadius: 6,
                      padding: '2px 8px',
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      {STATUSES[order.status]?.label}
                    </span>
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

export default DashboardPage;