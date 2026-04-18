import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token  = localStorage.getItem('token');
    if (stored && token) {
      const parsedUser = JSON.parse(stored);
      setUser(parsedUser);
      // Restore must_change_password from stored user object (persists across refreshes)
      setMustChangePassword(!!parsedUser.must_change_password);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, user: userData, must_change_password } = res.data;
    // Embed must_change_password into the stored user so it survives refresh
    const userToStore = { ...userData, must_change_password: !!must_change_password };
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userToStore));
    setUser(userToStore);
    setMustChangePassword(!!must_change_password);
    return { userData: userToStore, mustChangePassword: !!must_change_password };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setMustChangePassword(false);
  };

  const clearMustChangePassword = () => {
    setMustChangePassword(false);
    // Also update localStorage so refreshing doesn't re-show the modal
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      localStorage.setItem('user', JSON.stringify({ ...parsed, must_change_password: false }));
    }
    if (user) setUser(prev => ({ ...prev, must_change_password: false }));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, mustChangePassword, clearMustChangePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
