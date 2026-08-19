import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('Testing Atlas Connection...');
try {
  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log('✅ Connection SUCCESS! Host:', conn.connection.host, 'DB:', conn.connection.name, 'ReadyState:', conn.connection.readyState);
  
  // Count users
  const collections = await conn.connection.db.listCollections().toArray();
  console.log('Collections in DB:', collections.map(c => c.name));
  
  await mongoose.disconnect();
} catch (err) {
  console.error('❌ Connection FAILED:', err.name, err.message);
}
