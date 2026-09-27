import mongoose from 'mongoose';

const IssueSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => 'iss-' + Math.random().toString(36).substring(2, 9)
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: [
      'Infrastructure',
      'Cleanliness',
      'Electricity',
      'Water',
      'Internet / Wi-Fi',
      'Classroom',
      'Laboratory',
      'Library',
      'Security',
      'Other'
    ],
    required: true,
    index: true
  },
  location: { type: String, required: true, index: true },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Low',
    index: true
  },
  status: {
    type: String,
    enum: ['Reported', 'Under Review', 'In Progress', 'Resolved'],
    default: 'Reported',
    index: true
  },
  reportedBy: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  isDemo: { type: Boolean, default: false },
  upvotes: { type: Number, default: 0 }
}, {
  timestamps: true
});

IssueSchema.index({ title: 'text', description: 'text', location: 'text', category: 'text' });

export const Issue = mongoose.model('Issue', IssueSchema);
