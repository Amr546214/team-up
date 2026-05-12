import { supabase } from '../../../lib/supabase';
import type { ChatUser } from '../types';

/**
 * Fetch current group members from conversation_participants
 */
export async function fetchGroupMembers(conversationId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId);

  if (error) {
    console.error('[GroupService] Error fetching group members:', error);
    throw new Error('Failed to fetch group members');
  }

  return data?.map(p => p.user_id) || [];
}

/**
 * Fetch available users from profiles who are NOT in the group
 */
export async function fetchAvailableUsers(
  conversationId: string,
  excludeUserIds: string[]
): Promise<ChatUser[]> {
  // First get current group members
  const memberIds = await fetchGroupMembers(conversationId);
  
  // Combine with exclusion list (current user)
  const allExcludedIds = [...new Set([...memberIds, ...excludeUserIds])];
  
  // Build query
  let query = supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, role, status');
  
  // Exclude existing members and current user
  if (allExcludedIds.length > 0) {
    query = query.not('id', 'in', `(${allExcludedIds.join(',')})`);
  }
  
  const { data, error } = await query;

  if (error) {
    console.error('[GroupService] Error fetching available users:', error);
    throw new Error('Failed to fetch available users');
  }

  // Map to ChatUser format
  return (data || []).map(profile => ({
    id: profile.id,
    name: profile.full_name || profile.email?.split('@')[0] || 'Unknown',
    role: (profile.role as ChatUser['role']) || 'client',
    avatar: profile.avatar_url || undefined,
    status: (profile.status as ChatUser['status']) || 'offline',
  }));
}

/**
 * Search available users by name or email
 */
export async function searchAvailableUsers(
  conversationId: string,
  excludeUserIds: string[],
  searchQuery: string
): Promise<ChatUser[]> {
  const memberIds = await fetchGroupMembers(conversationId);
  const allExcludedIds = [...new Set([...memberIds, ...excludeUserIds])];
  
  // Build search query - search in full_name and email
  let query = supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, role, status')
    .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
  
  // Exclude existing members and current user
  if (allExcludedIds.length > 0) {
    query = query.not('id', 'in', `(${allExcludedIds.join(',')})`);
  }
  
  const { data, error } = await query;

  if (error) {
    console.error('[GroupService] Error searching users:', error);
    throw new Error('Failed to search users');
  }

  return (data || []).map(profile => ({
    id: profile.id,
    name: profile.full_name || profile.email?.split('@')[0] || 'Unknown',
    role: (profile.role as ChatUser['role']) || 'client',
    avatar: profile.avatar_url || undefined,
    status: (profile.status as ChatUser['status']) || 'offline',
  }));
}

/**
 * Check if user already exists in group
 */
export async function isUserInGroup(
  conversationId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('[GroupService] Error checking user in group:', error);
    throw new Error('Failed to check user membership');
  }

  return !!data;
}

/**
 * Add users to a group conversation
 */
export async function addUsersToGroup(
  conversationId: string,
  userIds: string[]
): Promise<{ added: number; alreadyMembers: string[] }> {
  const added: string[] = [];
  const alreadyMembers: string[] = [];

  for (const userId of userIds) {
    try {
      // Check if already in group
      const exists = await isUserInGroup(conversationId, userId);
      
      if (exists) {
        alreadyMembers.push(userId);
        continue;
      }

      // Insert new participant
      const { error } = await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          role: 'member',
          joined_at: new Date().toISOString(),
        });

      if (error) {
        console.error(`[GroupService] Error adding user ${userId}:`, error);
        throw new Error(`Failed to add user: ${userId}`);
      }

      added.push(userId);
    } catch (err) {
      console.error(`[GroupService] Failed to add user ${userId}:`, err);
      throw err;
    }
  }

  return { added: added.length, alreadyMembers };
}

/**
 * Fetch full group members data from Supabase
 */
export async function fetchFullGroupMembers(
  conversationId: string
): Promise<ChatUser[]> {
  const { data, error } = await supabase
    .from('conversation_participants')
    .select(`
      user_id,
      role,
      profiles:user_id (
        id,
        full_name,
        email,
        avatar_url,
        role,
        status
      )
    `)
    .eq('conversation_id', conversationId);

  if (error) {
    console.error('[GroupService] Error fetching full group members:', error);
    throw new Error('Failed to fetch group members');
  }

  return (data || []).map(item => {
    const profile = item.profiles as any;
    return {
      id: item.user_id,
      name: profile?.full_name || profile?.email?.split('@')[0] || 'Unknown',
      role: (profile?.role as ChatUser['role']) || 'client',
      avatar: profile?.avatar_url || undefined,
      status: (profile?.status as ChatUser['status']) || 'offline',
    };
  });
}
