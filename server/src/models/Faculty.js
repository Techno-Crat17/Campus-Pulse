import mongoose from 'mongoose';

const ScheduleSchema = new mongoose.Schema({
  time: { type: String, required: true },
  event: { type: String, required: true },
  room: { type: String, default: '' }
}, { _id: false });

const FacultySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, index: true },
  designation: { type: String, default: '' },
  department: { type: String, default: '', index: true },
  email: { type: String, default: null },
  cabinLocation: { type: String, default: '' },
  nodeId: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  todaySchedule: [ScheduleSchema],
  weeklySchedule: { type: mongoose.Schema.Types.Mixed, default: {} },
  shortCode: { type: String, default: '' },
  status: { type: String, default: 'Available in Cabin' },
  currentLocation: { type: String, default: '' },
  nextAvailableTime: { type: String, default: '' },
  officeHours: { type: String, default: '' },
  expertise: { type: String, default: '' },
  profileUrl: { type: String, default: '' },
  sourceUrl: { type: String, default: '' }
}, {
  timestamps: true,
  strict: false
});

// Index for text search
FacultySchema.index({ name: 'text', department: 'text', designation: 'text', cabinLocation: 'text', expertise: 'text' });

export const Faculty = mongoose.model('Faculty', FacultySchema, 'faculty');
