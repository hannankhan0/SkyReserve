import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // On mount, restore session from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    const storedIsAdmin = (localStorage.getItem('isAdmin') || sessionStorage.getItem('isAdmin')) === 'true';

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAdmin(storedIsAdmin);
    }
    setLoading(false);
  }, []);

  const loginUser = (userData, tokenValue, remember = true) => {
    setUser(userData);
    setToken(tokenValue);
    setIsAdmin(false);
    const storage = remember ? localStorage : sessionStorage;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('isAdmin');
    storage.setItem('token', tokenValue);
    storage.setItem('user', JSON.stringify(userData));
    storage.setItem('isAdmin', 'false');
  };

  const loginAdmin = (adminData, tokenValue) => {
    setUser(adminData);
    setToken(tokenValue);
    setIsAdmin(true);
    localStorage.setItem('token', tokenValue);
    localStorage.setItem('user', JSON.stringify(adminData));
    localStorage.setItem('isAdmin', 'true');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAdmin(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('isAdmin');
  };

  const removeToast = useCallback((id) => setToasts((prev) => prev.filter((toast) => toast.id !== id)), []);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    if (type === 'success') {
      window.setTimeout(() => removeToast(id), 3000);
    }
  }, [removeToast]);

  const toast = useMemo(() => ({
    success: (message) => showToast(message, 'success'),
    error: (message) => showToast(message, 'error'),
    info: (message) => showToast(message, 'info'),
    dismiss: removeToast,
  }), [removeToast, showToast]);

  return (
    <AppContext.Provider value={{ user, setUser, isAdmin, token, loading, loginUser, loginAdmin, logout, toast, toasts }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};

export default AppContext;
