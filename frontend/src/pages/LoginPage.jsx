import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const LoginPage = () => {
  usePageTitle('Logowanie');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionExpired] = useState(() => {
    const expired = localStorage.getItem('session_expired') === '1';
    if (expired) localStorage.removeItem('session_expired');
    return expired;
  });
  const [isDark, setIsDark] = useState(() => {
    const dark = localStorage.getItem('theme') === 'dark';
    document.body.classList.toggle('dark', dark);
    return dark;
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains('dark'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { email, password };
      if (requires2FA) payload.totp_token = totpToken;

      const res = await api.post('/auth/login', payload);

      if (res.data.requires_2fa) {
        setRequires2FA(true);
        setLoading(false);
        return;
      }

      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Nieprawidłowy email lub hasło');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isDark ? '#0f172a' : '#f5f5f5',
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 400 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Auto Detailing CRM</h1>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>
          {requires2FA ? 'Wprowadź kod z aplikacji authenticator' : 'Zaloguj się do systemu'}
        </p>

        {sessionExpired && (
          <div style={{
            background: '#fef2f2', border: '1px solid #ef4444', color: '#ef4444',
            borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, fontWeight: 600,
          }}>
            Sesja wygasła — zaloguj się ponownie
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!requires2FA ? (
            <>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@crm.pl"
                  required
                />
              </div>
              <div className="form-group">
                <label>Hasło</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </>
          ) : (
            <div className="form-group">
              <label>Kod weryfikacyjny (6 cyfr)</label>
              <input
                type="text"
                value={totpToken}
                onChange={e => setTotpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                autoFocus
                style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center' }}
              />
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                Otwórz Google Authenticator lub Authy i wprowadź kod
              </div>
            </div>
          )}

          {error && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%' }}
            disabled={loading || (requires2FA && totpToken.length !== 6)}
          >
            {loading ? 'Logowanie...' : requires2FA ? 'Weryfikuj' : 'Zaloguj się'}
          </button>

          {requires2FA && (
            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', marginTop: 8 }}
              onClick={() => { setRequires2FA(false); setTotpToken(''); setError(''); }}
            >
              ← Wróć
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginPage;