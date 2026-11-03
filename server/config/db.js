const mongoose = require('mongoose');

let connectionPromise = null;
let listenersAttached = false;

/**
 * Configure global Mongoose connection event handlers once.
 * Listens for connect, disconnect, and runtime errors.
 */
function setupConnectionListeners() {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('connected', () => {
    console.log(
      `[MongoDB] Connection established to ${mongoose.connection.host}/${mongoose.connection.name || 'ldb_tracker'}`
    );
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[MongoDB] Runtime connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Connection lost. Disconnected from database.');
    connectionPromise = null; // Clear cached promise on disconnect so subsequent calls will reconnect
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[MongoDB] Connection re-established successfully.');
  });

  // Graceful shutdown on process termination
  const gracefulExit = async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log('[MongoDB] Connection closed due to application termination.');
      }
    } catch (err) {
      console.error('[MongoDB] Error closing connection on shutdown:', err.message);
    }
  };

  process.once('SIGINT', gracefulExit);
  process.once('SIGTERM', gracefulExit);
}

/**
 * Connect to MongoDB with connection reuse, in-flight promise deduplication,
 * and automatic reconnect recovery.
 */
const connectDB = async () => {
  setupConnectionListeners();

  // 1. If already connected (readyState 1), reuse existing active connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // 2. If connection is actively in progress (readyState 2) or a promise is in-flight, await it
  if (connectionPromise && mongoose.connection.readyState === 2) {
    try {
      await connectionPromise;
      return mongoose.connection;
    } catch {
      // In-flight promise failed, fall through to retry below
      connectionPromise = null;
    }
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ldb_tracker';

  try {
    // 3. Initiate new connection and store promise to deduplicate concurrent calls
    connectionPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });

    const conn = await connectionPromise;
    console.log(
      `[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name || 'ldb_tracker'}`
    );
    return conn.connection;
  } catch (error) {
    connectionPromise = null;
    console.error(`[MongoDB] Connection error: ${error.message}`);
    if (uri.includes('@')) {
      console.warn('[MongoDB] Check your MongoDB Atlas credentials, cluster status, and IP Access List (0.0.0.0/0).');
    } else {
      console.warn('[MongoDB] Make sure local MongoDB is running or configure MONGODB_URI in your .env file.');
    }
    return null;
  }
};

module.exports = connectDB;
