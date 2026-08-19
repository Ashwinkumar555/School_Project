import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedComprehensiveData } from './seedComprehensiveData.js';

// Ensure .env is loaded
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

let isConnecting = false;

// Helper to mask connection strings in logs
const maskUri = (uri) => {
  if (!uri) return 'undefined';
  return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/, '$1*****$3');
};

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (isConnecting) return null;

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn('⚠️ MONGODB_URI is not defined in backend/.env');
    return null;
  }

  console.log(`🔌 Attempting MongoDB connection to: ${maskUri(mongoUri)}`);
  isConnecting = true;

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
    });

    isConnecting = false;
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host} / Database: ${conn.connection.name}`);

    // Seed comprehensive school records, roles, needs, and early attention data automatically
    await seedComprehensiveData();

    return conn;
  } catch (error) {
    isConnecting = false;
    console.warn(`ℹ️ MongoDB Note: ${error.message}`);
    console.log('⚡ EduConnect is running with resilient state store fallback.');
    return null;
  }
};

mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connection established.');
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ Mongoose connection status: offline/disconnected.');
});

export const getDbStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized',
  };

  const stateCode = mongoose.connection.readyState;
  return {
    connected: stateCode === 1,
    statusText: states[stateCode] || 'unknown',
    readyState: stateCode,
    host: mongoose.connection.host || null,
    dbName: mongoose.connection.name || null,
  };
};
