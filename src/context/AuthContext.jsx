import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  clearDemoSession,
  getDemoSession,
  setDemoSession,
  verifyDemoLogin,
} from "../services/demoAuthService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getDemoSession());

  const login = useCallback((email, password, role, rememberMe) => {
    const result = verifyDemoLogin(email, password, role);
    if (!result.ok) return result;
    setDemoSession({ email: result.account.email, role: result.account.role }, rememberMe);
    setSession(getDemoSession());
    return { ok: true, account: result.account };
  }, []);

  const logout = useCallback(() => {
    clearDemoSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session?.email && session?.role),
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
