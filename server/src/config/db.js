import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure server/.env is loaded regardless of current working directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campuspulse';

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('[Database] Connected to MongoDB');
    console.log(`[Database] Database: ${mongoose.connection.name || 'campuspulse'}`);
  } catch (err) {
    console.error(`[Database] Connection Error: Unable to connect to MongoDB at ${uri}`);
    console.error(`[Database] Error Details: ${err.message}`);
    console.error('[Database] Terminating backend process. Please ensure local MongoDB is running on port 27017.');
    process.exit(1);
  }
}
