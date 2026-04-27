import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore session from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAdmin(storedIsAdmin);
    }
    setLoading(false);
  }, []);

  const loginUser = (userData, tokenValue) => {
    setUser(userData);
    setToken(tokenValue);
    setIsAdmin(false);
    localStorage.setItem('token', tokenValue);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isAdmin', 'false');
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
  };

  return (
    <AppContext.Provider value={{ user, setUser, isAdmin, token, loading, loginUser, loginAdmin, logout }}>
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
