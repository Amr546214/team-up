import {
  readDemoAccounts,
  writeDemoAccounts,
  normalizeEmail,
} from "../utils/demoAccountStorage";

const PENDING_SKILL_QUIZ_EMAIL_KEY = "teamup_pending_skill_quiz_email";
const SESSION_KEY = "teamup_demo_session_v1";

function readSessionStorage() {
  if (typeof window === "undefined") return null;
  try {
    const fromSession = window.sessionStorage.getItem(SESSION_KEY);
    if (fromSession) return JSON.parse(fromSession);
    const fromLocal = window.localStorage.getItem(SESSION_KEY);
    if (fromLocal) return JSON.parse(fromLocal);
  } catch {
    return null;
  }
  return null;
}

export function getDemoSession() {
  return readSessionStorage();
}

export function setDemoSession({ email, role }, rememberMe) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify({
    email: normalizeEmail(email),
    role,
  });
  window.sessionStorage.setItem(SESSION_KEY, payload);
  if (rememberMe) {
    window.localStorage.setItem(SESSION_KEY, payload);
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

export function clearDemoSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(SESSION_KEY);
}

export function setPendingSkillQuizEmail(email) {
  if (typeof window === "undefined") return;
  const n = normalizeEmail(email);
  if (!n) return;
  window.sessionStorage.setItem(PENDING_SKILL_QUIZ_EMAIL_KEY, n);
}

export function getPendingSkillQuizEmail() {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(PENDING_SKILL_QUIZ_EMAIL_KEY) || "";
}

export function clearPendingSkillQuizEmail() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PENDING_SKILL_QUIZ_EMAIL_KEY);
}

/**
 * @param {{ email: string, password: string, role: string, profile: object, skillQuizCompleted?: boolean }} account
 */
export function saveDemoAccount(account) {
  const email = normalizeEmail(account.email);
  if (!email || !account.password) return { ok: false, reason: "missing_fields" };

  const accounts = readDemoAccounts();
  const next = {
    email,
    password: account.password,
    role: account.role,
    skillQuizCompleted: Boolean(account.skillQuizCompleted),
    profile: account.profile && typeof account.profile === "object" ? account.profile : {},
    createdAt: new Date().toISOString(),
  };

  const idx = accounts.findIndex(
    (a) => normalizeEmail(a.email) === email && a.role === account.role
  );
  if (idx >= 0) {
    accounts[idx] = { ...accounts[idx], ...next };
  } else {
    accounts.push(next);
  }
  writeDemoAccounts(accounts);
  return { ok: true };
}

export function findDemoAccountByEmail(email) {
  const n = normalizeEmail(email);
  return readDemoAccounts().find((a) => normalizeEmail(a.email) === n) || null;
}

export function findDemoAccountByEmailAndRole(email, role) {
  const n = normalizeEmail(email);
  return (
    readDemoAccounts().find((a) => normalizeEmail(a.email) === n && a.role === role) ||
    null
  );
}

export function verifyDemoLogin(email, password, role) {
  const n = normalizeEmail(email);
  const acc = findDemoAccountByEmailAndRole(n, role);
  if (!acc) return { ok: false, reason: "not_found" };
  if (acc.password !== password) return { ok: false, reason: "bad_password" };
  if (role === "developer" && !acc.skillQuizCompleted) {
    return { ok: false, reason: "skill_quiz_required" };
  }
  return { ok: true, account: acc };
}

export function markDeveloperSkillQuizCompletedForPendingEmail() {
  const pending = getPendingSkillQuizEmail();
  if (!pending) return { ok: false, reason: "no_pending" };

  const acc = findDemoAccountByEmail(pending);
  if (!acc || acc.role !== "developer") return { ok: false, reason: "no_account" };

  const accounts = readDemoAccounts();
  const idx = accounts.findIndex((a) => normalizeEmail(a.email) === pending);
  if (idx < 0) return { ok: false, reason: "no_account" };

  accounts[idx] = { ...accounts[idx], skillQuizCompleted: true };
  writeDemoAccounts(accounts);
  clearPendingSkillQuizEmail();
  return { ok: true };
}
