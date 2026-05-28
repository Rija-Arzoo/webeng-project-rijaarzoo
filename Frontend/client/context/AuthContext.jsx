import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/apiService.jsx';
import { prefetchAfterLogin } from '../services/prefetch.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const profileFetchGen = useRef(0);

  const persistSessionProfile = (nextProfile, nextUser) => {
    const session = localStorage.getItem('alumni_session');
    if (!session) return;
    try {
      const parsed = JSON.parse(session);
      localStorage.setItem(
        'alumni_session',
        JSON.stringify({
          ...parsed,
          user: nextUser ?? parsed.user,
          profile: nextProfile,
          profileFetchedAt: Date.now(),
        })
      );
    } catch {
      // ignore malformed session entries
    }
  };

  const persistSessionUser = (nextUser) => {
    const session = localStorage.getItem('alumni_session');
    if (!session) return;
    try {
      const parsed = JSON.parse(session);
      localStorage.setItem(
        'alumni_session',
        JSON.stringify({
          ...parsed,
          user: nextUser,
        })
      );
    } catch {
      // ignore malformed session entries
    }
  };

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('alumni_session');
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession);
        setUser(sessionData.user);
        if (sessionData.profile) {
          setProfile(sessionData.profile);
        }
        // Refresh profile only if stale (>5 min) — avoids heavy /me on every page load.
        if (sessionData.token && sessionData.user) {
          const runPrefetch = () => prefetchAfterLogin(sessionData.user);
          if (typeof requestIdleCallback === 'function') {
            requestIdleCallback(runPrefetch, { timeout: 1500 });
          } else {
            setTimeout(runPrefetch, 50);
          }

          const fetchedAt = sessionData.profileFetchedAt || 0;
          const stale = Date.now() - fetchedAt > 5 * 60 * 1000;
          if (stale || !sessionData.profile) {
            const run = () => fetchUserProfile();
            if (typeof requestIdleCallback === 'function') {
              requestIdleCallback(run, { timeout: 2000 });
            } else {
              setTimeout(run, 100);
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse saved session:', e);
        localStorage.removeItem('alumni_session');
      }
    }
    setLoading(false);
  }, []);

  const mergeProfileWithResumeGuard = (prev, serverProfile) => {
    if (!serverProfile) return prev ?? null;
    if (!prev) return serverProfile;

    const prevUploaded = prev.resumeUploadedAt
      ? new Date(prev.resumeUploadedAt).getTime()
      : 0;
    const serverUploaded = serverProfile.resumeUploadedAt
      ? new Date(serverProfile.resumeUploadedAt).getTime()
      : 0;

    if (prevUploaded > serverUploaded) {
      return {
        ...serverProfile,
        resumeSkills: prev.resumeSkills,
        resumeSuggestedIndustry: prev.resumeSuggestedIndustry,
        resumeSuggestedTopics: prev.resumeSuggestedTopics,
        resumeInsightSummary: prev.resumeInsightSummary,
        resumeUploadedAt: prev.resumeUploadedAt,
      };
    }
    return serverProfile;
  };

  /**
   * Fetch current user profile (ignores stale responses when a newer fetch or patch ran).
   */
  const fetchUserProfile = async () => {
    const gen = ++profileFetchGen.current;
    try {
      const response = await api.auth.getMe();
      if (gen !== profileFetchGen.current) return response;

      const serverProfile = response.profile;
      setProfile((prev) => {
        const next = mergeProfileWithResumeGuard(prev, serverProfile);
        setUser((u) => {
          if (!u) return u;
          const merged = {
            ...u,
            id: serverProfile.id || u.id,
            name: serverProfile.name || u.name,
            email: serverProfile.email || u.email,
            role: serverProfile.role || u.role,
            profilePicture: serverProfile.profilePicture || u.profilePicture,
          };
          persistSessionProfile(next, merged);
          return merged;
        });
        return next;
      });
      return response;
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      throw err;
    }
  };

  /**
   * Register new user
   */
  const register = async (registerData) => {
    try {
      setError(null);
      const response = await api.auth.register(registerData);
      setUser(response.user);
      
      // Save session with token
      localStorage.setItem('alumni_session', JSON.stringify({
        token: response.token,
        user: response.user,
      }));

      prefetchAfterLogin(response.user);
      fetchUserProfile().catch((err) => console.error('Profile refresh:', err));

      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Login user
   */
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.auth.login(email, password);
      setUser(response.user);
      
      // Save session with token
      localStorage.setItem('alumni_session', JSON.stringify({
        token: response.token,
        user: response.user,
      }));

      prefetchAfterLogin(response.user);
      fetchUserProfile().catch((err) => console.error('Profile refresh:', err));

      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await api.auth.updateProfile(profileData);
      setProfile(response.profile);
      setUser((prev) => {
        if (!prev) return prev;
        const merged = {
          ...prev,
          id: response.profile.id || prev.id,
          name: response.profile.name || prev.name,
          email: response.profile.email || prev.email,
          role: response.profile.role || prev.role,
          profilePicture: response.profile.profilePicture || prev.profilePicture,
        };
        persistSessionUser(merged);
        return merged;
      });
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    setUser(null);
    setProfile(null);
    localStorage.removeItem('alumni_session');
  };

  /** Merge fields into profile immediately (e.g. after resume upload). */
  const patchProfile = (partial) => {
    if (!partial || typeof partial !== 'object') return;
    profileFetchGen.current += 1;
    setProfile((prev) => {
      const next = prev ? { ...prev, ...partial } : { ...partial };
      persistSessionProfile(next, null);
      return next;
    });
  };

  const value = {
    user,
    profile,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    fetchUserProfile,
    patchProfile,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
