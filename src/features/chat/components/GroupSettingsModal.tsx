import { useState, useCallback, useEffect, useMemo } from 'react';
import { X, Users, UserPlus, Search, Check, User } from 'lucide-react';
import type { Conversation, ChatUser } from '../types';
import {
  addUsersToGroup,
  fetchFullGroupMembers,
} from '../services/groupService';

interface GroupSettingsModalProps {
  conversation: Conversation | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: ChatUser;
  onUpdateConversation?: (conversation: Conversation) => void;
  initialSection?: 'settings' | 'add-users' | 'members';
  allUsers?: ChatUser[]; // All registered users from parent
}

// Safe wrapper to prevent crashes
function GroupSettingsModalSafe(props: GroupSettingsModalProps) {
  const { isOpen, conversation } = props;
  
  console.log('[GROUP SETTINGS] wrapper check', { isOpen, hasConversation: !!conversation, type: conversation?.type });
  
  // IMMEDIATE SAFETY GUARD - return null before any hooks run if modal should not show
  if (!isOpen) {
    console.log('[GROUP SETTINGS] not open, returning null');
    return null;
  }
  
  if (!conversation) {
    console.log('[GROUP SETTINGS] no conversation, returning null');
    return null;
  }
  
  if (conversation.type !== 'group') {
    console.log('[GROUP SETTINGS] not a group, returning null');
    return null;
  }
  
  // Safe to render the actual modal
  return <GroupSettingsModalContent {...props} />;
}

