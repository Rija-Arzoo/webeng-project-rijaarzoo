import React, { useState } from 'react';
import { getInitials } from '../utils/initials.js';

export default function Avatar({ src, name, className = 'w-14 h-14 rounded-xl', style }) {
  const [failed, setFailed] = useState(false);
  const initials = getInitials(name);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center text-white font-bold text-sm ${className}`}
        style={{ background: 'linear-gradient(135deg, var(--c-accent), #7b8ef5)', ...style }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || 'User'}
      className={`object-cover ${className}`}
      style={style}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
