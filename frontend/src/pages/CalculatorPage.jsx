import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const CAR_SIZES = [
  { id: 'small',  label: 'Małe',    desc: 'Fiat, Polo, Corsa, 208',    mult: 1.0  },
  { id: 'medium', label: 'Średnie', desc: 'Golf, Focus, A4, 3-series',  mult: 1.2  },
  { id: 'large',  label: 'Duże',    desc: 'E-klasa, 5-series, A6',      mult: 1.45 },
  { id: 'suv',    label: 'SUV',     desc: 'Touareg, X5, Q7, GLE',       mult: 1.6  },
  { id: 'van',    label: 'Van',     desc: 'Transit, Vito, Sprinter',    mult: 1.85 },
];

const fmt = (n) => Math.round(n).toLocaleString('pl-PL') + ' zł';

export default function CalculatorPage() {
  usePageTitle('Kalkulator wyceny');
  const navigate = useNavigate();

  const [services, setServices]   = useState([]);
  const [selected, setSelected]   = useState(new Set());
  const [sizeId, setSizeId]       = useState('medium');
  const [loading, setLoading]     = useState(true);

  const size = CAR_SIZES.find(s => s.id === sizeId);

  useEffect(() => {
    api.get('/services').then(r => {
      setServices(r.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedServices = services.filter(s => selected.has(s.id));
  const baseTotal = selectedServices.reduce((sum, s) => sum + (parseFloat(s.base_price) || 0), 0);
  const total = baseTotal * size.mult;
  const totalMin = Math.round(total * 0.9);
  const totalMax = Math.round(total * 1.15);

  const c = {
    bg: 'var(--bg, #0f1117)',
    card: 'rgba(255,255,255,0.04)',
    cardHover: 'rgba(255,255,255,0.07)',
    border: 'rgba(255,255,255,0.08)',
    borderActive: 'rgba(139,92,246,0.5)',
    text: '#f1f5f9',
    sub: '#94a3b8',
    accent: '#8b5cf6',
    accentDim: 'rgba(139,92,246,0.15)',
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 960, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: c.text, margin: 0, marginBottom: 4 }}>
          Kalkulator wyceny
        </h1>
        <p style={{ fontSize: 13, color: c.sub, margin: 0 }}>
          Szybka wycena orientacyjna dla klienta. Ceny bazowe z katalogu usług × mnożnik rozmiaru auta.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 20, alignItems: 'start' }}>

        {/* Lewa kolumna — rozmiar auta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            background: c.card, border: `1px solid ${c.border}`,
            borderRadius: 12, padding: '18px 20px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: c.sub, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
              Rozmiar pojazdu
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CAR_SIZES.map(s => {
                const active = sizeId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSizeId(s.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: active ? c.accentDim : 'transparent',
                      border: `1px solid ${active ? c.borderActive : c.border}`,
                      borderRadius: 8, cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: active ? '#c4b5fd' : c.text }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize: 11, color: c.sub, marginTop: 1 }}>{s.desc}</div>
                    </div>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: active ? '#a78bfa' : c.sub,
                      background: active ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${active ? c.borderActive : c.border}`,
                      padding: '2px 7px', borderRadius: 5, whiteSpace: 'nowrap',
                    }}>
                      ×{s.mult.toFixed(2)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Podsumowanie */}
          <div style={{
            background: selected.size > 0 ? c.accentDim : c.card,
            border: `1px solid ${selected.size > 0 ? c.borderActive : c.border}`,
            borderRadius: 12, padding: '18px 20px',
            transition: 'all 0.2s ease',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: c.sub, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
              Podsumowanie
            </div>

            {selected.size === 0 ? (
              <p style={{ fontSize: 13, color: c.sub, margin: 0 }}>
                Wybierz usługi z listy obok.
              </p>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  {selectedServices.map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: c.sub }}>{s.name}</span>
                      <span style={{ color: c.text, fontWeight: 600 }}>
                        {fmt((parseFloat(s.base_price) || 0) * size.mult)}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 12, marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 12, color: c.sub, fontWeight: 600 }}>Orientacyjnie</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#c4b5fd' }}>
                      {fmt(totalMin)} – {fmt(totalMax)}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: 11, color: c.sub, margin: '8px 0 16px', lineHeight: 1.5 }}>
                  Cena przybliżona ±15%. Ostateczna wycena po inspekcji pojazdu.
                </p>

                <button
                  onClick={() => navigate('/orders/new')}
                  style={{
                    width: '100%', padding: '10px 0',
                    background: c.accent, color: '#fff', border: 'none',
                    borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseOver={e => e.target.style.opacity = '0.85'}
                  onMouseOut={e => e.target.style.opacity = '1'}
                >
                  Utwórz zlecenie
                </button>
              </>
            )}
          </div>
        </div>

        {/* Prawa kolumna — usługi */}
        <div style={{
          background: c.card, border: `1px solid ${c.border}`,
          borderRadius: 12, padding: '18px 20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: c.sub, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Usługi z katalogu
            </div>
            {selected.size > 0 && (
              <button
                onClick={() => setSelected(new Set())}
                style={{ fontSize: 11, color: c.sub, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Wyczyść
              </button>
            )}
          </div>

          {loading ? (
            <p style={{ color: c.sub, fontSize: 13 }}>Ładowanie...</p>
          ) : services.length === 0 ? (
            <p style={{ color: c.sub, fontSize: 13 }}>Brak usług w katalogu.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {services.map(s => {
                const active = selected.has(s.id);
                const price = parseFloat(s.base_price) || 0;
                const calcPrice = price * size.mult;
                return (
                  <label
                    key={s.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '9px 12px',
                      background: active ? c.accentDim : 'transparent',
                      border: `1px solid ${active ? c.borderActive : 'transparent'}`,
                      borderRadius: 7, cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggle(s.id)}
                        style={{ accentColor: c.accent, width: 14, height: 14, flexShrink: 0, cursor: 'pointer' }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#e2d9f3' : c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.name}
                        </div>
                        {s.description && (
                          <div style={{ fontSize: 11, color: c.sub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {s.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, marginLeft: 12 }}>
                      {price > 0 ? (
                        <>
                          <span style={{ fontSize: 13, fontWeight: 700, color: active ? '#c4b5fd' : c.text }}>
                            {fmt(calcPrice)}
                          </span>
                          {size.mult !== 1.0 && (
                            <span style={{ fontSize: 10, color: c.sub }}>
                              baza {fmt(price)}
                            </span>
                          )}
                        </>
                      ) : (
                        <span style={{ fontSize: 12, color: c.sub }}>wycena ind.</span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
