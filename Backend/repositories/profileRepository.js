import Profile from '../models/Profile.js';

export const profileRepository = {
  create: (data) => Profile.create(data),

  findByUserId: (userId, projection) =>
    Profile.findOne({ user: userId }).select(projection).lean(),

  findByUserIds: (userIds, projection) =>
    Profile.find({ user: { $in: userIds } }).select(projection).lean(),

  upsertByUserId: (userId, update) =>
    Profile.findOneAndUpdate({ user: userId }, update, { upsert: true, new: true }),

  deleteByUserId: (userId) => Profile.deleteOne({ user: userId }),
};
