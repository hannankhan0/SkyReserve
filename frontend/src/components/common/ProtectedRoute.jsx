import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

// Redirects to /login if not logged in
// If adminOnly=true, also redirects non-admins
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isAdmin, loading } = useApp();

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return children;
};

export default ProtectedRoute;
