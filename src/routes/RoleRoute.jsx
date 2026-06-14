import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { hasCompletedQuiz } from "../services/fakeApi";

export default function RoleRoute({ role }) {
  const { session, isAuthenticated, userRole } = useAuth();

  // Check for backend access token and role from localStorage
  const hasBackendToken = typeof window !== "undefined" &&
    !!localStorage.getItem("teamup_access_token");
  const backendRole = typeof window !== "undefined"
    ? localStorage.getItem("teamup_user_role")
    : null;

  // Use effective role from context or localStorage
  const effectiveRole = userRole || backendRole || session?.role;

  // Allow access if backend token exists and role matches (for client, developer, company)
  if (hasBackendToken && effectiveRole === role) {
    return <Outlet />;
  }

  // Fallback to session-based auth check
  if (!session?.email || !session?.role) {
    console.log("[RoleRoute] Redirect to /login - missing session data:", { email: session?.email, role: session?.role, requiredRole: role });
    return <Navigate to="/login" replace />;
  }
  if (session.role !== role) {
    console.log("[RoleRoute] Redirect to /login - role mismatch:", { sessionRole: session.role, requiredRole: role });
    return <Navigate to="/login" replace />;
  }

  // Critical rule: developer pages require completed quiz (cannot be bypassed)
  if (role === "developer" && !hasCompletedQuiz(session.id)) {
    return <Navigate to="/skill-quiz" replace />;
  }

  return <Outlet />;
}

