const { execSync } = require('child_process');

/**
 * Gracefully free ports 5050 and 5173 before launching local dev servers
 * so there are never EADDRINUSE conflicts.
 */
function freePort(port) {
  try {
    if (process.platform === 'win32') {
      const res = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: 'utf-8' });
      const pids = res.trim().split('\n').map((l) => l.trim().split(/\s+/).pop()).filter(Boolean);
      for (const pid of pids) {
        try { execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' }); } catch (e) {}
      }
    } else {
      const res = execSync(`lsof -ti :${port} -sTCP:LISTEN`, { encoding: 'utf-8' }).trim();
      if (res) {
        const pids = res.split('\n').filter(Boolean);
        for (const pid of pids) {
          try {
            process.kill(Number(pid), 'SIGKILL');
          } catch (e) {}
        }
      }
    }
  } catch (err) {
    // Port was already free, nothing to do
  }
}

freePort(5050);
freePort(5173);

