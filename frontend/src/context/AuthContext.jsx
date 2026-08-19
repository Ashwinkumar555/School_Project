import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

// Security helper: Strip sensitive Aadhaar data before browser storage
const sanitizeUserForStorage = (userData) => {
  if (!userData) return null;
  const safe = { ...userData };
  delete safe.aadhaarNumber;
  delete safe.aadhaar;
  delete safe.password;
  return safe;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('educonnect_user');
      return stored ? sanitizeUserForStorage(JSON.parse(stored)) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('educonnect_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore and validate session from localStorage on page refresh / app open
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('educonnect_token');
      const storedUser = localStorage.getItem('educonnect_user');

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          try {
            const parsed = sanitizeUserForStorage(JSON.parse(storedUser));
            setUser(parsed);
            // Ensure localStorage is sanitized
            localStorage.setItem('educonnect_user', JSON.stringify(parsed));
          } catch (e) {
            console.warn('Failed to parse cached user data:', e);
          }
        }

        try {
          // Validate authentication token/session with backend
          const res = await authService.getMe();
          if (res?.data?.user) {
            const verifiedUser = sanitizeUserForStorage(res.data.user);
            setUser(verifiedUser);
            localStorage.setItem('educonnect_user', JSON.stringify(verifiedUser));
          } else {
            logout();
          }
        } catch (err) {
          console.warn('Session verification failed, logging out:', err.message);
          logout();
        }
      } else {
        // No token present
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (loginDataOrPhone, maybeOtp) => {
    setError(null);
    try {
      const response = await authService.login(loginDataOrPhone, maybeOtp);
      if (response.success && response.data) {
        const { user: rawUser, token: userToken } = response.data;
        const safeUser = sanitizeUserForStorage(rawUser);
        setUser(safeUser);
        setToken(userToken);
        localStorage.setItem('educonnect_token', userToken);
        localStorage.setItem('educonnect_user', JSON.stringify(safeUser));
        return { success: true, user: safeUser };
      }
      throw new Error(response.message || 'Login failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to authenticate';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const response = await authService.register(userData);
      if (response.success && response.data) {
        const { user: rawUser, token: newToken } = response.data;
        const safeUser = sanitizeUserForStorage(rawUser);
        setUser(safeUser);
        setToken(newToken);
        localStorage.setItem('educonnect_token', newToken);
        localStorage.setItem('educonnect_user', JSON.stringify(safeUser));
        return { success: true, user: safeUser };
      }
      throw new Error(response.message || 'Registration failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration error';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('educonnect_token');
    localStorage.removeItem('educonnect_user');
  };

  const getRoleDisplayName = (roleKey) => {
    const roleMap = {
      village_head: 'Village Local Head',
      alumni: 'School Alumni',
      ngo: 'NGO / Partner',
      headmaster_admin: 'Headmaster / Admin',
      teacher: 'Teacher',
      parent: 'Parent / Guardian',
      student: 'Student',
      // Aliases
      community_member: 'Village Local Head',
      welfare_officer: 'Headmaster / Admin',
      student_parent: 'Parent / Guardian',
      community_volunteer: 'NGO / Partner',
    };
    return roleMap[roleKey] || roleKey || 'User';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        error,
        login,
        register,
        logout,
        getRoleDisplayName,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
