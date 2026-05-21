import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/apiService.jsx';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        // Optionally fetch full profile data
        if (sessionData.token) {
          fetchUserProfile();
        }
      } catch (e) {
        console.error('Failed to parse saved session:', e);
        localStorage.removeItem('alumni_session');
      }
    }
    setLoading(false);
  }, []);

  /**
   * Fetch current user profile
   */
  const fetchUserProfile = async () => {
    try {
      const response = await api.auth.getMe();
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
    } catch (err) {
      console.error('Failed to fetch profile:', err);
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

      // Fetch profile
      await fetchUserProfile();
      
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

      // Fetch profile
      await fetchUserProfile();
      
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
