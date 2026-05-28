/** Optimistic list updates for mentorship requests (no visual change). */
export function normalizeUserId(id) {
  if (id == null) return null;
  if (typeof id === 'object' && id.$oid) return String(id.$oid);
  return String(id);
}

export function requestRowId(row) {
  return normalizeUserId(row?.id ?? row?._id);
}

export function patchRequestStatus(requests, id, status) {
  const sid = normalizeUserId(id);
  return requests.map((r) => (requestRowId(r) === sid ? { ...r, status } : r));
}

export function removeRequest(requests, id) {
  const sid = normalizeUserId(id);
  return requests.filter((r) => requestRowId(r) !== sid);
}
const sessionKey = (userId, role) =>
  `requests_cache:${normalizeUserId(userId)}:${role}`;

export function readRequestsSessionCache(userId, role) {
  try {
    const raw = sessionStorage.getItem(sessionKey(userId, role));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeRequestsSessionCache(userId, role, requests) {
  try {
    sessionStorage.setItem(sessionKey(userId, role), JSON.stringify(requests));
  } catch {
    // ignore quota / private mode
  }
}

/** Second cancel after success returns 404 — must not restore the card. */
export function isRequestNotFoundError(err) {
  const msg = (err?.message || '').toLowerCase();
  return msg.includes('not found') || msg.includes('already');
}