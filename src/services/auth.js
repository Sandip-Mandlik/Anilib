/**
 * AniLib Auth Storage Service
 * Handles account management, sessions, and per-user data namespacing.
 * All data is stored in localStorage — no backend required.
 */

const AUTH_KEYS = {
  ACCOUNTS: "anilib_accounts",   // { [username]: { username, email, passwordHash, avatar, displayName, joined, badge } }
  SESSION:  "anilib_session",    // { username, loginAt }
};

// ── Simple deterministic hash (not cryptographically secure, demo only) ──────
function simpleHash(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function hashPassword(password) {
  // Salt with a fixed prefix so it isn't the raw string
  return simpleHash("anilib_salt_v1_" + password);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function safeGet(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("authStorage write error:", err);
  }
}

// ── PRESET AVATARS — Official anime character artwork ─────────────────────────
export const PRESET_AVATARS = [
  "/avatars/naruto.jpg",
  "/avatars/levi.jpg",
  "/avatars/gojo.jpg",
  "/avatars/light.jpg",
  "/avatars/zerotwo.jpg",
  "/avatars/edward.jpg",
  "/avatars/tanjiro.jpg",
  "/avatars/mikasa.jpg",
  "/avatars/itadori.jpg",
  "/avatars/rem.jpg",
  "/avatars/l.jpg",
  "/avatars/frieren.jpg",
  "/avatars/luffy.jpg",
  "/avatars/zoro.jpg",
  "/avatars/killua.jpg",
  "/avatars/gon.jpg",
];

export const PRESET_AVATAR_NAMES = [
  "Naruto", "Levi", "Gojo", "Light",
  "Zero Two", "Edward", "Tanjiro", "Mikasa",
  "Itadori", "Rem", "L", "Frieren",
  "Luffy", "Zoro", "Killua", "Gon",
];

const LEGACY_AVATAR_MAP = {
  "https://cdn.myanimelist.net/images/characters/2/284121.jpg": "/avatars/naruto.jpg",
  "https://cdn.myanimelist.net/images/characters/2/241413.jpg": "/avatars/levi.jpg",
  "https://cdn.myanimelist.net/images/characters/8/493068.jpg": "/avatars/gojo.jpg",
  "https://cdn.myanimelist.net/images/characters/8/13467.jpg": "/avatars/light.jpg",
  "https://cdn.myanimelist.net/images/characters/13/395945.jpg": "/avatars/zerotwo.jpg",
  "https://cdn.myanimelist.net/images/characters/11/174517.jpg": "/avatars/edward.jpg",
  "https://cdn.myanimelist.net/images/characters/6/373924.jpg": "/avatars/tanjiro.jpg",
  "https://cdn.myanimelist.net/images/characters/9/215563.jpg": "/avatars/mikasa.jpg",
  "https://cdn.myanimelist.net/images/characters/7/521072.jpg": "/avatars/itadori.jpg",
  "https://cdn.myanimelist.net/images/characters/13/356395.jpg": "/avatars/rem.jpg",
  "https://cdn.myanimelist.net/images/characters/8/33532.jpg": "/avatars/l.jpg",
  "https://cdn.myanimelist.net/images/characters/2/515066.jpg": "/avatars/frieren.jpg",
};

export function normalizeAvatar(url) {
  if (!url) return PRESET_AVATARS[0];
  if (LEGACY_AVATAR_MAP[url]) return LEGACY_AVATAR_MAP[url];
  if (typeof url === "string" && url.includes("myanimelist.net/images/characters")) {
    return "/avatars/tanjiro.jpg";
  }
  return url;
}

// ── Account CRUD ──────────────────────────────────────────────────────────────
export function getAccounts() {
  const accounts = safeGet(AUTH_KEYS.ACCOUNTS, {});
  let modified = false;
  for (const k of Object.keys(accounts)) {
    const acc = accounts[k];
    if (acc && acc.avatar) {
      const normalized = normalizeAvatar(acc.avatar);
      if (normalized !== acc.avatar) {
        acc.avatar = normalized;
        modified = true;
      }
    }
  }
  if (modified) {
    safeSet(AUTH_KEYS.ACCOUNTS, accounts);
  }
  return accounts;
}

export function accountExists(username) {
  const accounts = getAccounts();
  return Boolean(accounts[username.toLowerCase().trim()]);
}

export function emailExists(email) {
  const accounts = getAccounts();
  return Object.values(accounts).some(
    (a) => a.email.toLowerCase() === email.toLowerCase().trim()
  );
}

/**
 * Creates a new account.
 * @returns {{ success: boolean, error?: string, user?: object }}
 */
export function createAccount({ username, email, password, avatar }) {
  const trimmedUsername = username.trim();
  const trimmedEmail    = email.trim();

  // Validation
  if (!trimmedUsername || trimmedUsername.length < 3) {
    return { success: false, error: "Username must be at least 3 characters." };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
    return { success: false, error: "Username can only contain letters, numbers, and underscores." };
  }
  if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { success: false, error: "Please enter a valid email address." };
  }
  if (!password || password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }
  if (accountExists(trimmedUsername)) {
    return { success: false, error: "That username is already taken. Try another!" };
  }
  if (emailExists(trimmedEmail)) {
    return { success: false, error: "An account with that email already exists." };
  }

  const accounts = getAccounts();
  const key      = trimmedUsername.toLowerCase();

  const user = {
    username:     trimmedUsername,
    email:        trimmedEmail,
    passwordHash: hashPassword(password),
    avatar:       normalizeAvatar(avatar),
    displayName:  trimmedUsername,
    joined:       new Date().getFullYear().toString(),
    badge:        "New Member",
  };

  accounts[key] = user;
  safeSet(AUTH_KEYS.ACCOUNTS, accounts);

  return { success: true, user };
}

