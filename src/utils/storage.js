// localStorage helpers for schedules & streaks
export function getSaved() {
  return JSON.parse(localStorage.getItem('ssp_schedules') || '[]');
}
export function getStreak() {
  return parseInt(localStorage.getItem('ssp_streak') || '0');
}
export function updateStreak() {
  const today = new Date().toDateString();
  const last = localStorage.getItem('ssp_streak_date');
  let streak = getStreak();
  if (last === today) return streak;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  streak = last === yesterday ? streak + 1 : 1;
  localStorage.setItem('ssp_streak', streak);
  localStorage.setItem('ssp_streak_date', today);
  return streak;
}
export function saveSchedule(gs, ts, currentUser) {
  const saved = getSaved();
  if (gs.id && saved.find(s => s.id === gs.id)) return 'exists';
  const newGs = { ...gs, id: Date.now(), userId: currentUser ? currentUser.id : 'guest', tickState: ts };
  saved.unshift(newGs);
  localStorage.setItem('ssp_schedules', JSON.stringify(saved));
  const streak = getStreak();
  const best = parseInt(localStorage.getItem('ssp_best_streak') || '0');
  if (streak > best) localStorage.setItem('ssp_best_streak', streak);
  return newGs;
}
export function updateSaved(gs, ts) {
  if (!gs || !gs.id) return;
  const saved = getSaved();
  const idx = saved.findIndex(s => s.id === gs.id);
  if (idx >= 0) {
    saved[idx] = { ...gs, tickState: ts };
    localStorage.setItem('ssp_schedules', JSON.stringify(saved));
  }
}
export function deleteSaved(targetId) {
  const saved = getSaved();
  localStorage.setItem('ssp_schedules', JSON.stringify(saved.filter(s => s.id !== targetId)));
}
