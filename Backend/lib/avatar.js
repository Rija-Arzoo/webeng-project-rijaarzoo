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

/**
 * Smaller avatar for lists/chat sidebars (Cloudinary auto-format + resize).
 */
export function avatarThumbUrl(value, seed = 'user', size = 96) {
  const base = avatarUrl(value, seed);
  if (base.includes('res.cloudinary.com') && base.includes('/upload/')) {
    return base.replace('/upload/', `/upload/w_${size},h_${size},c_fill,f_auto,q_auto/`);
  }
  if (base.includes('api.dicebear.com')) {
    return `${base}${base.includes('?') ? '&' : '?'}size=${size}`;
  }
  return base;
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
