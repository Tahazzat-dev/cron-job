import { initializeAutoScheduler } from "../jobs/autoCron.scheduler";

const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {});

mongoose.connection.on('connected', () => {
  // initializeAutoScheduler()
  console.log('MongoDB connected');
});

mongoose.connection.on('error', (err:any) => {
  console.error('MongoDB connection error:', err);
});

module.exports = mongoose;
