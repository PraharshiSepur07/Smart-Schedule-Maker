import {
  DAYS, SLOTS, SLOT_HOURS, SLOT_MINUTES,
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
  const m = label.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const mins = parseInt(m[2] || '0', 10);
  const ap = m[3] ? m[3].toUpperCase() : null;
  if (ap) {
    if (ap === 'PM' && h !== 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
  }
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

function parseMinutesPerDay(value, fallback = 60) {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  const m = String(value || '').match(/(\d+)/);
  return m ? Math.max(1, parseInt(m[1], 10)) : fallback;
}

const PERIOD_WINDOWS = {
  morning: [[6, 12]],
  afternoon: [[12, 17]],
  evening: [[17, 22]],
  night: [[22, 24], [0, 6]],
};

function slotsForPeriod(period) {
  const windows = PERIOD_WINDOWS[String(period || '').toLowerCase()] || [];
  const slots = new Set();
  windows.forEach(([startHour, endHour]) => {
    SLOT_HOURS.forEach((slotHour, idx) => {
      const inRange = startHour < endHour
        ? slotHour >= startHour && slotHour < endHour
        : slotHour >= startHour || slotHour < endHour;
      if (inRange) slots.add(idx);
    });
  });
  return Array.from(slots).sort((a, b) => a - b);
}

function buildSessionDurations(minutesPerDay) {
  const total = Math.max(30, Math.round(Number(minutesPerDay) || 60));
  if (total <= 60) return [total];

  const durations = [];
  let remaining = total;
  while (remaining > 0) {
    if (remaining <= 60) {
      if (remaining < 30 && durations.length) {
        durations[durations.length - 1] += remaining;
      } else {
        durations.push(Math.max(30, remaining));
      }
      break;
    }

    const afterSixty = remaining - 60;
    if (afterSixty > 0 && afterSixty < 30) {
      durations.push(remaining);
      break;
    }

    durations.push(60);
    remaining -= 60;
  }

  return durations;
}

function preferredSlotsFromLabels(labels, periods = []) {
  if ((!Array.isArray(labels) || !labels.length) && (!Array.isArray(periods) || !periods.length)) {
    return Array.from({ length: SLOT_HOURS.length }, (_, i) => i);
  }
  const allSlots = new Set();
  (labels || []).forEach((label) => {
    const v = String(label || '');
    const range = v.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (range) {
      const sh = parseInt(range[1], 10);
      const sm = parseInt(range[2], 10);
      const eh = parseInt(range[3], 10);
      const em = parseInt(range[4], 10);
      const start = sh + sm / 60;
      const end = eh + em / 60;
      SLOT_HOURS.forEach((slotHour, idx) => {
        const inRange = start < end
          ? slotHour >= start && slotHour < end
          : slotHour >= start || slotHour < end;
        if (inRange) allSlots.add(idx);
      });
      return;
    }

    const m = v.match(/(\d{1,2})(?::(\d{2}))?/);
    if (m) {
      const startH = parseInt(m[1], 10);
      const startM = parseInt(m[2] || '0', 10);
      const start = startH + startM / 60;
      let bestIdx = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      SLOT_HOURS.forEach((slotHour, idx) => {
        const dist = Math.abs(slotHour - start);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = idx;
        }
      });
      allSlots.add(bestIdx);
    }
  });
  (periods || []).forEach((period) => {
    const windows = PERIOD_WINDOWS[String(period || '').toLowerCase()] || [];
    windows.forEach(([startHour, endHour]) => {
      SLOT_HOURS.forEach((slotHour, idx) => {
        const inRange = startHour < endHour
          ? slotHour >= startHour && slotHour < endHour
          : slotHour >= startHour || slotHour < endHour;
        if (inRange) allSlots.add(idx);
      });
    });
  });
  return allSlots.size ? Array.from(allSlots).sort((a, b) => a - b) : Array.from({ length: SLOT_HOURS.length }, (_, i) => i);
}

function sessionDurationForDomain(domain, itemMeta, domainPlan) {
  const fromMeta = Number(itemMeta && itemMeta.durationMinutes);
  if (Number.isFinite(fromMeta) && fromMeta > 0) return Math.max(30, Math.round(fromMeta));
  const fromPlan = Number(domainPlan && domainPlan[domain] && domainPlan[domain].minutesPerSession);
  if (Number.isFinite(fromPlan) && fromPlan > 0) return Math.max(30, Math.round(fromPlan));
  return 60;
}

function slotsNeededForDuration(durationMinutes) {
  const mins = Number(durationMinutes);
  if (!Number.isFinite(mins) || mins <= 0) return 1;
  return Math.max(1, Math.ceil(mins / SLOT_MINUTES));
}

function buildStudyGuideLink(subject) {
  const q = encodeURIComponent(String(subject || 'study').trim());
  return `https://www.khanacademy.org/search?page_search_query=${q}`;
}

function buildStudyYouTubeLink(subject) {
  const q = encodeURIComponent(`${String(subject || 'study').trim()} tutorial`);
  return `https://www.youtube.com/results?search_query=${q}`;
}

function buildStudyGfgLink(subject) {
  const q = encodeURIComponent(String(subject || 'study').trim());
  return `https://www.geeksforgeeks.org/?s=${q}`;
}

function getMondayStart(offsetWeeks = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const jsDay = d.getDay();
  const deltaToMonday = jsDay === 0 ? -6 : 1 - jsDay;
  d.setDate(d.getDate() + deltaToMonday + offsetWeeks * 7);
  return d;
}

function getScheduleWeekCount(deadlineStr) {
  if (!deadlineStr) return 1;
  const deadline = new Date(deadlineStr);
  if (Number.isNaN(deadline.getTime())) return 1;
  deadline.setHours(23, 59, 59, 999);
  const start = getMondayStart(0);
  const diffDays = Math.max(0, Math.ceil((deadline - start) / 86400000));
  return Math.max(1, Math.min(12, Math.ceil((diffDays + 1) / 7)));
}

function formatHeaderDate(dateObj) {
  return dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function buildWeekDates(offsetWeeks) {
  const monday = getMondayStart(offsetWeeks);
  const map = {};
  DAYS.forEach((day, idx) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + idx);
    map[day] = formatHeaderDate(d);
  });
  return { startDate: monday.toISOString().slice(0, 10), dates: map };
}

