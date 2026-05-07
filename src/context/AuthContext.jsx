import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTemporaryAuthError(error) {
  if (!error) return false;
  const message = String(error.message || error.msg || "").toLowerCase();
  return (
    error.status === 429 ||
    /rate limit/i.test(message) ||
    /timeout/i.test(message) ||
    /network/i.test(message) ||
    /fetch/i.test(message)
  );
}

async function fetchProfileWithRetry(userId, retries = 2) {
  const delays = [1000, 3000];
  let attempt = 0;

  while (true) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,avatar_url,role")
      .eq("id", userId)
      .maybeSingle();

    if (!error) {
      return { profile, error: null, temporary: false };
    }

    const temporary = isTemporaryAuthError(error);
    if (!temporary || attempt >= retries) {
      return { profile: null, error, temporary };
    }

    console.warn("[Auth] Supabase rate limited, retrying profile fetch", error);
    await sleep(delays[attempt] || 3000);
    attempt += 1;
  }
}

function mapSupabaseUser(supabaseUser, profile = null) {
  if (!supabaseUser) return null;
  const meta = supabaseUser.user_metadata || {};
  const pendingRole = localStorage.getItem("pendingAuthRole");
  const role = pendingRole || profile?.role || meta.role || "client";
  return {
    id: supabaseUser.id,
    email: profile?.email || supabaseUser.email,
    name:
      profile?.full_name ||
      meta.full_name ||
      meta.name ||
      supabaseUser.email?.split("@")[0] ||
      "",
    role,
    avatar: profile?.avatar_url || meta.avatar_url || meta.picture || "",
    provider: supabaseUser.app_metadata?.provider || "supabase",
    supabase: true,
  };
}

