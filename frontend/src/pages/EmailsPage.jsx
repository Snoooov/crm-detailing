import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import Pagination from '../components/Pagination.jsx';
import useDarkMode from '../hooks/useDarkMode.js';

const TYPE_NAMES = {
  confirmation: 'Potwierdzenie rezerwacji',
  reminder_24h: 'Przypomnienie 24h przed',
  ready: 'Auto gotowe do odbioru',
  followup_short: 'Follow-up (4 dni po)',
  followup_long: 'Follow-up (30 dni po)',
};

const VARIABLES_HELP = '{{client_name}}, {{vehicle_brand}}, {{vehicle_model}}, {{plate_number}}, {{service_name}}, {{date_from}}, {{date_to}}';

const EmailsPage = () => {
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
        <div style={{ display: 'flex', gap: 8 }}>
            <button
            className="btn-secondary"
            onClick={handleTestEmail}
            disabled={testLoading}
            >
            {testLoading ? 'Wysyłanie...' : '✉️ Wyślij testowy mail'}
            </button>
            <button
            className="btn-secondary"
            onClick={handleRunJobs}
            disabled={runningJobs}
            >
            {runningJobs ? 'Uruchamianie...' : '▶ Uruchom teraz'}
            </button>
        </div>
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