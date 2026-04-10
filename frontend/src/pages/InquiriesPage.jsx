import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import useDarkMode from '../hooks/useDarkMode.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const STATUS_CONFIG = {
  new:       { label: 'Nowe',        bg: '#dbeafe', color: '#1e40af' },
  contacted: { label: 'Skontaktowano', bg: '#fef3c7', color: '#92400e' },
  converted: { label: 'Konwersja',   bg: '#dcfce7', color: '#166534' },
  spam:      { label: 'Spam',        bg: '#fee2e2', color: '#991b1b' },
};

const STATUS_CONFIG_DARK = {
  new:       { label: 'Nowe',        bg: 'rgba(37,99,235,0.18)', color: '#93c5fd' },
  contacted: { label: 'Skontaktowano', bg: 'rgba(217,119,6,0.18)', color: '#fcd34d' },
  converted: { label: 'Konwersja',   bg: 'rgba(22,163,74,0.18)', color: '#86efac' },
  spam:      { label: 'Spam',        bg: 'rgba(220,38,38,0.18)', color: '#fca5a5' },
};

const StatusBadge = ({ status, dark }) => {
  const cfg = (dark ? STATUS_CONFIG_DARK : STATUS_CONFIG)[status] || STATUS_CONFIG.new;
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 700,
      background: cfg.bg,
      color: cfg.color,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
};

const PAGE_SIZE = 30;

