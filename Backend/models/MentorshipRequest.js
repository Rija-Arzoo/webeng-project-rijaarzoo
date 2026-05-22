import mongoose from 'mongoose';

const mentorshipRequestSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    goal: {
      type: String,
      required: true,
      minlength: 20,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

mentorshipRequestSchema.index({ mentorId: 1, studentId: 1, status: 1 });

export default mongoose.model('MentorshipRequest', mentorshipRequestSchema);
