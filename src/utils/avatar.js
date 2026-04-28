/**
 * Get the user's avatar image URL from various sources.
 * Priority: localStorage keys > session user object > fallback
 * @param {Object} user - User object from session/context (optional)
 * @returns {string} Avatar URL or empty string if not found
 */
export function getStoredUserAvatar(user = null) {
  try {
    if (typeof window === "undefined") return "";

    // Check localStorage keys directly
    const directImage =
      localStorage.getItem("profileImage") ||
      localStorage.getItem("avatar") ||
      localStorage.getItem("avatarUrl") ||
      localStorage.getItem("photoURL");

    if (directImage) return directImage;

    // Parse stored user objects from localStorage
    const rawUser =
      localStorage.getItem("currentUser") ||
      localStorage.getItem("authUser") ||
      localStorage.getItem("loggedInUser") ||
      localStorage.getItem("user") ||
      localStorage.getItem("teamup_current_user") ||
      localStorage.getItem("teamup_user");

    const storedUser = rawUser ? JSON.parse(rawUser) : null;

    // Check stored user object for avatar fields
    const storedAvatar =
      storedUser?.developerProfile?.image ||
      storedUser?.profileImage ||
      storedUser?.profile?.image ||
      storedUser?.avatar ||
      storedUser?.avatarUrl ||
      storedUser?.image ||
      storedUser?.photoURL ||
      storedUser?.photo;

    if (storedAvatar) return storedAvatar;

    // Fallback to passed user object
    const userAvatar =
      user?.developerProfile?.image ||
      user?.profileImage ||
      user?.profile?.image ||
      user?.avatar ||
      user?.avatarUrl ||
      user?.image ||
      user?.photoURL ||
      user?.photo;

    return userAvatar || "";
  } catch {
    // Fallback to passed user object on error
    return (
      user?.developerProfile?.image ||
      user?.profileImage ||
      user?.profile?.image ||
      user?.avatar ||
      user?.avatarUrl ||
      user?.image ||
      user?.photoURL ||
      user?.photo ||
      ""
    );
  }
}

/**
 * Get user initials from name
 * @param {string} name - User name
 * @returns {string} Initials (1-2 characters)
 */
export function getUserInitials(name = "") {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
