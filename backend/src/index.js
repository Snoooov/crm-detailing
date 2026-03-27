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

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Serwer działa' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie ${PORT}`);
});