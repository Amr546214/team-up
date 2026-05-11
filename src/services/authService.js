import { apiRequest } from "../lib/api.js";
import { saveTokens } from "../utils/authStorage.js";

/**
 * Login with email and password
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<any>} API response
 */
export async function login({ email, password }) {
  const response = await apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
  });

  // Save tokens if credentials exist in response
  if (response?.data?.credentials) {
    saveTokens(response.data.credentials);
  }

  return response;
}

/**
 * Request forgot password email
 * @param {object} params
 * @param {string} params.email
 * @returns {Promise<any>} API response
 */
export async function forgotPassword({ email }) {
  return await apiRequest("/auth/send-forgot-password", {
    method: "PATCH",
    body: { email },
  });
}

/**
 * Signup as a client
 * @param {object} params
 * @param {string} params.fullName
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.confirmPassword
 * @param {string[]} [params.servicesWanted]
 * @returns {Promise<any>} API response
 */
export async function signupClient({
  fullName,
  email,
  password,
  confirmPassword,
  servicesWanted,
}) {
  const body = {
    role: "client",
    fullName,
    email,
    password,
    confirmPassword,
  };

  // Only add servicesWanted if provided
  if (servicesWanted !== undefined) {
    body.servicesWanted = servicesWanted;
  }

  return await apiRequest("/auth/signup", {
    method: "POST",
    body,
  });
}

/**
 * Signup as a developer
 * @param {object} params
 * @param {string} params.fullName
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.confirmPassword
 * @param {string[]} params.skills
 * @returns {Promise<any>} API response
 */
export async function signupDeveloper({
  fullName,
  email,
  password,
  confirmPassword,
  skills,
}) {
  return await apiRequest("/auth/signup", {
    method: "POST",
    body: {
      role: "developer",
      fullName,
      email,
      password,
      confirmPassword,
      skills,
    },
  });
}

/**
 * Signup as a company
 * @param {object} params
 * @param {string} params.companyName
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.confirmPassword
 * @param {string} params.companySize
 * @param {string} params.industry
 * @returns {Promise<any>} API response
 */
export async function signupCompany({
  companyName,
  email,
  password,
  confirmPassword,
  companySize,
  industry,
}) {
  return await apiRequest("/auth/signup", {
    method: "POST",
    body: {
      role: "company",
      email,
      password,
      confirmPassword,
      companyName,
      companySize,
      industry,
    },
  });
}

/**
 * Signup as an admin
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.adminCode
 * @returns {Promise<any>} API response
 */
export async function signupAdmin({ email, password, adminCode }) {
  return await apiRequest("/auth/signup", {
    method: "POST",
    body: {
      role: "admin",
      email,
      password,
      adminCode,
    },
  });
}

/**
 * Login with Google
 * @param {object} params
 * @param {string} params.idToken
 * @returns {Promise<any>} API response
 */
export async function googleLogin({ idToken }) {
  const response = await apiRequest("/auth/login/gmail", {
    method: "POST",
    body: { idToken },
  });

  // Save tokens if credentials exist in response
  if (response?.data?.credentials) {
    saveTokens(response.data.credentials);
  }

  return response;
}

/**
 * Signup with Google
 * @param {object} params
 * @param {string} params.idToken
 * @returns {Promise<any>} API response
 */
export async function googleSignup({ idToken }) {
  return await apiRequest("/auth/signup/gmail", {
    method: "POST",
    body: { idToken },
  });
}
