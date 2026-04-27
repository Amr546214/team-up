// Job type definition for TypeScript-like clarity
/**
 * @typedef {Object} JobRequirements
 * @property {number} team_size
 * @property {string[]} skills
 * @property {number} budget
 * @property {string} priority
 */

/**
 * @typedef {Object} Job
 * @property {number|string} id
 * @property {string} title
 * @property {string} location
 * @property {string} jobType
 * @property {string} salary
 * @property {number} applications
 * @property {string} applicationsLabel
 * @property {string} status
 * @property {string} posted
 * @property {boolean} [isNew]
 * @property {string} [description]
 * @property {string} [duration]
 * @property {string[]} [skills]
 * @property {number} [team_size]
 * @property {string} [priority]
 * @property {JobRequirements} [requirements]
 */

// Start with empty jobs array - no default/fake jobs
export const initialJobs = [];

export function getInitialJobs() {
  return [...initialJobs];
}

// ============================================
// FAKE AUTH & QUIZ API
// LocalStorage-based API for development until backend is ready.
// teamup_users   → array of user objects
// teamup_current_user → the logged-in user (single object)
// ============================================

const USERS_KEY = "teamup_users";
const CURRENT_USER_KEY = "teamup_current_user";

// ---- Internal helpers ----

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v !== null && v !== undefined ? v : fallback;
  } catch {
    return fallback;
  }
}

function generateId() {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function withoutPassword(user) {
  if (!user) return null;
  const copy = { ...user };
  delete copy.password;
  return copy;
}

// ============================================
// CORE STORAGE HELPERS (exported)
// ============================================

/**
 * Read the full users array from localStorage.
 * Always returns an array.
 */
export function getUsers() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(USERS_KEY);
  const parsed = safeParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

/**
 * Persist the users array to localStorage.
 * @param {Array} users
 */
export function saveUsers(users) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/**
 * Get the currently logged-in user (from teamup_current_user).
 * @returns {Object|null}
 */
export function getCurrentUser() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(CURRENT_USER_KEY);
  return safeParse(raw, null);
}

// ============================================
// AUTH API
// ============================================

/**
 * Register a new user.
 *  - Reads the existing users array from localStorage.
 *  - Rejects if email already exists (any role).
 *  - Pushes new user, saves array, sets teamup_current_user.
 *
 * @param {Object} userData - { name, email, password, role, profile? }
 * @returns {{ success: boolean, data?: Object, message?: string }}
 */
export function registerUser(userData) {
  const users = getUsers();
  const normalizedEmail = normalizeEmail(userData.email);

  // Email must be unique across ALL users
  const existing = users.find((u) => normalizeEmail(u.email) === normalizedEmail);
  if (existing) {
    return { success: false, message: "Email already exists" };
  }

  const newUser = {
    id: generateId(),
    name: userData.name || userData.fullName || userData.companyName || "",
    email: normalizedEmail,
    password: userData.password,
    role: userData.role,
    createdAt: new Date().toISOString(),
    profile: userData.profile || {},
    quiz: {
      score: 0,
      rank: "Unranked",
      completedAt: null,
    },
    // Only developers get a developerProfile
    ...(userData.role === "developer" && {
      developerProfile: {
        image: null,
        experience: "",
        skills: [],
        track: "",
        portfolio: "",
        rank: "Unranked",
        completedAt: null,
      },
    }),
  };

  users.push(newUser);
  saveUsers(users);

  // Auto-login
  const safe = withoutPassword(newUser);
  setCurrentUser(safe);

  // Create welcome notification
  addNotification(safe.id, {
    title: "Welcome to TeamUp!",
    message: `Your ${userData.role} account has been created successfully. Get started by exploring your dashboard.`,
    type: "auth",
  });

  return { success: true, data: safe };
}

/**
 * Log in an existing user.
 *  - Finds user by email + password match.
 *  - Does NOT create a new user.
 *  - Does NOT overwrite the users array.
 *
 * @param {string} email
 * @param {string} password
 * @returns {{ success: boolean, data?: Object, message?: string, requiresQuiz?: boolean, userId?: string }}
 */
