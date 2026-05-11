const ACCESS_TOKEN_KEY = "teamup_access_token";
const REFRESH_TOKEN_KEY = "teamup_refresh_token";

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
