const ACCESS_TOKEN_KEY = "teamup_access_token";
const REFRESH_TOKEN_KEY = "teamup_refresh_token";
const USER_ROLE_KEY = "teamup_user_role";
const USER_PROFILE_KEY = "teamup_user_profile";

/**
 * Save access and refresh tokens to localStorage
 * @param {object} credentials - Object containing access_token and refresh_token
 */
export function saveTokens(credentials) {
  if (credentials?.access_token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, credentials.access_token);
  }
  if (credentials?.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, credentials.refresh_token);
  }
}

/**
 * Get the stored access token
 * @returns {string|null} Access token or null if not found
 */
export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Get the stored refresh token
 * @returns {string|null} Refresh token or null if not found
 */
export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Clear both tokens from localStorage
 */
export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Save user role to localStorage
 * @param {string} role - User role (client, developer, company, admin)
 */
export function saveUserRole(role) {
  if (role) {
    localStorage.setItem(USER_ROLE_KEY, role);
  }
}

/**
 * Get the stored user role
 * @returns {string|null} User role or null if not found
 */
export function getUserRole() {
  return localStorage.getItem(USER_ROLE_KEY);
}

/**
 * Clear all auth data from localStorage (tokens + role + profile)
 */
export function clearAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
  localStorage.removeItem(USER_PROFILE_KEY);
}

/**
 * Save user profile to localStorage
 * @param {object} profile - User profile object { email, role, name, avatarUrl }
 */
export function saveUserProfile(profile) {
  if (profile && typeof window !== "undefined") {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  }
}

/**
 * Get user profile from localStorage
 * @returns {object|null} User profile object or null if not found
 */
export function getUserProfile() {
  if (typeof window === "undefined") return null;
  const profile = localStorage.getItem(USER_PROFILE_KEY);
  if (!profile) return null;
  try {
    return JSON.parse(profile);
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated via backend token
 * @returns {boolean} True if access token exists
 */
export function isAuthenticatedWithBackend() {
  return !!localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Dispatch custom event to notify components of auth state change
 * Use this after login/logout to trigger UI updates
 */
export function dispatchAuthChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("teamup-auth-changed"));
  }
}

/**
 * Get dashboard path based on user role
 * Single source of truth for role-based navigation
 * @param {string} role - User role (client, developer, company, admin)
 * @returns {string} Dashboard path for the role
 */
export function getDashboardPath(role) {
  switch (role) {
    case "client":
      return "/client/profile";
    case "developer":
      return "/developer/dashboard";
    case "company":
      return "/company/profile";
    case "admin":
      return "/admin/dashboard";
    case "team-leader":
      return "/team-leader/dashboard";
    default:
      return "/login";
  }
}