export function loginUser(email, password) {
  const users = getUsers();
  const normalizedEmail = normalizeEmail(email);

  const user = users.find(
    (u) => normalizeEmail(u.email) === normalizedEmail && u.password === password
  );

  if (!user) {
    return { success: false, message: "Invalid email or password" };
  }

  // Developers must complete the skill quiz first
  if (user.role === "developer" && !user.quiz?.completedAt) {
    return {
      success: false,
      message: "Please complete the skill quiz before logging in.",
      requiresQuiz: true,
      userId: user.id,
    };
  }

  const safe = withoutPassword(user);
  setCurrentUser(safe);

  // Create login notification
  addNotification(safe.id, {
    title: "Login successful",
    message: `Welcome back, ${safe.name}! You are now logged in as ${user.role}.`,
    type: "auth",
  });

  // Developers must also complete their profile
  if (user.role === "developer" && !user.developerProfile?.completedAt) {
    return {
      success: true,
      data: safe,
      requiresProfile: true,
    };
  }

  return { success: true, data: safe };
}

/**
 * Log out the current user.
 * Removes only teamup_current_user; teamup_users stays intact.
 * @returns {{ success: boolean }}
 */
export function logoutUser() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(CURRENT_USER_KEY);
  }
  return { success: true };
}

// ============================================
// USER HELPERS
// ============================================

/**
 * Persist a user object as the current session.
 * @param {Object|null} user
 */
export function setCurrentUser(user) {
  if (typeof window === "undefined") return;
  if (user) {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(CURRENT_USER_KEY);
  }
}

/**
 * Check if a user session exists.
 * @returns {boolean}
 */
export function isAuthenticated() {
  const user = getCurrentUser();
  return Boolean(user?.id && user?.email && user?.role);
}

/**
 * Get a user by ID (password excluded).
 * @param {string} userId
 * @returns {Object|null}
 */
export function getUserById(userId) {
  const users = getUsers();
  const user = users.find((u) => u.id === userId);
  return withoutPassword(user);
}

/**
 * Find a user by email (password excluded).
 * @param {string} email
 * @returns {Object|null}
 */
export function findUserByEmail(email) {
  const users = getUsers();
  const normalizedEmail = normalizeEmail(email);
  const user = users.find((u) => normalizeEmail(u.email) === normalizedEmail);
  return withoutPassword(user);
}

/**
 * Find user by email and role (password excluded).
 * Kept for backward compatibility.
 * @param {string} email
 * @param {string} role
 * @returns {Object|null}
 */
export function findUserByEmailAndRole(email, role) {
  const users = getUsers();
  const normalizedEmail = normalizeEmail(email);
  const user = users.find(
    (u) => normalizeEmail(u.email) === normalizedEmail && u.role === role
  );
  return withoutPassword(user);
}

/**
 * Update a user's profile data.
 * @param {string} userId
 * @param {Object} profileData
 * @returns {{ success: boolean, data?: Object, message?: string }}
 */
export function updateUserProfile(userId, profileData) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);

  if (idx === -1) {
    return { success: false, message: "User not found." };
  }

  users[idx] = {
    ...users[idx],
    profile: { ...users[idx].profile, ...profileData },
  };
  saveUsers(users);

  // Keep teamup_current_user in sync
  const current = getCurrentUser();
  if (current?.id === userId) {
    setCurrentUser(withoutPassword(users[idx]));
  }

  return { success: true, data: withoutPassword(users[idx]) };
}

// ============================================
// CHANGE PASSWORD API
// ============================================

/**
 * Change a user's password.
 *  - Verifies current password matches.
 *  - Updates the password in the users array.
 *  - teamup_current_user stays password-free (no sync needed for password).
 *
 * @param {string} userId
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {{ success: boolean, message?: string }}
 */
export function changePassword(userId, currentPassword, newPassword) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);

  if (idx === -1) {
    return { success: false, message: "User not found." };
  }

  if (users[idx].password !== currentPassword) {
    return { success: false, message: "Current password is incorrect." };
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, message: "New password must be at least 6 characters." };
  }

  users[idx].password = newPassword;
  saveUsers(users);

  // Create password change notification
  addNotification(userId, {
    title: "Password updated",
    message: "Your password has been changed successfully. If you did not make this change, please contact support immediately.",
    type: "password",
  });

  return { success: true, message: "Password changed successfully." };
}

// ============================================
// DEVELOPER PROFILE API
// ============================================

/**
 * Save / update a developer's profile after quiz completion.
 *  - Finds the user in teamup_users by id.
 *  - Merges profileData into user.developerProfile.
 *  - Sets rank from user.quiz.rank (not user-editable).
 *  - Sets completedAt to now.
 *  - Syncs teamup_current_user.
 *
 * @param {string} userId
 * @param {Object} profileData - { image?, experience, skills, track, portfolio }
 * @returns {{ success: boolean, data?: Object, message?: string }}
 */
