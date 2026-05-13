export interface ChatUser {
  id: string;
  name: string;
  role: 'client' | 'developer' | 'company' | 'admin' | 'team-leader';
  avatar?: string;
  status?: 'online' | 'offline' | 'busy' | 'away';
}

export type MessageType = 'text' | 'image' | 'file' | 'voice' | 'audio';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'unread' | 'failed';
  type: MessageType;
  // File/attachment fields
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  mediaUrl?: string;
  // Voice message duration in seconds
  duration?: number;
  // Soft delete for everyone (from messages table)
  deletedAt?: string | null;
  deletedBy?: string | null;
  deleteScope?: string | null;
  deleteReason?: string | null;
  // User-specific actions (from message_user_actions table)
  isStarred?: boolean;
  hiddenAt?: string | null;
  reportedAt?: string | null;
  reportReason?: string | null;
  // Read receipt timestamp (null = not read, date = read by recipient)
  readAt?: string | null;
  // Sender profile (fetched alongside messages)
  senderProfile?: {
    id: string;
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    role?: string | null;
  };
  // Reply fields (for replying to a specific message)
  replyToMessageId?: string | null;
  replyToPreview?: string | null;
  replyToSenderName?: string | null;
  replyToMessageType?: string | null;
}

export type ChatFilter =
  | 'all'
  | 'direct'
  | 'group'
  | 'unread';

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  participants: ChatUser[];
  name?: string; // For groups
  avatar?: string; // For groups
  membersCount?: number; // For groups
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: Date;
  isMuted?: boolean;
  isPinned?: boolean;
  pinnedAt?: Date;
}

export interface ChatState {
  currentUser: ChatUser;
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
}

export interface PinnedMessage {
  id: string;
  conversationId: string;
  messageId: string;
  pinnedBy: string;
  pinnedAt: string;
  // Joined message data
  message?: Message;
}

export type ChatProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  provider: string | null;
};
