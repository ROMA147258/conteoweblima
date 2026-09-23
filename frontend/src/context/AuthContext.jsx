import React, { createContext, useContext, useState, useCallback } from 'react';
import { authService } from '../services/authService';
import { useSecuritySession } from '../hooks/useSecuritySession';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [logoutReason, setLogoutReason] = useState(null);

  const logout = useCallback(async (reason = null) => {
    if (reason) {
      setLogoutReason(reason);
    }
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const login = async (username, password) => {
    setLogoutReason(null);
    const res = await authService.login(username, password);
    if (res.success) {
      setUser(res.user);
      setIsAuthenticated(true);
    }
    return res;
  };

  const clearLogoutReason = () => {
    setLogoutReason(null);
  };

  // Activar mecanismo de seguridad bancaria
  useSecuritySession({ isAuthenticated, logout });

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, logoutReason, clearLogoutReason }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

