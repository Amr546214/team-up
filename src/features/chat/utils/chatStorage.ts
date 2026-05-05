// Chat localStorage utilities for persisting read state and other preferences
// All functions guard browser APIs

const READ_CONVERSATION_IDS_KEY = 'chat:readConversationIds';

/**
 * Get array of read conversation IDs from localStorage
 */
export function getReadConversationIds(): string[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(READ_CONVERSATION_IDS_KEY);
  if (!stored) return [];
  
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Mark a conversation as read by adding its ID to localStorage
 */
export function addReadConversationId(conversationId: string): void {
  if (typeof window === 'undefined') return;
  
  const currentIds = getReadConversationIds();
  if (!currentIds.includes(conversationId)) {
    const updatedIds = [...currentIds, conversationId];
    localStorage.setItem(READ_CONVERSATION_IDS_KEY, JSON.stringify(updatedIds));
  }
}

/**
 * Mark a conversation as unread by removing its ID from localStorage
 */
export function removeReadConversationId(conversationId: string): void {
  if (typeof window === 'undefined') return;
  
  const currentIds = getReadConversationIds();
  const updatedIds = currentIds.filter(id => id !== conversationId);
  localStorage.setItem(READ_CONVERSATION_IDS_KEY, JSON.stringify(updatedIds));
}

/**
 * Clean up read conversation IDs that are no longer valid
 * Returns the cleaned array of valid IDs
 */
export function cleanReadConversationIds(validConversationIds: string[]): string[] {
  if (typeof window === 'undefined') return [];
  
  const currentIds = getReadConversationIds();
  const validIds = currentIds.filter(id => validConversationIds.includes(id));
  
  // Update storage if any IDs were removed
  if (validIds.length !== currentIds.length) {
    localStorage.setItem(READ_CONVERSATION_IDS_KEY, JSON.stringify(validIds));
  }
  
  return validIds;
}

/**
 * Check if a conversation is marked as read
 */
export function isConversationRead(conversationId: string): boolean {
  const readIds = getReadConversationIds();
  return readIds.includes(conversationId);
}
