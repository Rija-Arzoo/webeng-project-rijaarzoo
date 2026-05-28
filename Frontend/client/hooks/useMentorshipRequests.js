import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/apiService.jsx';
import {
  patchRequestStatus,
  removeRequest,
  readRequestsSessionCache,
  writeRequestsSessionCache,
  isRequestNotFoundError,
  normalizeUserId,
  requestRowId,
} from '../utils/requestList.js';

/**
 * Loads mentorship requests with sessionStorage paint + stale-response guard.
 * Prevents cancelled cards reappearing when an older fetch finishes after cancel.
 */
export function useMentorshipRequests(user) {
  const userId = normalizeUserId(user?.id);
  const role = user?.role;

  const loadGenRef = useRef(0);
  const cachedOnMount =
    userId && role ? readRequestsSessionCache(userId, role) : null;

  const [requests, setRequests] = useState(cachedOnMount ?? []);
  const [loading, setLoading] = useState(cachedOnMount == null);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingIds, setCancellingIds] = useState(() => new Set());
  const requestsRef = useRef(requests);
  requestsRef.current = requests;

  const applyRequests = useCallback(
    (data) => {
      setRequests(data);
      if (userId && role) writeRequestsSessionCache(userId, role, data);
    },
    [userId, role]
  );

  const fetchRequests = useCallback(
    async ({ background = false } = {}) => {
      if (!userId || !role) return [];

      const gen = ++loadGenRef.current;
      if (!background) setRefreshing(true);

      try {
        const data = await api.requests.getUserRequests();
        if (gen !== loadGenRef.current) return null;
        applyRequests(data);
        return data;
      } catch (err) {
        if (gen === loadGenRef.current) throw err;
        return null;
      } finally {
        if (gen === loadGenRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [userId, role, applyRequests]
  );

  useEffect(() => {
    if (!userId || !role) return undefined;

    const cached = readRequestsSessionCache(userId, role);
    if (cached != null) {
      setRequests(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    fetchRequests({ background: cached != null });

    return () => {
      loadGenRef.current += 1;
    };
  }, [userId, role, fetchRequests]);

  const handleUpdateStatus = useCallback(
    async (id, status) => {
      const rid = requestRowId({ id });
      const snapshot = requestsRef.current;
      loadGenRef.current += 1;
      setRequests((prev) => patchRequestStatus(prev, rid, status));
      try {
        await api.requests.updateStatus(rid, status);
        fetchRequests({ background: true });
      } catch (err) {
        setRequests(snapshot);
        throw err;
      }
    },
    [fetchRequests]
  );

  const handleCancelOrDelete = useCallback(
    async (id) => {
      const rid = requestRowId({ id });
      if (!rid || cancellingIds.has(rid)) return;

      const snapshot = requestsRef.current;
      loadGenRef.current += 1;
      setCancellingIds((prev) => new Set(prev).add(rid));
      setRequests((prev) => {
        const next = removeRequest(prev, rid);
        if (userId && role) writeRequestsSessionCache(userId, role, next);
        return next;
      });

      try {
        await api.requests.cancel(rid);
        fetchRequests({ background: true });
      } catch (err) {
        if (isRequestNotFoundError(err)) {
          fetchRequests({ background: true });
        } else {
          setRequests(snapshot);
          if (userId && role) writeRequestsSessionCache(userId, role, snapshot);
          throw err;
        }
      } finally {
        setCancellingIds((prev) => {
          const next = new Set(prev);
          next.delete(rid);
          return next;
        });
      }
    },
    [cancellingIds, fetchRequests, role, userId]
  );

  return {
    requests,
    loading,
    refreshing,
    cancellingIds,
    fetchRequests,
    handleUpdateStatus,
    handleCancelOrDelete,
  };
}
