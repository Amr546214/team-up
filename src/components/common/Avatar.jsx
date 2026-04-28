import { getStoredUserAvatar, getUserInitials } from "../../utils/avatar";

/**
 * Reusable Avatar Component
 * Displays user avatar image from localStorage/session with fallback to initials
 *
 * @param {Object} props
 * @param {Object} props.user - User object (optional, will be checked for avatar fields)
 * @param {string} props.src - Direct image URL (optional, overrides user avatar)
 * @param {string} props.alt - Alt text for image
 * @param {string} props.size - Size variant: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.fallbackClassName - CSS classes for fallback container
 */
function Avatar({
  user = null,
  src = null,
  alt = "User avatar",
  size = "md",
  className = "",
  fallbackClassName = "",
}) {
  // Get avatar URL from various sources
  const avatarSrc = src || getStoredUserAvatar(user);

  // Get user name for initials fallback
  const userName = user?.name || user?.fullName || user?.displayName || user?.username || "";
  const initials = getUserInitials(userName);

  // Size classes
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-24 w-24",
  };

  const baseClasses =
    "rounded-full object-cover overflow-hidden shrink-0";
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  if (avatarSrc) {
    return (
      <img
        src={avatarSrc}
        alt={alt}
        className={`${baseClasses} ${sizeClass} ${className}`}
        onError={(e) => {
          // On image error, hide the broken image and show fallback
          e.target.style.display = "none";
          e.target.nextSibling.style.display = "flex";
        }}
      />
    );
  }

  // Fallback to initials
  return (
    <div
      className={`${sizeClass} ${baseClasses} flex items-center justify-center bg-gray-200 text-gray-600 font-semibold ${fallbackClassName}`}
    >
      {initials}
    </div>
  );
}

export default Avatar;
