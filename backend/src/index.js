require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/appConfig');

const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const orderRoutes = require('./routes/orderRoutes');
const searchRoutes = require('./routes/searchRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const noteRoutes = require('./routes/noteRoutes');
const twoFactorRoutes = require('./routes/twoFactorRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const { startScheduler } = require('./services/emailScheduler');
const emailRoutes = require('./routes/emailRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const icalRoutes = require('./routes/icalRoutes');
const logsRoutes = require('./routes/logsRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.server.frontendUrl,
  credentials: true,
}));
app.use(express.json({ limit: config.server.bodyLimit }));

const loginLimiter = rateLimit({
  windowMs: config.rateLimit.login.windowMs,
  max: config.rateLimit.login.max,
  message: { error: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.' },
});

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.api.windowMs,
  max: config.rateLimit.api.max,
  message: { error: 'Zbyt wiele zapytań. Spróbuj ponownie za chwilę.' },
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/ical', icalRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Serwer działa' });
});

const PORT = config.server.port;
startScheduler();
app.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie ${PORT}`);
});