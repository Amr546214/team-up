import React, { useMemo } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { findDemoAccountByEmailAndRole } from "../services/demoAuthService";

export default function RoleRoute({ role }) {
  const { session } = useAuth();

  const account = useMemo(() => {
    if (!session?.email || !session?.role) return null;
    return findDemoAccountByEmailAndRole(session.email, session.role);
  }, [session?.email, session?.role]);

  if (!session?.email || !session?.role) return <Navigate to="/login" replace />;
  if (session.role !== role) return <Navigate to="/login" replace />;

  // Critical rule: developer pages require completed quiz (cannot be bypassed)
  if (role === "developer" && !account?.skillQuizCompleted) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

