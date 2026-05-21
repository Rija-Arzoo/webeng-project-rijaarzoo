import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  location: { type: String, default: null },
  title: { type: String, default: null },
  industry: { type: String, default: null },
  headline: { type: String },
  bio: { type: String },
  company: { type: String },
  skills: [{ type: String }],
  isVerified: { type: Boolean, default: false }
});

export default mongoose.model('Profile', profileSchema);