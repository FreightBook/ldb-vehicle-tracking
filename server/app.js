const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const tripRoutes = require('./routes/tripRoutes');
const connectDB = require('./config/db');

const app = express();

// Enable CORS
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-access-code'],
  })
);

app.use(express.json());

// Health check handler (Requirement: placed before custom API routes and error middleware)
const healthCheckHandler = (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const statusCode = isDbConnected ? 200 : 503;
  return res.status(statusCode).json({
    status: isDbConnected ? 'ok' : 'degraded',
    db: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(2)}s`,
  });
};

app.get('/health', healthCheckHandler);
app.get('/api/health', healthCheckHandler);

// Optional cron trigger endpoint (for external cron services or serverless invocations)
app.get('/api/cron/poll', async (req, res) => {
  try {
    await connectDB();
    const { processAllActiveTrips } = require('./services/trackingScheduler');
    await processAllActiveTrips();
    return res.json({
      success: true,
      message: 'Active vehicle tracking poll completed',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[Cron Route Error] ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

// Verify access passcode endpoint
app.post('/api/auth/verify-code', (req, res) => {
  const { code } = req.body || {};
  const expectedCode = process.env.APP_ACCESS_CODE || 'FASTAG2026';
  if (!code || code.trim() !== expectedCode.trim()) {
    return res.status(401).json({ error: 'Invalid passcode. Please enter the correct code.' });
  }
  return res.json({ success: true, message: 'Access granted' });
});

// Shield /api/trips with access passcode
app.use(
  '/api/trips',
  (req, res, next) => {
    const expectedCode = process.env.APP_ACCESS_CODE;
    if (!expectedCode) return next();

    const providedCode = req.headers['x-access-code'] || req.query.code;
    if (!providedCode || providedCode.trim() !== expectedCode.trim()) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or missing access code' });
    }
    next();
  },
  tripRoutes
);

// Serve frontend build in production if available (for Node / Render standalone)
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Fallback for SPA routing in Node / Render standalone
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.url.startsWith('/api')) {
    return res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
      if (err) {
        res.status(200).send('LDB Vehicle Tracking API Server is running');
      }
    });
  }
  next();
});

module.exports = app;

