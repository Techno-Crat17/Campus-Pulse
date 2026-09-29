import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { errorResponse } from './utils/apiResponse.js';

import healthRoutes from './routes/healthRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import libraryRoutes from './routes/libraryRoutes.js';
import buildingRoutes from './routes/buildingRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import issueRoutes from './routes/issueRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import eventRoutes from './routes/eventRoutes.js';

import { connectDB } from './config/db.js';

dotenv.config();

const app = express();

// Security Header Configuration
app.use(helmet());

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://campus-pulse-mu-bice.vercel.app',
  'https://campus-pulse-git-main-udbhavv-s-projects.vercel.app',
  'https://campus-pulse-e0ecutxm7-udbhavv-s-projects.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

// Body Parsing Middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Rate Limiter
app.use('/api/', apiLimiter);

// Database Connection Middleware for API endpoints
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[App] Database connection error:', err.message);
    return errorResponse(res, 'Database connection unavailable.', 'DATABASE_ERROR', 500);
  }
});

// Root & Health Root Endpoint Handlers
app.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Campus Pulse API is running',
    health: '/api/health'
  });
});

app.get('/health', (req, res) => {
  return res.redirect('/api/health');
});

// API Routes Mounting
app.use('/api/health', healthRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/libraries', libraryRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/events', eventRoutes);

// 404 Route Handler
app.use((req, res) => {
  return errorResponse(res, `Route ${req.method} ${req.originalUrl} not found`, 'NOT_FOUND', 404);
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
