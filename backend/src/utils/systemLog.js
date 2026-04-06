const pool = require('../config/db');

/**
 * Loguje akcję systemową do tabeli system_logs.
 * Nigdy nie rzuca wyjątku — logowanie nie może przerywać normalnego działania.
 */
const logAction = async ({ userId, userName, action, entityType, entityId, details, ipAddress }) => {
  try {
    await pool.query(
      `INSERT INTO system_logs (user_id, user_name, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId   || null,
        userName || null,
        action,
        entityType || null,
        entityId   || null,
        JSON.stringify(details || {}),
        ipAddress  || null,
      ]
    );
  } catch (err) {
    console.error('[SystemLog] Błąd zapisu logu:', err.message);
  }
};

module.exports = { logAction };
