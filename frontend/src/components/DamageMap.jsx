import { useState, useRef } from 'react';
import api from '../api/axios.js';
import useDarkMode from '../hooks/useDarkMode.js';

const DAMAGE_TYPES = [
  { key: 'scratch', label: 'Zarysowanie', color: '#f97316' },
  { key: 'dent',    label: 'Wgniecenie',  color: '#ef4444' },
  { key: 'other',   label: 'Inne',        color: '#3b82f6' },
];

const VIEWS = [
  { key: 'top',   label: 'Z góry',    vw: 200, vh: 360 },
  { key: 'front', label: 'Przód',     vw: 280, vh: 175 },
  { key: 'back',  label: 'Tył',       vw: 280, vh: 175 },
  { key: 'left',  label: 'Lewy bok',  vw: 400, vh: 175 },
  { key: 'right', label: 'Prawy bok', vw: 400, vh: 175, flip: true },
];

const cl = (isDark) => ({
  body:   isDark ? '#1e293b' : '#f1f5f9',
  zone:   isDark ? '#0f172a' : '#e2e8f0',
  s:      isDark ? '#475569' : '#94a3b8',   // stroke
  glass:  isDark ? '#1e3a5f' : '#bfdbfe',
  wheel:  isDark ? '#94a3b8' : '#334155',
  hub:    isDark ? '#334155' : '#94a3b8',
  hl:     isDark ? '#854d0e' : '#fef3c7',   // headlight
  tl:     isDark ? '#7f1d1d' : '#fee2e2',   // taillight
  plate:  isDark ? '#263548' : '#e5e7eb',
  lbl:    isDark ? '#64748b' : '#94a3b8',
});

// ── TOP VIEW ──────────────────────────────────────────────────────────────────
const TopView = ({ isDark }) => {
  const C = cl(isDark);
  return (
    <>
      <rect x="12" y="42"  width="18" height="52" rx="8" fill={C.wheel}/>
      <rect x="170" y="42" width="18" height="52" rx="8" fill={C.wheel}/>
      <rect x="12" y="265" width="18" height="52" rx="8" fill={C.wheel}/>
      <rect x="170" y="265" width="18" height="52" rx="8" fill={C.wheel}/>
      <rect x="24" y="16" width="152" height="328" rx="20" fill={C.body} stroke={C.s} strokeWidth="2"/>
      {/* Hood */}
      <rect x="30" y="22" width="140" height="80" rx="12" ry="4" fill={C.zone}/>
      {/* Front windshield */}
      <path d="M 48,102 L 152,102 L 146,130 L 54,130 Z" fill={C.glass} opacity="0.85"/>
      {/* Cabin */}
      <rect x="54" y="130" width="92" height="94" rx="4" fill={C.zone}/>
      {/* Rear window */}
      <path d="M 54,224 L 146,224 L 152,250 L 48,250 Z" fill={C.glass} opacity="0.85"/>
      {/* Trunk */}
      <rect x="30" y="250" width="140" height="90" rx="4" ry="14" fill={C.zone}/>
      {/* Center dash line */}
      <line x1="100" y1="24" x2="100" y2="336" stroke={C.s} strokeWidth="0.5" strokeDasharray="4 4" opacity="0.4"/>
      {/* Labels */}
      <text x="100" y="11"  textAnchor="middle" fontSize="9" fill={C.lbl} fontWeight="600" letterSpacing="1">PRZÓD</text>
      <text x="100" y="354" textAnchor="middle" fontSize="9" fill={C.lbl} fontWeight="600" letterSpacing="1">TYŁ</text>
      <text x="7"   y="182" textAnchor="middle" fontSize="8" fill={C.lbl} fontWeight="600" transform="rotate(-90,7,182)">LEWY</text>
      <text x="193" y="182" textAnchor="middle" fontSize="8" fill={C.lbl} fontWeight="600" transform="rotate(90,193,182)">PRAWY</text>
    </>
  );
};