export function saveDeveloperProfile(userId, profileData) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);

  if (idx === -1) {
    return { success: false, message: "User not found." };
  }

  const user = users[idx];

  if (user.role !== "developer") {
    return { success: false, message: "User is not a developer." };
  }

  // Normalize skills: accept comma-separated string or array
  let skills = profileData.skills || [];
  if (typeof skills === "string") {
    skills = skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  users[idx].developerProfile = {
    image: profileData.image ?? user.developerProfile?.image ?? null,
    experience: profileData.experience || "",
    skills,
    track: profileData.track || "",
    portfolio: profileData.portfolio || "",
    rank: user.quiz?.rank || "Unranked",
    completedAt: new Date().toISOString(),
  };

  saveUsers(users);

  const current = getCurrentUser();
  if (current?.id === userId) {
    setCurrentUser(withoutPassword(users[idx]));
  }

  // Create profile completion notification
  addNotification(userId, {
    title: "Profile completed!",
    message: `Your developer profile has been successfully completed. You are now ranked as ${user.quiz?.rank || "Unranked"} and ready to start receiving project opportunities.`,
    type: "profile",
  });

  return { success: true, data: withoutPassword(users[idx]) };
}

// ============================================
// QUIZ API
// ============================================

/**
 * Save quiz result for a user.
 *  - Finds user in teamup_users by id.
 *  - Updates that user's quiz object.
 *  - Saves array back and syncs teamup_current_user.
 *
 * @param {string} userId
 * @param {number} score
 * @param {string} rank
 * @returns {{ success: boolean, data?: Object, message?: string }}
 */
export function saveQuizResult(userId, score, rank) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);

  if (idx === -1) {
    return { success: false, message: "User not found." };
  }

  users[idx].quiz = {
    score: score ?? 0,
    rank: rank || "Unranked",
    completedAt: new Date().toISOString(),
  };

  saveUsers(users);

  const current = getCurrentUser();
  if (current?.id === userId) {
    setCurrentUser(withoutPassword(users[idx]));
  }

  // Create quiz completion notification
  addNotification(userId, {
    title: "Quiz completed!",
    message: `You have completed the skill quiz with a score of ${score ?? 0}. You have been ranked as ${rank || "Unranked"}. Complete your profile to start receiving project opportunities.`,
    type: "quiz",
  });

  return { success: true, data: withoutPassword(users[idx]) };
}

/**
 * Get quiz result for a user.
 * @param {string} userId
 * @returns {{ success: boolean, data?: Object, message?: string }}
 */
export function getQuizResult(userId) {
  const user = getUserById(userId);
  if (!user) {
    return { success: false, message: "User not found." };
  }
  return {
    success: true,
    data: user.quiz || { score: 0, rank: "Unranked", completedAt: null },
  };
}

/**
 * Check if a developer has completed the required quiz.
 * @param {string} userId
 * @returns {boolean}
 */
export function hasCompletedQuiz(userId) {
  const user = getUserById(userId);
  return user?.role === "developer" && Boolean(user?.quiz?.completedAt);
}

/**
 * Mark a developer's quiz as completed by email.
 * @param {string} email
 * @returns {{ success: boolean, message?: string }}
 */
export function markSkillQuizCompletedByEmail(email) {
  const users = getUsers();
  const normalizedEmail = normalizeEmail(email);
  const idx = users.findIndex(
    (u) => normalizeEmail(u.email) === normalizedEmail && u.role === "developer"
  );

  if (idx === -1) {
    return { success: false, message: "Developer account not found." };
  }

  if (!users[idx].quiz?.completedAt) {
    users[idx].quiz = {
      ...users[idx].quiz,
      completedAt: new Date().toISOString(),
    };
    saveUsers(users);
  }

  return { success: true };
}

// ============================================
// BACKEND-READY ASYNC WRAPPERS
// Replace localStorage logic with fetch/axios when the real API is ready.
// ============================================

export async function apiRegister(userData) {
  await new Promise((r) => setTimeout(r, 300));
  return registerUser(userData);
}

export async function apiLogin(email, password) {
  await new Promise((r) => setTimeout(r, 300));
  return loginUser(email, password);
}

export async function apiLogout() {
  await new Promise((r) => setTimeout(r, 200));
  return logoutUser();
}

