export const BASE_URL = "https://team-up-backend-production-6c43.up.railway.app";

/**
 * Reusable API request function
 * @param {string} path - API endpoint path (e.g., "/auth/login")
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<any>} Parsed JSON response
 * @throws {object} Normalized error object { status, message, data }
 */
export async function apiRequest(path, options = {}) {
  const url = `${BASE_URL}${path}`;

  // Default headers
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  // Merge headers
  const headers = {
    ...defaultHeaders,
    ...options.headers,
  };

  // Prepare fetch options
  const fetchOptions = {
    ...options,
    headers,
  };

  // Stringify body if it's an object
  if (fetchOptions.body && typeof fetchOptions.body === "object") {
    fetchOptions.body = JSON.stringify(fetchOptions.body);
  }

  try {
    const response = await fetch(url, fetchOptions);

    // Parse JSON response safely
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // If response is not ok, throw normalized error
    if (!response.ok) {
      throw {
        status: response.status,
        message: data?.message || data?.error || response.statusText || "Request failed",
        data: data,
      };
    }

    // Return parsed JSON on success
    return data;
  } catch (error) {
    // If it's already our normalized error, rethrow it
    if (error.status !== undefined) {
      throw error;
    }

    // Network or other errors - normalize them
    throw {
      status: 0,
      message: error.message || "Network error",
      data: null,
    };
  }
}
