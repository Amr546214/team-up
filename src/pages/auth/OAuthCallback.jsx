import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

/**
 * OAuth Callback Handler
 *
 * Handles Supabase OAuth callback, extracts session from URL hash,
 * and redirects user to appropriate dashboard based on role.
 */
function OAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        console.log("[OAuthCallback] Processing OAuth callback...");
        console.log("[OAuthCallback] Current URL:", window.location.href);

        // Get session from Supabase (handles the OAuth hash automatically)
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("[OAuthCallback] Session error:", sessionError);
          setError(sessionError.message);
          return;
        }

        const session = data.session;

        if (!session) {
          console.error("[OAuthCallback] No session found");
          setError("Authentication failed. Please try again.");
          return;
        }

        console.log("[OAuthCallback] Session found:", {
          userId: session.user?.id,
          email: session.user?.email,
          provider: session.user?.app_metadata?.provider,
        });

        // Get role from localStorage (set during sign-in)
        const pendingRole = localStorage.getItem("pendingAuthRole");
        const role = pendingRole || session.user?.user_metadata?.role || "client";

        console.log("[OAuthCallback] Role:", role);

        // Clear pending auth data
        localStorage.removeItem("pendingAuthRole");
        localStorage.removeItem("pendingAuthSource");
        localStorage.removeItem("pendingOAuthAttemptId");
        localStorage.removeItem("pendingOAuthStartedAt");

        // Map roles to dashboard paths
        const roleRedirects = {
          client: "/client/profile",
          developer: "/developer/dashboard",
          company: "/company/dashboard",
          admin: "/admin/dashboard",
        };

        const redirectPath = roleRedirects[role] || "/";
        console.log("[OAuthCallback] Redirecting to:", redirectPath);

        // Small delay to ensure state updates
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 100);
      } catch (err) {
        console.error("[OAuthCallback] Unexpected error:", err);
        setError("An unexpected error occurred. Please try again.");
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-red-600">
            Authentication Failed
          </h2>
          <p className="mb-4 text-gray-600">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="rounded-md bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-teal-600"></div>
        <p className="text-gray-600">Completing sign-in...</p>
      </div>
    </div>
  );
}

export default OAuthCallback;
