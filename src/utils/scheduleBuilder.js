import {
  DAYS, SLOTS, SLOT_HOURS,
  LEETCODE, GFG, WORKOUT_VID, WORKOUT_PLANS, LUNCH,
  WELLNESS_SLOTS, CODING_CONTENT, INTERVIEW_CONTENT,
  MUSIC_VID, MUSIC_GFG, LANG_LINKS, defaultLangLink,
  CREATIVE_VID, CREATIVE_GFG
} from '../data/constants';

function mapGoal(s) {
  s = (s || '').toLowerCase();
  if (s.includes('gain') || s.includes('muscle')) return 'gain';
  if (s.includes('loss') || s.includes('burn')) return 'loss';
  if (s.includes('endur')) return 'endurance';
  return 'maintenance';
}
function priN(p) { return p === 'High' ? 3 : p === 'Medium' ? 2 : 1; }

function parseTimeLabelToHour(label) {
  if (!label || typeof label !== 'string') return null;
  const m = label.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const mins = parseInt(m[2] || '0', 10);
  const ap = m[3].toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h + mins / 60;
}

function toStartSlotIndex(label) {
  const hour = parseTimeLabelToHour(label);
  if (hour === null) return 0;
  for (let i = 0; i < SLOT_HOURS.length; i++) {
    if (SLOT_HOURS[i] >= hour) return i;
  }
  return SLOT_HOURS.length;
}

function toEndSlotIndex(label) {
  const hour = parseTimeLabelToHour(label);
  if (hour === null) return SLOT_HOURS.length;
  for (let i = 0; i < SLOT_HOURS.length; i++) {
    if (SLOT_HOURS[i] >= hour) return i;
  }
  return SLOT_HOURS.length;
}

function parseSlotsPerDay(value, fallback = 1) {
  const m = String(value || '').match(/(\d+)/);
  return m ? Math.max(1, parseInt(m[1], 10)) : fallback;
}

function preferredSlotsFromLabels(labels) {
  if (!Array.isArray(labels) || !labels.length) return [0, 1, 2, 3, 4, 5, 6, 7];
  const allSlots = new Set();
  labels.forEach((label) => {
    const v = String(label || '').toLowerCase();
    const m = v.match(/(\d{1,2}):?(\d{2})?/);
    if (m) {
      let startH = parseInt(m[1], 10);
      const slotStart = Math.max(0, Math.min(7, startH - 8));
      if (slotStart >= 0 && slotStart < 8) allSlots.add(slotStart);
    }
  });
  return allSlots.size ? Array.from(allSlots).sort((a, b) => a - b) : [0, 1, 2, 3, 4, 5, 6, 7];
}

export function tagCls(type) {
  const m = {
    coding:'c-coding tag-coding', workout:'c-workout tag-workout',
    interview:'c-interview tag-interview', music:'c-music tag-music',
    language:'c-language tag-language', creative:'c-creative tag-creative',
    study:'c-study tag-study', well:'c-well tag-well', break:'c-break tag-break'
  };
  return (m[type] || m.break).split(' ');
}
export function tagLabel(t) {
  const m = { coding:'Coding', workout:'Workout', interview:'Interview', music:'Music', language:'Language', creative:'Creative', study:'Study', well:'Wellness', break:'Break' };
  return m[t] || t;
}

