require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

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
const icalRoutes = require('./routes/icalRoutes');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
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
app.use('/api/ical', icalRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Serwer działa' });
});

const PORT = process.env.PORT || 5000;
startScheduler();
app.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie ${PORT}`);
});