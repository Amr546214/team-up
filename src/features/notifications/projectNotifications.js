/**
 * Project Status Notifications
 *
 * Creates notifications when project/job status changes.
 * Notifies all related team members except the actor performing the change.
 *
 * Statuses supported:
 * - pending
 * - active
 * - in_progress
 * - completed
 * - cancelled
 * - paused
 *
 * @module features/notifications/projectNotifications
 */

import { supabase } from '../../lib/supabase';
import { createNotification } from './notificationsService';

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------
// Track recent project+status combinations to prevent duplicate notifications
// when the same status change is processed multiple times
const _recentProjectNotifications = new Map(); // key: `${projectId}:${status}`, value: timestamp
const NOTIFICATION_COOLDOWN_MS = 5000; // 5 seconds cooldown

function getNotificationKey(projectId, status) {
  return `${projectId}:${status}`;
}

function wasRecentlyNotified(projectId, status) {
  const key = getNotificationKey(projectId, status);
  const lastTime = _recentProjectNotifications.get(key);
  if (!lastTime) return false;
  return Date.now() - lastTime < NOTIFICATION_COOLDOWN_MS;
}

function markAsNotified(projectId, status) {
  const key = getNotificationKey(projectId, status);
  _recentProjectNotifications.set(key, Date.now());

  // Cleanup old entries periodically
  if (_recentProjectNotifications.size > 100) {
    const now = Date.now();
    for (const [k, v] of _recentProjectNotifications.entries()) {
      if (now - v > NOTIFICATION_COOLDOWN_MS) {
        _recentProjectNotifications.delete(k);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Notify team members about a project status change.
 *
 * @param {Object} params
 * @param {string} params.projectId - The project/job ID
 * @param {string} params.jobId - Optional job ID (for job-specific notifications)
 * @param {string} params.newStatus - The new status (pending, active, in_progress, completed, cancelled, paused)
 * @param {string} params.previousStatus - The previous status (for duplicate detection)
 * @param {string} params.projectName - The project name for the notification body
 * @param {string} params.actorId - The user ID performing the status change (excluded from recipients)
 * @param {string[]} params.teamMemberIds - Array of user IDs to notify (excluding actor)
 *
 * @returns {Promise<{success: boolean, notifiedCount: number, error: string|null}>}
 *
 * Requirements:
 * - Only sends if newStatus !== previousStatus (actual change occurred)
 * - Cooldown period prevents duplicate sends (5 seconds)
 * - Actor is excluded from recipients
 * - Fire-and-forget: errors are logged but don't block the workflow
 *
 * TODO: Future integrations:
 * - Email notifications: Send email to offline team members
 * - Push notifications: Send mobile push to team members
 * - Activity timeline: Save to project_activity table for audit trail
 */
export async function notifyProjectStatusChange({
  projectId,
  jobId = null,
  newStatus,
  previousStatus,
  projectName,
  actorId,
  teamMemberIds = [],
}) {
  try {
    // --- Guard: Only notify if status actually changed ---
    if (newStatus === previousStatus) {
      console.log('[ProjectNotif] Status unchanged, skipping notification', { projectId, status: newStatus });
      return { success: false, notifiedCount: 0, error: null };
    }

    // --- Guard: Cooldown to prevent duplicate notifications ---
    if (wasRecentlyNotified(projectId, newStatus)) {
      console.log('[ProjectNotif] Recently notified, skipping duplicate', { projectId, status: newStatus });
      return { success: false, notifiedCount: 0, error: null };
    }

    // --- Validate inputs ---
    if (!projectId || !newStatus || !projectName || !actorId) {
      console.warn('[ProjectNotif] Missing required parameters', { projectId, newStatus, projectName, actorId });
      return { success: false, notifiedCount: 0, error: 'Missing required parameters' };
    }

    // --- Determine recipients (exclude actor) ---
    const recipients = teamMemberIds.filter((id) => id !== actorId);
    if (recipients.length === 0) {
      console.log('[ProjectNotif] No recipients to notify', { projectId });
      return { success: true, notifiedCount: 0, error: null };
    }

    // --- Build notification content ---
    const title = 'Project status updated';
    const body = `Project "${projectName}" is now ${newStatus}`;

    // --- Send notifications to all recipients ---
    const results = await Promise.allSettled(
      recipients.map((userId) =>
        createNotification({
          userId,
          type: 'project_status_changed',
          title,
          body,
          metadata: {
            projectId,
            jobId,
            status: newStatus,
            redirectTo: `/developer/projects/${projectId}`,
          },
          actorId,
        })
      )
    );

    const successful = results.filter((r) => r.status === 'fulfilled' && r.value?.data).length;
    const failed = results.length - successful;

    if (failed > 0) {
      console.warn('[ProjectNotif] Some notifications failed', { projectId, failed, successful });
    }

    if (successful > 0) {
      console.log(`[ProjectNotif] ${successful} notification(s) sent for project ${projectId} status ${newStatus}`);
      markAsNotified(projectId, newStatus);
    }

    return { success: true, notifiedCount: successful, error: null };
  } catch (err) {
    console.error('[ProjectNotif] Error sending status change notifications:', err);
    return { success: false, notifiedCount: 0, error: err.message };
  }
}

/**
 * Fetch team members for a project from the database.
 * Use this to populate teamMemberIds when calling notifyProjectStatusChange.
 *
 * @param {string} projectId - The project ID
 * @returns {Promise<{memberIds: string[], error: string|null}>}
 *
 * TODO: In the future, this could also fetch from:
 * - project_members table
 * - job_applications table (for job-specific teams)
 * - team_assignments table
 */
export async function fetchProjectTeamMembers(projectId) {
  try {
    // Fetch from project_members table (if exists)
    const { data: members, error } = await supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', projectId);

    if (error) {
      console.warn('[ProjectNotif] Failed to fetch team members', error);
      return { memberIds: [], error: error.message };
    }

    const memberIds = members?.map((m) => m.user_id) || [];
    return { memberIds, error: null };
  } catch (err) {
    console.error('[ProjectNotif] Error fetching team members:', err);
    return { memberIds: [], error: err.message };
  }
}

/**
 * Helper to send project status notification with automatic team member fetching.
 * Use this when you don't already have the team member IDs.
 *
 * @param {Object} params
 * @param {string} params.projectId - The project ID
 * @param {string} params.jobId - Optional job ID
 * @param {string} params.newStatus - The new status
 * @param {string} params.previousStatus - The previous status
 * @param {string} params.projectName - The project name
 * @param {string} params.actorId - The user making the change
 *
 * @returns {Promise<{success: boolean, notifiedCount: number, error: string|null}>}
 */
export async function notifyProjectStatusChangeWithFetch({
  projectId,
  jobId = null,
  newStatus,
  previousStatus,
  projectName,
  actorId,
}) {
  // Fetch team members first
  const { memberIds, error } = await fetchProjectTeamMembers(projectId);

  if (error) {
    return { success: false, notifiedCount: 0, error };
  }

  // Send notifications
  return notifyProjectStatusChange({
    projectId,
    jobId,
    newStatus,
    previousStatus,
    projectName,
    actorId,
    teamMemberIds: memberIds,
  });
}
