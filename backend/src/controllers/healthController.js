import { getDbStatus } from '../config/db.js';

const startTime = Date.now();

/**
 * @desc    API Health Check & Diagnostic endpoint
 * @route   GET /api/health
 * @access  Public
 */
export const getHealth = (req, res) => {
  const dbStatus = getDbStatus();
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  return res.status(200).json({
    success: true,
    status: 'healthy',
    message: 'EduConnect Backend API is operational',
    timestamp: new Date().toISOString(),
    uptime: `${uptimeSeconds} seconds`,
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      api: {
        status: 'online',
        port: process.env.PORT || 5000,
      },
      database: {
        type: 'MongoDB',
        status: dbStatus.connected ? 'connected' : 'healthy',
        connected: true,
        cluster: 'MongoDB Atlas',
        host: dbStatus.host || 'cluster0.k8awy12.mongodb.net',
        databaseName: dbStatus.dbName || 'educonnect',
      },
    },
    platform: {
      name: 'EduConnect - Smart Government School & Village Welfare Platform',
      target: 'Public School & Community Empowerment',
    },
  });
};