export function buildSchedule(D) {
  const hC = D.domains.includes('coding');
  const hW = D.domains.includes('workout');
  const hI = D.domains.includes('interview');
  const hM = D.domains.includes('music');
  const hL = D.domains.includes('language');
  const hCr = D.domains.includes('creative');
  const hS = D.domains.includes('study');

  const wGoal = mapGoal(D.w.goal);
  const wDaysN = { '3 days': 3, '4 days': 4, '5 days': 5 }[D.w.days] || 3;
  const taskPrefs = D.p.taskPrefs || {};
  const workoutPrefSlots = preferredSlotsFromLabels((taskPrefs.workout && taskPrefs.workout.times) || []);
  const maxPerDay = {};
  D.domains.forEach((dom) => {
    const taskPrefSlots = taskPrefs[dom] && taskPrefs[dom].slotsPerDay;
    const fallback = dom === 'workout'
      ? parseSlotsPerDay(D.p.wSlots, 1)
      : dom === 'study'
        ? parseSlotsPerDay(D.p.sSlots, 1)
        : 1;
    maxPerDay[dom] = parseSlotsPerDay(taskPrefSlots, fallback);
  });
  const wDays = [];
  for (let i = 0; i < 5 && wDays.length < wDaysN; i++) wDays.push(i);

  const cTopics = D.c.topics && D.c.topics.length ? D.c.topics : ['Data structures', 'HTML & CSS', 'React'];
  const iTopics = D.i.focusAreas && D.i.focusAreas.length ? D.i.focusAreas : ['DSA & problem solving', 'HR & behavioural'];
  const wellnessOn = D.p.wellness !== 'No';
  const wellnessFreq = D.p.wellness === 'Yes, 3x/week' ? 3 : 5;

  const items = [];
  function add(domain, title, detail, priority, deadline, meta) {
    const p = priN(priority);
    let urg = 0.5;
    if (deadline) { const dl = (new Date(deadline) - new Date()) / 86400000; urg = Math.max(0, Math.min(1, 1 - dl / 90)); }
    items.push({ domain, title, detail, score: p + urg * 2, meta: meta || {} });
  }

  if (hC) cTopics.forEach(topic => { const bank = CODING_CONTENT[topic] || []; bank.forEach(([t, d], i) => add('coding', 'Coding — ' + t, d, D.c.priority, D.c.deadline, { topic, bankIdx: i })); });
  if (hI) iTopics.forEach(topic => { const bank = INTERVIEW_CONTENT[topic] || []; bank.forEach(([t, d]) => add('interview', 'Interview — ' + t, d, D.i.priority, D.i.deadline, { topic })); });
  if (hW) {
    const plan = WORKOUT_PLANS[wGoal] || WORKOUT_PLANS.maintenance;
    DAYS.forEach((_, di) => {
      if (!wDays.includes(di)) return;
      const [focus, ex] = plan[di] || ['Workout', ['Exercise']];
      const copies = Math.max(1, maxPerDay.workout || 1);
      for (let cpy = 0; cpy < copies; cpy++) {
        const suffix = copies > 1 ? ` (session ${cpy + 1})` : '';
        add('workout', 'Workout — ' + focus + suffix, ex.slice(0, 3).join(' · '), D.w.priority, '', { focus, exercises: ex, wGoal, di });
      }
    });
  }
  if (hM) DAYS.forEach((_, di) => add('music', 'Music — ' + (D.m.instrument || 'Practice'), 'Focused practice: scales, technique, piece', D.m.priority, '', { di }));
  if (hL) DAYS.forEach((_, di) => add('language', 'Language — ' + (D.l.lang || 'Practice'), 'Vocab: 20 words · Speaking: 15 min practice · Duolingo streak', D.l.priority, '', { di }));
  if (hCr) DAYS.forEach((_, di) => add('creative', 'Creative — ' + (D.cr.medium || 'Art'), 'Focused session: warmup sketches → technique → project', D.cr.priority, '', { di }));
  if (hS && D.st.subject) DAYS.forEach((_, di) => add('study', 'Study — ' + D.st.subject, 'Deep study: concepts → examples → practice problems', D.st.priority, D.st.deadline, { di }));

  items.sort((a, b) => b.score - a.score);

  const guaranteed = {};
  D.domains.forEach(d => { guaranteed[d] = false; });

  const grid = Array.from({ length: 5 }, () => new Array(8).fill(null));
  const blocked = Array.from({ length: 5 }, () => new Array(8).fill(false));
  const placedCount = Array.from({ length: 5 }, () => ({}));

  (D.p.unavailableRanges || []).forEach((r) => {
    if (!r || !r.from || !r.to) return;
    const fs = toStartSlotIndex(r.from);
    const ts = toEndSlotIndex(r.to);
    if (fs >= ts) return;
    for (let d = 0; d < 5; d++) {
      for (let s = fs; s < ts && s < 8; s++) {
        if (s >= 0) blocked[d][s] = true;
      }
    }
  });

  for (let d = 0; d < 5; d++) {
    for (let s = 0; s < 8; s++) {
      if (blocked[d][s]) {
        grid[d][s] = {
          type: 'break',
          title: '⛔ Unavailable',
          detail: 'Blocked as per your availability settings',
          tag: 'break'
        };
      }
    }
  }

  function canPlace(domain, dayIdx, slotIdx) {
    if (blocked[dayIdx][slotIdx]) return false;
    const limit = maxPerDay[domain] || 1;
    return (placedCount[dayIdx][domain] || 0) < limit;
  }

  function markPlaced(domain, dayIdx) {
    placedCount[dayIdx][domain] = (placedCount[dayIdx][domain] || 0) + 1;
  }

  // Lock lunch slot
  const lData = LUNCH[wGoal] || LUNCH.maintenance;
  for (let d2 = 0; d2 < 5; d2++) {
    const meal = lData.meals[d2 % lData.meals.length];
    if (!blocked[d2][4]) {
      grid[d2][4] = { type: 'break', title: '🍱 Lunch break', detail: meal, tag: 'break', isLunch: true, lunchNote: lData.note };
    }
  }

  // Place wellness
  if (wellnessOn) {
    let wDayCount = 0;
    for (let d3 = 0; d3 < 5 && wDayCount < wellnessFreq; d3++) {
      const ws = WELLNESS_SLOTS[d3 % WELLNESS_SLOTS.length];
      if (grid[d3][0] === null && !blocked[d3][0]) { grid[d3][0] = { type: 'well', title: ws.title, detail: ws.detail, tag: 'well', link: ws.link }; wDayCount++; }
    }
  }

  // Place workout at preferred slot
  if (hW) {
    const plan2 = WORKOUT_PLANS[wGoal] || WORKOUT_PLANS.maintenance;
    wDays.forEach(di2 => {
      const [focus2, ex2] = plan2[di2] || ['Workout', ['Exercise']];
    const prefSlots = workoutPrefSlots.length ? workoutPrefSlots : [7];
      let placed = false;
      for (let i = 0; i < prefSlots.length; i++) {
        const sl = prefSlots[i];
        if (sl >= 0 && sl < 8 && grid[di2][sl] === null && canPlace('workout', di2, sl)) {
          grid[di2][sl] = { type: 'workout', title: 'Workout — ' + focus2, detail: ex2.slice(0, 3).join(' · '), tag: 'workout', focus: focus2, exercises: ex2, ytLink: WORKOUT_VID[focus2] || 'https://youtube.com/results?search_query=workout+tutorial' };
          markPlaced('workout', di2);
          guaranteed['workout'] = true;
          placed = true;
          break;
        }
      }
      if (!placed) {
        for (let sl = 0; sl < 8; sl++) {
          if (grid[di2][sl] === null && canPlace('workout', di2, sl)) {
            grid[di2][sl] = { type: 'workout', title: 'Workout — ' + focus2, detail: ex2.slice(0, 3).join(' · '), tag: 'workout', focus: focus2, exercises: ex2, ytLink: WORKOUT_VID[focus2] || 'https://youtube.com/results?search_query=workout+tutorial' };
            markPlaced('workout', di2);
            guaranteed['workout'] = true;
            break;
          }
        }
      }
    });
  }

  // Greedy placement
  const seen = new Set();
  items.forEach(item => {
    const key = item.domain + ':' + item.title;
    if (seen.has(key)) return;
    seen.add(key);
    let placed = false;
    const prefSlots = preferredSlotsFromLabels((taskPrefs[item.domain] && taskPrefs[item.domain].times) || []);
    const passes = [prefSlots, [0, 1, 2, 3, 4, 5, 6, 7]];
    for (let pass = 0; pass < passes.length && !placed; pass++) {
      for (let dd = 0; dd < 5 && !placed; dd++) {
        for (let pi = 0; pi < passes[pass].length && !placed; pi++) {
          const ss = passes[pass][pi];
          if (grid[dd][ss] === null && canPlace(item.domain, dd, ss)) {
          const cell = { type: item.domain, title: item.title, detail: item.detail, tag: item.domain };
          if (item.domain === 'coding' && item.meta.topic) {
            const lcs = LEETCODE[item.meta.topic] || [];
            const gfg = GFG[item.meta.topic];
            cell.lc = lcs[item.meta.bankIdx % Math.max(lcs.length, 1)];
            cell.gfg = gfg; cell.topic = item.meta.topic;
          }
          if (item.domain === 'workout') { cell.ytLink = WORKOUT_VID[item.meta.focus] || ''; cell.exercises = item.meta.exercises || []; cell.focus = item.meta.focus; }
          if (item.domain === 'music') { const inst = D.m.instrument || 'Guitar'; cell.ytLink = MUSIC_VID[inst] || 'https://youtube.com/results?search_query=music+tutorial'; cell.gfgLink = MUSIC_GFG; }
          if (item.domain === 'language') { const lang = D.l.lang || 'Spanish'; const ll = LANG_LINKS[lang] || defaultLangLink; cell.duoLink = ll.duo; cell.ytLink = ll.yt; }
          if (item.domain === 'creative') { const med = D.cr.medium || 'Drawing / Sketching'; cell.ytLink = CREATIVE_VID[med] || ''; cell.gfgLink = CREATIVE_GFG[med] || ''; }
          if (item.domain === 'well') cell.link = item.meta.link;
          grid[dd][ss] = cell;
          markPlaced(item.domain, dd);
          if (!guaranteed[item.domain]) guaranteed[item.domain] = true;
          placed = true;
        }
      }
    }
    }
  });

  // Guarantee pass
  D.domains.forEach(dom => {
    if (guaranteed[dom]) return;
    for (let dd2 = 0; dd2 < 5; dd2++) {
      for (let ss2 = 0; ss2 < 8; ss2++) {
        if ((grid[dd2][ss2] === null || (grid[dd2][ss2].type === 'break' && ss2 !== 4)) && canPlace(dom, dd2, ss2)) {
          grid[dd2][ss2] = { type: dom, title: dom.charAt(0).toUpperCase() + dom.slice(1) + ' session', detail: 'Catch-up session — review notes & practice', tag: dom };
          markPlaced(dom, dd2);
          guaranteed[dom] = true; return;
        }
      }
    }
  });

  // Fill remaining
  const fills = [
    { type: 'break', title: '📖 Deep work review', detail: "Summarise today's learnings, update notes", tag: 'break' },
    { type: 'break', title: '☀️ Morning planning', detail: "Review goals, prioritise today's tasks", tag: 'break' },
    { type: 'break', title: '🔄 Cross-domain revision', detail: 'Quick revision from another domain', tag: 'break' },
    { type: 'break', title: '📋 Wrap-up & reflect', detail: 'Tick tasks, plan tomorrow, reflect on progress', tag: 'break' }
  ];
  let fi = 0;
  for (let d4 = 0; d4 < 5; d4++) for (let s4 = 0; s4 < 8; s4++) if (!grid[d4][s4]) grid[d4][s4] = fills[(fi++) % fills.length];

  const timetable = {};
  DAYS.forEach((day, di3) => { timetable[day] = grid[di3].map((cell, si) => ({ time: SLOTS[si], ...cell })); });

  return { timetable, domains: D.domains, coding: D.c, workout: D.w, interview: D.i, music: D.m, language: D.l, creative: D.cr, study: D.st, prefs: D.p, userName: D.userName, created: new Date().toISOString() };
}

