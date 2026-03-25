import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';

const STATUSES = {
  inspection: { label: 'Oględziny', color: '#6b7280' },
  planned: { label: 'Zaplanowane', color: '#2563eb' },
  in_progress: { label: 'W trakcie', color: '#d97706' },
  done: { label: 'Gotowe', color: '#16a34a' },
  released: { label: 'Wydane', color: '#7c3aed' },
  cancelled: { label: 'Anulowane', color: '#ef4444' },
};

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
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('pl-PL', { month: 'short' });
};

const BarChart = ({ data }) => {
  const max = Math.max(...data.map(d => parseFloat(d.total)), 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160 }}>
      {data.map((d, i) => {
        const pct = (parseFloat(d.total) / max) * 100;
        return (
          <div key={i} style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            height: '100%',
            gap: 4,
          }}>
            <div style={{ fontSize: 10, color: '#6b7280', textAlign: 'center' }}>
              {Math.round(parseFloat(d.total))} zł
            </div>
            <div style={{
              width: '100%',
              height: `${pct}%`,
              minHeight: 4,
              background: i === data.length - 1 ? '#2563eb' : '#bfdbfe',
              borderRadius: '4px 4px 0 0',
            }} />
            <div style={{ fontSize: 11, color: '#6b7280' }}>
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

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

      {/* Karty statystyk */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard
          label="Przychód w tym miesiącu"
          value={formatPrice(data.revenueThisMonth)}
          color="#2563eb"
        />
        <StatCard
          label="Zlecenia dziś"
          value={data.ordersToday}
          sub="aktywnych na dziś"
          color="#d97706"
        />
        <StatCard
          label="Aktywne zlecenia"
          value={activeOrders}
          sub="w toku (bez wydanych)"
          color="#16a34a"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

        {/* Wykres przychodów */}
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

        {/* Zlecenia według statusu */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            Aktywne zlecenia według statusu
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
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: STATUSES[s.status]?.color,
                        borderRadius: 4,
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Nadchodzące zlecenia */}
      <div className="card">
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          Nadchodzące zlecenia
        </h2>
        {data.upcomingOrders.length === 0 ? (
          <div style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>
            Brak nadchodzących zleceń
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Klient</th>
                <th>Pojazd</th>
                <th>Usługa</th>
                <th>Cena</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.upcomingOrders.map(order => (
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
                  <td style={{ whiteSpace: 'nowrap' }}>{formatPrice(order.price)}</td>
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