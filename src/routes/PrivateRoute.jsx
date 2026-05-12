import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function PrivateRoute() {
  const { isAuthenticated } = useAuth();
  // Also check for backend access token as fallback
  const hasBackendToken = typeof window !== "undefined" &&
    !!localStorage.getItem("teamup_access_token");

  if (!isAuthenticated && !hasBackendToken) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

