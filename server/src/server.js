import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { seedDatabase } from './data/seed.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    if (process.env.SKIP_SEED !== 'true') {
      await seedDatabase();
    }

    app.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`);
      console.log(`==================================================`);
      console.log(`🚀 Campus Pulse REST API Server is running!`);
      console.log(`🌍 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`==================================================`);
    });
  } catch (err) {
    console.error('Fatal error starting server:', err);
    process.exit(1);
  }
}

startServer();
