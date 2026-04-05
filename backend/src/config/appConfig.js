/**
 * Centralna konfiguracja aplikacji.
 *
 * Wszystkie wartości można nadpisać zmiennymi środowiskowymi w pliku .env.
 * Domyślne wartości działają od razu bez żadnej konfiguracji (środowisko developerskie).
 */

module.exports = {
  // ─── Firma ────────────────────────────────────────────────────────────────
  company: {
    /** Pełna nazwa firmy — używana w PDF, mailach, iCal, 2FA QR */
    name: process.env.COMPANY_NAME || 'Auto Detailing',
    /** Skrócona nazwa / identyfikator — używana w domenach iCal, PRODID */
    slug: process.env.COMPANY_SLUG || 'autodetailing-crm',
  },

  // ─── Serwer ───────────────────────────────────────────────────────────────
  server: {
    port: parseInt(process.env.PORT, 10) || 5000,
    /** Maksymalny rozmiar ciała żądania */
    bodyLimit: process.env.BODY_LIMIT || '1mb',
    /** URL frontendu — używany przez CORS */
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    /** Publiczny URL backendu — używany do generowania linków iCal */
    backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
  },

  // ─── Bezpieczeństwo ───────────────────────────────────────────────────────
  auth: {
    /** Czas ważności tokena JWT (np. '8h', '1d', '30m') */
    jwtExpiry: process.env.JWT_EXPIRY || '8h',
    /** Liczba rund bcrypt do hashowania haseł */
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,
  },

  // ─── Rate limiting ────────────────────────────────────────────────────────
  rateLimit: {
    login: {
      /** Okno czasowe w milisekundach */
      windowMs: parseInt(process.env.RATE_LOGIN_WINDOW_MS, 10) || 15 * 60 * 1000,
      /** Maksymalna liczba prób logowania w oknie */
      max: parseInt(process.env.RATE_LOGIN_MAX, 10) || 20,
    },
    api: {
      /** Okno czasowe w milisekundach */
      windowMs: parseInt(process.env.RATE_API_WINDOW_MS, 10) || 60 * 1000,
      /** Maksymalna liczba zapytań API w oknie */
      max: parseInt(process.env.RATE_API_MAX, 10) || 200,
    },
  },

  // ─── Email ────────────────────────────────────────────────────────────────
  email: {
    /** Typ transportera nodemailer (np. 'gmail', 'smtp') */
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || '',
  },

  // ─── Scheduler emaili ─────────────────────────────────────────────────────
  scheduler: {
    /** Wyrażenie cron określające częstotliwość sprawdzania emaili do wysłania */
    cronExpression: process.env.EMAIL_CRON || '0 * * * *',
    /** Opóźnienie pierwszego uruchomienia po starcie serwera (ms) */
    startupDelayMs: parseInt(process.env.EMAIL_STARTUP_DELAY_MS, 10) || 5000,
  },
};
