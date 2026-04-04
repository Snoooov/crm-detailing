import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import useDarkMode from '../hooks/useDarkMode.js';

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

  return (
    <div className="card" style={{ maxWidth: 560, marginTop: 24 }}>
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
              Upewnij się że serwer nasłuchuje na interfejsie sieciowym (nie tylko 127.0.0.1) lub zrestartuj backend — powinien automatycznie wykryć lokalny IP.
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 600 }}>
              URL kalendarza (HTTP)
            </div>
            <div style={{
              background: isDark ? '#263548' : '#f3f4f6',
              border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
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
              <a
                href={webcalUrl}
                style={{
                  padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: '#4f46e5', color: 'white', textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Otwórz w Kalendarzu
              </a>
              <button className="btn-secondary" onClick={generate} style={{ fontSize: 12 }}>
                Odśwież link
              </button>
            </div>
          </div>

          <div style={{
            background: isDark ? '#1e293b' : '#f8fafc',
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            borderRadius: 8, padding: '14px 16px', fontSize: 13,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Jak dodać do iPhone (to samo WiFi co serwer):</div>
            <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 2, color: isDark ? '#94a3b8' : '#374151' }}>
              <li>Kliknij <strong>Otwórz w Kalendarzu</strong> powyżej — iPhone zapyta o dodanie</li>
              <li>Lub ręcznie: <strong>Ustawienia → Kalendarz → Konta → Dodaj konto → Inne</strong></li>
              <li>Wybierz <strong>Dodaj subskrybowany kalendarz</strong></li>
              <li>Wklej skopiowany URL i naciśnij <strong>Dalej</strong></li>
            </ol>
            <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 6, fontSize: 12,
              background: isDark ? '#0f172a' : '#eff6ff',
              color: isDark ? '#60a5fa' : '#1d4ed8',
              border: `1px solid ${isDark ? '#1e3a5f' : '#bfdbfe'}`,
            }}>
              iPhone i komputer z serwerem muszą być w tej samej sieci WiFi.
              Po wdrożeniu na produkcję ustaw <code>BACKEND_URL</code> w <code>backend/.env</code>.
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const SettingsPage = () => {
  const [status, setStatus] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isDark = useDarkMode();

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
    } catch (err) {
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
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Ustawienia</h1>

      <div className="card" style={{ maxWidth: 520 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
          Weryfikacja dwuetapowa (2FA)
        </h2>
        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>
          Zwiększ bezpieczeństwo konta wymagając kodu z aplikacji authenticator przy każdym logowaniu.
        </p>

        {message && (
          <div style={{
            background: isDark ? '#14532d33' : '#f0fdf4',
            border: '1px solid #16a34a',
            color: '#16a34a',
            borderRadius: 6,
            padding: '10px 14px',
            marginBottom: 16,
            fontSize: 13,
          }}>
            ✓ {message}
          </div>
        )}

        {status === null ? (
          <div style={{ color: '#6b7280' }}>Ładowanie...</div>
        ) : status ? (
          <>
            <div style={{
              background: isDark ? '#14532d33' : '#f0fdf4',
              border: '1px solid #16a34a',
              borderRadius: 6,
              padding: '10px 14px',
              marginBottom: 16,
              fontSize: 13,
              color: '#16a34a',
              fontWeight: 600,
            }}>
              ✓ 2FA jest włączone
            </div>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
              Aby wyłączyć 2FA wprowadź kod z aplikacji authenticator:
            </p>
            <div className="form-group">
              <label>Kod weryfikacyjny</label>
              <input
                type="text"
                value={token}
                onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                style={{ fontSize: 20, letterSpacing: 6, textAlign: 'center' }}
              />
            </div>
            {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}
            <button
              className="btn-danger"
              onClick={handleDisable}
              disabled={loading || token.length !== 6}
            >
              {loading ? 'Wyłączanie...' : 'Wyłącz 2FA'}
            </button>
          </>
        ) : (
          <>
            <div style={{
              background: isDark ? '#7f1d1d33' : '#fef2f2',
              border: '1px solid #ef4444',
              borderRadius: 6,
              padding: '10px 14px',
              marginBottom: 16,
              fontSize: 13,
              color: '#ef4444',
              fontWeight: 600,
            }}>
              ✗ 2FA jest wyłączone
            </div>

            {!qrCode ? (
              <button className="btn-primary" onClick={handleSetup} disabled={loading}>
                {loading ? 'Generowanie...' : 'Skonfiguruj 2FA'}
              </button>
            ) : (
              <>
                <p style={{ fontSize: 13, color: '#374151', marginBottom: 12 }}>
                  1. Zainstaluj <strong>Google Authenticator</strong> lub <strong>Authy</strong> na telefonie.
                </p>
                <p style={{ fontSize: 13, color: '#374151', marginBottom: 12 }}>
                  2. Zeskanuj kod QR:
                </p>
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <img src={qrCode} alt="QR Code" style={{ width: 180, height: 180 }} />
                </div>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                  Lub wprowadź ręcznie klucz:
                </p>
                <div style={{
                  background: isDark ? '#263548' : '#f3f4f6',
                  border: `1px solid ${isDark ? '#334155' : 'transparent'}`,
                  borderRadius: 6,
                  padding: '8px 12px',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  letterSpacing: 2,
                  marginBottom: 16,
                  wordBreak: 'break-all',
                  color: isDark ? '#e2e8f0' : '#111',
                }}>
                  {secret}
                </div>
                <p style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>
                  3. Wprowadź kod z aplikacji aby potwierdzić:
                </p>
                <div className="form-group">
                  <label>Kod weryfikacyjny</label>
                  <input
                    type="text"
                    value={token}
                    onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    style={{ fontSize: 20, letterSpacing: 6, textAlign: 'center' }}
                    autoFocus
                  />
                </div>
                {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}
                <button
                  className="btn-primary"
                  onClick={handleEnable}
                  disabled={loading || token.length !== 6}
                >
                  {loading ? 'Weryfikowanie...' : 'Włącz 2FA'}
                </button>
              </>
            )}
          </>
        )}
      </div>

      <ICalSection isDark={isDark} />
    </div>
  );
};

export default SettingsPage;