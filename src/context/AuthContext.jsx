import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import {
  loginUser,
  logoutUser,
  getCurrentUser,
} from "../services/fakeApi";
import { supabase } from "../lib/supabase";
import { upsertUserProfile } from "../lib/supabaseAuth";

const AuthContext = createContext(null);

const ROLE_REDIRECTS = {
  client: "/client/profile",
  developer: "/developer/dashboard",
  company: "/company/profile",
  admin: "/",
};

/**
 * Map a Supabase user object to the app's session shape.
 * Reads the pending role from localStorage (set before OAuth redirect).
 */
function mapSupabaseUser(supabaseUser) {
  if (!supabaseUser) return null;
  const meta = supabaseUser.user_metadata || {};
  const pendingRole = localStorage.getItem("pendingAuthRole");
  const role = pendingRole || meta.role || "client";
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: meta.full_name || meta.name || supabaseUser.email?.split("@")[0] || "",
    role,
    avatar: meta.avatar_url || meta.picture || "",
    provider: supabaseUser.app_metadata?.provider || "supabase",
    supabase: true,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getCurrentUser());
  const [supabaseSession, setSupabaseSession] = useState(null);

  // Listen for Supabase auth state changes (OAuth redirect callback)
  useEffect(() => {
    async function handleSupabaseSession(sbSession) {
      if (!sbSession?.user) return;
      console.log("[Auth] Supabase session detected for:", sbSession.user.email);
      setSupabaseSession(sbSession);

      const mapped = mapSupabaseUser(sbSession.user);
      setSession((prev) => {
        if (prev && !prev.supabase) return prev; // keep existing local session
        return mapped;
      });

      // Upsert profile into the profiles table, then redirect
      const pendingRole = localStorage.getItem("pendingAuthRole");
      const authSource = localStorage.getItem("pendingAuthSource");

      if (pendingRole) {
        console.log("[Auth] Pending role found:", pendingRole);
        console.log("[Auth] Auth source:", authSource || "app");

        await upsertUserProfile(sbSession);

        localStorage.removeItem("pendingAuthRole");

        // Production join: stay on landing page with success modal
        if (authSource === "production_join") {
          localStorage.removeItem("pendingAuthSource");
          localStorage.setItem("showJoinSuccess", "true");
          console.log("[Auth] Production join — redirecting to landing page.");
          window.location.replace("/");
          return;
        }

        const target = ROLE_REDIRECTS[pendingRole] || "/";
        console.log("[Auth] Redirecting to:", target);
        window.location.replace(target);
      }
    }

    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session: sbSession } }) => {
      handleSupabaseSession(sbSession);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, sbSession) => {
        handleSupabaseSession(sbSession);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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

  const logout = useCallback(async () => {
    logoutUser();
    // Sign out of Supabase too
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
    // Clear legacy session keys
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("teamup_demo_session_v1");
      window.localStorage.removeItem("teamup_demo_session_v1");
    }
    setSupabaseSession(null);
    setSession(null);
  }, []);

  const refreshSession = useCallback(() => {
    setSession(getCurrentUser());
  }, []);

  const value = useMemo(
    () => ({
      session,
      supabaseSession,
      isAuthenticated: Boolean(session?.id && session?.email && session?.role),
      login,
      logout,
      refreshSession,
    }),
    [session, supabaseSession, login, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
