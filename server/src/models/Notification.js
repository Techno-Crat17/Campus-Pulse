import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: { type: String, default: 'global', index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['ISSUE_UPDATE', 'FACULTY_UPDATE', 'LIBRARY_UPDATE', 'SYSTEM'],
    default: 'SYSTEM'
  },
  read: { type: Boolean, default: false, index: true }
}, {
  timestamps: true
});

export const Notification = mongoose.model('Notification', NotificationSchema, 'notifications');
