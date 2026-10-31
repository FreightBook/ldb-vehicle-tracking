const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ldb_tracker';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    console.warn(`[MongoDB] Please make sure MongoDB is running locally or provide a valid MONGODB_URI in your .env file.`);
    // Do not crash the entire process immediately so UI can still run and display status
    return null;
  }
};

module.exports = connectDB;