// ── FRONT VIEW ────────────────────────────────────────────────────────────────
const FrontView = ({ isDark }) => {
  const C = cl(isDark);
  return (
    <>
      {/* Body silhouette */}
      <path d="M 74,8 L 206,8 L 264,60 L 264,162 L 16,162 L 16,60 Z"
        fill={C.body} stroke={C.s} strokeWidth="2"/>
      {/* Windshield */}
      <path d="M 80,12 L 200,12 L 248,58 L 32,58 Z" fill={C.glass} opacity="0.85"/>
      {/* Shoulder line */}
      <line x1="16" y1="60" x2="264" y2="60" stroke={C.s} strokeWidth="1.5"/>
      {/* Left headlight */}
      <path d="M 16,60 L 68,60 L 68,104 L 16,110 Z" fill={C.hl} stroke={C.s} strokeWidth="1"/>
      <rect x="20"  y="66" width="42" height="8"  rx="2" fill={C.s} opacity="0.3"/>
      <rect x="20"  y="78" width="42" height="14" rx="2" fill={C.s} opacity="0.15"/>
      {/* Right headlight */}
      <path d="M 264,60 L 212,60 L 212,104 L 264,110 Z" fill={C.hl} stroke={C.s} strokeWidth="1"/>
      <rect x="218" y="66" width="42" height="8"  rx="2" fill={C.s} opacity="0.3"/>
      <rect x="218" y="78" width="42" height="14" rx="2" fill={C.s} opacity="0.15"/>
      {/* Grille */}
      <rect x="68" y="60" width="144" height="44" fill={C.zone} stroke={C.s} strokeWidth="0.5"/>
      {[68,76,84,92,100].map(y => (
        <rect key={y} x="80" y={y} width="120" height="4" rx="1" fill={C.s} opacity="0.2"/>
      ))}
      <circle cx="140" cy="82" r="9" fill={C.s} opacity="0.25"/>
      {/* Lower body */}
      <path d="M 16,110 L 264,110 L 264,152 L 16,152 Z" fill={C.zone}/>
      <rect x="12" y="152" width="256" height="12" rx="5" fill={C.zone} stroke={C.s} strokeWidth="1.5"/>
      {/* License plate */}
      <rect x="110" y="118" width="60" height="20" rx="2" fill={C.plate} stroke={C.s} strokeWidth="0.5"/>
      {/* Fog lights */}
      <rect x="22"  y="116" width="30" height="10" rx="4" fill={C.s} opacity="0.2"/>
      <rect x="228" y="116" width="30" height="10" rx="4" fill={C.s} opacity="0.2"/>
      {/* Side mirrors */}
      <rect x="3"   y="52" width="14" height="18" rx="3" fill={C.zone} stroke={C.s} strokeWidth="1"/>
      <rect x="263" y="52" width="14" height="18" rx="3" fill={C.zone} stroke={C.s} strokeWidth="1"/>
      <text x="140" y="173" textAnchor="middle" fontSize="9" fill={C.lbl} fontWeight="600" letterSpacing="1">PRZÓD</text>
    </>
  );
};

// ── BACK VIEW ─────────────────────────────────────────────────────────────────
const BackView = ({ isDark }) => {
  const C = cl(isDark);
  return (
    <>
      <path d="M 74,8 L 206,8 L 264,60 L 264,162 L 16,162 L 16,60 Z"
        fill={C.body} stroke={C.s} strokeWidth="2"/>
      {/* Rear window */}
      <path d="M 86,12 L 194,12 L 238,58 L 42,58 Z" fill={C.glass} opacity="0.85"/>
      {/* Trunk lid line */}
      <line x1="16" y1="60" x2="264" y2="60" stroke={C.s} strokeWidth="1.5"/>
      {/* Left tail light (horizontal) */}
      <path d="M 16,60 L 68,60 L 68,110 L 16,116 Z" fill={C.tl} stroke={C.s} strokeWidth="1"/>
      <rect x="20"  y="66" width="42" height="18" rx="2" fill={C.s}     opacity="0.15"/>
      <rect x="20"  y="88" width="42" height="14" rx="2" fill="#ef4444" opacity="0.35"/>
      {/* Right tail light */}
      <path d="M 264,60 L 212,60 L 212,110 L 264,116 Z" fill={C.tl} stroke={C.s} strokeWidth="1"/>
      <rect x="218" y="66" width="42" height="18" rx="2" fill={C.s}     opacity="0.15"/>
      <rect x="218" y="88" width="42" height="14" rx="2" fill="#ef4444" opacity="0.35"/>
      {/* Trunk area */}
      <rect x="68" y="60" width="144" height="54" fill={C.zone}/>
      {/* Trunk handle */}
      <rect x="112" y="102" width="56" height="6" rx="3" fill={C.s} opacity="0.3"/>
      {/* Lower bumper */}
      <path d="M 16,116 L 264,116 L 264,152 L 16,152 Z" fill={C.zone}/>
      <rect x="12" y="152" width="256" height="12" rx="5" fill={C.zone} stroke={C.s} strokeWidth="1.5"/>
      {/* License plate (rear, wider) */}
      <rect x="96" y="122" width="88" height="24" rx="2" fill={C.plate} stroke={C.s} strokeWidth="0.5"/>
      {/* Exhaust */}
      <ellipse cx="88"  cy="160" rx="8" ry="4" fill={C.s} opacity="0.2"/>
      <ellipse cx="192" cy="160" rx="8" ry="4" fill={C.s} opacity="0.2"/>
      {/* Side mirrors */}
      <rect x="3"   y="52" width="14" height="18" rx="3" fill={C.zone} stroke={C.s} strokeWidth="1"/>
      <rect x="263" y="52" width="14" height="18" rx="3" fill={C.zone} stroke={C.s} strokeWidth="1"/>
      <text x="140" y="173" textAnchor="middle" fontSize="9" fill={C.lbl} fontWeight="600" letterSpacing="1">TYŁ</text>
    </>
  );
};

