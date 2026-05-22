/**
 * Never send multi-MB base64 images in list APIs.
 * URLs (Cloudinary, Dicebear, https) pass through unchanged.
 */
export function avatarUrl(value, seed = 'user') {
  const v = (value || '').toString().trim();
  if (!v) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
  }
  if (v.startsWith('data:image')) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
  }
  if (v.startsWith('http://') || v.startsWith('https://')) {
    return v;
  }
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

export function sanitizeUserForList(user) {
  if (!user) return user;
  const id = user._id?.toString?.() || user.id || 'user';
  const { resumeText, password, securityQuestions, ...rest } = user;
  return {
    ...rest,
    profilePicture: avatarUrl(user.profilePicture, id),
  };
}