const InquiriesPage = () => {
  usePageTitle('Zgłoszenia ze strony');
  const isDark = useDarkMode();
  const navigate = useNavigate();

  const [inquiries, setInquiries] = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(false);
  const [page, setPage]           = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [updatingId, setUpdatingId]     = useState(null);
  const [deletingId, setDeletingId]     = useState(null);

  const s = {
    bg:      isDark ? '#0d1117' : '#f1f5f9',
    surface: isDark ? '#161b22' : '#ffffff',
    border:  isDark ? '#30363d' : '#e2e8f0',
    text1:   isDark ? '#f0f6fc' : '#0f172a',
    text2:   isDark ? '#8b949e' : '#475569',
    text3:   isDark ? '#484f58' : '#94a3b8',
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (filterStatus) params.status = filterStatus;
      const { data } = await api.get('/inquiries', { params });
      setInquiries(data.inquiries);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const setStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const { data } = await api.patch(`/inquiries/${id}/status`, { status });
      setInquiries(prev => prev.map(i => i.id === id ? data : i));
    } catch (err) {
      alert('Błąd zmiany statusu.');
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteInquiry = async (id, name) => {
    if (!confirm(`Usunąć zgłoszenie od ${name}?`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/inquiries/${id}`);
      setInquiries(prev => prev.filter(i => i.id !== id));
      setTotal(t => t - 1);
    } catch {
      alert('Błąd usuwania.');
    } finally {
      setDeletingId(null);
    }
  };

  const convertToOrder = (inq) => {
    // Przekazujemy dane przez sessionStorage, żeby formularz mógł je wczytać
    sessionStorage.setItem('inquiry_prefill', JSON.stringify({
      clientName: inq.name,
      clientPhone: inq.phone || '',
      clientEmail: inq.email,
      serviceName: inq.service || '',
      notes: inq.message || '',
    }));
    navigate('/orders/new');
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const countNew = inquiries.filter(i => i.status === 'new').length;

  const pill = (label, value) => (
    <button
      key={value}
      onClick={() => { setFilterStatus(value); setPage(0); }}
      style={{
        padding: '6px 14px',
        borderRadius: 20,
        border: `1px solid ${filterStatus === value ? '#7c3aed' : s.border}`,
        background: filterStatus === value ? '#7c3aed' : 'transparent',
        color: filterStatus === value ? '#fff' : s.text2,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ color: s.text1 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Zgłoszenia ze strony
            {countNew > 0 && (
              <span style={{
                marginLeft: 10,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22, height: 22,
                borderRadius: 999,
                background: '#7c3aed',
                color: '#fff',
                fontSize: 11,
                fontWeight: 800,
                verticalAlign: 'middle',
              }}>
                {countNew}
              </span>
            )}
          </h1>
          <p style={{ color: s.text2, fontSize: 14 }}>
            Formularze kontaktowe z prestiq.pl — łącznie {total}
          </p>
        </div>
      </div>

      {/* Filtry */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {pill('Wszystkie', '')}
        {pill('Nowe', 'new')}
        {pill('Skontaktowane', 'contacted')}
        {pill('Konwersja', 'converted')}
        {pill('Spam', 'spam')}
      </div>

      {/* Tabela */}
      <div style={{
        background: s.surface,
        borderRadius: 12,
        border: `1px solid ${s.border}`,
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: s.text2 }}>Ładowanie...</div>
        ) : inquiries.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: s.text2 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Brak zgłoszeń</div>
            <div style={{ fontSize: 14, color: s.text3 }}>
              {filterStatus ? 'Zmień filtr, aby zobaczyć zgłoszenia.' : 'Gdy ktoś wypełni formularz na stronie, pojawi się tutaj.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${s.border}` }}>
                  {['Data', 'Imię i nazwisko', 'Kontakt', 'Usługa', 'Wiadomość', 'Status', 'Akcje'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: s.text2,
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inq, idx) => (
                  <tr
                    key={inq.id}
                    style={{
                      borderBottom: idx < inquiries.length - 1 ? `1px solid ${s.border}` : 'none',
                      background: inq.status === 'new'
                        ? (isDark ? 'rgba(124,58,237,0.04)' : 'rgba(124,58,237,0.02)')
                        : 'transparent',
                    }}
                  >
                    {/* Data */}
                    <td style={{ padding: '14px 16px', color: s.text2, whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 500, color: s.text1 }}>
                        {new Date(inq.created_at).toLocaleDateString('pl-PL')}
                      </div>
                      <div style={{ fontSize: 12, marginTop: 2 }}>
                        {new Date(inq.created_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Imię */}
                    <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 600, color: s.text1 }}>{inq.name}</div>
                      {inq.status === 'new' && (
                        <div style={{
                          display: 'inline-block',
                          marginTop: 4,
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          background: '#7c3aed',
                          color: '#fff',
                        }}>NOWE</div>
                      )}
                    </td>

                    {/* Kontakt */}
                    <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                      <a href={`mailto:${inq.email}`} style={{ color: '#7c3aed', display: 'block', fontWeight: 500 }}>
                        {inq.email}
                      </a>
                      {inq.phone && (
                        <a href={`tel:${inq.phone}`} style={{ color: s.text2, fontSize: 13, display: 'block', marginTop: 2 }}>
                          {inq.phone}
                        </a>
                      )}
                    </td>

                    {/* Usługa */}
                    <td style={{ padding: '14px 16px', color: s.text2, verticalAlign: 'top', maxWidth: 160 }}>
                      {inq.service || <span style={{ color: s.text3 }}>—</span>}
                    </td>

                    {/* Wiadomość */}
                    <td style={{ padding: '14px 16px', verticalAlign: 'top', maxWidth: 220 }}>
                      {inq.message ? (
                        <div style={{
                          color: s.text2,
                          fontSize: 13,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: 1.5,
                        }}>
                          {inq.message}
                        </div>
                      ) : (
                        <span style={{ color: s.text3 }}>—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                      <StatusBadge status={inq.status} dark={isDark} />
                    </td>

                    {/* Akcje */}
                    <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>

                        {/* Dropdown statusu */}
                        <select
                          value={inq.status}
                          disabled={updatingId === inq.id}
                          onChange={e => setStatus(inq.id, e.target.value)}
                          style={{
                            padding: '5px 8px',
                            borderRadius: 6,
                            border: `1px solid ${s.border}`,
                            background: s.surface,
                            color: s.text1,
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                            width: '100%',
                          }}
                        >
                          <option value="new">Nowe</option>
                          <option value="contacted">Skontaktowano</option>
                          <option value="converted">Konwersja</option>
                          <option value="spam">Spam</option>
                        </select>

                        {/* Utwórz zlecenie */}
                        <button
                          onClick={() => convertToOrder(inq)}
                          style={{
                            padding: '5px 8px',
                            borderRadius: 6,
                            border: `1px solid #7c3aed`,
                            background: 'rgba(124,58,237,0.1)',
                            color: '#7c3aed',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            width: '100%',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.1)'; e.currentTarget.style.color = '#7c3aed'; }}
                        >
                          + Utwórz zlecenie
                        </button>

                        {/* Usuń */}
                        <button
                          onClick={() => deleteInquiry(inq.id, inq.name)}
                          disabled={deletingId === inq.id}
                          style={{
                            padding: '5px 8px',
                            borderRadius: 6,
                            border: `1px solid rgba(220,38,38,0.3)`,
                            background: 'transparent',
                            color: '#ef4444',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            width: '100%',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          Usuń
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginacja */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              padding: '7px 16px', borderRadius: 7,
              border: `1px solid ${s.border}`,
              background: s.surface, color: s.text1,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              opacity: page === 0 ? 0.4 : 1,
            }}
          >
            ← Poprzednia
          </button>
          <span style={{ padding: '7px 14px', color: s.text2, fontSize: 13 }}>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{
              padding: '7px 16px', borderRadius: 7,
              border: `1px solid ${s.border}`,
              background: s.surface, color: s.text1,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              opacity: page >= totalPages - 1 ? 0.4 : 1,
            }}
          >
            Następna →
          </button>
        </div>
      )}
    </div>
  );
};

export default InquiriesPage;
