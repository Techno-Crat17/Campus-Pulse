import { Notification } from '../models/Notification.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export async function getNotifications(req, res, next) {
  try {
    const userId = req.user ? req.user.id : 'global';
    const notifications = await Notification.find({
      $or: [{ userId }, { userId: 'global' }]
    }).sort({ createdAt: -1 }).limit(30).lean();

    return successResponse(res, notifications);
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return errorResponse(res, `Notification ${req.params.id} not found`, 'NOT_FOUND', 404);
    }

    return successResponse(res, notification);
  } catch (err) {
    next(err);
  }
}
