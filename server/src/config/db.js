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

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('[Database] Connection Error: MONGODB_URI environment variable is not set.');
    console.error('[Database] Please define MONGODB_URI in server/.env or hosting environment variables.');
    process.exit(1);
  }

  try {
    const isAtlas = uri.includes('mongodb+srv://');
    const safeHostDb = isAtlas
      ? 'MongoDB Atlas'
      : uri.replace(/^mongodb:\/\//, '').split('@').pop().split('?')[0];

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000
    });

    console.log(`[Database] Connected to ${isAtlas ? 'MongoDB Atlas' : 'MongoDB'}`);
    console.log(`[Database] Connection Target: ${safeHostDb}`);
    console.log(`[Database] Database: ${mongoose.connection.name || 'campuspulse'}`);
  } catch (err) {
    console.error(`[Database] Connection Error: Unable to connect to MongoDB.`);
    console.error(`[Database] Error Details: ${err.message}`);
    console.error('[Database] Terminating backend process.');
    process.exit(1);
  }
}