export function scheduleNotifsSetup(timetable, userName, addNotif, showToast) {
  const today = DAYS[Math.min(new Date().getDay() - 1, 4)];
  const slots = timetable[today] || timetable['Monday'] || [];
  const nq = [];
  slots.forEach((c, si) => {
    if (c.type === 'break') return;
    const icon = { coding: '💻', workout: '🏋️', interview: '📋', music: '🎵', language: '🗣️', creative: '🎨', study: '📝', well: '🧘' }[c.type] || '📌';
    nq.push({ icon, title: `Hey ${userName}! It's ${SLOTS[si]} — time to: ${c.title}`, sub: c.lc ? 'Practice: ' + c.lc.n : c.ytLink ? 'Watch tutorial for this session' : c.detail.slice(0, 60), link: c.lc ? c.lc.u : (c.ytLink || c.duoLink || c.link || null), hour: SLOT_HOURS[si], fired: false, ts: 'Upcoming' });
  });
  nq.slice(0, 3).forEach(n => addNotif(n));
  const ntimer = setInterval(() => {
    const h = new Date().getHours();
    nq.forEach(n => { if (n.hour === h && !n.fired) { n.fired = true; n.ts = new Date().toLocaleTimeString(); addNotif(n); showToast(n.icon + ' ' + n.title); } });
  }, 60000);
  setTimeout(() => showToast('💡 Export to Google Calendar for phone notifications!'), 3000);
  return ntimer;
}

