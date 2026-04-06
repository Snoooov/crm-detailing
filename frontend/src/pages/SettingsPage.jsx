import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import useDarkMode from '../hooks/useDarkMode.js';

// ─── iCal ────────────────────────────────────────────────────────────────────

const ICalSection = ({ isDark }) => {
  const [icalUrl, setIcalUrl] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedWebcal, setCopiedWebcal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/ical/token');
      setIcalUrl(res.data.url);
    } catch (err) {
      setError('Błąd podczas generowania linku');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text, setter) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const webcalUrl = icalUrl ? icalUrl.replace(/^https?/, 'webcal') : null;
  const isLocalhost = icalUrl && (icalUrl.includes('localhost') || icalUrl.includes('127.0.0.1'));
  const border = isDark ? '#334155' : '#e5e7eb';

  return (
    <div className="card">
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Kalendarz iPhone / iCal</h2>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
        Subskrybuj harmonogram zleceń w Kalendarzu iPhone, Google Calendar lub dowolnej aplikacji obsługującej iCal.
        Kalendarz odświeża się automatycznie.
      </p>

      {!icalUrl ? (
        <>
          {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}
          <button className="btn-primary" onClick={generate} disabled={loading}>
            {loading ? 'Generowanie...' : 'Wygeneruj link do kalendarza'}
          </button>
        </>
      ) : (
        <>
          {isLocalhost && (
            <div style={{
              background: isDark ? '#7c2d1222' : '#fff7ed',
              border: '1px solid #f97316',
              borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13,
              color: isDark ? '#fb923c' : '#c2410c',
            }}>
              <strong>Uwaga:</strong> URL zawiera <code>localhost</code> — iPhone nie może się z nim połączyć.
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 600 }}>URL kalendarza (HTTP)</div>
            <div style={{
              background: isDark ? '#263548' : '#f3f4f6',
              border: `1px solid ${border}`,
              borderRadius: 6, padding: '8px 12px',
              fontFamily: 'monospace', fontSize: 11,
              wordBreak: 'break-all', marginBottom: 8,
              color: isDark ? '#e2e8f0' : '#374151',
            }}>
              {icalUrl}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={() => copyText(icalUrl, setCopiedUrl)} style={{ fontSize: 12 }}>
                {copiedUrl ? '✓ Skopiowano' : 'Kopiuj URL'}
              </button>
              <button className="btn-secondary" onClick={() => copyText(webcalUrl, setCopiedWebcal)} style={{ fontSize: 12 }}>
                {copiedWebcal ? '✓ Skopiowano' : 'Kopiuj webcal://'}
              </button>
              <a href={webcalUrl} style={{ padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#4f46e5', color: 'white', textDecoration: 'none', display: 'inline-block' }}>
                Otwórz w Kalendarzu
              </a>
              <button className="btn-secondary" onClick={generate} style={{ fontSize: 12 }}>Odśwież link</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Zmiana hasła ─────────────────────────────────────────────────────────────

const PasswordSection = ({ isDark }) => {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.current_password || !form.new_password) return setError('Wypełnij wszystkie pola');
    if (form.new_password !== form.confirm_password) return setError('Nowe hasła nie są identyczne');
    if (form.new_password.length < 6) return setError('Nowe hasło musi mieć co najmniej 6 znaków');
    if (form.new_password === form.current_password) return setError('Nowe hasło musi się różnić od aktualnego');

    setLoading(true);
    setError('');
    try {
      await api.put('/settings/password', {
        current_password: form.current_password,
        new_password: form.new_password,
      });
      setSuccess('Hasło zostało zmienione pomyślnie');
      setForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas zmiany hasła');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Zmiana hasła</h2>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>
        Aby zmienić hasło, wprowadź najpierw aktualne, a następnie nowe.
      </p>

      {success && (
        <div style={{ background: isDark ? '#14532d33' : '#f0fdf4', border: '1px solid #16a34a', color: '#16a34a', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
          ✓ {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Aktualne hasło</label>
          <input type="password" name="current_password" value={form.current_password} onChange={handleChange} autoComplete="current-password" />
        </div>
        <div className="form-group">
          <label>Nowe hasło</label>
          <input type="password" name="new_password" value={form.new_password} onChange={handleChange} autoComplete="new-password" />
        </div>
        <div className="form-group">
          <label>Powtórz nowe hasło</label>
          <input type="password" name="confirm_password" value={form.confirm_password} onChange={handleChange} autoComplete="new-password" />
        </div>
        {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Zapisywanie...' : 'Zmień hasło'}
        </button>
      </form>
    </div>
  );
};

// ─── Dane firmy (admin) ───────────────────────────────────────────────────────

const CompanySection = ({ isDark }) => {
  const [form, setForm] = useState({ name: '', address: '', phone: '', email_contact: '', nip: '', website: '' });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');

  useEffect(() => {
    api.get('/settings/company').then(res => {
      setForm(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) return setError('Nazwa firmy jest wymagana');
    setSaving(true);
    setError('');
    try {
      await api.put('/settings/company', form);
      setSuccess('Dane firmy zostały zapisane');
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas zapisywania');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="card">
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Dane firmy</h2>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>
        Informacje wyświetlane na kartach przyjęcia, PDF i w mailach do klientów.
      </p>

      {success && (
        <div style={{ background: isDark ? '#14532d33' : '#f0fdf4', border: '1px solid #16a34a', color: '#16a34a', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
          ✓ {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nazwa firmy *</label>
          <input name="name" value={form.name} onChange={handleChange} placeholder="np. Auto Detailing Kowalski" />
        </div>
        <div className="form-group">
          <label>Adres</label>
          <textarea name="address" value={form.address} onChange={handleChange} rows={2} placeholder="ul. Przykładowa 1, 00-001 Warszawa" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label>Telefon kontaktowy</label>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="+48 123 456 789" />
          </div>
          <div className="form-group">
            <label>NIP</label>
            <input name="nip" value={form.nip} onChange={handleChange} placeholder="000-000-00-00" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label>Email kontaktowy</label>
            <input name="email_contact" type="email" value={form.email_contact} onChange={handleChange} placeholder="kontakt@firma.pl" />
          </div>
          <div className="form-group">
            <label>Strona WWW</label>
            <input name="website" value={form.website} onChange={handleChange} placeholder="https://firma.pl" />
          </div>
        </div>
        {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Zapisywanie...' : 'Zapisz dane firmy'}
        </button>
      </form>
    </div>
  );
};

// ─── Preferencje powiadomień ──────────────────────────────────────────────────

const NOTIF_TYPES = [
  { key: 'show_overdue',  label: 'Zlecenia przeterminowane', desc: 'Gdy data zakończenia już minęła',         color: '#ef4444' },
  { key: 'show_today',    label: 'Zlecenia na dziś',         desc: 'Zlecenia zaplanowane na bieżący dzień',   color: '#d97706' },
  { key: 'show_ready',    label: 'Gotowe do wydania',        desc: 'Zlecenia ze statusem "Gotowe"',           color: '#16a34a' },
  { key: 'show_tomorrow', label: 'Zlecenia jutro',           desc: 'Zlecenia zaplanowane na jutro',           color: '#2563eb' },
];

const NotificationsSection = ({ isDark }) => {
  const [prefs, setPrefs]     = useState(null);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  const border = isDark ? '#334155' : '#e5e7eb';
  const bg     = isDark ? '#1e293b' : '#f9fafb';

  useEffect(() => {
    api.get('/settings/notifications').then(res => setPrefs(res.data)).catch(() => {});
  }, []);

  const toggle = (key) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    setSuccess('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put('/settings/notifications', prefs);
      setSuccess('Preferencje zostały zapisane');
    } catch (err) {
      setError('Błąd podczas zapisywania');
    } finally {
      setSaving(false);
    }
  };

  if (!prefs) return null;

  return (
    <div className="card">
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Powiadomienia</h2>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>
        Wybierz które typy powiadomień chcesz widzieć w dzwonku w górnym pasku.
      </p>

      {success && (
        <div style={{ background: isDark ? '#14532d33' : '#f0fdf4', border: '1px solid #16a34a', color: '#16a34a', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
          ✓ {success}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {NOTIF_TYPES.map(t => (
          <label
            key={t.key}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: 8,
              border: `1px solid ${prefs[t.key] ? t.color + '60' : border}`,
              background: prefs[t.key] ? (isDark ? t.color + '15' : t.color + '08') : bg,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onClick={() => toggle(t.key)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: prefs[t.key] ? t.color : (isDark ? '#334155' : '#d1d5db'),
                flexShrink: 0, transition: 'background 0.15s',
              }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{t.label}</div>
                <div style={{ fontSize: 12, color: isDark ? '#64748b' : '#9ca3af', marginTop: 1 }}>{t.desc}</div>
              </div>
            </div>
            <div style={{
              width: 40, height: 22, borderRadius: 99,
              background: prefs[t.key] ? t.color : (isDark ? '#334155' : '#d1d5db'),
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: 3, left: prefs[t.key] ? 21 : 3,
                width: 16, height: 16, borderRadius: '50%', background: 'white',
                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
          </label>
        ))}
      </div>

      {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}
      <button className="btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Zapisywanie...' : 'Zapisz preferencje'}
      </button>
    </div>
  );
};

// ─── 2FA ─────────────────────────────────────────────────────────────────────

const TwoFactorSection = ({ isDark }) => {
  const [status, setStatus] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState('');
  const [token, setToken]   = useState('');
  const [message, setMessage] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/2fa/status').then(res => setStatus(res.data.totp_enabled));
  }, []);

  const handleSetup = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/2fa/setup');
      setQrCode(res.data.qrCode);
      setSecret(res.data.secret);
    } catch {
      setError('Błąd podczas konfiguracji');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post('/2fa/enable', { token });
      setStatus(true);
      setQrCode(null);
      setSecret('');
      setToken('');
      setMessage('2FA zostało włączone pomyślnie!');
    } catch (err) {
      setError(err.response?.data?.error || 'Nieprawidłowy kod');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post('/2fa/disable', { token });
      setStatus(false);
      setToken('');
      setMessage('2FA zostało wyłączone.');
    } catch (err) {
      setError(err.response?.data?.error || 'Nieprawidłowy kod');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Weryfikacja dwuetapowa (2FA)</h2>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>
        Zwiększ bezpieczeństwo konta wymagając kodu z aplikacji authenticator przy każdym logowaniu.
      </p>

      {message && (
        <div style={{ background: isDark ? '#14532d33' : '#f0fdf4', border: '1px solid #16a34a', color: '#16a34a', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
          ✓ {message}
        </div>
      )}

      {status === null ? (
        <div style={{ color: '#6b7280' }}>Ładowanie...</div>
      ) : status ? (
        <>
          <div style={{ background: isDark ? '#14532d33' : '#f0fdf4', border: '1px solid #16a34a', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
            ✓ 2FA jest włączone
          </div>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>Aby wyłączyć 2FA wprowadź kod z aplikacji authenticator:</p>
          <div className="form-group">
            <label>Kod weryfikacyjny</label>
            <input type="text" value={token} onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} style={{ fontSize: 20, letterSpacing: 6, textAlign: 'center' }} />
          </div>
          {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}
          <button className="btn-danger" onClick={handleDisable} disabled={loading || token.length !== 6}>
            {loading ? 'Wyłączanie...' : 'Wyłącz 2FA'}
          </button>
        </>
      ) : (
        <>
          <div style={{ background: isDark ? '#7f1d1d33' : '#fef2f2', border: '1px solid #ef4444', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#ef4444', fontWeight: 600 }}>
            ✗ 2FA jest wyłączone
          </div>
          {!qrCode ? (
            <button className="btn-primary" onClick={handleSetup} disabled={loading}>
              {loading ? 'Generowanie...' : 'Skonfiguruj 2FA'}
            </button>
          ) : (
            <>
              <p style={{ fontSize: 13, color: '#374151', marginBottom: 12 }}>1. Zainstaluj <strong>Google Authenticator</strong> lub <strong>Authy</strong> na telefonie.</p>
              <p style={{ fontSize: 13, color: '#374151', marginBottom: 12 }}>2. Zeskanuj kod QR:</p>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <img src={qrCode} alt="QR Code" style={{ width: 180, height: 180 }} />
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Lub wprowadź ręcznie klucz:</p>
              <div style={{ background: isDark ? '#263548' : '#f3f4f6', border: `1px solid ${isDark ? '#334155' : 'transparent'}`, borderRadius: 6, padding: '8px 12px', fontFamily: 'monospace', fontSize: 13, letterSpacing: 2, marginBottom: 16, wordBreak: 'break-all', color: isDark ? '#e2e8f0' : '#111' }}>
                {secret}
              </div>
              <p style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>3. Wprowadź kod z aplikacji aby potwierdzić:</p>
              <div className="form-group">
                <label>Kod weryfikacyjny</label>
                <input type="text" value={token} onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} style={{ fontSize: 20, letterSpacing: 6, textAlign: 'center' }} autoFocus />
              </div>
              {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}
              <button className="btn-primary" onClick={handleEnable} disabled={loading || token.length !== 6}>
                {loading ? 'Weryfikowanie...' : 'Włącz 2FA'}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
};

// ─── Główna strona ────────────────────────────────────────────────────────────

const SettingsPage = () => {
  const { user } = useAuth();
  const isDark = useDarkMode();
  const isAdmin = user?.role === 'admin';

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Ustawienia</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, alignItems: 'start' }}>
        <PasswordSection isDark={isDark} />
        <NotificationsSection isDark={isDark} />
        <TwoFactorSection isDark={isDark} />
        <ICalSection isDark={isDark} />
        {isAdmin && (
          <div style={{ gridColumn: '1 / -1' }}>
            <CompanySection isDark={isDark} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
