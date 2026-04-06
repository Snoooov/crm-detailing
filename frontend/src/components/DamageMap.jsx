import { useState, useRef } from 'react';
import api from '../api/axios.js';
import useDarkMode from '../hooks/useDarkMode.js';

const DAMAGE_TYPES = [
  { key: 'scratch', label: 'Zarysowanie', color: '#f97316' },
  { key: 'dent',    label: 'Wgniecenie',  color: '#ef4444' },
  { key: 'other',   label: 'Inne',        color: '#3b82f6' },
];

const DamageMap = ({ orderId, initialMap, editable }) => {
  const [points, setPoints] = useState(() => {
    const raw = initialMap || [];
    const arr = Array.isArray(raw) ? raw : [];
    return arr.map(p => ({ id: p.id ?? Date.now(), x: p.x, y: p.y, type: p.type || 'scratch' }));
  });
  const [selectedType, setSelectedType] = useState('scratch');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const containerRef = useRef(null);
  const isDark = useDarkMode();

  const border = isDark ? '#334155' : '#e5e7eb';
  const bg     = isDark ? '#0f172a' : '#f9fafb';

  const handleClick = (e) => {
    if (!editable) return;
    if (e.target.closest('[data-point]')) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = parseFloat(((e.clientX - rect.left) / rect.width  * 100).toFixed(2));
    const y = parseFloat(((e.clientY - rect.top)  / rect.height * 100).toFixed(2));
    setPoints(prev => [...prev, { id: Date.now(), x, y, type: selectedType }]);
    setSaved(false);
  };

  const removePoint = (id) => {
    if (!editable) return;
    setPoints(prev => prev.filter(p => p.id !== id));
    setSaved(false);
  };

  const updateNote = (id, note) => {
    setPoints(prev => prev.map(p => p.id === id ? { ...p, note } : p));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/orders/${orderId}/damage`, { damage_map: points });
      setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ border: `1px solid ${border}`, borderRadius: 8, padding: 16 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>
          Mapa uszkodzeń
          {points.length > 0 && (
            <span style={{
              background: isDark ? '#334155' : '#f3f4f6',
              color: isDark ? '#94a3b8' : '#6b7280',
              borderRadius: 99, padding: '1px 8px',
              fontSize: 12, fontWeight: 600, marginLeft: 8,
            }}>
              {points.length}
            </span>
          )}
        </div>
        {editable && (
          <button
            className="btn-primary"
            style={{ fontSize: 12, padding: '4px 12px' }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Zapisywanie...' : saved ? '✓ Zapisano' : 'Zapisz mapę'}
          </button>
        )}
      </div>

      {/* ── Damage type selector ── */}
      {editable && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: isDark ? '#64748b' : '#9ca3af' }}>Typ:</span>
          {DAMAGE_TYPES.map(t => (
            <button
              key={t.key}
              onClick={() => setSelectedType(t.key)}
              style={{
                padding: '3px 10px', borderRadius: 99, fontSize: 12, cursor: 'pointer',
                border: `2px solid ${t.color}`,
                background: selectedType === t.key ? t.color : 'transparent',
                color: selectedType === t.key ? '#fff' : t.color,
                fontWeight: 600,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Image + markers + list ── */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Image with SVG overlay */}
        <div
          ref={containerRef}
          onClick={handleClick}
          style={{
            position: 'relative',
            display: 'inline-block',
            flexShrink: 0,
            cursor: editable ? 'crosshair' : 'default',
            borderRadius: 6,
            overflow: 'hidden',
            background: isDark ? '#1e293b' : '#f1f5f9',
            maxWidth: '100%',
          }}
        >
          <img
            src="/images/car-damage-map.png"
            alt="Schemat pojazdu"
            draggable={false}
            style={{
              display: 'block',
              width: '100%',
              maxWidth: 680,
              userSelect: 'none',
            }}
          />

          {/* Damage markers */}
          <svg
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              overflow: 'visible',
            }}
          >
            {points.map((p, i) => {
              const typeInfo = DAMAGE_TYPES.find(t => t.key === p.type) || DAMAGE_TYPES[0];
              const cx = `${p.x}%`;
              const cy = `${p.y}%`;
              return (
                <g
                  key={p.id}
                  data-point="1"
                  style={{ pointerEvents: editable ? 'all' : 'none', cursor: 'pointer' }}
                  onClick={ev => { ev.stopPropagation(); removePoint(p.id); }}
                >
                  {p.note && <title>{`#${i + 1} ${typeInfo.label}: ${p.note}`}</title>}
                  <circle cx={cx} cy={cy} r="10" fill={typeInfo.color} opacity="0.2"/>
                  <circle cx={cx} cy={cy} r="7"  fill={typeInfo.color} opacity="0.92"/>
                  <circle cx={cx} cy={cy} r="7"  fill="none" stroke="#fff" strokeWidth="1.5"/>
                  <text
                    x={cx} y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="7"
                    fill="#fff"
                    fontWeight="700"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Points list */}
        <div style={{ flex: 1, minWidth: 150 }}>
          {points.length === 0 ? (
            <div style={{ color: isDark ? '#475569' : '#9ca3af', fontSize: 13, paddingTop: 4 }}>
              {editable
                ? 'Kliknij schemat, aby zaznaczyć uszkodzenie'
                : 'Brak zaznaczonych uszkodzeń'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {points.map((p, i) => {
                const typeInfo = DAMAGE_TYPES.find(t => t.key === p.type) || DAMAGE_TYPES[0];
                return (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: bg, border: `1px solid ${border}`,
                    borderRadius: 6, padding: '6px 10px', fontSize: 13,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        background: typeInfo.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 700, color: '#fff',
                      }}>
                        {i + 1}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ color: typeInfo.color, fontWeight: 600 }}>{typeInfo.label}</span>
                        {editable ? (
                          <input
                            type="text"
                            value={p.note || ''}
                            onChange={e => updateNote(p.id, e.target.value)}
                            placeholder="Notatka…"
                            onClick={e => e.stopPropagation()}
                            style={{
                              display: 'block', width: '100%', marginTop: 4,
                              fontSize: 11, padding: '3px 6px', borderRadius: 4,
                              border: `1px solid ${isDark ? '#334155' : '#d1d5db'}`,
                              background: isDark ? '#1e293b' : '#fff',
                              color: isDark ? '#94a3b8' : '#374151',
                              outline: 'none', boxSizing: 'border-box',
                            }}
                          />
                        ) : p.note ? (
                          <div style={{ fontSize: 11, marginTop: 3, color: isDark ? '#64748b' : '#6b7280' }}>
                            {p.note}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    {editable && (
                      <button
                        onClick={() => removePoint(p.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: isDark ? '#475569' : '#9ca3af',
                          fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0,
                        }}
                        title="Usuń punkt"
                      >×</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {DAMAGE_TYPES.map(t => (
              <div key={t.key} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 11, color: isDark ? '#64748b' : '#9ca3af',
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: t.color, display: 'inline-block', flexShrink: 0,
                }}/>
                {t.label}
              </div>
            ))}
            {editable && (
              <div style={{ fontSize: 11, color: isDark ? '#475569' : '#9ca3af', marginTop: 4 }}>
                Kliknij punkt, aby usunąć
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DamageMap;
