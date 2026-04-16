// Auth helpers using localStorage
export function getUsers() {
  return JSON.parse(localStorage.getItem('ssp_users') || '[]');
}
export function saveUsers(users) {
  localStorage.setItem('ssp_users', JSON.stringify(users));
}
export function getCurrentUser() {
  const s = localStorage.getItem('ssp_cur');
  return s ? JSON.parse(s) : null;
}
export function persistUser(user) {
  localStorage.setItem('ssp_cur', JSON.stringify(user));
}
export function clearUser() {
  localStorage.removeItem('ssp_cur');
}
