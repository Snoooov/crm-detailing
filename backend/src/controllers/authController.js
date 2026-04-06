const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const pool = require('../config/db');
const config = require('../config/appConfig');
const { logAction } = require('../utils/systemLog');

const getIp = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;

const login = async (req, res) => {
  const { email, password, totp_token } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email i hasło są wymagane' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      await logAction({ action: 'login_failed', details: { email, reason: 'Użytkownik nie istnieje' }, ipAddress: getIp(req) });
      return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      await logAction({ userId: user.id, userName: user.name, action: 'login_failed', details: { email, reason: 'Błędne hasło' }, ipAddress: getIp(req) });
      return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
    }

    if (user.totp_enabled) {
      if (!totp_token) {
        return res.status(200).json({ requires_2fa: true });
      }

      const verified = speakeasy.totp.verify({
        secret: user.totp_secret,
        encoding: 'base32',
        token: totp_token,
        window: 1,
      });

      if (!verified) {
        await logAction({ userId: user.id, userName: user.name, action: 'login_failed', details: { email, reason: 'Błędny kod 2FA' }, ipAddress: getIp(req) });
        return res.status(401).json({ error: 'Nieprawidłowy kod weryfikacyjny' });
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: config.auth.jwtExpiry }
    );

    await logAction({ userId: user.id, userName: user.name, action: 'login', details: { email, role: user.role }, ipAddress: getIp(req) });

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

module.exports = { login };