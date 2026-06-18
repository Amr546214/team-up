import type { Conversation, ChatUser, Message } from '../types';
import { getOtherParticipant } from '../utils/chatHelpers';
import {
  getLastMessageForConversation,
  buildMessagePreview,
  formatSidebarMessageTime,
} from '../utils/messagePreview';
import { Users, Pin } from 'lucide-react';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  currentUser: ChatUser;
  messages?: Record<string, Message[]>;
  isUserOnline?: (userId: string) => boolean;
}

export function ConversationItem({ conversation, isSelected, onClick, currentUser, messages, isUserOnline }: ConversationItemProps) {
  const isGroup = conversation.type === 'group';

  // Get the OTHER participant (not the current user)
  const otherUser = getOtherParticipant(conversation, currentUser?.id);

  // Check real-time online status for direct conversations
  const otherUserId = otherUser?.id;
  const isOtherUserOnline = !isGroup && otherUserId && isUserOnline ? isUserOnline(otherUserId) : false;

  // Debug logging for presence
  if (!isGroup && otherUserId) {
    console.log('[Presence UI] sidebar item', {
      conversationId: conversation.id,
      currentUserId: currentUser?.id,
      otherUserId,
      isOtherUserOnline,
    });
  }
  
  // Get the actual last message from messages state if available, fallback to conversation.lastMessage
  const lastMessage = messages 
    ? getLastMessageForConversation(conversation.id, messages) || conversation.lastMessage
    : conversation.lastMessage;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'client':
        return 'bg-blue-100 text-blue-700';
      case 'developer':
        return 'bg-green-100 text-green-700';
      case 'company':
        return 'bg-purple-100 text-purple-700';
      case 'admin':
        return 'bg-red-100 text-red-700';
      case 'team-leader':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Get display name (group name or participant name)
  const displayName = isGroup ? conversation.name : otherUser?.name;

  // Get avatar content
  const avatarContent = isGroup
    ? (conversation.avatar
        ? <img src={conversation.avatar} alt={conversation.name} className="w-full h-full rounded-full object-cover" />
        : conversation.name?.charAt(0).toUpperCase() || 'G'
      )
    : (otherUser?.avatar
        ? <img src={otherUser.avatar} alt={otherUser.name} className="w-full h-full rounded-full object-cover" />
        : otherUser?.name.charAt(0).toUpperCase()
      );

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3.5 transition-all duration-200 text-left group ${
        isSelected
          ? 'bg-teal-50/80 hover:bg-teal-50'
          : 'hover:bg-gray-50'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0 relative">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm ${
          isSelected
            ? 'bg-linear-to-br from-teal-500 to-teal-600'
            : isGroup
              ? 'bg-linear-to-br from-indigo-400 to-indigo-500'
              : 'bg-linear-to-br from-teal-400 to-teal-500'
        }`}>
          {avatarContent}
        </div>
        {/* Online status indicator for direct conversations - using real-time presence */}
        {!isGroup && isOtherUserOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
        {/* Group indicator */}
        {isGroup && (
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
            <Users className="w-3 h-3 text-indigo-500" />
          </div>
        )}
        {/* Pinned indicator */}
        {conversation.isPinned && (
          <div className="absolute -top-0.5 -left-0.5 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center shadow-sm">
            <Pin className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Top row: Name and Time */}
        <div className="flex items-center justify-between gap-3 mb-0.5">
          <h3 className={`font-medium truncate ${isSelected ? 'text-teal-900' : 'text-gray-900'}`}>
            {displayName}
          </h3>
          {lastMessage && (
            <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
              {formatSidebarMessageTime(lastMessage.timestamp)}
            </span>
          )}
        </div>

        {/* Second row: Message preview with sender prefix and unread badge */}
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
            {lastMessage 
              ? buildMessagePreview(lastMessage, conversation, currentUser)
              : 'No messages yet'
            }
          </p>
          {conversation.unreadCount > 0 && (
            <span className="shrink-0 bg-teal-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full min-w-5 text-center leading-tight">
              {conversation.unreadCount}
            </span>
          )}
        </div>

        {/* Third row: Role/Group badge */}
        <div className="flex items-center gap-2 mt-1">
          {isGroup ? (
            <span className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-indigo-100 text-indigo-700 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {conversation.membersCount || conversation.participants.length} members
            </span>
          ) : otherUser && (
            <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${getRoleBadgeColor(otherUser.role)}`}>
              {otherUser.role}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