export async function apiGetCurrentUser() {
  await new Promise((r) => setTimeout(r, 100));
  const user = getCurrentUser();
  return user
    ? { success: true, data: user }
    : { success: false, message: "Not authenticated" };
}

export async function apiUpdateProfile(userId, profileData) {
  await new Promise((r) => setTimeout(r, 300));
  return updateUserProfile(userId, profileData);
}

export async function apiSaveQuizResult(userId, score, rank) {
  await new Promise((r) => setTimeout(r, 300));
  return saveQuizResult(userId, score, rank);
}

export async function apiGetQuizResult(userId) {
  await new Promise((r) => setTimeout(r, 100));
  return getQuizResult(userId);
}

export async function apiSaveDeveloperProfile(userId, profileData) {
  await new Promise((r) => setTimeout(r, 300));
  return saveDeveloperProfile(userId, profileData);
}

// ============================================
// NOTIFICATIONS API
// ============================================

const NOTIFICATIONS_KEY = "teamup_notifications";

function getNotificationsFromStorage() {
  try {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveNotificationsToStorage(notifications) {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new Event("teamup_notifications_updated"));
}

/**
 * Get all notifications for a user
 * @param {string} userId
 * @returns {Array} Array of notification objects
 */
export function getNotifications(userId) {
  if (!userId) return [];
  const notifications = getNotificationsFromStorage();
  return notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Get unread notification count for a user
 * @param {string} userId
 * @returns {number}
 */
export function getUnreadNotificationCount(userId) {
  if (!userId) return 0;
  const notifications = getNotificationsFromStorage();
  return notifications.filter((n) => n.userId === userId && !n.isRead).length;
}

/**
 * Add a new notification for a user
 * @param {string} userId
 * @param {Object} notificationData
 * @returns {Object} The created notification
 */
export function addNotification(userId, notificationData) {
  if (!userId) return null;

  const notifications = getNotificationsFromStorage();

  const newNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    isRead: false,
    createdAt: new Date().toISOString(),
    ...notificationData,
  };

  notifications.push(newNotification);
  saveNotificationsToStorage(notifications);

  return newNotification;
}

/**
 * Mark a specific notification as read
 * @param {string} userId
 * @param {string} notificationId
 * @returns {boolean}
 */
export function markNotificationAsRead(userId, notificationId) {
  if (!userId || !notificationId) return false;

  const notifications = getNotificationsFromStorage();
  const idx = notifications.findIndex(
    (n) => n.id === notificationId && n.userId === userId
  );

  if (idx === -1) return false;

  notifications[idx].isRead = true;
  saveNotificationsToStorage(notifications);

  return true;
}

/**
 * Mark all notifications as read for a user
 * @param {string} userId
 * @returns {boolean}
 */
export function markAllNotificationsAsRead(userId) {
  if (!userId) return false;

  const notifications = getNotificationsFromStorage();
  let updated = false;

  notifications.forEach((n) => {
    if (n.userId === userId && !n.isRead) {
      n.isRead = true;
      updated = true;
    }
  });

  if (updated) {
    saveNotificationsToStorage(notifications);
  }

  return updated;
}

/**
 * Clear all notifications for a user
 * @param {string} userId
 * @returns {boolean}
 */
export function clearNotifications(userId) {
  if (!userId) return false;

  const notifications = getNotificationsFromStorage();
  const filtered = notifications.filter((n) => n.userId !== userId);

  saveNotificationsToStorage(filtered);

  return true;
}

/**
 * Delete a specific notification
 * @param {string} userId
 * @param {string} notificationId
 * @returns {boolean}
 */
export function deleteNotification(userId, notificationId) {
  if (!userId || !notificationId) return false;

  const notifications = getNotificationsFromStorage();
  const filtered = notifications.filter(
    (n) => !(n.id === notificationId && n.userId === userId)
  );

  saveNotificationsToStorage(filtered);

  return filtered.length < notifications.length;
}

// ============================================
// LEGACY COMPATIBILITY
// ============================================

export {
  getCurrentUser as getFakeApiSession,
  setCurrentUser as setFakeApiSession,
  logoutUser as clearFakeApiSession,
  findUserByEmailAndRole as findFakeApiAccountByEmailAndRole,
  registerUser as saveFakeApiAccount,
  markSkillQuizCompletedByEmail as markFakeApiSkillQuizCompleted,
};