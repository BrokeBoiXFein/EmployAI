// ============================================================
// ProtectedRoute — gate any route behind authentication
// ============================================================
// Usage in App.jsx:
//   <Route path="/analyze" element={
//     <ProtectedRoute><Analyzer /></ProtectedRoute>
//   } />
//
// If the user isn't logged in, redirects to /login with a
// `from` query so we can bounce them back after they sign in.
// ============================================================

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth';

export default function ProtectedRoute({ children }) {
  const user = useAuth(s => s.user);
  const loading = useAuth(s => s.loading);
  const location = useLocation();

  // While we're checking the token on first app load, show nothing.
  // (Could also show a spinner. Empty screen for ~200ms is fine.)
  if (loading) return null;

  if (!user) {
    // Send them to login, remembering where they wanted to go
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
