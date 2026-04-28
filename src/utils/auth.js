// Auth helpers using localStorage
const AUTH_SESSION_KEY = 'ssp_auth_v1';
const LEGACY_USER_KEY = 'ssp_cur';

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeSession(session) {
  if (!session) return null;
  if (session.user) {
    return {
      user: session.user,
      token: String(session.token || ''),
    };
  }
  return {
    user: session,
    token: String(session.token || session.authToken || ''),
  };
}

export function getAuthSession() {
  const raw = localStorage.getItem(AUTH_SESSION_KEY);
  const parsed = raw ? safeJsonParse(raw, null) : null;
  if (parsed && parsed.user) return normalizeSession(parsed);

  // Backward compatibility for older storage shape.
  const legacyUser = localStorage.getItem(LEGACY_USER_KEY);
  if (!legacyUser) return null;
  const user = safeJsonParse(legacyUser, null);
  return user ? normalizeSession({ user, token: '' }) : null;
}

export function getUsers() {
  return safeJsonParse(localStorage.getItem('ssp_users') || '[]', []);
}
export function saveUsers(users) {
  localStorage.setItem('ssp_users', JSON.stringify(users));
}
export function getCurrentUser() {
  return getAuthSession()?.user || null;
}
export function getCurrentToken() {
  return getAuthSession()?.token || '';
}
export function persistAuthSession(session) {
  const normalized = normalizeSession(session);
  if (!normalized) return;
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(normalized));
  localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(normalized.user));
}
export function persistUser(user, token = '') {
  persistAuthSession({ user, token });
}
export function clearUser() {
  localStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem('ssp_cur');
}
export function getAuthHeaders() {
  const token = getCurrentToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
