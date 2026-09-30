import mongoose from 'mongoose';
import { normalizeRoomNumber } from '../utils/roomUtils.js';

const RoomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true, index: true },
  roomNumberNormalized: { type: String, index: true },
  name: { type: String, default: '', index: true },
  normalizedName: { type: String, index: true },
  building: { type: String, required: true, index: true },
  buildingCode: { type: String, default: '', index: true },
  floor: { type: String, default: '', index: true },
  department: { type: String, default: '', index: true },
  departments: [{ type: String }],
  type: {
    type: String,
    enum: ['Classroom', 'Lab', 'Seminar Hall', 'Board Room', 'Auditorium', 'Office', 'Library', 'Lounge', 'Other'],
    default: 'Other'
  },
  category: { type: String, default: '' },
  description: { type: String, default: '' },
  libraryReference: { type: String, default: '' },
  nodeId: { type: String, default: '' },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  status: { type: String, default: 'Available' },
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
  if (this.name) {
    this.normalizedName = this.name.toLowerCase().trim();
  }
  next();
});

RoomSchema.index({ roomNumber: 'text', name: 'text', building: 'text', department: 'text', floor: 'text' });
RoomSchema.index({ building: 1, floor: 1 });
RoomSchema.index({ buildingCode: 1, floor: 1 });
RoomSchema.index({ departments: 1 });

export const Room = mongoose.model('Room', RoomSchema, 'rooms');
