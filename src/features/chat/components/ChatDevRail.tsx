import { useState, useRef, useEffect, useCallback } from 'react';
import {
  HomeIcon,
  UsersIcon,
  BellIcon,
  StarIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentIcon,
  ChatBubbleLeftIcon,
  PlusIcon,
  XMarkIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { getMyStarredMessages, type StarredMessageItem } from '../services/supabaseChatService';
import { formatMessageTime } from '../utils/dateFormat';

interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  provider?: string;
}

interface ChatDevRailProps {
  unreadMessages: number;
  unreadConversations: number;
  profiles: Profile[];
  profilesLoading: boolean;
  profilesError: string | null;
  startingChatFor: string | null;
  currentUserId?: string;
  onBackHome: () => void;
  onTestNotification: () => void;
  onFetchAvailableUsers: () => void;
  onStartChat: (userId: string, name: string) => void;
  onCreateGroup?: (title: string, memberIds: string[]) => Promise<string | null>;
  onCopyId: (id: string) => void;
  onSelectConversation?: (conversationId: string, messageId?: string) => void;
  copiedId: string | null;
}

export function ChatDevRail({
  unreadMessages,
  unreadConversations,
  profiles,
  profilesLoading,
  profilesError,
  startingChatFor,
  currentUserId,
  onBackHome,
  onTestNotification,
  onFetchAvailableUsers,
  onStartChat,
  onCreateGroup,
  onCopyId,
  onSelectConversation,
  copiedId,
}: ChatDevRailProps) {
  const [usersPanelOpen, setUsersPanelOpen] = useState(false);
  const [starredPanelOpen, setStarredPanelOpen] = useState(false);
  const [starredMessages, setStarredMessages] = useState<StarredMessageItem[]>([]);
  const [starredLoading, setStarredLoading] = useState(false);
  const [starredError, setStarredError] = useState<string | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  // Create Group modal state
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [createGroupError, setCreateGroupError] = useState<string | null>(null);

  // Close panels when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (railRef.current && !railRef.current.contains(event.target as Node)) {
        setUsersPanelOpen(false);
        setStarredPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadgeColor = (role?: string) => {
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

  const handleToggleUsers = () => {
    const nextState = !usersPanelOpen;
    setUsersPanelOpen(nextState);
    setStarredPanelOpen(false); // Close other panel
    if (nextState) {
      onFetchAvailableUsers();
    }
  };

  const handleToggleStarred = useCallback(() => {
    const nextState = !starredPanelOpen;
    setStarredPanelOpen(nextState);
    setUsersPanelOpen(false); // Close other panel

    // Fetch starred messages when opening
    if (nextState) {
      fetchStarredMessages();
    }
  }, [starredPanelOpen]);

  const fetchStarredMessages = useCallback(async () => {
    setStarredLoading(true);
    setStarredError(null);
    const { items, error } = await getMyStarredMessages();
    if (error) {
      setStarredError(error);
    } else {
      setStarredMessages(items);
    }
    setStarredLoading(false);
  }, []);

  const handleStarredItemClick = (item: StarredMessageItem) => {
    console.log('[Starred] clicked message', { conversationId: item.conversationId, messageId: item.messageId });
    setStarredPanelOpen(false);
    onSelectConversation?.(item.conversationId, item.messageId);
  };

  const getMessagePreview = (item: StarredMessageItem): string => {
    switch (item.type) {
      case 'image':
        return '📷 Photo';
      case 'file':
        return '📎 File';
      case 'voice':
        return '🎤 Voice message';
      case 'text':
      default:
        return item.content || '';
    }
  };

  // Create Group handlers
  const handleOpenCreateGroup = () => {
    setCreateGroupOpen(true);
    setGroupName('');
    setSelectedMemberIds(new Set());
    setCreateGroupError(null);
    // Open users panel to see available members
    if (!usersPanelOpen) {
      setUsersPanelOpen(true);
      onFetchAvailableUsers();
    }
  };

  const handleCloseCreateGroup = () => {
    setCreateGroupOpen(false);
    setGroupName('');
    setSelectedMemberIds(new Set());
    setCreateGroupError(null);
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMemberIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleCreateGroup = async () => {
    if (!onCreateGroup) return;
    if (!groupName.trim()) {
      setCreateGroupError('Group name is required');
      return;
    }
    if (selectedMemberIds.size < 1) {
      setCreateGroupError('Select at least 1 member');
      return;
    }

    setCreatingGroup(true);
    setCreateGroupError(null);

    const memberIds = Array.from(selectedMemberIds);
    console.log('[Group Chat] creating group', { title: groupName.trim(), memberIds });

    try {
      const conversationId = await onCreateGroup(groupName.trim(), memberIds);
      console.log('[Group Chat] group created', conversationId);
      if (conversationId) {
        handleCloseCreateGroup();
        setUsersPanelOpen(false);
      } else {
        setCreateGroupError('Failed to create group');
      }
    } catch (err) {
      console.error('[Group Chat] create error', err);
      setCreateGroupError('Failed to create group');
    } finally {
      setCreatingGroup(false);
    }
  };

  return (
    <div ref={railRef} className="relative flex h-full shrink-0">
      {/* Icon-only Rail - 56px fixed width */}
      <div className="w-14 flex flex-col items-center py-3 bg-white border-r border-gray-200/70 shrink-0">
        {/* Unread Badge - on Messages icon */}
        <div className="relative mb-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <ChatBubbleLeftIcon className="w-4 h-4 text-gray-500" />
          </div>
          {unreadMessages > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-600 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </div>

        <div className="w-full h-px bg-gray-100 my-2" />

        {/* Back to Home */}
        <button
          onClick={onBackHome}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors mb-1"
          title="Back to Home"
        >
          <HomeIcon className="w-5 h-5" />
        </button>

        {/* Test Notification */}
        <button
          onClick={onTestNotification}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-amber-500 hover:bg-amber-50 transition-colors mb-1"
          title="Test Notification"
        >
          <BellIcon className="w-5 h-5" />
        </button>

        {/* Available Users */}
        <button
          onClick={handleToggleUsers}
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors mb-1 ${
            usersPanelOpen
              ? 'bg-teal-50 text-teal-600'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          }`}
          title="Available Users"
        >
          <UsersIcon className="w-5 h-5" />
          {profiles.length > 0 && !usersPanelOpen && (
            <span className="absolute bottom-1 right-1 w-2 h-2 bg-teal-500 rounded-full" />
          )}
        </button>

        {/* Starred Messages */}
        <button
          onClick={handleToggleStarred}
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors mb-1 ${
            starredPanelOpen
              ? 'bg-amber-50 text-amber-600'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          }`}
          title="Starred messages"
          aria-label="Starred messages"
        >
          <StarIcon className="w-5 h-5" />
        </button>

        {/* Bottom spacer */}
        <div className="flex-1" />

        {/* Dev indicator */}
        <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center">
          <span className="text-[9px] font-medium text-gray-400">Dev</span>
        </div>
      </div>

      {/* Available Users Popover Panel */}
      {usersPanelOpen && (
        <div className="absolute left-14 top-0 h-full w-[280px] bg-white border-r border-gray-200 shadow-xl z-50 flex flex-col">
          {/* Panel Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-teal-600" />
                Available Users
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Real profiles from Supabase</p>
            </div>
            <div className="flex items-center gap-1">
              {/* Create Group Button */}
              <button
                onClick={handleOpenCreateGroup}
                className="p-1.5 hover:bg-teal-50 rounded-lg transition-colors text-teal-600 hover:text-teal-700"
                title="Create group"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setUsersPanelOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {/* Refresh button */}
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Profiles
              </p>
              <button
                onClick={onFetchAvailableUsers}
                className="flex items-center gap-1 text-[11px] text-teal-600 hover:text-teal-700 font-medium"
                disabled={profilesLoading}
              >
                <ArrowPathIcon className={`w-3 h-3 ${profilesLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Loading */}
            {profilesLoading && (
              <div className="flex items-center gap-2 text-xs text-gray-500 py-3">
                <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-teal-600 rounded-full animate-spin" />
                Loading users...
              </div>
            )}

            {/* Error */}
            {profilesError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-700">
                <span className="font-medium">Error:</span> {profilesError}
              </div>
            )}

            {/* Empty */}
            {!profilesLoading && !profilesError && profiles.length === 0 && (
              <p className="text-xs text-gray-500 py-2">No available users found.</p>
            )}

            {/* Profiles List */}
            {!profilesLoading && !profilesError && profiles.length > 0 && (
              <div className="space-y-2">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    {/* Avatar */}
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name || 'User'}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-8 h-8 rounded-full bg-teal-100 text-teal-700 items-center justify-center text-[11px] font-semibold shrink-0 ${
                        profile.avatar_url ? 'hidden' : 'flex'
                      }`}
                    >
                      {getInitials(profile.full_name)}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {profile.full_name || 'Unnamed'}
                      </p>
                      {profile.email && (
                        <p className="text-[10px] text-gray-500 truncate">{profile.email}</p>
                      )}
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        {profile.role && (
                          <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${getRoleBadgeColor(profile.role)}`}>
                            {profile.role}
                          </span>
                        )}
                        {profile.provider && (
                          <span className="text-[9px] px-1 py-0.5 rounded font-medium bg-orange-50 text-orange-600">
                            {profile.provider}
                          </span>
                        )}
                        <button
                          onClick={() => onCopyId(profile.id)}
                          className="text-[9px] text-gray-400 hover:text-teal-600 flex items-center gap-0.5 transition-colors"
                          title={`Copy ID: ${profile.id}`}
                        >
                          <ClipboardDocumentIcon className="w-2.5 h-2.5" />
                          {copiedId === profile.id ? 'Copied!' : 'ID'}
                        </button>
                      </div>
                    </div>

                    {/* Start Chat Button */}
                    <button
                      onClick={() => onStartChat(profile.id, profile.full_name || 'User')}
                      disabled={startingChatFor === profile.id}
                      className="shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-wait transition-colors"
                      title={`Start chat with ${profile.full_name || 'User'}`}
                    >
                      <ChatBubbleLeftRightIcon className="w-3 h-3" />
                      {startingChatFor === profile.id ? '...' : 'Chat'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Starred Messages Popover Panel */}
      {starredPanelOpen && (
        <div className="absolute left-14 top-0 h-full w-[280px] bg-white border-r border-gray-200 shadow-xl z-50 flex flex-col">
          {/* Panel Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <StarIcon className="w-4 h-4 text-amber-500" />
                Starred Messages
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Messages you have starred</p>
            </div>
            <button
              onClick={() => setStarredPanelOpen(false)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {/* Loading */}
            {starredLoading && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-8">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-amber-500 rounded-full animate-spin" />
                Loading starred messages...
              </div>
            )}

            {/* Error */}
            {!starredLoading && starredError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                Failed to load starred messages
              </div>
            )}

            {/* Empty */}
            {!starredLoading && !starredError && starredMessages.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-8">No starred messages yet</p>
            )}

            {/* Starred Messages List */}
            {!starredLoading && !starredError && starredMessages.length > 0 && (
              <div className="space-y-3">
                {starredMessages.map((item) => (
                  <button
                    key={item.messageId}
                    onClick={() => handleStarredItemClick(item)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-100 transition-colors"
                  >
                    {/* Conversation header */}
                    <div className="flex items-center gap-2 mb-2">
                      {item.conversationAvatar ? (
                        <img
                          src={item.conversationAvatar}
                          alt={item.conversationName}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-medium text-gray-600">
                          {item.conversationName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs font-medium text-gray-700 truncate">
                        {item.conversationName}
                      </span>
                    </div>

                    {/* Message preview */}
                    <p className="text-sm text-gray-800 line-clamp-2 mb-1">
                      {getMessagePreview(item)}
                    </p>

                    {/* Sender and time */}
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>
                        {item.senderId === currentUserId ? 'You' : item.senderName}
                      </span>
                      <span>{formatMessageTime(item.createdAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {createGroupOpen && (
        <div className="absolute left-14 top-0 h-full w-[280px] bg-white border-r border-gray-200 shadow-xl z-[60] flex flex-col">
          {/* Modal Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <UserGroupIcon className="w-4 h-4 text-teal-600" />
                Create Group
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Select members and name your group</p>
            </div>
            <button
              onClick={handleCloseCreateGroup}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {/* Group Name Input */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                Group Name *
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            {/* Selected Count */}
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                Select Members
              </p>
              <span className="text-[10px] text-teal-600 font-medium">
                {selectedMemberIds.size} selected
              </span>
            </div>

            {/* Error */}
            {createGroupError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700">
                {createGroupError}
              </div>
            )}

            {/* Profiles List with Checkboxes */}
            {profilesLoading && (
              <div className="flex items-center gap-2 text-xs text-gray-500 py-3">
                <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-teal-600 rounded-full animate-spin" />
                Loading users...
              </div>
            )}

            {!profilesLoading && profiles.length === 0 && (
              <p className="text-xs text-gray-500 py-2">No available users found.</p>
            )}

            {!profilesLoading && profiles.length > 0 && (
              <div className="space-y-1">
                {profiles
                  .filter((p) => p.id !== currentUserId)
                  .map((profile) => {
                    const isSelected = selectedMemberIds.has(profile.id);
                    return (
                      <button
                        key={profile.id}
                        onClick={() => toggleMemberSelection(profile.id)}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-lg border transition-colors text-left ${
                          isSelected
                            ? 'bg-teal-50 border-teal-200'
                            : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                        }`}
                      >
                        {/* Checkbox */}
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-teal-600 border-teal-600'
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>

                        {/* Avatar */}
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.full_name || 'User'}
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[10px] font-semibold shrink-0">
                            {getInitials(profile.full_name)}
                          </div>
                        )}

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {profile.full_name || 'Unnamed'}
                          </p>
                          {profile.role && (
                            <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${getRoleBadgeColor(profile.role)}`}>
                              {profile.role}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-3 py-3 border-t border-gray-100 space-y-2">
            <button
              onClick={handleCreateGroup}
              disabled={creatingGroup || !groupName.trim() || selectedMemberIds.size < 1}
              className="w-full py-2 px-4 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creatingGroup ? 'Creating...' : 'Create Group'}
            </button>
            <button
              onClick={handleCloseCreateGroup}
              disabled={creatingGroup}
              className="w-full py-2 px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
