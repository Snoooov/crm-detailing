import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios.js';
import useDarkMode from '../hooks/useDarkMode.js';

const fmt = (val) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(parseFloat(val) || 0);

const fmtDate = (d) => new Date(d).toLocaleDateString('pl-PL');

const PRESETS = [
  { label: 'Ten tydzień', key: 'week' },
  { label: 'Ten miesiąc', key: 'month' },
  { label: 'Poprzedni miesiąc', key: 'prev_month' },
  { label: 'Ten rok', key: 'year' },
  { label: 'Własny zakres', key: 'custom' },
];

function getPresetDates(key) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (key === 'week') {
    const day = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const mon = new Date(now); mon.setDate(now.getDate() - day);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { from: iso(mon), to: iso(sun) };
  }
  if (key === 'month') {
    return {
      from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`,
      to: iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    };
  }
  if (key === 'prev_month') {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: iso(first), to: iso(last) };
  }
  if (key === 'year') {
    return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` };
  }
  return null;
}

const Delta = ({ current, prev }) => {
  const c = parseFloat(current) || 0;
  const p = parseFloat(prev) || 0;
  if (p === 0) return null;
  const pct = Math.round(((c - p) / p) * 100);
  const positive = pct >= 0;
  return (
    <div style={{ fontSize: 12, color: positive ? '#16a34a' : '#ef4444', fontWeight: 600, marginTop: 4 }}>
      {positive ? '↑' : '↓'} {Math.abs(pct)}% vs poprzedni okres
    </div>
  );
};

