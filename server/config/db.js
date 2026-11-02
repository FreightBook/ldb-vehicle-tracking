const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
  // If already connected, reuse existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If connection is in progress, return cached promise
  if (cachedConnection) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ldb_tracker';
  try {
    cachedConnection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully: ${cachedConnection.connection.host}`);
    return cachedConnection;
  } catch (error) {
    cachedConnection = null;
    console.error(`[MongoDB] Connection error: ${error.message}`);
    console.warn(`[MongoDB] Please make sure MongoDB is running locally or provide a valid MONGODB_URI in your .env file.`);
    return null;
  }
};

module.exports = connectDB;
