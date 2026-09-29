import mongoose from 'mongoose';

const LatLngSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true }
}, { _id: false });

const CornersSchema = new mongoose.Schema({
  TL: LatLngSchema,
  BL: LatLngSchema,
  TR: LatLngSchema,
  BR: LatLngSchema
}, { _id: false });

const BuildingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, index: true },
  displayName: { type: String, default: '' },
  shortName: { type: String, default: '' },
  description: { type: String, default: '' },
  departments: [{ type: String }],
  libraries: [{ type: String }],
  category: { type: String, default: 'academic' },
  baseOccupancy: { type: Number, default: 50 },
  colorName: { type: String, default: '' },
  fillColor: { type: String, default: '' },
  strokeColor: { type: String, default: '' },
  center: LatLngSchema,
  polygon: [LatLngSchema],
  corners: CornersSchema,
  facilities: [{ type: String }]
}, {
  timestamps: true
});

BuildingSchema.index({ name: 'text', displayName: 'text', shortName: 'text', description: 'text' });

export const Building = mongoose.model('Building', BuildingSchema, 'buildings');