function GroupSettingsModalContent({
  conversation,
  isOpen,
  onClose,
  currentUser,
  onUpdateConversation,
  initialSection = 'settings',
  allUsers = [],
}: GroupSettingsModalProps) {
  console.log('[GROUP SETTINGS] GroupSettingsModal render', { isOpen, conversationId: conversation?.id, type: conversation?.type, allUsersCount: allUsers?.length });
  
  // Safe defaults for all state
  const [showAddUsers, setShowAddUsers] = useState(initialSection === 'add-users');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Group members from Supabase
  const [groupMembers, setGroupMembers] = useState<ChatUser[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Safe data access
  const safeConversation = conversation || {} as Conversation;
  const safeGroupMembers = Array.isArray(groupMembers) ? groupMembers : [];
  const safeAllUsers = Array.isArray(allUsers) ? allUsers : [];
  const safeParticipants = Array.isArray(safeConversation.participants) ? safeConversation.participants : [];

  // Safe user data helpers - defined before use
  const getUserDisplayName = (user: any): string => {
    const name = user?.full_name || user?.name || user?.display_name || user?.username || user?.email || 'Unknown User';
    console.log('[ADD USERS] raw user:', user);
    console.log('[ADD USERS] display name:', name);
    return name;
  };

  const getUserEmail = (user: any): string => {
    return user?.email || '';
  };

  const getUserAvatar = (user: any): string | null => {
    return user?.avatar_url || user?.avatar || user?.image || null;
  };

  // Safe initials helper - handles undefined/null gracefully
  const getInitials = (value?: string | null): string => {
    const safeValue = typeof value === 'string' && value.trim()
      ? value.trim()
      : '?';

    return safeValue
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };
  
  // Compute available users from allUsers, excluding group members and current user
  const availableUsers = useMemo(() => {
    console.log('[GROUP SETTINGS] computing available users', { allUsersCount: safeAllUsers.length, groupMembersCount: safeGroupMembers.length });
    
    // Get all member IDs from various possible data structures
    const memberIds = new Set(
      safeGroupMembers
        .map(member => member.id || (member as any).user_id || (member as any).user?.id || (member as any).profile?.id || (member as any).profiles?.id)
        .filter(Boolean)
    );
    
    console.log('[GROUP SETTINGS] memberIds', Array.from(memberIds));
    
    // Filter allUsers to get available users
    const filtered = safeAllUsers.filter(user => {
      const userId = user.id || (user as any).user_id;
      if (!userId) return false;
      if (memberIds.has(userId)) return false;
      if (currentUser?.id && userId === currentUser.id) return false;
      return true;
    });
    
    console.log('[GROUP SETTINGS] available users computed', filtered.length);
    return filtered;
  }, [safeAllUsers, safeGroupMembers, currentUser?.id]);
  
  // Search filtered available users
  const filteredAvailableUsers = useMemo(() => {
    if (!searchQuery.trim()) return availableUsers;
    
    const query = searchQuery.toLowerCase().trim();
    return availableUsers.filter(user => {
      const displayName = getUserDisplayName(user).toLowerCase();
      const email = getUserEmail(user).toLowerCase();
      return displayName.includes(query) || email.includes(query);
    });
  }, [availableUsers, searchQuery]);
  
  console.log('[GROUP SETTINGS] debug logs:');
  console.log('[GROUP SETTINGS] allUsers from parent:', safeAllUsers);
  console.log('[GROUP SETTINGS] groupMembers:', safeGroupMembers);
  console.log('[GROUP SETTINGS] availableUsers:', availableUsers);

  const groupName = conversation?.name || 'Unnamed Group';
  const groupAvatar = conversation?.avatar;
  const membersCount = conversation?.membersCount || safeGroupMembers.length || safeParticipants.length || 0;

  // Fetch group members from Supabase
  useEffect(() => {
    if (!isOpen || !conversation?.id) return;
    
    const loadMembers = async () => {
      setIsLoadingMembers(true);
      try {
        const members = await fetchFullGroupMembers(conversation.id!);
        setGroupMembers(members);
        // Update conversation with fresh data
        if (onUpdateConversation && members.length > 0) {
          onUpdateConversation({
            ...conversation,
            participants: members,
            membersCount: members.length,
          });
        }
      } catch (err) {
        console.error('[GroupSettings] Error loading group members:', err);
        // Fall back to conversation.participants if Supabase fails
        setGroupMembers(conversation.participants || []);
      } finally {
        setIsLoadingMembers(false);
      }
    };
    
    loadMembers();
  }, [isOpen, conversation?.id]);

  // Reset section when modal opens or initialSection changes
  useEffect(() => {
    if (isOpen) {
      console.log('[GROUP SETTINGS] resetting section to', initialSection);
      setShowAddUsers(initialSection === 'add-users');
      setSearchQuery('');
      setSelectedUsers(new Set());
      setError(null);
      // For 'members' section, scroll to members after render
      if (initialSection === 'members') {
        setTimeout(() => {
          const membersSection = document.getElementById('current-members-section');
          membersSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [isOpen, initialSection]);

  // Toggle user selection
  const toggleUserSelection = useCallback((userId: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  // Add selected users to group
  const handleAddUsers = useCallback(async () => {
    if (selectedUsers.size === 0 || !conversation?.id) return;

    setIsAdding(true);
    setError(null);

    try {
      // Add users via Supabase
      const { added, alreadyMembers } = await addUsersToGroup(
        conversation.id,
        Array.from(selectedUsers)
      );

      if (added > 0) {
        // Refresh members list
        const updatedMembers = await fetchFullGroupMembers(conversation.id);
        setGroupMembers(updatedMembers);
        
        // Update conversation with new data
        if (onUpdateConversation) {
          onUpdateConversation({
            ...conversation,
            participants: updatedMembers,
            membersCount: updatedMembers.length,
          });
        }

        // Show success
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }

      if (alreadyMembers.length > 0) {
        console.log('[GroupSettings] Some users were already members:', alreadyMembers);
      }

      // Reset state
      setSelectedUsers(new Set());
      setShowAddUsers(false);
      setSearchQuery('');
    } catch (err) {
      console.error('[GroupSettings] Error adding users:', err);
      setError('Failed to add users. Please try again.');
    } finally {
      setIsAdding(false);
    }
  }, [selectedUsers, conversation, currentUser.id, onUpdateConversation]);

  // Log current state for debugging
  console.log('[GROUP SETTINGS] open', isOpen);
  console.log('[GROUP SETTINGS] activeConversation', conversation);
  console.log('[GROUP SETTINGS] groupMembers', safeGroupMembers);
  console.log('[GROUP SETTINGS] availableUsers', availableUsers);

  // Get status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'busy':
        return 'bg-red-500';
      case 'away':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md md:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Group Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Success Toast */}
        {showSuccess && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            Users added successfully!
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Group Info */}
          <div className="px-6 py-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              {/* Group Avatar */}
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xl font-semibold shadow-md">
                  {groupAvatar ? (
                    <img
                      src={groupAvatar}
                      alt={groupName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(groupName)
                  )}
                </div>
              </div>

              {/* Group Name & Count */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-gray-900 truncate">
                  {groupName}
                </h3>
                <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                  <Users className="w-4 h-4" />
                  <span>{membersCount} members</span>
                </div>
              </div>
            </div>
          </div>

          {/* Add Users Button */}
          <div className="px-6 py-4 border-b border-gray-100">
            <button
              onClick={() => setShowAddUsers(!showAddUsers)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors font-medium"
            >
              <UserPlus className="w-4 h-4" />
              {showAddUsers ? 'Cancel' : 'Add Users'}
            </button>
          </div>

          {/* Add Users Section */}
          {showAddUsers && (
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              {/* Available Users List */}
              <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
                {filteredAvailableUsers.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-4">
                    {searchQuery ? 'No users found matching your search' : 'No users available to add'}
                  </p>
                ) : (
                  filteredAvailableUsers.map(user => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-sm font-medium">
                          {(() => {
                            const avatar = getUserAvatar(user);
                            const displayName = getUserDisplayName(user);
                            return avatar ? (
                              <img
                                src={avatar}
                                alt={displayName}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              getInitials(displayName)
                            );
                          })()}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${getStatusColor(user.status)}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {getUserDisplayName(user)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{user.role || 'member'}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>

              {/* Confirm Add Button */}
              {selectedUsers.size > 0 && (
                <button
                  onClick={handleAddUsers}
                  disabled={isAdding}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-xl transition-colors font-medium"
                >
                  {isAdding ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Add {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''}
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Current Members */}
          <div className="px-6 py-4" id="current-members-section">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Current Members
            </h4>
            
            {isLoadingMembers ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                <span className="ml-2 text-sm text-gray-500">Loading members...</span>
              </div>
            ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {/* Current User */}
              <div className="flex items-center gap-3 p-2.5 bg-teal-50/50 rounded-xl border border-teal-100">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-sm font-medium">
                    {(() => {
                      const avatar = getUserAvatar(currentUser);
                      const displayName = getUserDisplayName(currentUser);
                      return avatar ? (
                        <img
                          src={avatar}
                          alt={displayName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(displayName)
                      );
                    })()}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${getStatusColor(currentUser.status)}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getUserDisplayName(currentUser)} (You)
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{currentUser.role || 'member'}</p>
                </div>
              </div>

              {/* Other Members */}
              {safeGroupMembers.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-4">
                  No other members in this group
                </p>
              ) : (
                safeGroupMembers.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-linear-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-sm font-medium">
                        {(() => {
                          const avatar = getUserAvatar(member);
                          const displayName = getUserDisplayName(member);
                          return avatar ? (
                            <img
                              src={avatar}
                              alt={displayName}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            getInitials(displayName)
                          );
                        })()}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${getStatusColor(member.status)}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getUserDisplayName(member)}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{member.role || 'member'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Export the safe wrapper as the main component
export { GroupSettingsModalSafe as GroupSettingsModal };