// ── SIDE VIEW (used for left; flip via CSS for right) ─────────────────────────
// Front is on the LEFT, rear on the RIGHT — flip reverses this visually for right side
const SideView = ({ isDark }) => {
  const C = cl(isDark);
  // Ground y=155, roof y=40, wheel radius=30
  // Front wheel cx=90, Rear wheel cx=295
  return (
    <>
      {/* Ground line */}
      <line x1="5" y1="155" x2="395" y2="155" stroke={C.s} strokeWidth="0.5" opacity="0.25"/>

      {/* Car body outline with wheel arch cutouts */}
      <path d={
        "M 18,148 L 22,120 L 38,98 L 80,72 L 112,66 L 142,40 L 252,38 " +
        "L 286,70 L 326,90 L 350,114 L 368,140 L 368,155 " +
        "L 330,155 A 35,35 0 0 0 260,155 " +
        "L 120,155 A 35,35 0 0 0 50,155 " +
        "L 18,155 Z"
      } fill={C.body} stroke={C.s} strokeWidth="2"/>

      {/* Front wheel */}
      <circle cx="90"  cy="155" r="30" fill={C.wheel}/>
      <circle cx="90"  cy="155" r="13" fill={C.hub}/>
      <line x1="90"  y1="126" x2="90"  y2="184" stroke={C.wheel} strokeWidth="2"/>
      <line x1="61"  y1="155" x2="119" y2="155" stroke={C.wheel} strokeWidth="2"/>
      <line x1="69"  y1="134" x2="111" y2="176" stroke={C.wheel} strokeWidth="1.5"/>
      <line x1="69"  y1="176" x2="111" y2="134" stroke={C.wheel} strokeWidth="1.5"/>

      {/* Rear wheel */}
      <circle cx="295" cy="155" r="30" fill={C.wheel}/>
      <circle cx="295" cy="155" r="13" fill={C.hub}/>
      <line x1="295" y1="126" x2="295" y2="184" stroke={C.wheel} strokeWidth="2"/>
      <line x1="266" y1="155" x2="324" y2="155" stroke={C.wheel} strokeWidth="2"/>
      <line x1="274" y1="134" x2="316" y2="176" stroke={C.wheel} strokeWidth="1.5"/>
      <line x1="274" y1="176" x2="316" y2="134" stroke={C.wheel} strokeWidth="1.5"/>

      {/* Windshield glass */}
      <path d="M 116,66 L 142,40 L 155,40 L 126,66 Z" fill={C.glass} opacity="0.85"/>

      {/* Front door window */}
      <path d="M 157,40 L 202,40 L 202,82 L 157,82 Z" fill={C.glass} opacity="0.85"/>

      {/* Rear door window */}
      <path d="M 207,40 L 246,40 L 246,82 L 207,82 Z" fill={C.glass} opacity="0.85"/>

      {/* Rear window */}
      <path d="M 252,38 L 280,68 L 260,68 L 252,52 Z" fill={C.glass} opacity="0.85"/>

      {/* B-pillar */}
      <rect x="202" y="40" width="5" height="86" fill={C.zone} stroke={C.s} strokeWidth="0.5"/>

      {/* Door dividing line */}
      <line x1="202" y1="126" x2="204" y2="82" stroke={C.s} strokeWidth="1" opacity="0.5"/>

      {/* Door handles */}
      <rect x="174" y="104" width="22" height="5" rx="2" fill={C.s} opacity="0.35"/>
      <rect x="220" y="104" width="22" height="5" rx="2" fill={C.s} opacity="0.35"/>

      {/* Side mirror */}
      <path d="M 118,56 L 106,52 L 106,67 L 118,67 Z" fill={C.zone} stroke={C.s} strokeWidth="1"/>

      {/* Front headlight */}
      <path d="M 22,120 L 40,98 L 56,102 L 56,130 L 22,133 Z" fill={C.hl} stroke={C.s} strokeWidth="1"/>

      {/* Rear tail light */}
      <path d="M 366,114 L 348,92 L 340,102 L 355,133 L 366,133 Z" fill={C.tl} stroke={C.s} strokeWidth="1"/>

      {/* Sill / body line */}
      <line x1="50" y1="126" x2="330" y2="126" stroke={C.s} strokeWidth="1" opacity="0.4"/>
    </>
  );
};

