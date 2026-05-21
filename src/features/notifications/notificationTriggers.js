/**
 * Notification Triggers
 *
 * Centralized automatic notification creation for all app actions.
 * All functions are fire-and-forget: they never block the main workflow.
 *
 * Usage: Import and call these functions after successful actions.
 *
 * @module features/notifications/notificationTriggers
 */

import { createNotification } from './notificationsService';
import { supabase } from '../../lib/supabase';

// Import from existing notification modules (used by wrapper functions and re-exported)
import {
  notifyMessageRecipients,
  notifyMentions,
  notifyMissedCall,
} from '../chat/services/chatNotifications';

import {
  notifyProjectStatusChange,
} from './projectNotifications';

// ---------------------------------------------------------------------------
// 1. Developer Invitation
// ---------------------------------------------------------------------------

/**
 * Notify developers when a client accepts them for a job.
 * Called after client clicks "Accept Team" in PublishResultModal.
 *
 * @param {Object} params
 * @param {Array} params.selectedTeam - Array of developers from AI recommendation
 * @param {string} params.actorId - Client user ID who accepted the team
 * @param {string} params.jobId - The job ID
 * @param {string} params.projectId - The project ID (optional, creates redirect link)
 *
 * @returns {Promise<{notified: number, failed: number}>}
 *
 * Integration point:
 * - Call in PublishResultModal.jsx after handleAcceptTeam succeeds
 * - Or call in the parent's onAcceptTeam callback
 *
 * TODO: Future integrations:
 * - Email notifications for offline developers
 * - Push notifications for mobile app
 * - In-app toast notification for invited developers
 */
export async function notifyDevelopersInvited({
  selectedTeam,
  actorId,
  jobId,
  projectId = null,
}) {
  try {
    if (!selectedTeam?.length || !actorId) {
      return { notified: 0, failed: 0 };
    }

    // Extract developer names from the selected team
    const developerNames = selectedTeam
      .map((dev) => dev.name || dev.Name || dev.full_name)
      .filter((n) => n && n !== 'Unknown Developer');

    if (developerNames.length === 0) {
      return { notified: 0, failed: 0 };
    }

    // Lookup profiles by full_name to get user IDs
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('full_name', developerNames);

    if (error) {
      console.error('[NotifyDevelopers] Profile lookup failed:', error.message);
      return { notified: 0, failed: 0 };
    }

    if (!profiles?.length) {
      return { notified: 0, failed: 0 };
    }

    // Create notifications for each matched developer
    const results = await Promise.allSettled(
      profiles.map((profile) =>
        createNotification({
          userId: profile.id,
          type: 'developer_invited',
          title: 'You have been invited to a project',
          body: `A client has invited you to join a new project. Review the details and accept if interested.`,
          metadata: {
            jobId,
            projectId,
            redirectTo: '/developer/dashboard',
          },
          actorId,
        })
      )
    );

    const notified = results.filter(
      (r) => r.status === 'fulfilled' && r.value?.data
    ).length;
    const failed = results.length - notified;

    if (failed > 0) {
      console.error(`[NotifyDevelopers] ${failed} notifications failed`);
    }

    return { notified, failed };
  } catch (err) {
    console.error('[NotifyDevelopers] Unexpected error:', err);
    return { notified: 0, failed: 0 };
  }
}

// ---------------------------------------------------------------------------
// Re-exports from existing notification modules
// These are already implemented and working
// ---------------------------------------------------------------------------

// Chat notifications (from chatNotifications.ts)
export {
  notifyMessageRecipients,
  notifyMentions,
  notifyMissedCall,
  setActiveConversationForNotifications,
  getActiveConversationForNotifications,
} from '../chat/services/chatNotifications';

// Project notifications (from projectNotifications.js)
export {
  notifyProjectStatusChange,
  notifyProjectStatusChangeWithFetch,
  fetchProjectTeamMembers,
} from './projectNotifications';

// ---------------------------------------------------------------------------
// Convenience wrapper for common patterns
// ---------------------------------------------------------------------------

/**
 * Trigger all relevant notifications after sending a chat message.
 * Combines mention notifications (priority) + generic message notifications.
 *
 * @param {Object} params
 * @param {string} params.messageId - The sent message ID
 * @param {string} params.conversationId - Target conversation
 * @param {string} params.senderId - Message sender user ID
 * @param {string} params.content - Message text content (for mention detection)
 *
 * Integration point:
 * - Call in ChatWindow.jsx or useChat.ts after successful message send
 * - Already integrated in supabaseChatService.ts sendTextMessage
 */
export async function triggerMessageNotifications({
  messageId,
  conversationId,
  senderId,
  content,
}) {
  try {
    // 1. Notify mentioned users first (higher priority)
    const mentionedIds = await notifyMentions(messageId, conversationId, senderId, content);

    // 2. Notify other recipients (excluding mentioned users to avoid duplication)
    await notifyMessageRecipients(messageId, conversationId, senderId, mentionedIds);
  } catch (err) {
    // Log but don't block - message was already sent successfully
    console.error('[TriggerNotifications] Message notifications failed:', err);
  }
}

/**
 * Trigger missed call notification when call times out.
 *
 * @param {Object} params
 * @param {string} params.callId - Call session ID
 * @param {string} params.callerId - User who initiated the call
 * @param {string} params.receiverId - User who missed the call
 * @param {string} params.conversationId - Conversation ID
 * @param {'audio'|'video'} params.callType - Type of call
 *
 * Integration point:
 * - Automatically called in supabaseCallService.ts markCallMissed()
 * - No manual trigger needed
 */
export async function triggerMissedCallNotification({
  callId,
  callerId,
  receiverId,
  conversationId,
  callType,
}) {
  try {
    await notifyMissedCall(callId, callerId, receiverId, conversationId, callType);
  } catch (err) {
    console.error('[TriggerNotifications] Missed call notification failed:', err);
  }
}

/**
 * Trigger project status change notifications for all team members.
 *
 * @param {Object} params
 * @param {string} params.projectId - Project ID
 * @param {string} params.projectName - Project name for notification body
 * @param {string} params.oldStatus - Previous status
 * @param {string} params.newStatus - New status
 * @param {string} params.actorId - User who made the change
 * @param {string[]} params.teamMemberIds - IDs of team members to notify
 *
 * Integration point:
 * - Call after successful project status update in:
 *   - DeveloperProjectDetails.jsx (developer changes status)
 *   - ProjectDetails.jsx (client changes status)
 *   - Any admin project management interface
 */
export async function triggerProjectStatusNotifications({
  projectId,
  projectName,
  oldStatus,
  newStatus,
  actorId,
  teamMemberIds,
}) {
  try {
    await notifyProjectStatusChange({
      projectId,
      newStatus,
      previousStatus: oldStatus,
      projectName,
      actorId,
      teamMemberIds,
    });
  } catch (err) {
    console.error('[TriggerNotifications] Project status notifications failed:', err);
  }
}

// Note: Additional notification utilities are available from their source modules:
// - chatNotifications.ts: setActiveConversationForNotifications, getActiveConversationForNotifications
// - projectNotifications.js: notifyProjectStatusChangeWithFetch, fetchProjectTeamMembers
