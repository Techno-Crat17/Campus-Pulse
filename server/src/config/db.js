import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    try {
      console.log(`[Database] Attempting connection to ${uri}...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 4000
      });
      console.log('[Database] Successfully connected to MongoDB.');
      return;
    } catch (err) {
      console.warn('[Database] External MongoDB connection failed or timed out:', err.message);
      console.log('[Database] Initializing fallback MongoMemoryServer...');
    }
  }

  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    const inMemoryUri = mongoServer.getUri();
    await mongoose.connect(inMemoryUri);
    console.log(`[Database] Successfully connected to in-memory MongoDB at ${inMemoryUri}.`);
  } catch (memErr) {
    console.error('[Database] Failed to start MongoMemoryServer:', memErr.message);
    process.exit(1);
  }
}
