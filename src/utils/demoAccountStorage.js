const ACCOUNTS_KEY = "teamup_demo_accounts_v1";

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

export function readDemoAccounts() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(ACCOUNTS_KEY);
  return safeParse(raw, []);
}

export function writeDemoAccounts(accounts) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}