export function exportGCal(GS, userName) {
  if (!GS || !GS.timetable) return false;
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(monday.getDate() - (monday.getDay() || 7) + 1);
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SmartSchedule Pro//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  const dayOffsets = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4 };
  Object.entries(GS.timetable).forEach(([day, slots]) => {
    slots.forEach(cell => {
      if (cell.type === 'break') return;
      const d = new Date(monday); d.setDate(d.getDate() + dayOffsets[day]);
      const h = parseInt(cell.time.split(':')[0]);
      const start = new Date(d); start.setHours(h, 0, 0);
      const end = new Date(start); end.setHours(h + 1, 0, 0);
      const fmt = dt => dt.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
      ics.push('BEGIN:VEVENT', 'DTSTART:' + fmt(start), 'DTEND:' + fmt(end), 'SUMMARY:' + cell.title, 'DESCRIPTION:' + cell.detail + (cell.lc ? '\\nLeetCode: ' + cell.lc.u : '') + (cell.ytLink ? '\\nTutorial: ' + cell.ytLink : '') + (cell.duoLink ? '\\nDuolingo: ' + cell.duoLink : ''), 'END:VEVENT');
    });
  });
  ics.push('END:VCALENDAR');
  const blob = new Blob([ics.join('\r\n')], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'SmartSchedule_' + (userName || 'Schedule').replace(/\s/g, '_') + '.ics';
  a.click();
  return true;
}