/**
 * Validates login credentials.
 * @returns {{ success: boolean, error?: string, user?: object }}
 */
export function loginWithCredentials(username, password) {
  const key      = username.trim().toLowerCase();
  const accounts = getAccounts();
  const account  = accounts[key];

  if (!account) {
    return { success: false, error: "No account found with that username." };
  }
  if (account.passwordHash !== hashPassword(password)) {
    return { success: false, error: "Incorrect password. Please try again." };
  }

  account.avatar = normalizeAvatar(account.avatar);
  return { success: true, user: account };
}

// ── Session ───────────────────────────────────────────────────────────────────
export function getSession() {
  const session = safeGet(AUTH_KEYS.SESSION, null);
  if (!session) return null;

  // Re-hydrate full user object from accounts
  const accounts = getAccounts();
  const user     = accounts[session.username.toLowerCase()];
  if (!user) return null;
  user.avatar = normalizeAvatar(user.avatar);
  return user;
}

export function saveSession(user) {
  safeSet(AUTH_KEYS.SESSION, { username: user.username.toLowerCase(), loginAt: new Date().toISOString() });
}

export function clearSession() {
  localStorage.removeItem(AUTH_KEYS.SESSION);
}

// ── Profile Update ────────────────────────────────────────────────────────────
export function updateAccountProfile(username, updates) {
  const accounts = getAccounts();
  const key      = username.toLowerCase();
  if (!accounts[key]) return null;

  if (updates.avatar) {
    updates.avatar = normalizeAvatar(updates.avatar);
  }
  accounts[key] = { ...accounts[key], ...updates };
  safeSet(AUTH_KEYS.ACCOUNTS, accounts);

  // Re-save session so getSession() returns fresh data
  saveSession(accounts[key]);
  return accounts[key];
}

// ── Per-user data key namespacing ─────────────────────────────────────────────
/**
 * Returns the localStorage key for a given data type and user.
 * If no username is provided, falls back to the legacy global key.
 */
export function userKey(baseKey, username) {
  if (!username) return baseKey;
  return `${baseKey}_${username.toLowerCase()}`;
}