// ── VIEW RENDERER ─────────────────────────────────────────────────────────────
const VIEW_CONTENT = {
  top:   TopView,
  front: FrontView,
  back:  BackView,
  left:  SideView,
  right: SideView,
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
const DamageMap = ({ orderId, initialMap, editable }) => {
  const [points, setPoints] = useState(() => {
    const raw = initialMap || [];
    const arr = Array.isArray(raw) ? raw : [];
    // backward compat: points without view → top
    return arr.map(p => ({ ...p, view: p.view || 'top' }));
  });
  const [activeView, setActiveView] = useState('top');
  const [selectedType, setSelectedType] = useState('scratch');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const svgRef = useRef(null);
  const isDark = useDarkMode();

  const currentViewCfg = VIEWS.find(v => v.key === activeView);
  const isFlipped = !!currentViewCfg?.flip;
  const ViewContent = VIEW_CONTENT[activeView];

  const viewPoints = points.filter(p => p.view === activeView);

  const handleSvgClick = (e) => {
    if (!editable) return;
    if (e.target.closest('[data-point]')) return;
    const rect = svgRef.current.getBoundingClientRect();
    let xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;
    if (isFlipped) xPct = 1 - xPct; // mirror x for right side view
    const x = parseFloat((xPct * 100).toFixed(2));
    const y = parseFloat((yPct * 100).toFixed(2));
    setPoints(prev => [...prev, { id: Date.now(), x, y, type: selectedType, view: activeView }]);
    setSaved(false);
  };

  const removePoint = (id) => {
    if (!editable) return;
    setPoints(prev => prev.filter(p => p.id !== id));
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

  const border = isDark ? '#334155' : '#e5e7eb';
  const bg     = isDark ? '#0f172a' : '#f9fafb';
  const { vw, vh } = currentViewCfg;

  // Display dimensions: fixed max-height, width scales with aspect ratio
  const displayH = activeView === 'top' ? 260 : 180;
  const displayW = Math.round(displayH * (vw / vh));

  return (
    <div style={{ border: `1px solid ${border}`, borderRadius: 8, padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>
          Mapa uszkodzeń
          {points.length > 0 && (
            <span style={{
              background: isDark ? '#334155' : '#f3f4f6', color: isDark ? '#94a3b8' : '#6b7280',
              borderRadius: 99, padding: '1px 8px', fontSize: 12, fontWeight: 600, marginLeft: 8,
            }}>
              {points.length}
            </span>
          )}
        </div>
        {editable && (
          <button className="btn-primary" style={{ fontSize: 12, padding: '4px 12px' }} onClick={handleSave} disabled={saving}>
            {saving ? 'Zapisywanie...' : saved ? '✓ Zapisano' : 'Zapisz mapę'}
          </button>
        )}
      </div>

      {/* View tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {VIEWS.map(v => {
          const cnt = points.filter(p => p.view === v.key).length;
          const active = activeView === v.key;
          return (
            <button
              key={v.key}
              onClick={() => setActiveView(v.key)}
              style={{
                padding: '4px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                border: `1px solid ${active ? '#2563eb' : border}`,
                background: active ? '#2563eb' : 'transparent',
                color: active ? '#fff' : isDark ? '#94a3b8' : '#6b7280',
                fontWeight: active ? 600 : 400,
                position: 'relative',
              }}
            >
              {v.label}
              {cnt > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -6,
                  background: active ? '#fff' : '#ef4444', color: active ? '#2563eb' : '#fff',
                  borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '0 5px', lineHeight: '16px',
                  minWidth: 16, textAlign: 'center',
                }}>
                  {cnt}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Damage type selector */}
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

      {/* SVG + points list */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* SVG diagram */}
        <div style={{ flexShrink: 0, overflowX: 'auto' }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${vw} ${vh}`}
            width={displayW}
            height={displayH}
            style={{
              cursor: editable ? 'crosshair' : 'default',
              display: 'block',
              transform: isFlipped ? 'scaleX(-1)' : undefined,
            }}
            onClick={handleSvgClick}
          >
            <ViewContent isDark={isDark} />

            {/* Damage point markers */}
            {viewPoints.map(p => {
              const typeInfo = DAMAGE_TYPES.find(t => t.key === p.type) || DAMAGE_TYPES[0];
              // For flipped view, mirror x back since SVG is CSS-flipped
              const cx = isFlipped ? (1 - p.x / 100) * vw : (p.x / 100) * vw;
              const cy = (p.y / 100) * vh;
              const lbl = p.type === 'scratch' ? 'Z' : p.type === 'dent' ? 'W' : 'I';
              return (
                <g
                  key={p.id}
                  data-point="1"
                  onClick={ev => { ev.stopPropagation(); removePoint(p.id); }}
                  style={{ cursor: editable ? 'pointer' : 'default' }}
                >
                  <circle cx={cx} cy={cy} r="9" fill={typeInfo.color} opacity="0.9"/>
                  <circle cx={cx} cy={cy} r="9" fill="none" stroke="#fff" strokeWidth="1.5"/>
                  {/* Un-mirror the label text inside flipped SVG */}
                  <text
                    x={cx} y={cy + 4}
                    textAnchor="middle" fontSize="8" fill="#fff" fontWeight="700"
                    style={{ transform: isFlipped ? `scaleX(-1)` : undefined, transformOrigin: `${cx}px ${cy}px` }}
                  >
                    {lbl}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Points list for current view */}
        <div style={{ flex: 1, minWidth: 150 }}>
          {viewPoints.length === 0 ? (
            <div style={{ color: isDark ? '#475569' : '#9ca3af', fontSize: 13, paddingTop: 4 }}>
              {editable
                ? `Kliknij na schemat, aby zaznaczyć uszkodzenie`
                : 'Brak uszkodzeń w tym widoku'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {viewPoints.map((p, i) => {
                const typeInfo = DAMAGE_TYPES.find(t => t.key === p.type) || DAMAGE_TYPES[0];
                return (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: bg, border: `1px solid ${border}`,
                    borderRadius: 6, padding: '6px 10px', fontSize: 13,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: typeInfo.color, display: 'inline-block', flexShrink: 0 }}/>
                      <span style={{ color: typeInfo.color, fontWeight: 600 }}>{typeInfo.label}</span>
                      <span style={{ color: isDark ? '#64748b' : '#9ca3af', fontSize: 11 }}>#{i + 1}</span>
                    </div>
                    {editable && (
                      <button
                        onClick={() => removePoint(p.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#475569' : '#9ca3af', fontSize: 16, lineHeight: 1, padding: '0 2px' }}
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
              <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: isDark ? '#64748b' : '#9ca3af' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, display: 'inline-block', flexShrink: 0 }}/>
                {t.label}
              </div>
            ))}
            {editable && (
              <div style={{ fontSize: 11, color: isDark ? '#475569' : '#9ca3af', marginTop: 4 }}>
                Kliknij punkt, aby usunąć
              </div>
            )}
          </div>

          {/* All-views summary */}
          {points.length > 0 && (
            <div style={{ marginTop: 14, fontSize: 12, color: isDark ? '#64748b' : '#9ca3af' }}>
              Wszystkie widoki: {points.length} uszkodzeń
              {VIEWS.filter(v => points.some(p => p.view === v.key)).map(v => {
                const cnt = points.filter(p => p.view === v.key).length;
                return (
                  <div key={v.key} style={{ fontSize: 11, marginTop: 2 }}>
                    {v.label}: {cnt}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DamageMap;
