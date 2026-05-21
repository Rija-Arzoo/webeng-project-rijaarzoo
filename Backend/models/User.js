import mongoose from 'mongoose';

const securityQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answerHash: { type: String, required: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'alumni'], default: 'student' },
    university: { type: String },
    department: { type: String },
    degreeLevel: { type: String, enum: ['BS', 'MS', 'PHD'] },
    studentId: { type: String },
    batchYear: { type: Number },
    graduationYear: { type: Number },
    enrollmentStatus: { type: String, enum: ['enrolled', 'graduated'], default: 'enrolled' },
    alumniSince: { type: Date, default: null },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    profilePicture: { type: String, default: null },
    bio: { type: String },
    location: { type: String },
    skills: [{ type: String }],
    company: { type: String },
    // Mentor specialization used by Mentor Finder (e.g., "Technology", "Finance")
    industry: { type: String },
    title: { type: String },
    headline: { type: String },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    mentorshipRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MentorshipRequest' }],
    conversations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' }],
    lastActive: { type: Date },

    // Resume upload + insights (stored as extracted text/keywords)
    resumeText: { type: String },
    resumeSkills: [{ type: String }],
    resumeSuggestedIndustry: { type: String },
    resumeSuggestedTopics: [{ type: String }],
    resumeUploadedAt: { type: Date },

    // Password recovery (security questions). Answers are stored hashed.
    securityQuestions: { type: [securityQuestionSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);