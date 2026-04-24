import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Session flag to track if we've already processed this session
// This prevents redirect loops and ensures we only check once on app load
const SESSION_KEY = "__quiz_app_session_active__";

/**
 * Hook to detect ACTUAL page refresh (F5/Ctrl+R) and redirect to home page.
 * Uses Performance API to detect navigation type.
 *
 * IMPORTANT: This hook only runs once per browser session to prevent
 * interfering with normal React Router navigation.
 *
 * @param {string} homePath - Path to redirect to on refresh (default: "/")
 */
const usePageRefresh = (homePath = "/") => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple checks in the same component lifecycle
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    // Only run on client side
    if (typeof window === "undefined" || !window.performance) {
      console.log("[usePageRefresh] Performance API not available");
      return;
    }

    // Check if we've already processed this browser session
    // This distinguishes between:
    // - Initial app load (sessionStorage empty) → check for refresh
    // - In-app navigation (sessionStorage has flag) → skip check
    const sessionActive = sessionStorage.getItem(SESSION_KEY);

    if (sessionActive) {
      console.log("[usePageRefresh] Session already active, skipping refresh check");
      return;
    }

    // Mark session as active
    sessionStorage.setItem(SESSION_KEY, "true");

    // Get navigation type using Performance API
    const navigationEntries = performance.getEntriesByType("navigation");
    const navigationType =
      navigationEntries.length > 0
        ? navigationEntries[0].type
        : performance.navigation?.type;

    console.log("[usePageRefresh] Navigation type:", navigationType);
    console.log("[usePageRefresh] Current path:", location.pathname);

    // TYPE_RELOAD = "reload" (string) or 1 (number) indicates page refresh
    const isRefresh =
      navigationType === "reload" ||
      navigationType === 1 ||
      navigationType === "hard_reload";

    // TYPE_NAVIGATE = "navigate" or 0 indicates normal navigation
    const isNavigate =
      navigationType === "navigate" ||
      navigationType === 0 ||
      !navigationType; // Fallback for unsupported browsers

    console.log("[usePageRefresh] Is refresh:", isRefresh, "| Is navigate:", isNavigate);

    // Only redirect if it's an actual refresh AND not already on home page
    if (isRefresh && location.pathname !== homePath) {
      console.log("[usePageRefresh] ✓ Page refresh detected, redirecting to", homePath);
      navigate(homePath, { replace: true });
    } else {
      console.log("[usePageRefresh] ✗ No refresh detected or already on home page");
    }
  }, [navigate, location.pathname, homePath]);
};

export default usePageRefresh;
