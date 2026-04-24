import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  loginUser,
  logoutUser,
  getCurrentUser,
} from "../services/fakeApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getCurrentUser());

  const login = useCallback((email, password, role, rememberMe) => {
    const result = loginUser(email, password);
    if (!result.success) {
      if (result.requiresQuiz) {
        return { ok: false, reason: "skill_quiz_required", userId: result.userId };
      }
      if (result.message === "Invalid email or password") {
        return { ok: false, reason: "invalid_credentials" };
      }
      return { ok: false, reason: "unknown", message: result.message };
    }
    // Store in localStorage with rememberMe option
    if (typeof window !== "undefined") {
      const payload = JSON.stringify({ email: result.data.email, role: result.data.role });
      window.sessionStorage.setItem("teamup_demo_session_v1", payload);
      if (rememberMe) {
        window.localStorage.setItem("teamup_demo_session_v1", payload);
      } else {
        window.localStorage.removeItem("teamup_demo_session_v1");
      }
    }
    setSession(result.data);

    // Developer logged in but hasn't completed profile yet
    if (result.requiresProfile) {
      return { ok: true, account: result.data, requiresProfile: true };
    }

    return { ok: true, account: result.data };
  }, []);

  const logout = useCallback(() => {
    logoutUser();
    // Clear legacy session keys
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("teamup_demo_session_v1");
      window.localStorage.removeItem("teamup_demo_session_v1");
    }
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session?.id && session?.email && session?.role),
      login,
      logout,
    }),
    [session, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
