import { useEffect, useRef, useCallback } from 'react';
import {
  User,
  Pin,
  PinOff,
  Bell,
  BellOff,
  Mail,
  Trash2,
  MessageSquareOff,
  Flag,
  Settings,
  UserPlus,
  Users,
} from 'lucide-react';

interface ChatHeaderMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isPinned: boolean;
  isMuted: boolean;
  isDirectConversation?: boolean;
  isUserReported?: boolean;
  isGroupConversation?: boolean;
  onPinToggle: () => void;
  onMuteToggle: () => void;
  onViewProfile: () => void;
  onMarkUnread: () => void;
  onClearChat: () => void;
  onDeleteChat: () => void;
  onReportUser?: () => void;
  onGroupSettings?: () => void;
  onAddUsers?: () => void;
  onViewMembers?: () => void;
}

export function ChatHeaderMenu({
  isOpen,
  onClose,
  isPinned,
  isMuted,
  isDirectConversation = false,
  isUserReported = false,
  isGroupConversation = false,
  onPinToggle,
  onMuteToggle,
  onViewProfile,
  onMarkUnread,
  onClearChat,
  onDeleteChat,
  onReportUser,
  onGroupSettings,
  onAddUsers,
  onViewMembers,
}: ChatHeaderMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle click outside
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      onClose();
    }
  }, [onClose]);

  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClickOutside, handleKeyDown]);

  if (!isOpen) return null;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
      role="menu"
    >
      {/* View Profile */}
      <button
        onClick={() => handleAction(onViewProfile)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        role="menuitem"
      >
        <User className="w-4 h-4 text-gray-500" />
        View profile
      </button>

      {/* Group Options - only for group conversations */}
      {isGroupConversation && (
        <>
          <button
            onClick={() => onGroupSettings && handleAction(onGroupSettings)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            role="menuitem"
          >
            <Settings className="w-4 h-4 text-gray-500" />
            Group Settings
          </button>
          <button
            onClick={() => onAddUsers && handleAction(onAddUsers)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            role="menuitem"
          >
            <UserPlus className="w-4 h-4 text-gray-500" />
            Add Users
          </button>
          <button
            onClick={() => onViewMembers && handleAction(onViewMembers)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            role="menuitem"
          >
            <Users className="w-4 h-4 text-gray-500" />
            View Members
          </button>
        </>
      )}

      {/* Pin / Unpin */}
      <button
        onClick={() => handleAction(onPinToggle)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        role="menuitem"
      >
        {isPinned ? (
          <>
            <PinOff className="w-4 h-4 text-gray-500" />
            Unpin chat
          </>
        ) : (
          <>
            <Pin className="w-4 h-4 text-gray-500" />
            Pin chat
          </>
        )}
      </button>

      {/* Mute / Unmute */}
      <button
        onClick={() => handleAction(onMuteToggle)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        role="menuitem"
      >
        {isMuted ? (
          <>
            <Bell className="w-4 h-4 text-gray-500" />
            Unmute notifications
          </>
        ) : (
          <>
            <BellOff className="w-4 h-4 text-gray-500" />
            Mute notifications
          </>
        )}
      </button>

      <div className="my-1 border-t border-gray-100" />

      {/* Mark as unread */}
      <button
        onClick={() => handleAction(onMarkUnread)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        role="menuitem"
      >
        <Mail className="w-4 h-4 text-gray-500" />
        Mark as unread
      </button>

      {/* Clear chat */}
      <button
        onClick={() => handleAction(onClearChat)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        role="menuitem"
      >
        <MessageSquareOff className="w-4 h-4 text-gray-500" />
        Clear chat
      </button>

      {/* Report user - only for direct conversations */}
      {isDirectConversation && (
        isUserReported ? (
          <span
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 cursor-default"
            role="menuitem"
          >
            <Flag className="w-4 h-4" />
            User reported
          </span>
        ) : (
          <button
            onClick={() => onReportUser && handleAction(onReportUser)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            role="menuitem"
          >
            <Flag className="w-4 h-4 text-orange-500" />
            Report user
          </button>
        )
      )}

      <div className="my-1 border-t border-gray-100" />

      {/* Delete chat */}
      <button
        onClick={() => handleAction(onDeleteChat)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
        role="menuitem"
      >
        <Trash2 className="w-4 h-4 text-red-500" />
        Delete chat
      </button>
    </div>
  );
}