function cloneWeekWithShift(timetable, weekShift) {
  const out = {};
  DAYS.forEach((day) => {
    const src = timetable[day] || [];
    out[day] = src.map((cell) => {
      if (!cell) return null;
      const next = { ...cell };
      if (next.type === 'coding' && next.topic) {
        const bank = CODING_CONTENT[next.topic] || [];
        if (bank.length) {
          const baseIdx = Number.isFinite(Number(next.bankIdx)) ? Number(next.bankIdx) : 0;
          const idx = (baseIdx + weekShift) % bank.length;
          const [t, d] = bank[idx];
          next.title = 'Coding — ' + t;
          next.detail = d;
          const lcs = LEETCODE[next.topic] || [];
          if (lcs.length) next.lc = lcs[idx % lcs.length];
          next.gfg = GFG[next.topic];
          next.bankIdx = idx;
        }
      }
      if (next.type === 'interview' && next.topic) {
        const bank = INTERVIEW_CONTENT[next.topic] || [];
        if (bank.length) {
          const baseIdx = Number.isFinite(Number(next.bankIdx)) ? Number(next.bankIdx) : 0;
          const idx = (baseIdx + weekShift) % bank.length;
          const [t, d] = bank[idx];
          next.title = 'Interview — ' + t;
          next.detail = d;
          next.bankIdx = idx;
        }
      }
      return next;
    });
  });
  return out;
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
  const workoutPrefSlots = preferredSlotsFromLabels((taskPrefs.workout && taskPrefs.workout.times) || [], (taskPrefs.workout && taskPrefs.workout.periods) || []);
  const workoutPrefPeriods = Array.isArray(taskPrefs.workout && taskPrefs.workout.periods) ? taskPrefs.workout.periods : [];
  const domainPlan = {};
  const maxPerDay = {};
  D.domains.forEach((dom) => {
    const taskPref = taskPrefs[dom] || {};
    const explicitSlots = taskPref.slotsPerDay;
    const taskPrefMinutes = taskPref.minutesPerDay;
    const fallbackMinutes = dom === 'workout'
      ? parseSlotsPerDay(D.p.wSlots, 1) * 60
      : dom === 'study'
        ? parseSlotsPerDay(D.p.sSlots, 1) * 60
        : 60;
    
    const minutesPerDay = parseMinutesPerDay(taskPrefMinutes, fallbackMinutes);
    const sessionDurations = buildSessionDurations(minutesPerDay);

    let slotsPerDay = sessionDurations.length;
    if (explicitSlots !== undefined && explicitSlots !== null && Number.isFinite(Number(explicitSlots))) {
      slotsPerDay = Math.max(1, Math.min(SLOT_HOURS.length, Number(explicitSlots)));
    } else if (taskPrefMinutes !== undefined && taskPrefMinutes !== null) {
      slotsPerDay = sessionDurations.length;
    }

    domainPlan[dom] = {
      minutesPerDay,
      slotsPerDay,
      sessionDurations,
      minutesPerSession: Math.max(30, Math.round(minutesPerDay / Math.max(1, slotsPerDay)))
    };
    maxPerDay[dom] = slotsPerDay;
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
  if (hI) iTopics.forEach(topic => { const bank = INTERVIEW_CONTENT[topic] || []; bank.forEach(([t, d], i) => add('interview', 'Interview — ' + t, d, D.i.priority, D.i.deadline, { topic, bankIdx: i })); });
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
  if (hM) {
    const mins = (domainPlan.music && domainPlan.music.minutesPerSession) || 60;
    const copies = Math.max(1, maxPerDay.music || 1);
    DAYS.forEach((_, di) => {
      for (let cpy = 0; cpy < copies; cpy++) {
        const suffix = copies > 1 ? ` (session ${cpy + 1})` : '';
        add(
          'music',
          'Music — ' + (D.m.instrument || 'Practice') + suffix,
          `Focused practice (${mins} min): scales, technique, piece`,
          D.m.priority,
          '',
          { di, durationMinutes: mins }
        );
      }
    });
  }
  if (hL) {
    const mins = (domainPlan.language && domainPlan.language.minutesPerSession) || 60;
    const copies = Math.max(1, maxPerDay.language || 1);
    DAYS.forEach((_, di) => {
      for (let cpy = 0; cpy < copies; cpy++) {
        const suffix = copies > 1 ? ` (session ${cpy + 1})` : '';
        add(
          'language',
          'Language — ' + (D.l.lang || 'Practice') + suffix,
          `Language block (${mins} min): vocab, speaking practice, Duolingo`,
          D.l.priority,
          '',
          { di, durationMinutes: mins }
        );
      }
    });
  }
  if (hCr) {
    const copies = Math.max(1, maxPerDay.creative || 1);
    DAYS.forEach((_, di) => {
      for (let cpy = 0; cpy < copies; cpy++) {
        const suffix = copies > 1 ? ` (session ${cpy + 1})` : '';
        add('creative', 'Creative — ' + (D.cr.medium || 'Art') + suffix, 'Focused session: warmup sketches → technique → project', D.cr.priority, '', { di });
      }
    });
  }
  if (hS && D.st.subject) {
    const copies = Math.max(1, maxPerDay.study || 1);
    DAYS.forEach((_, di) => {
      for (let cpy = 0; cpy < copies; cpy++) {
        const suffix = copies > 1 ? ` (session ${cpy + 1})` : '';
        add('study', 'Study — ' + D.st.subject + suffix, 'Deep study: concepts → examples → practice problems', D.st.priority, D.st.deadline, { di });
      }
    });
  }

  items.sort((a, b) => b.score - a.score);

  const guaranteed = {};
  D.domains.forEach(d => { guaranteed[d] = false; });

  const slotCount = SLOT_HOURS.length;
  const allSlotIndexes = Array.from({ length: slotCount }, (_, i) => i);
  const grid = Array.from({ length: 5 }, () => new Array(slotCount).fill(null));
  const blocked = Array.from({ length: 5 }, () => new Array(slotCount).fill(false));
  const occupied = Array.from({ length: 5 }, () => new Array(slotCount).fill(false));
  const placedCount = Array.from({ length: 5 }, () => ({}));

  (D.p.unavailableRanges || []).forEach((r) => {
    if (!r || !r.from || !r.to) return;
    const fs = toStartSlotIndex(r.from);
    const ts = toEndSlotIndex(r.to);
    if (fs === ts) return;
    for (let d = 0; d < 5; d++) {
      if (fs < ts) {
        for (let s = fs; s < ts && s < slotCount; s++) {
          if (s >= 0) blocked[d][s] = true;
        }
      } else {
        // Overnight block (e.g. 23:00 -> 06:00)
        for (let s = fs; s < slotCount; s++) blocked[d][s] = true;
        for (let s = 0; s < ts; s++) blocked[d][s] = true;
      }
    }
  });

  for (let d = 0; d < 5; d++) {
    for (let s = 0; s < slotCount; s++) {
      if (blocked[d][s]) {
        occupied[d][s] = true;
        grid[d][s] = {
          type: 'break',
          title: '⛔ Unavailable',
          detail: 'Blocked as per your availability settings',
          tag: 'break'
        };
      }
    }
  }

  function canPlace(domain, dayIdx, slotIdx, durationMinutes = 60) {
    const needed = slotsNeededForDuration(durationMinutes);
    if (slotIdx < 0 || slotIdx + needed > slotCount) return false;
    for (let k = 0; k < needed; k++) {
      if (blocked[dayIdx][slotIdx + k] || occupied[dayIdx][slotIdx + k]) return false;
    }
    const limit = maxPerDay[domain] || 1;
    return (placedCount[dayIdx][domain] || 0) < limit;
  }

  function markPlaced(domain, dayIdx, slotIdx, durationMinutes = 60, title = 'Session') {
    placedCount[dayIdx][domain] = (placedCount[dayIdx][domain] || 0) + 1;
    const needed = slotsNeededForDuration(durationMinutes);
    for (let k = 0; k < needed; k++) {
      const si = slotIdx + k;
      if (si >= slotCount) break;
      occupied[dayIdx][si] = true;
      if (k > 0 && grid[dayIdx][si] === null) {
        grid[dayIdx][si] = {
          type: 'break',
          title: '',
          detail: title,
          tag: 'break',
          isContinuation: true,
          continuationOf: title
        };
      }
    }

    const relaxDomains = domain === 'coding' || domain === 'interview';
    const needsMoreSessions = (placedCount[dayIdx][domain] || 0) < (maxPerDay[domain] || 1);
    if (relaxDomains && needsMoreSessions) {
      const relaxNeeded = slotsNeededForDuration(10);
      const relaxStart = slotIdx + needed;
      let canRelax = true;
      if (relaxStart + relaxNeeded > slotCount) canRelax = false;
      if (canRelax) {
        for (let k = 0; k < relaxNeeded; k++) {
          if (blocked[dayIdx][relaxStart + k] || occupied[dayIdx][relaxStart + k]) {
            canRelax = false;
            break;
          }
        }
      }
      if (canRelax) {
        for (let k = 0; k < relaxNeeded; k++) {
          const si = relaxStart + k;
          occupied[dayIdx][si] = true;
          if (k === 0) {
            grid[dayIdx][si] = {
              type: 'break',
              title: '😌 Relax break',
              detail: 'Quick reset: breathe, hydrate, stretch (10 min)',
              tag: 'break',
              durationMinutes: 10,
              isRelax: true
            };
          } else {
            grid[dayIdx][si] = {
              type: 'break',
              title: '',
              detail: 'Relax break in progress',
              tag: 'break',
              isContinuation: true,
              isRelax: true
            };
          }
        }
      }
    }
  }

  function placementPenalty(item, dayIdx, slotIdx) {
    let penalty = 0;
    const prev = slotIdx > 0 ? grid[dayIdx][slotIdx - 1] : null;
    const next = slotIdx < slotCount - 1 ? grid[dayIdx][slotIdx + 1] : null;

    // Avoid consecutive same-domain sessions to reduce fatigue.
    if (prev && prev.type === item.domain) penalty += 8;
    if (next && next.type === item.domain) penalty += 8;

    // Spread a domain across the day instead of stacking it.
    penalty += (placedCount[dayIdx][item.domain] || 0) * 3;

    // Slightly prefer slots adjacent to lighter/break sessions.
    if (prev && prev.type === 'break') penalty -= 1;
    if (next && next.type === 'break') penalty -= 1;

    return penalty;
  }

  function buildCellFromItem(item) {
    const cell = {
      type: item.domain,
      title: item.title,
      detail: item.detail,
      tag: item.domain,
      durationMinutes: sessionDurationForDomain(item.domain, item.meta, domainPlan)
    };
    if (item.domain === 'coding' && item.meta.topic) {
      const lcs = LEETCODE[item.meta.topic] || [];
      const gfg = GFG[item.meta.topic];
      cell.lc = lcs[item.meta.bankIdx % Math.max(lcs.length, 1)];
      cell.gfg = gfg;
      cell.topic = item.meta.topic;
      cell.bankIdx = item.meta.bankIdx;
    }
    if (item.domain === 'interview' && item.meta.topic) {
      cell.topic = item.meta.topic;
      cell.bankIdx = item.meta.bankIdx;
    }
    if (item.domain === 'workout') {
      cell.ytLink = WORKOUT_VID[item.meta.focus] || '';
      cell.exercises = item.meta.exercises || [];
      cell.focus = item.meta.focus;
    }
    if (item.domain === 'music') {
      const inst = D.m.instrument || 'Guitar';
      cell.ytLink = MUSIC_VID[inst] || 'https://youtube.com/results?search_query=music+tutorial';
      cell.gfgLink = MUSIC_GFG;
    }
    if (item.domain === 'language') {
      const lang = D.l.lang || 'Spanish';
      const ll = LANG_LINKS[lang] || defaultLangLink;
      cell.duoLink = ll.duo;
      cell.ytLink = ll.yt;
    }
    if (item.domain === 'creative') {
      const med = D.cr.medium || 'Drawing / Sketching';
      cell.ytLink = CREATIVE_VID[med] || '';
      cell.gfgLink = CREATIVE_GFG[med] || '';
    }
    if (item.domain === 'study') {
      const subject = D.st.subject || 'Study';
      cell.link = buildStudyGuideLink(subject);
      cell.ytLink = buildStudyYouTubeLink(subject);
      cell.gfgLink = buildStudyGfgLink(subject);
    }
    if (item.domain === 'well') cell.link = item.meta.link;
    return cell;
  }

  // Lock lunch slot
  const lData = LUNCH[wGoal] || LUNCH.maintenance;
  const lunchSlot = Math.max(0, SLOT_HOURS.indexOf(12));
  const lunchNeeded = slotsNeededForDuration(60);
  for (let d2 = 0; d2 < 5; d2++) {
    const meal = lData.meals[d2 % lData.meals.length];
    if (!blocked[d2][lunchSlot]) {
      grid[d2][lunchSlot] = { type: 'break', title: '🍱 Lunch break', detail: meal, tag: 'break', isLunch: true, lunchNote: lData.note, durationMinutes: 60 };
      for (let k = 0; k < lunchNeeded; k++) {
        const si = lunchSlot + k;
        if (si >= slotCount) break;
        occupied[d2][si] = true;
        if (k > 0 && grid[d2][si] === null) {
          grid[d2][si] = {
            type: 'break',
            title: '',
            detail: 'Lunch break in progress',
            tag: 'break',
            isContinuation: true,
            isLunch: true
          };
        }
      }
    }
  }

  // Place wellness
  if (wellnessOn) {
    let wDayCount = 0;
    for (let d3 = 0; d3 < 5 && wDayCount < wellnessFreq; d3++) {
      const ws = WELLNESS_SLOTS[d3 % WELLNESS_SLOTS.length];
      if (grid[d3][0] === null && !blocked[d3][0] && !occupied[d3][0]) {
        grid[d3][0] = { type: 'well', title: ws.title, detail: ws.detail, tag: 'well', link: ws.link, durationMinutes: 30 };
        occupied[d3][0] = true;
        wDayCount++;
      }
    }
  }

  // Place workout at preferred slot
  if (hW) {
    const plan2 = WORKOUT_PLANS[wGoal] || WORKOUT_PLANS.maintenance;
    wDays.forEach(di2 => {
      const [focus2, ex2] = plan2[di2] || ['Workout', ['Exercise']];
      const defaultWorkoutSlot = Math.max(0, SLOT_HOURS.indexOf(18));
      const prefSlots = workoutPrefSlots.length ? workoutPrefSlots : [defaultWorkoutSlot];
      const periodBuckets = workoutPrefPeriods.length
        ? workoutPrefPeriods.map((period) => slotsForPeriod(period)).filter((bucket) => bucket.length)
        : [];
      const workoutDurations = (domainPlan.workout && Array.isArray(domainPlan.workout.sessionDurations) && domainPlan.workout.sessionDurations.length)
        ? domainPlan.workout.sessionDurations
        : [sessionDurationForDomain('workout', {}, domainPlan)];
      const workoutSlotsForDay = Math.max(1, workoutDurations.length || maxPerDay.workout || 1);

      for (let copy = 0; copy < workoutSlotsForDay; copy++) {
        const workoutDuration = Math.max(30, Number(workoutDurations[copy] || workoutDurations[0] || 60));
        let placed = false;
        const candidateBuckets = periodBuckets.length
          ? [periodBuckets[copy % periodBuckets.length], prefSlots]
          : [prefSlots];

        for (let bi = 0; bi < candidateBuckets.length && !placed; bi++) {
          const candidateSlots = candidateBuckets[bi];
          for (let i = 0; i < candidateSlots.length; i++) {
            const sl = candidateSlots[(i + copy) % candidateSlots.length];
            if (sl >= 0 && sl < slotCount && grid[di2][sl] === null && canPlace('workout', di2, sl, workoutDuration)) {
              const suffix = workoutSlotsForDay > 1 ? ` (session ${copy + 1})` : '';
              grid[di2][sl] = {
                type: 'workout',
                title: 'Workout — ' + focus2 + suffix,
                detail: ex2.slice(0, 3).join(' · '),
                tag: 'workout',
                focus: focus2,
                exercises: ex2,
                durationMinutes: workoutDuration,
                ytLink: WORKOUT_VID[focus2] || 'https://youtube.com/results?search_query=workout+tutorial'
              };
              markPlaced('workout', di2, sl, workoutDuration, 'Workout — ' + focus2 + suffix);
              guaranteed['workout'] = true;
              placed = true;
              break;
            }
          }
        }
        if (!placed) {
          for (let sl = 0; sl < slotCount; sl++) {
            if (grid[di2][sl] === null && canPlace('workout', di2, sl, workoutDuration)) {
              const suffix = workoutSlotsForDay > 1 ? ` (session ${copy + 1})` : '';
              grid[di2][sl] = {
                type: 'workout',
                title: 'Workout — ' + focus2 + suffix,
                detail: ex2.slice(0, 3).join(' · '),
                tag: 'workout',
                focus: focus2,
                exercises: ex2,
                durationMinutes: workoutDuration,
                ytLink: WORKOUT_VID[focus2] || 'https://youtube.com/results?search_query=workout+tutorial'
              };
              markPlaced('workout', di2, sl, workoutDuration, 'Workout — ' + focus2 + suffix);
              guaranteed['workout'] = true;
              break;
            }
          }
        }
      }
    });
  }

  // Greedy placement
  items.forEach(item => {
    const taskPref = taskPrefs[item.domain] || {};
    const prefSlots = preferredSlotsFromLabels(taskPref.times || [], taskPref.periods || []);
    const hasExplicitPref = (Array.isArray(taskPref.times) && taskPref.times.length > 0) || (Array.isArray(taskPref.periods) && taskPref.periods.length > 0);
    const passes = hasExplicitPref ? [prefSlots] : [prefSlots, allSlotIndexes];
    for (let pass = 0; pass < passes.length; pass++) {
      let best = null;
      for (let dd = 0; dd < 5; dd++) {
        if (Number.isInteger(item.meta.di) && dd !== item.meta.di) continue;
        for (let pi = 0; pi < passes[pass].length; pi++) {
          const ss = passes[pass][pi];
          const duration = sessionDurationForDomain(item.domain, item.meta, domainPlan);
          if (grid[dd][ss] !== null || !canPlace(item.domain, dd, ss, duration)) continue;
          const score = placementPenalty(item, dd, ss);
          if (!best || score < best.score) best = { dd, ss, score };
        }
      }
      if (best) {
        const cell = buildCellFromItem(item);
        grid[best.dd][best.ss] = cell;
        markPlaced(item.domain, best.dd, best.ss, cell.durationMinutes, cell.title);
        if (!guaranteed[item.domain]) guaranteed[item.domain] = true;
        break;
      }
    }
  });

  // Guarantee pass
  D.domains.forEach(dom => {
    if (guaranteed[dom]) return;
    for (let dd2 = 0; dd2 < 5; dd2++) {
      for (let ss2 = 0; ss2 < slotCount; ss2++) {
        const fallbackDuration = sessionDurationForDomain(dom, {}, domainPlan);
        if ((grid[dd2][ss2] === null || (grid[dd2][ss2].type === 'break' && ss2 !== lunchSlot)) && canPlace(dom, dd2, ss2, fallbackDuration)) {
          grid[dd2][ss2] = {
            type: dom,
            title: dom.charAt(0).toUpperCase() + dom.slice(1) + ' session',
            detail: 'Catch-up session — review notes & practice',
            tag: dom,
            durationMinutes: fallbackDuration
          };
          markPlaced(dom, dd2, ss2, fallbackDuration, dom.charAt(0).toUpperCase() + dom.slice(1) + ' session');
          guaranteed[dom] = true; return;
        }
      }
    }
  });

  const timetable = {};
  DAYS.forEach((day, di3) => {
    timetable[day] = grid[di3].map((cell, si) => (cell ? ({ time: SLOTS[si], ...cell }) : null));
  });

  const totalWeeks = getScheduleWeekCount(D.p && D.p.scheduleDeadline);
  const weeks = Array.from({ length: totalWeeks }, (_, wi) => {
    const wk = buildWeekDates(wi);
    return {
      weekIndex: wi,
      startDate: wk.startDate,
      dates: wk.dates,
      timetable: wi === 0 ? timetable : cloneWeekWithShift(timetable, wi),
      label: `Week ${wi + 1}`
    };
  });

  return {
    timetable,
    weeks,
    domains: D.domains,
    coding: D.c,
    workout: D.w,
    interview: D.i,
    music: D.m,
    language: D.l,
    creative: D.cr,
    study: D.st,
    prefs: D.p,
    userName: D.userName,
    created: new Date().toISOString()
  };
}

export function scheduleNotifsSetup(timetable, userName, addNotif, showToast) {
  const today = DAYS[Math.min(new Date().getDay() - 1, 4)];
  const slots = timetable[today] || timetable['Monday'] || [];
  const nq = [];
  slots.forEach((c, si) => {
    if (!c || c.type === 'break') return;
    const icon = { coding: '💻', workout: '🏋️', interview: '📋', music: '🎵', language: '🗣️', creative: '🎨', study: '📝', well: '🧘' }[c.type] || '📌';
    const slotHour = SLOT_HOURS[si];
    const hour = Math.floor(slotHour);
    const minute = Math.round((slotHour - hour) * 60);
    nq.push({ icon, title: `Hey ${userName}! It's ${SLOTS[si]} — time to: ${c.title}`, sub: c.lc ? 'Practice: ' + c.lc.n : c.ytLink ? 'Watch tutorial for this session' : c.detail.slice(0, 60), link: c.lc ? c.lc.u : (c.ytLink || c.duoLink || c.link || null), hour, minute, fired: false, ts: 'Upcoming' });
  });
  nq.slice(0, 3).forEach(n => addNotif(n));
  const ntimer = setInterval(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    nq.forEach(n => {
      if (n.hour === h && n.minute === m && !n.fired) {
        n.fired = true;
        n.ts = now.toLocaleTimeString();
        addNotif(n);
        showToast(n.icon + ' ' + n.title);
      }
    });
  }, 60000);
  setTimeout(() => showToast('💡 Export to Google Calendar for phone notifications!'), 3000);
  return ntimer;
}

export function exportGCal(GS, userName, accountHint = '') {
  if (!GS || !GS.timetable) return false;
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(monday.getDate() - (monday.getDay() || 7) + 1);
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SmartSchedule Pro//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  const dayOffsets = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4 };
  if (accountHint) ics.push('X-WR-CALNAME:SmartSchedule for ' + accountHint);

  const weekBlocks = Array.isArray(GS.weeks) && GS.weeks.length
    ? GS.weeks
    : [{ startDate: monday.toISOString().slice(0, 10), timetable: GS.timetable }];

  weekBlocks.forEach((week) => {
    const weekStart = new Date(week.startDate + 'T00:00:00');
    Object.entries(week.timetable || {}).forEach(([day, slots]) => {
      slots.forEach(cell => {
        if (!cell || cell.type === 'break') return;
        const d = new Date(weekStart);
        d.setDate(d.getDate() + (dayOffsets[day] || 0));
        const mm = String(cell.time || '').match(/^(\d{2}):(\d{2})/);
        const h = mm ? parseInt(mm[1], 10) : 8;
        const mins = mm ? parseInt(mm[2], 10) : 0;
        const start = new Date(d); start.setHours(h, mins, 0);
        const end = new Date(start);
        const duration = Number(cell.durationMinutes);
        end.setMinutes(start.getMinutes() + (Number.isFinite(duration) && duration > 0 ? duration : 60));
        const fmt = dt => dt.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
        ics.push(
          'BEGIN:VEVENT',
          'DTSTART:' + fmt(start),
          'DTEND:' + fmt(end),
          'SUMMARY:' + cell.title,
          'DESCRIPTION:' + cell.detail + (cell.lc ? '\\nLeetCode: ' + cell.lc.u : '') + (cell.ytLink ? '\\nTutorial: ' + cell.ytLink : '') + (cell.duoLink ? '\\nDuolingo: ' + cell.duoLink : ''),
          'END:VEVENT'
        );
      });
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
