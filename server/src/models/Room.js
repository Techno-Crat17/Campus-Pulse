import mongoose from 'mongoose';
import { normalizeRoomNumber } from '../utils/roomUtils.js';

const RoomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true, index: true },
  roomNumberNormalized: { type: String, index: true },
  building: { type: String, required: true, index: true },
  department: { type: String, default: '', index: true },
  type: {
    type: String,
    enum: ['Classroom', 'Lab', 'Seminar Hall', 'Board Room', 'Auditorium', 'Other'],
    required: true
  },
  sourceUrl: { type: String, default: '' },
  sourceTitle: { type: String, default: '' },
  sourceYear: { type: Number, default: 2026 },
  verified: { type: Boolean, default: true },
  temporalStatus: { type: String, default: 'current' }
}, {
  timestamps: true
});

RoomSchema.pre('save', function (next) {
  if (this.roomNumber) {
    this.roomNumberNormalized = normalizeRoomNumber(this.roomNumber);
  }
  next();
});

RoomSchema.index({ roomNumber: 'text', building: 'text', department: 'text' });

export const Room = mongoose.model('Room', RoomSchema, 'rooms');
