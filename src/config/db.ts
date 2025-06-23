// config/db.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export async function connectDB() {
  try {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI not set');
    await mongoose.connect(process.env.MONGO_URI, {});
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    process.exit(1); // Exit if DB fails
  }
}
