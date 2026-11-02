const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const app = require('./app');
const connectDB = require('./config/db');
const { startTrackingScheduler } = require('./services/trackingScheduler');
const { startKeepAliveService } = require('./services/keepAlive');

const PORT = process.env.PORT || 5000;

// Start Server (used by Render & local standalone Node.js)
async function startServer() {
  await connectDB();
  startTrackingScheduler();
  startKeepAliveService();

  app.listen(PORT, () => {
    const pollSec = parseInt(process.env.POLL_INTERVAL_SECONDS || '1800', 10);
    console.log(`=======================================================`);
    console.log(`🚀 LDB Vehicle Toll Tracking API Server running on port ${PORT}`);
    console.log(`📡 LDB Polling Interval: ${pollSec}s (${Math.round(pollSec / 60)} minutes)`);
    console.log(`🌐 Health endpoint: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
}

startServer();
