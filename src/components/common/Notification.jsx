import NotificationsDropdown from "../../features/notifications/components/NotificationsDropdown";

/**
 * Notification wrapper for Header integration.
 * Delegates to the feature-level NotificationsDropdown component.
 */
function Notification() {
  return <NotificationsDropdown />;
}

export default Notification;
