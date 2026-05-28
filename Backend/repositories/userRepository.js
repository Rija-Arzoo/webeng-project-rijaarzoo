import User from '../models/User.js';
import {
  USER_LIST_FIELDS,
  USER_MENTOR_FIELDS,
  USER_REQUEST_SENDER_FIELDS,
} from '../lib/userSelect.js';

export const userRepository = {
  findByEmail: (email, projection) => User.findOne({ email }).select(projection),

  findById: (id, projection) => User.findById(id).select(projection),

  findByIdLean: (id, projection) => User.findById(id).select(projection).lean(),

  findAlumni: () => User.find({ role: 'alumni' }).select(USER_MENTOR_FIELDS).lean(),

  findByIdsLean: (ids, fields = USER_REQUEST_SENDER_FIELDS) =>
    User.find({ _id: { $in: ids } }).select(fields).lean(),

  findPublicById: (id) =>
    User.findById(id)
      .select(
        'name role profilePicture bio location skills company industry title headline isVerified resumeSkills resumeSuggestedIndustry resumeSuggestedTopics resumeInsightSummary resumeUploadedAt'
      )
      .lean(),

  create: (data) => User.create(data),

  save: (user) => user.save(),

  deleteById: (id) => User.deleteOne({ _id: id }),

  removeFromFollowLists: (userId) =>
    User.updateMany(
      { $or: [{ followers: userId }, { following: userId }] },
      { $pull: { followers: userId, following: userId } }
    ),
};

export { USER_MENTOR_FIELDS, USER_REQUEST_SENDER_FIELDS, USER_LIST_FIELDS };
