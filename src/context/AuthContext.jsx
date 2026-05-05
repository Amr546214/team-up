import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import {
  loginUser,
  logoutUser,
  getCurrentUser,
} from "../services/fakeApi";
import { supabase } from "../lib/supabase";
import { upsertUserProfile } from "../lib/supabaseAuth";

const AuthContext = createContext(null);

function clearAllAuthStorage() {
  localStorage.removeItem("pendingAuthRole");
  localStorage.removeItem("pendingAuthSource");
  localStorage.removeItem("pendingOAuthAttemptId");
  localStorage.removeItem("pendingOAuthStartedAt");
  localStorage.removeItem("joinResult");
  localStorage.removeItem("joinUserName");
  localStorage.removeItem("joinUserAvatar");
  localStorage.removeItem("showJoinSuccess");
  localStorage.removeItem("teamup_demo_session_v1");
  sessionStorage.removeItem("teamup_demo_session_v1");
}

const ROLE_REDIRECTS = {
  client: "/client/profile",
  developer: "/developer/dashboard",
  company: "/company/profile",
  admin: "/",
};

/**
 * Map a Supabase user and optional profile to the app's session shape.
 * Prefers profile data when available, falls back to user metadata.
 */
function mapSupabaseUser(supabaseUser, profile = null) {
  if (!supabaseUser) return null;
  const meta = supabaseUser.user_metadata || {};
  const pendingRole = localStorage.getItem("pendingAuthRole");
  const role = pendingRole || profile?.role || meta.role || "client";
  return {
    id: supabaseUser.id,
    email: profile?.email || supabaseUser.email,
    name: profile?.full_name || meta.full_name || meta.name || supabaseUser.email?.split("@")[0] || "",
    role,
    avatar: profile?.avatar_url || meta.avatar_url || meta.picture || "",
    provider: supabaseUser.app_metadata?.provider || "supabase",
    supabase: true,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getCurrentUser());
  const [supabaseSession, setSupabaseSession] = useState(null);
  const [isProcessingJoinAuth, setIsProcessingJoinAuth] = useState(false);

  // Listen for Supabase auth state changes (OAuth redirect callback)
  useEffect(() => {
    async function handleSupabaseSession(sbSession) {
      if (!sbSession?.user) return;
      console.log("[Auth] Supabase session detected for:", sbSession.user.email);

      // Check for pending production join attempt first
      const pendingRole = localStorage.getItem("pendingAuthRole");
      const authSource = localStorage.getItem("pendingAuthSource");

      // Production join flow: validate freshness, upsert profile, redirect to landing
      if (authSource === "production_join" && pendingRole) {
        console.log("[Auth] Production join detected");
        setIsProcessingJoinAuth(true);

        const attemptId = localStorage.getItem("pendingOAuthAttemptId");
        const startedAt = Number(localStorage.getItem("pendingOAuthStartedAt") || 0);
        const now = Date.now();
        const lastSignInAt = new Date(sbSession.user.last_sign_in_at || 0).getTime();

        console.log("[Auth] OAuth attempt validation:", {
          attemptIdExists: Boolean(attemptId),
          startedAtExists: Boolean(startedAt),
          ageMs: now - startedAt,
          lastSignInAtDiff: lastSignInAt - startedAt,
        });

        const isFresh =
          attemptId &&
          startedAt > 0 &&
          now - startedAt < 10 * 60 * 1000 && // 10 minute window
          lastSignInAt >= startedAt - 5000; // signed in after attempt started (5s buffer)

        if (!isFresh) {
          console.log("[Auth] Production join attempt invalid — clearing flags");
          localStorage.removeItem("pendingAuthRole");
          localStorage.removeItem("pendingAuthSource");
          localStorage.removeItem("pendingOAuthAttemptId");
          localStorage.removeItem("pendingOAuthStartedAt");
          setIsProcessingJoinAuth(false);
          // Do NOT show success modal, do NOT upsert for this stale attempt
          return;
        }

        console.log("[Auth] Production join attempt valid");
        console.log("[Auth] Upserting profile for production join");

        try {
          // Upsert profile (creates if new, updates if existing)
          await upsertUserProfile(sbSession);
        } catch (err) {
          console.error("[Auth] Profile upsert failed:", err);
        }

        // Clear all production join flags
        localStorage.removeItem("pendingAuthRole");
        localStorage.removeItem("pendingAuthSource");
        localStorage.removeItem("pendingOAuthAttemptId");
        localStorage.removeItem("pendingOAuthStartedAt");

        console.log("[Auth] Production join complete — returning to landing page");
        // Keep isProcessingJoinAuth true during redirect to prevent UI flash
        window.location.replace("/");
        return;
      }

      // For non-production sessions, validate profile exists to prevent stale sessions
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id,email,full_name,avatar_url,role")
        .eq("id", sbSession.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("[Auth] Failed to validate profile:", profileError.message);
      }

      if (!profile) {
        console.log("[Auth] Existing session profile missing — signing out");
        await supabase.auth.signOut();
        logoutUser();
        clearAllAuthStorage();
        setSupabaseSession(null);
        setSession(null);
        return;
      }

      console.log("[Auth] Profile validated:", profile.email);
      setSupabaseSession(sbSession);

      const mapped = mapSupabaseUser(sbSession.user, profile);
      setSession((prev) => {
        if (prev && !prev.supabase) return prev; // keep existing local session
        return mapped;
      });

      // Handle normal role-based redirects
      if (pendingRole) {
        console.log("[Auth] Pending role found:", pendingRole);
        console.log("[Auth] Auth source:", authSource || "app");

        await upsertUserProfile(sbSession);
        localStorage.removeItem("pendingAuthRole");

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
    clearAllAuthStorage();
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
      isProcessingJoinAuth,
      login,
      logout,
      refreshSession,
    }),
    [session, supabaseSession, isProcessingJoinAuth, login, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
