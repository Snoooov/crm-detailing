import { useState, useEffect } from 'react';
import api from '../api/axios.js';

const SettingsPage = () => {
  const [status, setStatus] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
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
            background: '#f0fdf4',
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
              background: '#f0fdf4',
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
              background: '#fef2f2',
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
                  background: '#f3f4f6',
                  borderRadius: 6,
                  padding: '8px 12px',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  letterSpacing: 2,
                  marginBottom: 16,
                  wordBreak: 'break-all',
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
    </div>
  );
};

export default SettingsPage;