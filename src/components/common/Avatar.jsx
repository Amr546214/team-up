import { useState } from "react";
import { getStoredUserAvatar, getUserInitials } from "../../utils/avatar";

/**
 * Reusable Avatar Component
 * Displays user avatar image from localStorage/session with fallback to initials
 *
 * @param {Object} props
 * @param {Object|null} [props.user] - User object (optional, will be checked for avatar fields)
 * @param {string|null} props.src - Direct image URL (optional, overrides user avatar)
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
  const [imageError, setImageError] = useState(false);

  // Get avatar URL from various sources
  const avatarSrc = src || getStoredUserAvatar(user);

  // Get user name for initials fallback
  const userName = user?.name || user?.fullName || user?.displayName || user?.username || "";
  const initials = getUserInitials(userName) || userName.charAt(0).toUpperCase();

  // Size classes
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-24 w-24 text-2xl",
  };

  const baseClasses = "rounded-full object-cover overflow-hidden shrink-0";
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  // Show initials fallback if no src or image failed to load
  if (!avatarSrc || imageError) {
    return (
      <div
        className={`${sizeClass} ${baseClasses} flex items-center justify-center bg-gray-200 text-gray-600 font-semibold ${fallbackClassName}`}
        title={alt}
      >
        {initials}
      </div>
    );
  }

  // Render image with error handler
  return (
    <img
      src={avatarSrc}
      alt={alt}
      className={`${baseClasses} ${sizeClass} ${className}`}
      onError={() => {
        setImageError(true);
      }}
    />
  );
}

export default Avatar;