const SummaryCard = ({ label, value, sub, color, rawCurrent, rawPrev }) => (
  <div className="card" style={{ borderTop: `3px solid ${color}` }}>
    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
    <Delta current={rawCurrent} prev={rawPrev} />
    {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
  </div>
);

const DayBarChart = ({ data, isDark }) => {
  if (!data || data.length === 0) return <div style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>Brak danych</div>;

  const revenues = data.map(d => parseFloat(d.revenue));
  const max = Math.max(...revenues, 1);

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, minHeight: 180, minWidth: data.length * 40 }}>
        {data.map((d, i) => {
          const pct = (parseFloat(d.revenue) / max) * 100;
          const hasRevenue = parseFloat(d.revenue) > 0;
          return (
            <div key={i} title={`${fmtDate(d.day)}\nPrzychód: ${fmt(d.revenue)}\nZlecenia: ${d.orders}`}
              style={{ flex: 1, minWidth: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: 180, gap: 4 }}>
              {hasRevenue && (
                <div style={{ fontSize: 9, color: '#6b7280', textAlign: 'center', lineHeight: 1.2 }}>
                  {Math.round(parseFloat(d.revenue))}
                </div>
              )}
              <div style={{
                width: '100%', height: `${Math.max(pct, 2)}%`, minHeight: 4,
                background: hasRevenue ? '#2563eb' : (isDark ? '#334155' : '#e5e7eb'),
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s',
              }} />
              <div style={{ fontSize: 10, color: '#6b7280', textAlign: 'center', whiteSpace: 'nowrap' }}>
                {new Date(d.day).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}
              </div>
              {parseInt(d.orders) > 0 && (
                <div style={{ fontSize: 9, color: '#94a3b8' }}>{d.orders}×</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

function exportCSV(data, period) {
  const lines = [
    ['Raport przychodów', `${data.period.from} — ${data.period.to}`],
    [],
    ['PODSUMOWANIE'],
    ['Łączny przychód', fmt(data.summary.total_revenue)],
    ['Liczba zleceń', data.summary.total_orders],
    ['Zlecenia anulowane', data.summary.cancelled_orders],
    ['Śr. wartość zlecenia', fmt(data.summary.avg_order_value)],
    ['Gotówka', fmt(data.summary.total_cash)],
    ['Karta', fmt(data.summary.total_card)],
    [],
    ['PRZYCHODY DZIENNE'],
    ['Data', 'Przychód', 'Gotówka', 'Karta', 'Zlecenia'],
    ...data.revenueByDay.map(d => [fmtDate(d.day), fmt(d.revenue), fmt(d.cash), fmt(d.card), d.orders]),
    [],
    ['TOP USŁUGI'],
    ['Usługa', 'Liczba', 'Łączna wartość', 'Śr. wartość'],
    ...data.topServices.map(s => [s.service_name, s.count, fmt(s.total_value), fmt(s.avg_value)]),
    [],
    ['PRACOWNICY'],
    ['Pracownik', 'Zlecenia', 'Łączna wartość'],
    ...data.employeeStats.map(e => [e.name, e.orders_count, fmt(e.total_value)]),
  ];

  const csv = lines.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `raport_${data.period.from}_${data.period.to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const STATUS_LABELS = {
  planned: 'Zaplanowane',
  inspection: 'Inspekcja',
  in_progress: 'W trakcie',
  released: 'Wydane',
  cancelled: 'Anulowane',
};

const EmployeeModal = ({ userId, period, onClose, isDark }) => {
  const [empData, setEmpData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/reports/employee/${userId}`, { params: period })
      .then(res => setEmpData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [userId, period]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: isDark ? '#1e293b' : '#fff',
          borderRadius: 12, padding: 24, width: '100%', maxWidth: 560,
          maxHeight: '85vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Ładowanie...</div>
        ) : !empData ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#ef4444' }}>Błąd ładowania danych</div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{empData.user.name}</h2>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{empData.user.email}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  {fmtDate(empData.period.from)} — {fmtDate(empData.period.to)}
                </div>
              </div>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Zlecenia', value: empData.summary.total_orders, color: '#2563eb' },
                { label: 'Przychód', value: fmt(empData.summary.total_revenue), color: '#16a34a' },
                { label: 'Śr. zlecenie', value: fmt(empData.summary.avg_order_value), color: '#d97706' },
              ].map(card => (
                <div key={card.label} style={{
                  background: isDark ? '#0f172a' : '#f9fafb',
                  border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                  borderTop: `3px solid ${card.color}`,
                  borderRadius: 8, padding: '12px 14px',
                }}>
                  <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{card.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: card.color }}>{card.value}</div>
                </div>
              ))}
            </div>

            {/* Status breakdown */}
            {empData.statusBreakdown.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Statusy zleceń</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {empData.statusBreakdown.map(s => (
                    <div key={s.status} style={{
                      background: isDark ? '#0f172a' : '#f3f4f6',
                      border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                      borderRadius: 6, padding: '4px 12px', fontSize: 13,
                    }}>
                      <span style={{ color: '#6b7280' }}>{STATUS_LABELS[s.status] || s.status}: </span>
                      <span style={{ fontWeight: 600 }}>{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top services */}
            {empData.topServices.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Top usługi</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {empData.topServices.map((s, i) => {
                    const maxCount = parseInt(empData.topServices[0].count);
                    const pct = Math.round((parseInt(s.count) / maxCount) * 100);
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                          <span style={{ fontWeight: 500 }}>{s.service_name}</span>
                          <span style={{ color: '#6b7280' }}>{s.count}× · {fmt(s.total_value)}</span>
                        </div>
                        <div style={{ background: isDark ? '#334155' : '#f3f4f6', borderRadius: 3, height: 4 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: '#7c3aed', borderRadius: 3 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent orders */}
            {empData.recentOrders.length > 0 && (
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Ostatnie zlecenia</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {empData.recentOrders.map(o => (
                    <div key={o.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: isDark ? '#0f172a' : '#f9fafb',
                      border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                      borderRadius: 6, padding: '8px 12px', fontSize: 12,
                    }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{o.service_name}</div>
                        <div style={{ color: '#6b7280' }}>{o.client_name} · {fmtDate(o.date_from)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600 }}>{fmt(o.price)}</div>
                        <div style={{ color: o.is_paid ? '#16a34a' : '#ef4444' }}>
                          {o.is_paid ? 'Opłacone' : 'Nieopłacone'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const ReportsPage = () => {
  const [preset, setPreset] = useState('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const isDark = useDarkMode();

  const load = useCallback(() => {
    let dates;
    if (preset === 'custom') {
      if (!customFrom || !customTo) return;
      dates = { from: customFrom, to: customTo };
    } else {
      dates = getPresetDates(preset);
    }
    setLoading(true);
    api.get('/reports', { params: dates })
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    if (preset !== 'custom') load();
  }, [preset, load]);

  const paid = data?.paymentBreakdown.find(p => p.is_paid) || { count: 0, value: 0 };
  const unpaid = data?.paymentBreakdown.find(p => !p.is_paid) || { count: 0, value: 0 };
  const totalOrders = data ? parseInt(data.summary.total_orders) : 0;
  const cashPct = data && parseFloat(data.summary.total_cash) + parseFloat(data.summary.total_card) > 0
    ? Math.round(parseFloat(data.summary.total_cash) / (parseFloat(data.summary.total_cash) + parseFloat(data.summary.total_card)) * 100)
    : 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Raporty</h1>
        {data && (
          <button className="btn-primary" onClick={() => exportCSV(data)}>
            Eksport CSV
          </button>
        )}
      </div>

      {/* Filtry okresu */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {PRESETS.map(p => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: `1px solid ${preset === p.key ? '#2563eb' : '#d1d5db'}`,
                background: preset === p.key ? '#2563eb' : 'transparent',
                color: preset === p.key ? 'white' : 'inherit',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: preset === p.key ? 600 : 400,
              }}
            >
              {p.label}
            </button>
          ))}
          {preset === 'custom' && (
            <>
              <input
                type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
              />
              <span style={{ color: '#6b7280' }}>—</span>
              <input
                type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
              />
              <button className="btn-primary" onClick={load} style={{ padding: '6px 14px' }}>
                Szukaj
              </button>
            </>
          )}
          {data && (
            <span style={{ marginLeft: 'auto', fontSize: 13, color: '#6b7280' }}>
              {fmtDate(data.period.from)} — {fmtDate(data.period.to)}
            </span>
          )}
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>Ładowanie...</div>}

      {!loading && data && (
        <>
          {/* Karty podsumowania */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <SummaryCard
              label="Łączny przychód"
              value={fmt(data.summary.total_revenue)}
              sub="tylko opłacone"
              color="#2563eb"
              rawCurrent={data.summary.total_revenue}
              rawPrev={data.prevSummary?.total_revenue}
            />
            <SummaryCard
              label="Liczba zleceń"
              value={totalOrders}
              sub={`${data.summary.cancelled_orders} anulowanych`}
              color="#16a34a"
              rawCurrent={data.summary.total_orders}
              rawPrev={data.prevSummary?.total_orders}
            />
            <SummaryCard
              label="Śr. wartość zlecenia"
              value={fmt(data.summary.avg_order_value)}
              sub="opłacone zlecenia"
              color="#d97706"
              rawCurrent={data.summary.avg_order_value}
              rawPrev={data.prevSummary?.avg_order_value}
            />
            <SummaryCard
              label="Nieopłacone"
              value={fmt(unpaid.value)}
              sub={`${unpaid.count || 0} zleceń`}
              color="#ef4444"
            />
          </div>

          {/* Gotówka vs Karta */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Płatności</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>Gotówka</span>
                  <span style={{ fontWeight: 700 }}>{fmt(data.summary.total_cash)}</span>
                </div>
                <div style={{ background: isDark ? '#334155' : '#f3f4f6', borderRadius: 4, height: 10 }}>
                  <div style={{ width: `${cashPct}%`, height: '100%', background: '#16a34a', borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{cashPct}%</div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                  <span style={{ color: '#2563eb', fontWeight: 600 }}>Karta</span>
                  <span style={{ fontWeight: 700 }}>{fmt(data.summary.total_card)}</span>
                </div>
                <div style={{ background: isDark ? '#334155' : '#f3f4f6', borderRadius: 4, height: 10 }}>
                  <div style={{ width: `${100 - cashPct}%`, height: '100%', background: '#2563eb', borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{100 - cashPct}%</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{
                flex: 1, padding: '10px 14px', borderRadius: 8,
                background: isDark ? '#14532d22' : '#f0fdf4',
                border: '1px solid #86efac',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>Opłacone zlecenia</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#16a34a' }}>{paid.count || 0}</span>
              </div>
              <div style={{
                flex: 1, padding: '10px 14px', borderRadius: 8,
                background: isDark ? '#7f1d1d22' : '#fef2f2',
                border: '1px solid #fca5a5',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>Nieopłacone</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>{unpaid.count || 0}</span>
              </div>
            </div>
          </div>

          {/* Wykres dzienny */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Przychody dzienne</h2>
            <DayBarChart data={data.revenueByDay} isDark={isDark} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            {/* Top usługi */}
            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Top usługi</h2>
              {data.topServices.length === 0 ? (
                <div style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>Brak danych</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.topServices.map((s, i) => {
                    const maxCount = parseInt(data.topServices[0].count);
                    const pct = Math.round((parseInt(s.count) / maxCount) * 100);
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                          <span style={{ fontWeight: 500 }}>
                            <span style={{ color: '#6b7280', marginRight: 6 }}>#{i + 1}</span>
                            {s.service_name}
                          </span>
                          <span style={{ color: '#6b7280', whiteSpace: 'nowrap', marginLeft: 8 }}>
                            {s.count}× · {fmt(s.total_value)}
                          </span>
                        </div>
                        <div style={{ background: isDark ? '#334155' : '#f3f4f6', borderRadius: 4, height: 5 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: '#2563eb', borderRadius: 4 }} />
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                          śr. {fmt(s.avg_value)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Ranking pracowników */}
            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Pracownicy</h2>
              {data.employeeStats.length === 0 ? (
                <div style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>Brak danych</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.employeeStats.map((e, i) => {
                    const maxOrders = parseInt(data.employeeStats[0].orders_count);
                    const pct = Math.round((parseInt(e.orders_count) / maxOrders) * 100);
                    const medals = ['🥇', '🥈', '🥉'];
                    return (
                      <div
                        key={i}
                        onClick={() => setSelectedEmployee({ id: e.id, name: e.name })}
                        style={{ cursor: 'pointer', borderRadius: 6, padding: '6px 8px', margin: '-6px -8px',
                          transition: 'background 0.15s' }}
                        onMouseEnter={ev => ev.currentTarget.style.background = isDark ? '#334155' : '#f3f4f6'}
                        onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                          <span style={{ fontWeight: 500 }}>
                            <span style={{ marginRight: 6 }}>{medals[i] || `#${i + 1}`}</span>
                            {e.name}
                          </span>
                          <span style={{ color: '#6b7280', whiteSpace: 'nowrap', marginLeft: 8 }}>
                            {e.orders_count} zleceń · {fmt(e.total_value)}
                          </span>
                        </div>
                        <div style={{ background: isDark ? '#1e293b' : '#f3f4f6', borderRadius: 4, height: 5 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: '#7c3aed', borderRadius: 4 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, textAlign: 'center' }}>
                Kliknij pracownika, aby zobaczyć szczegóły
              </div>
            </div>
          </div>

          {/* Tabela dzienna */}
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Zestawienie dzienne</h2>
            {data.revenueByDay.length === 0 ? (
              <div style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>Brak danych</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th style={{ textAlign: 'right' }}>Zlecenia</th>
                    <th style={{ textAlign: 'right' }}>Gotówka</th>
                    <th style={{ textAlign: 'right' }}>Karta</th>
                    <th style={{ textAlign: 'right' }}>Przychód</th>
                  </tr>
                </thead>
                <tbody>
                  {data.revenueByDay.map((d, i) => (
                    <tr key={i}>
                      <td>{fmtDate(d.day)}</td>
                      <td style={{ textAlign: 'right', color: '#6b7280' }}>{d.orders}</td>
                      <td style={{ textAlign: 'right', color: '#16a34a' }}>{fmt(d.cash)}</td>
                      <td style={{ textAlign: 'right', color: '#2563eb' }}>{fmt(d.card)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(d.revenue)}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '2px solid #e5e7eb', fontWeight: 700 }}>
                    <td>Razem</td>
                    <td style={{ textAlign: 'right' }}>{data.summary.total_orders}</td>
                    <td style={{ textAlign: 'right', color: '#16a34a' }}>{fmt(data.summary.total_cash)}</td>
                    <td style={{ textAlign: 'right', color: '#2563eb' }}>{fmt(data.summary.total_card)}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(data.summary.total_revenue)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {selectedEmployee && (
        <EmployeeModal
          userId={selectedEmployee.id}
          period={data?.period}
          onClose={() => setSelectedEmployee(null)}
          isDark={isDark}
        />
      )}
    </div>
  );
};

export default ReportsPage;
