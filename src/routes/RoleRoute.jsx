import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { hasCompletedQuiz } from "../services/fakeApi";

export default function RoleRoute({ role }) {
  const { session } = useAuth();

  // Also check for backend access token as fallback for client, developer, and company roles
  const hasBackendToken = typeof window !== "undefined" &&
    !!localStorage.getItem("teamup_access_token");

  // Allow client/developer/company routes if backend token exists (temporary until full auth context integration)
  if ((role === "client" || role === "developer" || role === "company") && hasBackendToken) {
    return <Outlet />;
  }

  if (!session?.email || !session?.role) return <Navigate to="/login" replace />;
  if (session.role !== role) return <Navigate to="/login" replace />;

  // Critical rule: developer pages require completed quiz (cannot be bypassed)
  if (role === "developer" && !hasCompletedQuiz(session.id)) {
    return <Navigate to="/skill-quiz" replace />;
  }

  return <Outlet />;
}

