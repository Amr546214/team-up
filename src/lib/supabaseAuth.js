import { supabase } from "./supabase";

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

/**
 * Ensure authenticated user has a profile row.
 * Upserts profile from auth metadata with retry logic for temporary errors.
 * @param {import("@supabase/supabase-js").User} authUser
 * @param {number} maxRetries - Max retry attempts for 429s
 * @returns {Promise<{ ok: boolean, profile: any, error: any, temporary: boolean }>}
 */
export async function ensureUserProfile(authUser, maxRetries = 2) {
  if (!authUser?.id) {
    console.warn("[ensureUserProfile] No auth user — skipping");
    return { ok: false, profile: null, error: "no_user", temporary: false };
  }

  const user = authUser;
  const meta = user.user_metadata || {};
  const pendingRole = localStorage.getItem("pendingAuthRole");
  const role = pendingRole || meta.role || "client";
  const email = user.email || "";

  const profile = {
    id: user.id,
    email,
    full_name: meta.full_name || meta.name || email.split("@")[0] || "User",
    avatar_url: meta.avatar_url || meta.picture || null,
    provider: user.app_metadata?.provider || "unknown",
    role,
    updated_at: new Date().toISOString(),
  };

  console.log("[ensureUserProfile] profile data", {
    userId: user.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
  });

  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const { data: upsertedProfile, error } = await supabase
        .from("profiles")
        .upsert(profile, { onConflict: "id" })
        .select()
        .single();

      if (!error) {
        console.log("[ensureUserProfile] success", {
          userId: user.id,
          email: profile.email,
        });
        return { ok: true, profile: upsertedProfile, error: null, temporary: false };
      }

      const temporary = isTemporaryAuthError(error);
      if (!temporary || attempt >= maxRetries) {
        console.warn("[ensureUserProfile] failed", {
          userId: user.id,
          error: error.message,
          temporary,
        });
        return { ok: false, profile: null, error, temporary };
      }

      console.warn("[ensureUserProfile] temporary error, retrying", {
        userId: user.id,
        attempt,
        error: error.message,
      });
      const delay = attempt === 0 ? 1500 : 3000;
      await sleep(delay);
      attempt += 1;
    } catch (err) {
      const temporary = isTemporaryAuthError(err);
      if (!temporary || attempt >= maxRetries) {
        console.error("[ensureUserProfile] unexpected error", {
          userId: user.id,
          error: err.message,
          temporary,
        });
        return { ok: false, profile: null, error: err, temporary };
      }

      console.warn("[ensureUserProfile] temporary error, retrying", {
        userId: user.id,
        attempt,
        error: err.message,
      });
      const delay = attempt === 0 ? 1500 : 3000;
      await sleep(delay);
      attempt += 1;
    }
  }

  return {
    ok: false,
    profile: null,
    error: new Error("Max retries exceeded"),
    temporary: false,
  };
}

/**
 * Sign in with an OAuth provider via Supabase.
 * Stores the selected role in localStorage so the app can redirect correctly after OAuth callback.
 * @param {"google" | "github" | "linkedin_oidc"} provider
 * @param {string} [role] - The currently selected role tab (client, developer, company, admin)
 */
export async function signInWithProvider(provider, role, source, attemptId) {
  try {
    if (role) {
      localStorage.setItem("pendingAuthRole", role);
    }
    if (source) {
      localStorage.setItem("pendingAuthSource", source);
    }
    if (attemptId) {
      localStorage.setItem("pendingOAuthAttemptId", attemptId);
      localStorage.setItem("pendingOAuthStartedAt", String(Date.now()));
    }

    const options = {
      redirectTo: window.location.origin,
    };

    if (provider === "google") {
      options.queryParams = {
        prompt: "select_account",
      };
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options,
    });

    if (error) {
      console.error(`[Supabase OAuth] ${provider} sign-in error:`, error.message);
      localStorage.removeItem("pendingAuthSource");
      localStorage.removeItem("pendingAuthRole");
      localStorage.removeItem("pendingOAuthAttemptId");
      localStorage.removeItem("pendingOAuthStartedAt");
      return { ok: false, error };
    }

    return { ok: true, data };
  } catch (err) {
    console.error(`[Supabase OAuth] Unexpected error during ${provider} sign-in:`, err);
    localStorage.removeItem("pendingAuthSource");
    localStorage.removeItem("pendingAuthRole");
    localStorage.removeItem("pendingOAuthAttemptId");
    localStorage.removeItem("pendingOAuthStartedAt");
    return { ok: false, error: err };
  }
}

export const signInWithGoogle = (role, source, attemptId) => signInWithProvider("google", role, source, attemptId);
export const signInWithGitHub = (role, source, attemptId) => signInWithProvider("github", role, source, attemptId);
export const signInWithLinkedIn = (role, source, attemptId) => signInWithProvider("linkedin_oidc", role, source, attemptId);


/**
 * Upsert the authenticated user into the `profiles` table.
 * Reads the pending role from localStorage; falls back to "client".
 * @param {import("@supabase/supabase-js").Session} session
 */
