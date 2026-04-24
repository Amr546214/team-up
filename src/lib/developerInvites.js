// Developer Project Invites Utility
// Handles matching accepted team developers to registered users and creating invites

import { addNotification } from "../services/fakeApi";

const USERS_KEY = "teamup_users";
const DEVELOPER_INVITES_KEY = "developer_project_invites";

function safeParse(json, fallback) {
  try {
    const value = JSON.parse(json);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeName(name) {
  return String(name || "").trim().toLowerCase();
}

export function getRegisteredUsers() {
  const raw = window.localStorage.getItem(USERS_KEY);
  const users = safeParse(raw, []);
  return Array.isArray(users) ? users : [];
}

export function findDeveloperUserByName(name) {
  const users = getRegisteredUsers();
  const targetName = normalizeName(name);

  return users.find((user) => {
    const userName = normalizeName(user.name || user.fullName);
    return user.role === "developer" && userName === targetName;
  });
}

export function addDeveloperProjectInvite(developerUser, job, developerFromTeam) {
  if (!developerUser?.id || !job?.id) return null;

  const raw = window.localStorage.getItem(DEVELOPER_INVITES_KEY);
  const parsed = safeParse(raw, []);
  const invites = Array.isArray(parsed) ? parsed : [];

  const alreadyExists = invites.some(
    (invite) =>
      invite.developerId === developerUser.id &&
      invite.jobId === job.id
  );

  if (alreadyExists) return null;

  const invite = {
    id: `invite_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    developerId: developerUser.id,
    developerName: developerUser.name,
    jobId: job.id,
    jobTitle: job.title,
    clientId: job.clientId || null,
    clientName: job.clientName || "Client",
    status: "pending",
    developerSnapshot: developerFromTeam,
    jobSnapshot: {
      id: job.id,
      title: job.title,
      description: job.description,
      budget: job.salary || job.requirements?.budget,
      duration: job.duration,
      skills: job.skills || job.requirements?.skills || [],
      requirements: job.requirements,
      finalCost: job.finalCost,
      budgetStatus: job.budgetStatus,
    },
    createdAt: new Date().toISOString(),
  };

  invites.push(invite);
  window.localStorage.setItem(DEVELOPER_INVITES_KEY, JSON.stringify(invites));

  return invite;
}

export function addDeveloperNotification(developerUser, job) {
  if (!developerUser?.id) return null;

  const notification = addNotification(developerUser.id, {
    title: "New project invitation",
    message: `You have been invited to join the project: ${job.title}`,
    type: "project_invite",
    jobId: job.id,
    isRead: false,
  });

  return notification;
}

export function notifyAcceptedTeamDevelopers(job, acceptedTeam) {
  if (!job || !Array.isArray(acceptedTeam)) {
    return {
      matched: [],
      unmatched: [],
    };
  }

  const matched = [];
  const unmatched = [];

  acceptedTeam.forEach((developerFromTeam) => {
    const developerName =
      developerFromTeam.name ||
      developerFromTeam.Name ||
      developerFromTeam.fullName ||
      developerFromTeam.full_name;

    const developerUser = findDeveloperUserByName(developerName);

    if (!developerUser) {
      unmatched.push(developerFromTeam);
      return;
    }

    const invite = addDeveloperProjectInvite(
      developerUser,
      job,
      developerFromTeam
    );

    addDeveloperNotification(developerUser, job);

    matched.push({
      developerUser,
      developerFromTeam,
      invite,
    });
  });

  if (unmatched.length > 0) {
    console.warn("[AcceptTeam] No registered user found for developers:", unmatched);
  }

  return { matched, unmatched };
}

export function getDeveloperInvites(developerId) {
  const raw = window.localStorage.getItem(DEVELOPER_INVITES_KEY);
  const parsed = safeParse(raw, []);
  const invites = Array.isArray(parsed) ? parsed : [];

  if (!developerId) return invites;
  return invites.filter((invite) => invite.developerId === developerId);
}

export function getDeveloperInviteById(inviteId) {
  const raw = window.localStorage.getItem(DEVELOPER_INVITES_KEY);
  const parsed = safeParse(raw, []);
  const invites = Array.isArray(parsed) ? parsed : [];

  return invites.find((invite) => invite.id === inviteId) || null;
}

export function updateInviteStatus(inviteId, newStatus) {
  const raw = window.localStorage.getItem(DEVELOPER_INVITES_KEY);
  const parsed = safeParse(raw, []);
  const invites = Array.isArray(parsed) ? parsed : [];

  const idx = invites.findIndex((invite) => invite.id === inviteId);
  if (idx === -1) return null;

  invites[idx].status = newStatus;
  invites[idx].updatedAt = new Date().toISOString();

  window.localStorage.setItem(DEVELOPER_INVITES_KEY, JSON.stringify(invites));

  return invites[idx];
}
