/**
 * Debug Logging Utility
 *
 * Centralized debug logging with environment-based enabling.
 * Use this instead of raw console.log() for development-only logs.
 *
 * Enable debug logs: VITE_DEBUG_LOGS=true npm run dev
 *
 * @module utils/debug
 */

const DEBUG = import.meta.env.DEV && import.meta.env.VITE_DEBUG_LOGS === "true";

/**
 * Log debug message (only in dev with VITE_DEBUG_LOGS=true)
 */
export function debugLog(...args) {
  if (DEBUG) console.log(...args);
}

/**
 * Log debug warning (only in dev with VITE_DEBUG_LOGS=true)
 */
export function debugWarn(...args) {
  if (DEBUG) console.warn(...args);
}

/**
 * Log debug error (always shown - use sparingly for actual errors)
 */
export function debugError(...args) {
  console.error(...args);
}

/**
 * Group debug logs (only in dev with VITE_DEBUG_LOGS=true)
 */
export function debugGroup(label) {
  if (DEBUG) console.group(label);
}

/**
 * End debug group (only in dev with VITE_DEBUG_LOGS=true)
 */
export function debugGroupEnd() {
  if (DEBUG) console.groupEnd();
}

/**
 * Time a debug operation (only in dev with VITE_DEBUG_LOGS=true)
 */
export function debugTime(label) {
  if (DEBUG) console.time(label);
}

/**
 * End timing a debug operation (only in dev with VITE_DEBUG_LOGS=true)
 */
export function debugTimeEnd(label) {
  if (DEBUG) console.timeEnd(label);
}
