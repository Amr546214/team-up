import { useEffect, useCallback } from 'react';
import { Phone, Video, User, Users, X, Settings } from 'lucide-react';
import type { Conversation, ChatUser } from '../types';
import { getOtherParticipant } from '../utils/chatHelpers';

interface ChatUserPopoverProps {
  conversation: Conversation;
  currentUser: ChatUser;
  isOpen: boolean;
  onClose: () => void;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  onViewProfile?: () => void;
  onGroupSettings?: () => void;
  isUserOnline?: (userId: string) => boolean;
}

export function ChatUserPopover({
  conversation,
  currentUser,
  isOpen,
  onClose,
  onVoiceCall,
  onVideoCall,
  onViewProfile,
  onGroupSettings,
  isUserOnline,
}: ChatUserPopoverProps) {
  const isGroup = conversation.type === 'group';
  const otherUser = getOtherParticipant(conversation, currentUser?.id);
  
  // Get real-time online status from presence
  const otherUserId = otherUser?.id;
  const isOtherUserOnline = !isGroup && otherUserId && isUserOnline ? isUserOnline(otherUserId) : false;

  // Handle Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="relative w-full max-w-[320px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
        aria-label="Close popover"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header with avatar and name */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-4">
          {/* Large Avatar */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-xl shadow-md ${
            isGroup
              ? 'bg-linear-to-br from-indigo-400 to-indigo-500'
              : 'bg-linear-to-br from-teal-400 to-teal-500'
          }`}>
            {isGroup
              ? (conversation.avatar
                  ? <img src={conversation.avatar} alt={conversation.name} className="w-full h-full rounded-full object-cover" />
                  : conversation.name?.charAt(0).toUpperCase()
                )
              : (otherUser?.avatar
                  ? <img src={otherUser.avatar} alt={otherUser.name} className="w-full h-full rounded-full object-cover" />
                  : otherUser?.name.charAt(0).toUpperCase()
                )
            }
          </div>

          {/* Name and status */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate text-lg">
              {isGroup ? conversation.name : otherUser?.name}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {isGroup
                ? `${conversation.membersCount || conversation.participants.length} members`
                : otherUser?.role
              }
            </p>
            {!isGroup && otherUserId && (
              <p className="text-xs text-gray-400 mt-0.5 capitalize flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${
                  isOtherUserOnline ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                {isOtherUserOnline ? 'online' : 'offline'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-2">
          {/* Voice Call */}
          <button
            onClick={() => {
              onVoiceCall?.();
              onClose();
            }}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
            aria-label="Voice call"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isGroup ? 'bg-gray-100 text-gray-400' : 'bg-teal-50 text-teal-600'
            }`}>
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-gray-700">Call</span>
          </button>

          {/* Video Call */}
          <button
            onClick={() => {
              onVideoCall?.();
              onClose();
            }}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
            aria-label="Video call"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isGroup ? 'bg-gray-100 text-gray-400' : 'bg-purple-50 text-purple-600'
            }`}>
              <Video className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-gray-700">Video</span>
          </button>

          {/* View Profile / Group Settings */}
          {isGroup ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[GROUP INFO] Settings clicked');
                console.log('[GROUP SETTINGS] opening modal');
                console.log('[GROUP SETTINGS] activeConversation', conversation);
                onGroupSettings?.();
                onClose();
              }}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              aria-label="Group settings"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-teal-50 text-teal-600">
                <Settings className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-700">Settings</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onViewProfile?.();
              }}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              aria-label="View profile"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-50 text-blue-600">
                <User className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-700">Profile</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
