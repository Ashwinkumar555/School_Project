import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables before anything else
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Start Express Server
  const server = app.listen(PORT, () => {
    console.log(`
=====================================================
🚀 EduConnect Backend Server is running!
🌐 Environment: ${process.env.NODE_ENV || 'development'}
📍 Server URL:  http://localhost:${PORT}
🩺 Health Check: http://localhost:${PORT}/api/health
🔐 Auth API:    http://localhost:${PORT}/api/auth
=====================================================
    `);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use by another process. Please terminate the other process or set a different PORT in .env.`);
    } else {
      console.error(`❌ Server error: ${err.message}`);
    }
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`❌ Unhandled Rejection: ${err.message}`);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error(`❌ Uncaught Exception: ${err.message}`);
  });
};

startServer();
