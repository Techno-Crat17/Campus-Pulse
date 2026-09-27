import mongoose from 'mongoose';
import { successResponse } from '../utils/apiResponse.js';

export function getHealth(req, res) {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';

  return successResponse(res, {
    service: 'Campus Pulse API',
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      name: mongoose.connection.name || 'campuspulse'
    },
    timestamp: new Date()
  });
}
