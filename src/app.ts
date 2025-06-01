
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // For handling CORS if frontend is on different origin
import helmet from 'helmet'; // For security headers
import cookieParser from 'cookie-parser'; // For parsing cookies
import morgan from "morgan"
import redisRoutes from './routes/test.routes';


dotenv.config();

// connect to database
require('./config/db')

// import { notFoundHandler, errorHandler } from './middlewares/error.middleware';
// import authRoutes from './routes/auth.routes';
// import userRoutes from './routes/user.routes';
// Import other route modules as you create them

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

// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/subscriptions', subscriptionRoutes);
// app.use('/api/crons', cronRoutes);
// app.use('/api/messages', messageRoutes);
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/telegram', telegramRoutes);
app.use('/api/test', redisRoutes);


// root route
app.get('/', (req, res) => {
  res.send('Backend API is running!');
});

// Error handling middleware (should be last)
// app.use(notFoundHandler);
// app.use(errorHandler);

export default app;