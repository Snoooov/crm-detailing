const pool = require('../config/db');
const config = require('../config/appConfig');

// Prosty cache — odświeżany co 60 sekund
let cache = null;
let cacheAt = 0;
const TTL = 60_000;

const DEFAULTS = {
  name:          config.company.name,
  address:       '',
  phone:         '',
  email_contact: '',
  nip:           '',
  website:       '',
  slug:          config.company.slug,
};

/**
 * Zwraca dane firmy z bazy (z cache).
 * Nigdy nie rzuca wyjątku — w razie błędu wraca do wartości z .env.
 */
const getCompany = async () => {
  const now = Date.now();
  if (cache && now - cacheAt < TTL) return cache;

  try {
    const result = await pool.query('SELECT * FROM company_settings WHERE id = 1');
    const row = result.rows[0];
    if (row) {
      cache = {
        name:          row.name          || DEFAULTS.name,
        address:       row.address       || '',
        phone:         row.phone         || '',
        email_contact: row.email_contact || '',
        nip:           row.nip           || '',
        website:       row.website       || '',
        // slug nie jest edytowalny z UI — zostaje z .env
        slug:          DEFAULTS.slug,
      };
      cacheAt = now;
      return cache;
    }
  } catch (err) {
    console.error('[companySettings] Błąd odczytu:', err.message);
  }
  return DEFAULTS;
};

/** Czyści cache — wywołaj po zapisie danych firmy */
const invalidateCache = () => {
  cache = null;
  cacheAt = 0;
};

module.exports = { getCompany, invalidateCache };
