import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';
import { seedDatabase } from './data/seed.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    if (process.env.SKIP_SEED !== 'true') {
      await seedDatabase();
    }

    const server = app.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`);
      console.log(`==================================================`);
      console.log(`🚀 Campus Pulse REST API Server is running!`);
      console.log(`🌍 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`==================================================`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[Server] Error: Port ${PORT} is already occupied by another process (EADDRINUSE).`);
        console.error(`[Server] Backend startup aborted to avoid starting a duplicate instance.`);
      } else {
        console.error('[Server] Server error:', err.message);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error('Fatal error starting server:', err.message);
    process.exit(1);
  }
}

startServer();
