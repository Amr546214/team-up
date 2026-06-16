import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  loginUser,
  logoutUser,
  getCurrentUser,
} from "../services/fakeApi";
import { supabase } from "../lib/supabase";
import { upsertUserProfile, ensureUserProfile } from "../lib/supabaseAuth";
import { clearAuth, dispatchAuthChanged, getUserProfile } from "../utils/authStorage";

const AuthContext = createContext(null);
// لينك ال api لبيدج اللوجين 
const BASE_URL = "https://team-up-backend-production-6c43.up.railway.app";

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
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  sessionStorage.removeItem("teamup_demo_session_v1");
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("refresh_token"); 
}

const ROLE_REDIRECTS = {
  client: "/client/profile",
  developer: "/developer/dashboard",
  company: "/company/profile",
  admin: "/admin/dashboard",
  "team-leader": "/team-leader/dashboard",
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
  
  // Role priority: profile.role (db) > pendingRole (for new registrations) > metadata.role > "client"
  const role = profile?.role || pendingRole || meta.role || "client";
  
  console.log("[mapSupabaseUser] Role resolution:", {
    finalRole: role,
    profileRole: profile?.role,
    pendingRole,
    metadataRole: meta.role,
    userId: supabaseUser.id,
  });
  
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
  const [isProfileReady, setIsProfileReady] = useState(false);
  // Backend auth state synced with localStorage
  const [backendAuthState, setBackendAuthState] = useState(() => ({
    hasToken: typeof window !== "undefined" && !!localStorage.getItem("teamup_access_token"),
    role: typeof window !== "undefined" ? localStorage.getItem("teamup_user_role") : null,
  }));
  // User profile synced with localStorage
  const [userProfile, setUserProfile] = useState(() =>
    typeof window !== "undefined" ? getUserProfile() : null
  );
  const isAuthInitializingRef = useRef(false);
  const authInitStartedRef = useRef(false);
  const profileRecoveryInProgressRef = useRef(false);

  useEffect(() => {
    async function handleSupabaseSession(sbSession, event = "INITIAL_SESSION") {
      if (event === "SIGNED_OUT") {
        console.log("[Auth] Supabase signed out");
        setSupabaseSession(null);
        setSession((prev) => (prev?.supabase ? null : prev));
        setProfileError(null);
        setIsProfileReady(false);
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

        // Step 1: Ensure profile row exists (upsert from auth metadata)
        if (!profileRecoveryInProgressRef.current) {
          profileRecoveryInProgressRef.current = true;
          try {
            const ensureResult = await ensureUserProfile(sbSession.user, 2);
            console.log("[Auth] ensureUserProfile completed", {
              userId: sbSession.user.id,
              ok: ensureResult.ok,
              error: ensureResult.error?.message,
            });
          } catch (err) {
            console.warn("[Auth] ensureUserProfile failed", err);
          } finally {
            profileRecoveryInProgressRef.current = false;
          }
        }

        // Step 2: Fetch and validate profile
        const {
          profile,
          error: profileFetchError,
          temporary,
        } = await ensureProfileForSession(sbSession);

        if (profileFetchError && temporary) {
          console.warn("[Auth] profile fetch failed but keeping session", profileFetchError);
          setProfileError(profileFetchError);
          setSupabaseSession(sbSession);
          setIsProfileReady(true);

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
          setIsProfileReady(true);

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
        setIsProfileReady(true);

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

          // Use the ACTUAL resolved role from the mapped user (which prioritizes profile.role)
          const actualRole = mapped?.role || pendingRole || "client";
          const target = ROLE_REDIRECTS[actualRole] || "/";
          console.log("[AuthContext] Redirect after OAuth - resolved role:", actualRole, "target:", target);
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
        setIsProfileReady(true);
        setIsLoadingAuth(false);
        console.log('[Auth] init complete', { hasSession: !!initialSession, userId: initialSession?.user?.id });
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

  // Listen for backend auth state changes (from localStorage)
  useEffect(() => {
    const syncAuthState = () => {
      const hasToken = !!localStorage.getItem("teamup_access_token");
      const role = localStorage.getItem("teamup_user_role");
      const profile = getUserProfile();
      setBackendAuthState({ hasToken, role });
      setUserProfile(profile);
      console.log("GLOBAL AUTH SYNC:", {
        tokenExists: hasToken,
        role: role,
        profile: profile,
      });
    };

    // Initial sync
    syncAuthState();

    // Listen for custom auth changed event
    window.addEventListener("teamup-auth-changed", syncAuthState);
    // Also listen for storage events (multi-tab sync)
    window.addEventListener("storage", syncAuthState);

    return () => {
      window.removeEventListener("teamup-auth-changed", syncAuthState);
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  // Function to manually sync auth state (can be called after login)
  const loginStateSync = useCallback(() => {
    const hasToken = !!localStorage.getItem("teamup_access_token");
    const role = localStorage.getItem("teamup_user_role");
    const profile = getUserProfile();
    setBackendAuthState({ hasToken, role });
    setUserProfile(profile);
    console.log("GLOBAL AUTH SYNC (manual):", {
      tokenExists: hasToken,
      role: role,
      profile: profile,
    });
  }, []);

  const login = useCallback((email, password, role) => {
    const result = loginUser(email, password);
    if (!result.success) {
      if (result.requiresQuiz) {
        return { ok: false, reason: "skill_quiz_required", userId: result.userId };
      }
      return { ok: false, reason: result.reason, message: result.message };
    }

    const userSession = {
      ...result.user,
      role,
    };

    setSession(userSession);

    return { ok: true, account: userSession };
  }, []);

  const logout = useCallback(async () => {
    logoutUser();

    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch {
      // ignore
    }

    clearAllAuthStorage();
    clearAuth(); // Clear backend tokens and role
    dispatchAuthChanged(); // Notify all components of logout
    setSupabaseSession(null);
    setSession(null);
  }, []);

  const refreshSession = useCallback(() => {
    setSession(getCurrentUser());
  }, []);

  // Use backendAuthState for reactive backend auth state
  const hasBackendToken = backendAuthState.hasToken;
  const backendRole = backendAuthState.role;

  // Combined authentication state: either Supabase/fakeApi session OR backend token
  const isAuthenticated = Boolean(
    (session?.id && session?.email && session?.role) || hasBackendToken
  );

  // Get effective role (from session or backend storage)
  const effectiveRole = session?.role || backendRole || "client";

  // Debug logs
  console.log("AUTH TOKEN EXISTS:", hasBackendToken);
  console.log("AUTH ROLE:", effectiveRole);

  const value = useMemo(
    () => ({
      user: session,
      profile: session,
      session,
      supabaseSession,
      profileError,
      isAuthenticated,
      isAuthReady,
      isProfileReady,
      isLoading: isLoadingAuth,
      isLoadingAuth,
      isProcessingJoinAuth,
      login,
      logout,
      refreshSession,
      backendRole,
      userRole: effectiveRole, // Exposed for easy access
      userProfile, // Global user profile for avatar/name
      loginStateSync, // Manual sync function
    }),
    [session, supabaseSession, profileError, isAuthReady, isProfileReady, isLoadingAuth, isProcessingJoinAuth, login, logout, refreshSession, backendRole, isAuthenticated, effectiveRole, userProfile, loginStateSync]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
