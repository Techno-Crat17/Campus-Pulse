import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { errorResponse } from '../utils/apiResponse.js';

export async function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Authentication token missing or invalid format', 'UNAUTHORIZED', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'campus_pulse_jwt_secret_key_2026_safe_production_hash');
    const user = await User.findById(decoded.id);
    if (!user) {
      return errorResponse(res, 'User associated with token no longer exists', 'UNAUTHORIZED', 401);
    }

    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    };
    next();
  } catch (err) {
    return errorResponse(res, 'Invalid or expired token', 'INVALID_TOKEN', 401);
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return errorResponse(res, 'Access denied. Admin privileges required.', 'FORBIDDEN', 403);
  }
  next();
}
