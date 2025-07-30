
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors'; // For handling CORS if frontend is on different origin
import helmet from 'helmet'; // For security headers
import cookieParser from 'cookie-parser'; // For parsing cookies
import morgan from "morgan"
import redisRoutes from './routes/test.routes';


// import { notFoundHandler, errorHandler } from './middlewares/error.middleware';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import userRoutes from './routes/user.routes';
import packageRoutes from './routes/package.routes';
import { authMiddleware } from './middlewares/authMiddleware';
import { initializeAutoScheduler } from './jobs/autoCron.scheduler';
import { connectDB } from './config/db';
import { isAdminMiddleware } from './middlewares/isAdminMiddleware';
// Import other route modules as you create them



// Connect to MongoDB
const init = async () => {
  await connectDB();
  // await initializeAutoScheduler();
}
init()

// schedule auto cron job
// require('./jobs/autoCron.scheduler')



const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/admin', isAdminMiddleware, adminRoutes);
app.use('/api/user', authMiddleware, userRoutes);
app.use('/api', packageRoutes);
// app.use('/api/subscriptions', subscriptionRoutes);
// app.use('/api/crons', cronRoutes);
// app.use('/api/messages', messageRoutes);
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/telegram', telegramRoutes);

app.get('/api/health', (_, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy' });
});

// root route
app.get('/', (req, res) => {
  res.send('Backend API is running!');
});

// Error handling middleware (should be last)
// app.use(notFoundHandler);
// app.use(errorHandler);

export default app;