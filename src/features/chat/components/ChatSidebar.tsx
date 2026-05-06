import { useState, useMemo } from 'react';
import { Search, MessageSquare } from 'lucide-react';
import type { Conversation, ChatFilter, ChatUser, Message } from '../types';
import { ConversationItem } from './ConversationItem';
import { ChatFilters } from './ChatFilters';

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  currentUser: ChatUser;
  messages?: Record<string, Message[]>;
  totalUnreadCount: number;
  unreadChatsCount: number;
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  currentUser,
  messages,
  totalUnreadCount,
  unreadChatsCount,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all');

  // Filter and search conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      // Apply filter
      switch (activeFilter) {
        case 'direct':
          if (conv.type !== 'direct') return false;
          break;
        case 'group':
          if (conv.type !== 'group') return false;
          break;
        case 'unread':
          if (conv.unreadCount === 0) return false;
          break;
        case 'all':
        default:
          break;
      }

      // Apply search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const searchFields: string[] = [];

        // Add group name for groups
        if (conv.type === 'group' && conv.name) {
          searchFields.push(conv.name.toLowerCase());
        }

        // Add participant names and roles for direct conversations
        conv.participants.forEach((p) => {
          searchFields.push(p.name.toLowerCase());
          searchFields.push(p.role.toLowerCase());
        });

        // Add last message content
        if (conv.lastMessage?.content) {
          searchFields.push(conv.lastMessage.content.toLowerCase());
        }

        // Also search in actual messages if available
        if (messages && messages[conv.id]) {
          const lastMsg = messages[conv.id][messages[conv.id].length - 1];
          if (lastMsg?.content) {
            searchFields.push(lastMsg.content.toLowerCase());
          }
        }

        return searchFields.some((field) => field.includes(query));
      }

      return true;
    });
  }, [conversations, activeFilter, searchQuery, messages]);

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200/70 w-full md:w-[340px] lg:w-[360px] xl:w-[380px] shrink-0">
      {/* Header */}
      <div className="px-5 py-5 border-b border-gray-100 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Messages</h2>
          {totalUnreadCount > 0 && (
            <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded-full">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount} unread in {unreadChatsCount} {unreadChatsCount === 1 ? 'chat' : 'chats'}
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-100/80 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Filters */}
      <ChatFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto bg-gray-50/30">
        {conversations.length === 0 ? (
          // No conversations at all - initial empty state
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-5 h-5 text-teal-400" />
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">No conversations yet</p>
            <p className="text-gray-400 text-xs">Start a chat from Available Users</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          // Search/filter returned no results
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">No conversations found</p>
            <p className="text-gray-400 text-xs">Try another filter or search term</p>
          </div>
        ) : (
          <div className="py-2">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={conversation.id === activeConversationId}
                onClick={() => onSelectConversation(conversation.id)}
                currentUser={currentUser}
                messages={messages}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
