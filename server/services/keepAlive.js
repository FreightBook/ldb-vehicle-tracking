const axios = require('axios');

/**
 * Self-pinging Keep-Alive service
 * Render free tier spins down web services after 15 minutes of inbound HTTP inactivity.
 * By periodically making an outbound HTTPS request to the app's public URL,
 * Render's load balancer registers inbound traffic and resets the 15-minute idle countdown.
 */
function startKeepAliveService() {
  // Determine public target URL:
  // 1. Explicit KEEP_ALIVE_URL in env
  // 2. Render's built-in RENDER_EXTERNAL_URL (e.g., https://ldb-vehicle-tracking.onrender.com)
  const explicitUrl = process.env.KEEP_ALIVE_URL;
  const renderUrl = process.env.RENDER_EXTERNAL_URL;
  
  let targetUrl = null;
  if (explicitUrl) {
    targetUrl = explicitUrl.endsWith('/health') ? explicitUrl : `${explicitUrl.replace(/\/$/, '')}/health`;
  } else if (renderUrl) {
    targetUrl = `${renderUrl.replace(/\/$/, '')}/health`;
  }

  if (!targetUrl) {
    console.log('[Keep-Alive] No RENDER_EXTERNAL_URL or KEEP_ALIVE_URL detected. Self-ping idle prevention inactive in local environment.');
    return;
  }

  const intervalMinutes = parseInt(process.env.KEEP_ALIVE_INTERVAL_MINUTES || '5', 10);
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`[Keep-Alive] Initialized. Target: ${targetUrl} | Interval: every ${intervalMinutes} minutes.`);

  // First ping after 45 seconds of server startup
  setTimeout(() => {
    pingTarget(targetUrl);
  }, 45 * 1000);

  // Recurring ping every 5 minutes (well under the 15-minute Render threshold)
  setInterval(() => {
    pingTarget(targetUrl);
  }, intervalMs);
}

async function pingTarget(url) {
  try {
    const startTime = Date.now();
    const res = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'SMTS-KeepAlive-Ping/1.0',
      },
    });
    const latency = Date.now() - startTime;
    console.log(`[Keep-Alive Ping] ${url} -> Status ${res.status} (${latency}ms) at ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    console.warn(`[Keep-Alive Ping Warning] Could not reach ${url}: ${err.message}`);
  }
}

module.exports = { startKeepAliveService };
