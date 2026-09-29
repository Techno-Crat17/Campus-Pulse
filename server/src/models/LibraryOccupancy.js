import mongoose from 'mongoose';

const LibraryOccupancySchema = new mongoose.Schema({
  libraryId: { type: String, required: true, index: true },
  occupancyPercentage: { type: Number, required: true, min: 0, max: 100 },
  timestamp: { type: Date, default: Date.now, index: true },
  source: { type: String, default: 'estimated' }
}, {
  timestamps: true
});

export const LibraryOccupancy = mongoose.model('LibraryOccupancy', LibraryOccupancySchema, 'library_occupancy');
