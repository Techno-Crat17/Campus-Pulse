import mongoose from 'mongoose';
import { successResponse } from '../utils/apiResponse.js';

export function getHealth(req, res) {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';

  return res.status(200).json({
    success: true,
    message: 'Campus Pulse API is running',
    data: {
      status: dbState === 1 ? 'ok' : 'degraded',
      database: dbStatus,
      service: 'Campus Pulse API',
      uptimeSeconds: Math.floor(process.uptime()),
      databaseDetails: {
        status: dbStatus,
        name: mongoose.connection.name || 'campuspulse'
      },
      timestamp: new Date()
    }
  });
}
