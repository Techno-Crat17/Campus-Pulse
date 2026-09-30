import mongoose from 'mongoose';

const LostFoundSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => 'lf-' + Math.random().toString(36).substring(2, 9)
  },
  itemName: { type: String, required: true, trim: true },
  itemTitle: { type: String, trim: true },
  title: { type: String, trim: true },
  category: {
    type: String,
    enum: [
      'Electronics',
      'Academic',
      'Accessories',
      'Wearables',
      'Documents',
      'Bags',
      'Personal',
      'Other'
    ],
    required: true,
    index: true
  },
  description: { type: String, required: true, trim: true },
  foundAt: { type: String, required: true, trim: true, index: true },
  location: { type: String, trim: true },
  foundOn: { type: String, required: true, trim: true },
  date: { type: String, trim: true },
  usn: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  status: {
    type: String,
    enum: ['found', 'recovered', 'FOUND', 'RECOVERED', 'lost', 'LOST'],
    default: 'found',
    index: true
  },
  contactLocation: { type: String, default: 'Security Enquiry Desk' },
  image: { type: String, default: '' },
  images: { type: [String], default: [] },
  isDemo: { type: Boolean, default: false }
}, {
  timestamps: true
});

LostFoundSchema.index({ itemName: 'text', title: 'text', description: 'text', foundAt: 'text', location: 'text', usn: 'text' });

export const LostFound = mongoose.model('LostFound', LostFoundSchema, 'lostfound');
