import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure server/.env is loaded regardless of current working directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

// Ensure SRV DNS queries for mongodb+srv resolve cleanly across local network DNS filters
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore fallback error if environment restricts setting custom DNS servers
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('[Database] Connection Error: MONGODB_URI environment variable is not set.');
    throw new Error('MONGODB_URI environment variable is not set.');
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const isAtlas = uri.includes('mongodb+srv://');
    const safeHostDb = isAtlas
      ? 'MongoDB Atlas'
      : uri.replace(/^mongodb:\/\//, '').split('@').pop().split('?')[0];

    cached.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000
    }).then((m) => {
      console.log(`[Database] Connected to ${isAtlas ? 'MongoDB Atlas' : 'MongoDB'}`);
      console.log(`[Database] Connection Target: ${safeHostDb}`);
      console.log(`[Database] Database: ${m.connection.name || 'campuspulse'}`);
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    console.error('[Database] Connection Error: Unable to connect to MongoDB.');
    console.error(`[Database] Error Details: ${err.message}`);
    throw err;
  }

  return cached.conn;
}
