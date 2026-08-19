import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, 'backend/.env') });

const maskUri = (uri) => {
  if (!uri) return 'undefined';
  return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/, '$1*****$3');
};

console.log('Testing Atlas Connection...');
console.log('URI:', maskUri(process.env.MONGODB_URI));

try {
  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log('✅ Connection SUCCESS! Host:', conn.connection.host, 'DB:', conn.connection.name);
  await mongoose.disconnect();
  process.exit(0);
} catch (err) {
  console.error('❌ Connection FAILED:', err.message);
  process.exit(1);
}
