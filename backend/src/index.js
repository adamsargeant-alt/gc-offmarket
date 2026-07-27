require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const db = require('./config/database');

const authRouter = require('./routes/auth');
const suburbsRouter = require('./routes/suburbs');
const listingsRouter = require('./routes/listings');
const buyersRouter = require('./routes/buyers');

const app = express();

const isProd = process.env.NODE_ENV === 'production';
const FRONTEND_DIST = path.join(__dirname, '../../frontend/dist');

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy: false }));
if (!isProd) {
  app.use(cors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:3000',
    ],
    credentials: true,
  }));
}
app.use(express.json());
app.use(morgan(isProd ? 'combined' : 'dev'));

// Serve frontend static files in production
if (isProd && fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
}

// Routes
app.use('/api/auth', authRouter);
app.use('/api/suburbs', suburbsRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/buyers', buyersRouter);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: err.message });
  }
});

// Auto-run migrations on startup
async function initDB() {
  try {
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await db.query(sql);
      console.log('✅ Database schema initialized');
    }
  } catch (err) {
    console.error('⚠️  DB init warning:', err.message);
  }
}

// Permanently purge listings/buyers past their chosen expiry.
// Rows are already excluded from every query once expired (expires_at > NOW()
// filters), so this just needs to run periodically to reclaim the space —
// once a week, Sunday night, is plenty.
async function purgeExpired() {
  try {
    const listings = await db.query('DELETE FROM listings WHERE expires_at <= NOW()');
    const buyers = await db.query('DELETE FROM buyers WHERE expires_at <= NOW()');
    if (listings.rowCount || buyers.rowCount) {
      console.log(`🧹 Purged ${listings.rowCount} expired listing(s), ${buyers.rowCount} expired buyer(s)`);
    }
  } catch (err) {
    console.error('⚠️  Purge expired warning:', err.message);
  }
}

let lastPurgeDay = null;
function maybePurgeExpired() {
  const now = new Date();
  const isSundayNight = now.getUTCDay() === 0 && now.getUTCHours() === 0;
  const todayKey = now.toISOString().slice(0, 10);
  if (isSundayNight && lastPurgeDay !== todayKey) {
    lastPurgeDay = todayKey;
    purgeExpired();
  }
}

// Catch-all: serve React app for any non-API route (production)
if (isProd && fs.existsSync(FRONTEND_DIST)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

initDB().then(() => {
  maybePurgeExpired();
  setInterval(maybePurgeExpired, 60 * 60 * 1000); // check hourly, purge only runs Sunday night
  app.listen(PORT, () => {
    console.log(`🚀 GC Off-Market API running on http://localhost:${PORT}`);
  });
});