async function ensureProfileForSession(sbSession) {
  const user = sbSession?.user;
  if (!user) {
    return { profile: null, error: null, temporary: false };
  }

  console.log("[Auth] loading profile", user.id);
  const initialFetch = await fetchProfileWithRetry(user.id, 2);

  if (initialFetch.error && initialFetch.temporary) {
    return {
      profile: null,
      error: initialFetch.error,
      temporary: true,
    };
  }

  if (initialFetch.profile) {
    console.log("[Auth] profile fetched", initialFetch.profile);
    return {
      profile: initialFetch.profile,
      error: null,
      temporary: false,
    };
  }

  console.log("[Auth] Existing session profile missing - attempting profile recovery");

  try {
    const upsertResult = await upsertUserProfile(sbSession);
    if (!upsertResult.ok) {
      console.warn("[Auth] profile recovery upsert failed", upsertResult.error);
    }
  } catch (err) {
    console.warn("[Auth] profile recovery upsert failed", err);
  }

  const refetch = await fetchProfileWithRetry(user.id, 1);
  if (!refetch.error && refetch.profile) {
    console.log("[Auth] profile upserted/fetched", refetch.profile);
    return { profile: refetch.profile, error: null, temporary: false };
  }

  if (refetch.error && refetch.temporary) {
    return {
      profile: null,
      error: refetch.error,
      temporary: true,
    };
  }

  return {
    profile: refetch.profile,
    error: refetch.error,
    temporary: false,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getCurrentUser());
  const [supabaseSession, setSupabaseSession] = useState(null);
  const [isProcessingJoinAuth, setIsProcessingJoinAuth] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const isAuthInitializingRef = useRef(false);
  const authInitStartedRef = useRef(false);

  // Listen for Supabase auth state changes (OAuth redirect callback)
  useEffect(() => {
    async function handleSupabaseSession(sbSession, event = "INITIAL_SESSION") {
      if (event === "SIGNED_OUT") {
        console.log("[Auth] Supabase signed out");
        setSupabaseSession(null);
        setSession((prev) => (prev?.supabase ? null : prev));
        setProfileError(null);
        return;
      }

      if (!sbSession?.user) {
        console.log("[Auth] No Supabase session present", { event });
        return;
      }

      if (isAuthInitializingRef.current) {
        console.log("[Auth] auth initialization already in progress, skipping duplicate session handling");
        return;
      }

      isAuthInitializingRef.current = true;
      try {
        console.log("[Auth] Supabase session detected", sbSession.user.email);

        const pendingRole = localStorage.getItem("pendingAuthRole");
        const authSource = localStorage.getItem("pendingAuthSource");

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
            now - startedAt < 10 * 60 * 1000 &&
            lastSignInAt >= startedAt - 5000;

          if (!isFresh) {
            console.log("[Auth] Production join attempt invalid — clearing flags");
            localStorage.removeItem("pendingAuthRole");
            localStorage.removeItem("pendingAuthSource");
            localStorage.removeItem("pendingOAuthAttemptId");
            localStorage.removeItem("pendingOAuthStartedAt");
            setIsProcessingJoinAuth(false);
            return;
          }

          console.log("[Auth] Production join attempt valid");
          console.log("[Auth] Upserting profile for production join");

          try {
            await upsertUserProfile(sbSession);
          } catch (err) {
            console.warn("[Auth] Profile upsert failed:", err);
          }

          localStorage.removeItem("pendingAuthRole");
          localStorage.removeItem("pendingAuthSource");
          localStorage.removeItem("pendingOAuthAttemptId");
          localStorage.removeItem("pendingOAuthStartedAt");

          console.log("[Auth] Production join complete — returning to landing page");
          window.location.replace("/");
          return;
        }

        const {
          profile,
          error: profileFetchError,
          temporary,
        } = await ensureProfileForSession(sbSession);

        if (profileFetchError && temporary) {
          console.warn("[Auth] profile fetch failed but keeping session", profileFetchError);
          setProfileError(profileFetchError);
          setSupabaseSession(sbSession);

          const mapped = mapSupabaseUser(sbSession.user, null);
          setSession((prev) => {
            if (prev && !prev.supabase) return prev;
            return mapped;
          });
          return;
        }

        if (!profile) {
          console.warn("[Auth] Unable to resolve profile, keeping session with fallback user");
          setProfileError(profileFetchError || new Error("Profile missing"));
          setSupabaseSession(sbSession);

          const mapped = mapSupabaseUser(sbSession.user, null);
          setSession((prev) => {
            if (prev && !prev.supabase) return prev;
            return mapped;
          });
          return;
        }

        console.log("[Auth] Profile validated:", profile.email);
        setSupabaseSession(sbSession);
        setProfileError(null);

        const mapped = mapSupabaseUser(sbSession.user, profile);
        setSession((prev) => {
          if (prev && !prev.supabase) return prev;
          return mapped;
        });

        if (pendingRole) {
          console.log("[Auth] Pending role found:", pendingRole);
          console.log("[Auth] Auth source:", authSource || "app");

          await upsertUserProfile(sbSession);
          localStorage.removeItem("pendingAuthRole");

          const target = ROLE_REDIRECTS[pendingRole] || "/";
          console.log("[Auth] Redirecting to:", target);
          window.location.replace(target);
        }
      } finally {
        isAuthInitializingRef.current = false;
      }
    }

    async function initializeAuth() {
      if (authInitStartedRef.current) return;
      authInitStartedRef.current = true;
      setIsLoadingAuth(true);
      console.log('[Auth] init start');

      let initialSession = null;
      try {
        const { data: { session: sbSession } } = await supabase.auth.getSession();
        initialSession = sbSession;
        await handleSupabaseSession(sbSession, 'INITIAL_SESSION');
      } catch (err) {
        console.warn('[Auth] init error', err);
      } finally {
        setIsAuthReady(true);
        setIsLoadingAuth(false);
        console.log('[Auth] auth ready', { hasSession: !!initialSession, userId: initialSession?.user?.id });
      }
    }

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, sbSession) => {
        console.log('[Auth] onAuthStateChange event', event);
        handleSupabaseSession(sbSession, event);
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
      user: session,
      profile: session,
      session,
      supabaseSession,
      profileError,
      isAuthenticated: Boolean(session?.id && session?.email && session?.role),
      isAuthReady,
      isLoadingAuth,
      isProcessingJoinAuth,
      login,
      logout,
      refreshSession,
    }),
    [session, supabaseSession, profileError, isAuthReady, isLoadingAuth, isProcessingJoinAuth, login, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
