import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import Pagination from '../components/Pagination.jsx';
import useDarkMode from '../hooks/useDarkMode.js';
import { useAuth } from '../context/AuthContext.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

const TYPE_NAMES = {
  confirmation: 'Potwierdzenie rezerwacji',
  reminder_24h: 'Przypomnienie 24h przed',
  ready: 'Auto gotowe do odbioru',
  date_changed: 'Zmiana terminu',
  followup_short: 'Follow-up (4 dni po)',
  followup_long: 'Follow-up (30 dni po)',
  campaign: 'Kampania',
};

const CLIENT_STATUS_LABELS = { vip: 'VIP', regular: 'Stały', normal: 'Normalny' };

const CampaignTab = ({ isDark }) => {
  const [filters, setFilters] = useState({ days_inactive: '', status: '', min_orders: '' });
  const [preview, setPreview] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const border = isDark ? '#334155' : '#e5e7eb';
  const bg = isDark ? '#0f172a' : '#f9fafb';

  const handlePreview = async () => {
    setLoadingPreview(true);
    setError('');
    try {
      const params = {};
      if (filters.days_inactive) params.days_inactive = filters.days_inactive;
      if (filters.status) params.status = filters.status;
      if (filters.min_orders) params.min_orders = filters.min_orders;
      const res = await api.get('/campaigns/preview', { params });
      setPreview(res.data);
      setSelectedIds(res.data.filter(c => c.email).map(c => c.id));
    } catch (err) {
      setError('Błąd ładowania klientów');
    } finally {
      setLoadingPreview(false);
    }
  };

  const toggleClient = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (!preview) return;
    const allIds = preview.map(c => c.id);
    setSelectedIds(selectedIds.length === allIds.length ? [] : allIds);
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return setError('Temat i treść są wymagane');
    if (!selectedIds.length) return setError('Wybierz co najmniej jednego klienta');
    if (!window.confirm(`Wyślij kampanię do ${selectedIds.length} klientów?`)) return;
    setSending(true);
    setError('');
    try {
      const res = await api.post('/campaigns/send', { subject, body, client_ids: selectedIds });
      setResult(res.data);
      setPreview(null);
      setSelectedIds([]);
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd wysyłania');
    } finally {
      setSending(false);
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pl-PL') : 'brak';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filters */}
      <div className="card">
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Segmentacja klientów</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Ostatnia wizyta ponad X dni temu</label>
            <input
              type="number" min="1" placeholder="np. 30"
              value={filters.days_inactive}
              onChange={e => setFilters(p => ({ ...p, days_inactive: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Status klienta</label>
            <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
              <option value="">Wszystkie</option>
              <option value="vip">VIP</option>
              <option value="regular">Stały</option>
              <option value="normal">Normalny</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Min. liczba wizyt</label>
            <input
              type="number" min="1" placeholder="np. 3"
              value={filters.min_orders}
              onChange={e => setFilters(p => ({ ...p, min_orders: e.target.value }))}
            />
          </div>
        </div>
        <button className="btn-primary" onClick={handlePreview} disabled={loadingPreview}>
          {loadingPreview ? 'Szukam...' : 'Znajdź klientów'}
        </button>
      </div>

      {error && (
        <div style={{ background: isDark ? '#7f1d1d22' : '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: 6, padding: '10px 14px', fontSize: 13 }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ background: isDark ? '#14532d22' : '#f0fdf4', border: '1px solid #86efac', color: '#16a34a', borderRadius: 6, padding: '14px 16px' }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Kampania wysłana</div>
          <div style={{ fontSize: 13 }}>Wysłano: {result.sent} · Błędy: {result.failed}</div>
        </div>
      )}

      {/* Client list */}
      {preview !== null && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${border}` }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              Klienci ({preview.length})
              {selectedIds.length > 0 && (
                <span style={{ color: '#2563eb', fontWeight: 400, fontSize: 13, marginLeft: 8 }}>
                  · {selectedIds.length} zaznaczonych
                </span>
              )}
            </div>
            {preview.length > 0 && (
              <button className="btn-secondary" style={{ fontSize: 12, padding: '4px 12px' }} onClick={toggleAll}>
                {selectedIds.length === preview.length ? 'Odznacz wszystkich' : 'Zaznacz wszystkich'}
              </button>
            )}
          </div>

          {preview.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280', fontSize: 13 }}>
              Brak klientów spełniających kryteria
            </div>
          ) : (
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: isDark ? '#1e293b' : '#f8fafc' }}>
                    <th style={{ width: 36, padding: '8px 0 8px 16px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={preview.length > 0 && selectedIds.length === preview.length}
                        onChange={toggleAll}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: isDark ? '#94a3b8' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Klient</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: isDark ? '#94a3b8' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>E-mail</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: isDark ? '#94a3b8' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wizyty</th>
                    <th style={{ padding: '8px 16px 8px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: isDark ? '#94a3b8' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ostatnia wizyta</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((c, i) => {
                    const selected = selectedIds.includes(c.id);
                    return (
                      <tr
                        key={c.id}
                        onClick={() => toggleClient(c.id)}
                        style={{
                          cursor: 'pointer',
                          background: selected
                            ? (isDark ? '#1e3a5f' : '#eff6ff')
                            : (i % 2 === 0 ? 'transparent' : (isDark ? '#ffffff08' : '#f9fafb')),
                          borderTop: `1px solid ${border}`,
                          transition: 'background 0.1s',
                        }}
                      >
                        <td style={{ padding: '10px 0 10px 16px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleClient(c.id)}
                            onClick={e => e.stopPropagation()}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontWeight: 500, fontSize: 13 }}>{c.full_name}</span>
                          {c.status && c.status !== 'normal' && (
                            <span style={{
                              marginLeft: 8, fontSize: 10, fontWeight: 700, borderRadius: 99,
                              padding: '2px 7px', verticalAlign: 'middle',
                              background: c.status === 'vip' ? (isDark ? '#4c1d9522' : '#f5f3ff') : (isDark ? '#0c4a6e22' : '#f0f9ff'),
                              color: c.status === 'vip' ? '#7c3aed' : '#0891b2',
                              border: `1px solid ${c.status === 'vip' ? '#7c3aed44' : '#0891b244'}`,
                            }}>
                              {CLIENT_STATUS_LABELS[c.status]}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 13, color: isDark ? '#94a3b8' : '#6b7280' }}>
                          {c.email}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: isDark ? '#e2e8f0' : '#374151' }}>
                          {c.total_orders}
                        </td>
                        <td style={{ padding: '10px 16px 10px 12px', textAlign: 'right', fontSize: 13, color: isDark ? '#94a3b8' : '#6b7280' }}>
                          {fmtDate(c.last_visit)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Email composition */}
      {preview !== null && preview.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Treść kampanii</h2>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
            Dostępne zmienne: <code>{'{{client_name}}'}</code>
          </div>
          <div className="form-group">
            <label>Temat maila</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="np. Czas na kolejny detailing!" />
          </div>
          <div className="form-group">
            <label>Treść (HTML)</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={8}
              style={{ fontFamily: 'monospace', fontSize: 13 }}
              placeholder="<p>Dzień dobry {{client_name}},</p><p>Zapraszamy ponownie!</p>"
            />
          </div>
          <button
            className="btn-primary"
            onClick={handleSend}
            disabled={sending || !selectedIds.length || !subject.trim() || !body.trim()}
          >
            {sending ? 'Wysyłanie...' : `Wyślij do ${selectedIds.length} klientów`}
          </button>
        </div>
      )}
    </div>
  );
};

const VARIABLES_HELP = '{{client_name}}, {{vehicle_brand}}, {{vehicle_model}}, {{plate_number}}, {{service_name}}, {{date_from}}, {{date_to}}';

const EmailsPage = () => {
  usePageTitle('E-maile');
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [templates, setTemplates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('templates');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [runningJobs, setRunningJobs] = useState(false);
  const [message, setMessage] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const LOGS_PER_PAGE = 20;
  const isDark = useDarkMode();

  useEffect(() => {
    api.get('/emails/templates').then(res => setTemplates(res.data));
    api.get('/emails/logs').then(res => setLogs(res.data));
  }, []);

  const handleEdit = (template) => {
    setEditingId(template.id);
    setEditForm({ ...template });
  };

  const handleTestByType = async (type) => {
    try {
        const res = await api.post('/emails/test', { type });
        setMessage(res.data.message);
        setTimeout(() => setMessage(''), 5000);
    } catch (err) {
        setMessage('Błąd: ' + (err.response?.data?.error || 'nieznany błąd'));
    }
    };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/emails/templates/${editingId}`, editForm);
      setTemplates(prev => prev.map(t => t.id === editingId ? res.data : t));
      setEditingId(null);
      setMessage('Szablon zapisany');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleRunJobs = async () => {
    setRunningJobs(true);
    try {
      await api.post('/emails/run-jobs');
      const logs = await api.get('/emails/logs');
      setLogs(logs.data);
      setMessage('Zadania wykonane — sprawdź historię');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setRunningJobs(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString('pl-PL') : '—';

  const tabStyle = (tab) => ({
    padding: '8px 16px',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
    background: 'none',
    cursor: 'pointer',
    fontWeight: activeTab === tab ? 600 : 400,
    color: activeTab === tab ? '#2563eb' : '#6b7280',
    fontSize: 14,
  });

  const handleTestEmail = async () => {
    setTestLoading(true);
    try {
        const res = await api.post('/emails/test');
        setMessage(res.data.message);
        setTimeout(() => setMessage(''), 5000);
    } catch (err) {
        setMessage('Błąd: ' + (err.response?.data?.error || 'nieznany błąd'));
    } finally {
        setTestLoading(false);
    }
    };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Maile automatyczne</h1>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={handleTestEmail} disabled={testLoading}>
              {testLoading ? 'Wysyłanie...' : '✉️ Wyślij testowy mail'}
            </button>
            <button className="btn-secondary" onClick={handleRunJobs} disabled={runningJobs}>
              {runningJobs ? 'Uruchamianie...' : '▶ Uruchom teraz'}
            </button>
          </div>
        )}
      </div>

      {message && (
        <div style={{
          background: isDark ? '#14532d33' : '#f0fdf4',
          border: '1px solid #16a34a', color: '#16a34a',
          borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, fontWeight: 600,
        }}>
          ✓ {message}
        </div>
      )}

      {/* Taby */}
      <div style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`, marginBottom: 24, display: 'flex', gap: 8 }}>
        <button style={tabStyle('templates')} onClick={() => setActiveTab('templates')}>Szablony</button>
        <button style={tabStyle('campaigns')} onClick={() => setActiveTab('campaigns')}>Kampanie</button>
        <button style={tabStyle('logs')} onClick={() => setActiveTab('logs')}>
          Historia ({logs.length})
        </button>
      </div>

      {/* Szablony */}
      {activeTab === 'templates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {templates.map(template => (
            <div key={template.id} className="card">
              {editingId === template.id ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600 }}>{TYPE_NAMES[template.type]}</h2>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={editForm.enabled}
                        onChange={e => setEditForm(prev => ({ ...prev, enabled: e.target.checked }))}
                      />
                      Włączony
                    </label>
                  </div>

                  <div style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#6b7280', marginBottom: 12, background: isDark ? '#263548' : '#f9fafb', border: isDark ? '1px solid #334155' : 'none', padding: '8px 10px', borderRadius: 6 }}>
                    Dostępne zmienne: <code>{VARIABLES_HELP}</code>
                  </div>

                  <div className="form-group">
                    <label>Temat maila</label>
                    <input
                      value={editForm.subject}
                      onChange={e => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Treść maila</label>
                    <textarea
                      value={editForm.body}
                      onChange={e => setEditForm(prev => ({ ...prev, body: e.target.value }))}
                      rows={12}
                      style={{ fontFamily: 'monospace', fontSize: 13 }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn-primary" onClick={handleSave} disabled={saving}>
                      {saving ? 'Zapisywanie...' : 'Zapisz'}
                    </button>
                    <button className="btn-secondary" onClick={() => setEditingId(null)}>Anuluj</button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <h2 style={{ fontSize: 15, fontWeight: 600 }}>{TYPE_NAMES[template.type]}</h2>
                      <span style={{
                        fontSize: 11, fontWeight: 700, borderRadius: 99, padding: '2px 8px',
                        background: template.enabled ? (isDark ? '#14532d33' : '#f0fdf4') : (isDark ? '#1e293b' : '#f9fafb'),
                        color: template.enabled ? '#16a34a' : (isDark ? '#64748b' : '#9ca3af'),
                        border: `1px solid ${template.enabled ? '#16a34a' : (isDark ? '#334155' : '#e5e7eb')}`,
                      }}>
                        {template.enabled ? 'Włączony' : 'Wyłączony'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 4 }}>
                      <strong>Temat:</strong> {template.subject}
                    </div>
                    <div style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#6b7280', whiteSpace: 'pre-wrap', maxHeight: 60, overflow: 'hidden' }}>
                      {template.body.substring(0, 120)}...
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 16 }}>
                    <button
                        className="btn-secondary"
                        style={{ fontSize: 12, padding: '6px 12px' }}
                        onClick={() => handleTestByType(template.type)}
                    >
                        ✉️ Test
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={() => handleEdit(template)}
                    >
                        Edytuj
                    </button>
                    </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Kampanie */}
      {activeTab === 'campaigns' && <CampaignTab isDark={isDark} />}

      {/* Historia */}
      {activeTab === 'logs' && (
        <div className="card">
          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Brak wysłanych maili</div>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Data wysłania</th>
                    <th>Klient</th>
                    <th>Email</th>
                    <th>Typ</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs
                    .slice((logsPage - 1) * LOGS_PER_PAGE, logsPage * LOGS_PER_PAGE)
                    .map(log => (
                      <tr key={log.id}>
                        <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>{formatDate(log.sent_at)}</td>
                        <td>{log.client_name || '—'}</td>
                        <td style={{ fontSize: 13 }}>{log.recipient_email}</td>
                        <td style={{ fontSize: 13 }}>{TYPE_NAMES[log.email_type] || log.email_type}</td>
                        <td>
                          <span style={{
                            fontSize: 12, fontWeight: 600, borderRadius: 99, padding: '2px 8px',
                            background: log.status === 'sent' ? (isDark ? '#14532d33' : '#f0fdf4') : (isDark ? '#7f1d1d33' : '#fef2f2'),
                            color: log.status === 'sent' ? '#16a34a' : '#ef4444',
                            border: `1px solid ${log.status === 'sent' ? '#16a34a' : '#ef4444'}`,
                          }}>
                            {log.status === 'sent' ? '✓ Wysłany' : '✗ Błąd'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <Pagination
                total={logs.length}
                perPage={LOGS_PER_PAGE}
                currentPage={logsPage}
                onPageChange={setLogsPage}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailsPage;