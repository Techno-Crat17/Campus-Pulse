import mongoose from 'mongoose';

const ClubSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, index: true },
  normalizedName: { type: String, required: true, unique: true, index: true },
  category: {
    type: String,
    required: true,
    enum: [
      'Cultural & Performing Arts',
      'Literary, Quizzing & Media',
      'Technical & Co-Curricular Chapters'
    ],
    index: true
  },
  description: { type: String, required: true },
  type: { type: String, default: 'CLUB' },
  relatedChapters: [{ type: String }],
  source: { type: String, default: 'Provided MSRIT club directory' },
  instagramUrl: { type: String, default: null },
  active: { type: Boolean, default: true, index: true }
}, {
  timestamps: true
});

ClubSchema.pre('save', function (next) {
  if (this.name) {
    this.normalizedName = this.name.toLowerCase().trim();
  }
  next();
});

ClubSchema.index({ name: 'text', description: 'text', category: 'text' });

export const Club = mongoose.model('Club', ClubSchema, 'clubs');
