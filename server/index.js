require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');

const app = express();

const port = process.env.PORT || 3000;
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const allowedOrigins = corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: false }));
app.use(express.json({ limit: '2mb' }));

app.use('/uploads', express.static(uploadDir));

app.use('/admin', adminRoutes);
app.use('/api', publicRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(port, () => {
  console.log(`CMS server running on port ${port}`);
});
