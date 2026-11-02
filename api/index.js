const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../server/config/db');
const app = require('../server/app');

// Serverless Function handler for Vercel
module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