export async function upsertUserProfile(session) {
  if (!session?.user) {
    console.warn("[Supabase Profile] No user in session — skipping upsert.");
    return { ok: false, error: "no_user" };
  }

  const user = session.user;
  const meta = user.user_metadata || {};
  const pendingRole = localStorage.getItem("pendingAuthRole");
  const role = pendingRole || meta.role || "client";
  const email = user.email || "";

  const profile = {
    id: user.id,
    email,
    full_name: meta.full_name || meta.name || email.split("@")[0] || "",
    avatar_url: meta.avatar_url || meta.picture || "",
    provider: user.app_metadata?.provider || "",
    role,
  };

  console.log("[Supabase Profile] Upserting profile:", profile);
  console.log("[Supabase Profile] Role used:", role, pendingRole ? "(from pendingAuthRole)" : "(fallback)");

  try {
    // Check if this is a new or existing user (for production join modal)
    const authSource = localStorage.getItem("pendingAuthSource");
    let isExistingProfile = false;
    if (authSource === "production_join") {
      const { data: existingRow } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      isExistingProfile = Boolean(existingRow);
    }

    const { error } = await supabase.from("profiles").upsert(profile, {
      onConflict: "id",
    });

    if (error) {
      console.error("[Supabase Profile] Upsert failed:", error.message);
      return { ok: false, error };
    }

    console.log("[Supabase Profile] Profile saved successfully.");

    // Send welcome email (only once per user)
    await sendWelcomeEmailIfNeeded(user.id, profile.email, profile.full_name);

    // Notify admin about the new signup (only once per user)
    await sendAdminNotificationIfNeeded(profile);

    // Store result type for production join modal (only for new users)
    if (authSource === "production_join") {
      if (isExistingProfile) {
        // Existing users see the permanent authenticated card, no modal needed
        console.log("[Supabase Profile] Existing user — showing permanent card, no modal.");
      } else {
        localStorage.setItem("joinResult", "new");
        localStorage.setItem("joinUserName", profile.full_name || profile.email || "there");
        localStorage.setItem("joinUserAvatar", profile.avatar_url || "");
      }
    }

    return { ok: true };
  } catch (err) {
    console.error("[Supabase Profile] Unexpected error:", err);
    return { ok: false, error: err };
  }
}

/**
 * Notify the admin about a new user signup via the Supabase Edge Function,
 * but only if `admin_notified` is false/null in the user's profile row.
 * On success, sets `admin_notified = true`.
 */
async function sendAdminNotificationIfNeeded(profile) {
  try {
    const { data: row, error: fetchErr } = await supabase
      .from("profiles")
      .select("admin_notified")
      .eq("id", profile.id)
      .single();

    if (fetchErr) {
      console.error("[Admin Notify] Failed to read profile:", fetchErr.message);
      return;
    }

    if (row?.admin_notified) {
      console.log("[Admin Notify] Already sent — skipping.");
      return;
    }

    console.log("[Admin Notify] Sending...");
    const { error: fnErr } = await supabase.functions.invoke(
      "send-admin-signup-notification",
      {
        body: {
          email: profile.email,
          name: profile.full_name,
          role: profile.role,
          provider: profile.provider,
          userId: profile.id,
        },
      }
    );

    if (fnErr) {
      console.error("[Admin Notify] Failed:", fnErr.message);
      return;
    }

    console.log("[Admin Notify] Sent successfully.");

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ admin_notified: true })
      .eq("id", profile.id);

    if (updateErr) {
      console.error("[Admin Notify] Failed to set admin_notified:", updateErr.message);
    }
  } catch (err) {
    console.error("[Admin Notify] Unexpected error:", err);
  }
}

/**
 * Send a welcome email via the Supabase Edge Function, but only if
 * `welcome_email_sent` is false/null in the user's profile row.
 * On success, sets `welcome_email_sent = true`.
 */
async function sendWelcomeEmailIfNeeded(userId, email, name) {
  try {
    // 1. Check current flag
    const { data: row, error: fetchErr } = await supabase
      .from("profiles")
      .select("welcome_email_sent")
      .eq("id", userId)
      .single();

      
    if (fetchErr) {
      console.error("[Welcome Email] Failed to read profile:", fetchErr.message);
      return;
    }

    if (row?.welcome_email_sent) {
      console.log("[Welcome Email] Already sent — skipping.");
      return;
    }

    // 2. Invoke the Edge Function
    console.log("[Welcome Email] Sending to:", email);
    const { error: fnErr } = await supabase.functions.invoke("send-welcome-email", {
      body: { email, name },
    });

    if (fnErr) {
      console.error("[Welcome Email] Edge Function failed:", fnErr.message);
      return;
    }

    console.log("[Welcome Email] Sent successfully.");

    // 3. Mark as sent
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ welcome_email_sent: true })
      .eq("id", userId);

    if (updateErr) {
      console.error("[Welcome Email] Failed to set welcome_email_sent:", updateErr.message);
    }
  } catch (err) {
    console.error("[Welcome Email] Unexpected error:", err);
  }
}
