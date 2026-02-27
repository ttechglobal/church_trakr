// src/components/layout/ProtectedRoute.jsx
// Redirects to /login if user is not authenticated.
// When Supabase is active, the AuthContext will manage session automatically.

import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
