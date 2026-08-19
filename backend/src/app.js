import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import classRoutes from './routes/classRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import academicRoutes from './routes/academicRoutes.js';
import earlyAttentionRoutes from './routes/earlyAttentionRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import schoolNeedRoutes from './routes/schoolNeedRoutes.js';
import communityDriveRoutes from './routes/communityDriveRoutes.js';
import contributionRoutes from './routes/contributionRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import impactRoutes from './routes/impactRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or development origins
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Root landing endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to EduConnect API - Smart Government School & Welfare Platform',
    version: '1.0.0',
    documentation: {
      health: '/api/health',
      auth: '/api/auth',
      classes: '/api/classes',
      students: '/api/students',
      attendance: '/api/attendance',
      academics: '/api/academics',
      earlyAttention: '/api/early-attention',
      inventory: '/api/inventory',
      schoolNeeds: '/api/school-needs',
      drives: '/api/drives',
      contributions: '/api/contributions',
      announcements: '/api/announcements',
      impact: '/api/impact',
      reports: '/api/reports',
    },
  });
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/academics', academicRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/early-attention', earlyAttentionRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/school-needs', schoolNeedRoutes);
app.use('/api/drives', communityDriveRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/impact', impactRoutes);
app.use('/api/reports', reportRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
