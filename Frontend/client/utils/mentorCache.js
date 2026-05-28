const key = (queryString) => `mentors_cache:${queryString || 'all'}`;

export function readMentorsSessionCache(queryString) {
  try {
    const raw = sessionStorage.getItem(key(queryString));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeMentorsSessionCache(queryString, data) {
  try {
    sessionStorage.setItem(key(queryString), JSON.stringify(data));
  } catch {
    /* quota */
  }
}
