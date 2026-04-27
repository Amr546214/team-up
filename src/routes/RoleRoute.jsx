import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { hasCompletedQuiz } from "../services/fakeApi";

export default function RoleRoute({ role }) {
  const { session } = useAuth();

  if (!session?.email || !session?.role) return <Navigate to="/login" replace />;
  if (session.role !== role) return <Navigate to="/login" replace />;

  // Critical rule: developer pages require completed quiz (cannot be bypassed)
  if (role === "developer" && !hasCompletedQuiz(session.id)) {
    return <Navigate to="/skill-quiz" replace />;
  }

  return <Outlet />;
}

