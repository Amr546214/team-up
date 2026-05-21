import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getDashboardPath } from "../utils/authStorage";

/**
 * PublicOnlyRoute - Redirects authenticated users away from public pages like /login and /register
 * Similar to PrivateRoute but in reverse - protects public routes from authenticated users
 */
export default function PublicOnlyRoute({ children }) {
  const { isAuthenticated, userRole } = useAuth();

  // If not authenticated, allow access to public pages
  if (!isAuthenticated) {
    return children;
  }

  const redirectPath = getDashboardPath(userRole);

  return <Navigate to={redirectPath} replace />;
}
