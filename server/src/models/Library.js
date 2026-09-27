import mongoose from 'mongoose';

const HistoricalTrendSchema = new mongoose.Schema({
  hour: { type: String, required: true },
  avgOccupancy: { type: Number, required: true }
}, { _id: false });

const LibrarySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  code: { type: String, default: '' },
  roomNumber: { type: String, default: '' },
  building: { type: String, required: true, index: true },
  type: { type: String, default: 'Physical Library' },
  openingTime: { type: String, default: '09:00' },
  closingTime: { type: String, default: '21:00' },
  openingHours: { type: String, default: '09:00–21:00 Daily' },
  primaryGroups: [{ type: String }],
  primaryUsers: [{ type: String }],
  nodeId: { type: String, default: '' },
  floor: { type: String, default: '' },
  location: { type: String, default: '' },
  description: { type: String, default: '' },
  noiseLevel: { type: String, default: 'Silent' },
  walkTimeMinutes: { type: Number, default: 3 },
  capacity: { type: Number, default: 500 },
  carpetArea: { type: String, default: '' },
  digitalWorkstations: { type: String, default: '' },
  digitalSystems: { type: String, default: '' },
  servers: { type: String, default: '' },
  facilities: mongoose.Schema.Types.Mixed,
  exclusiveFor: { type: String, default: '' },
  disciplines: { type: String, default: '' },
  historicalTrend: [HistoricalTrendSchema],
  source: { type: String, default: '' }
}, {
  timestamps: true
});

LibrarySchema.index({ name: 'text', building: 'text', disciplines: 'text' });

export const Library = mongoose.model('Library', LibrarySchema);
