/**
 * Environment Detection Utilities
 *
 * Centralized helpers for detecting runtime environment.
 * Prevents localhost from being treated as production.
 */

/**
 * Check if running on localhost or 127.0.0.1
 */
export const isLocalhost = () => {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
};

/**
 * Check if running on local development (Vite dev server)
 */
export const isLocalDev = () => {
  return import.meta.env.DEV || isLocalhost();
};

/**
 * Check if running on Vercel production
 */
export const isVercelProduction = () => {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  return (
    hostname.includes("vercel.app") &&
    !isLocalhost() &&
    import.meta.env.PROD
  );
};

/**
 * Check if deployment page should be shown
 * Only on production (not localhost) when explicitly enabled
 */
export const shouldShowDeploymentPage = () => {
  // Never show deployment page on localhost
  if (isLocalhost()) return false;

  // Only show if explicitly enabled via env var
  return import.meta.env.VITE_SHOW_DEPLOYMENT_PAGE === "true";
};

/**
 * Get safe redirect origin for OAuth
 * Always use current window.location.origin
 */
export const getSafeRedirectOrigin = () => {
  if (typeof window === "undefined") return "";
  return window.location.origin;
};
