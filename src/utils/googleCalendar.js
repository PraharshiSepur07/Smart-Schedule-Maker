const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const GOOGLE_GSI_SRC = 'https://accounts.google.com/gsi/client';
const LAST_SYNC_HASH_KEY = 'ssp_google_last_sync_hash_v1';
const BATCH_DELAY_MS = 180;

let gsiLoadPromise = null;
const sessionSyncedEventKeys = new Set();

function getClientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
}

function isLikelyValidClientId(clientId) {
  return /\.apps\.googleusercontent\.com$/i.test(String(clientId || '').trim());
}

function toSyncError(code, message, detail) {
  const err = new Error(message);
  err.code = code;
  if (detail !== undefined) err.detail = detail;
  return err;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    const out = {};
    Object.keys(value).sort().forEach((k) => {
      out[k] = stableValue(value[k]);
    });
    return out;
  }
  return value;
}

function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash.toString(16);
}

function getScheduleSyncHash(schedule) {
  try {
    const stable = stableValue({
      weeks: schedule?.weeks || [],
      timetable: schedule?.timetable || {},
      domains: schedule?.domains || [],
      prefs: schedule?.prefs || {},
      details: schedule?.details || {},
    });
    return hashString(JSON.stringify(stable));
  } catch {
    return '';
  }
}

export function getGoogleSyncSetupState() {
  const clientId = getClientId();
  if (!clientId) {
    return {
      configured: false,
      reason: 'missing-client-id',
      message: 'Google Calendar Sync is not configured. Missing VITE_GOOGLE_CLIENT_ID.'
    };
  }
  if (!isLikelyValidClientId(clientId)) {
    return {
      configured: false,
      reason: 'invalid-client-id',
      message: 'Google Calendar Sync is not configured. VITE_GOOGLE_CLIENT_ID appears invalid.'
    };
  }
  return { configured: true, reason: '', message: '' };
}

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gsiLoadPromise) return gsiLoadPromise;

  gsiLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GOOGLE_GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity script')),
        { once: true });
      if (window.google?.accounts?.oauth2) resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity script'));
    document.head.appendChild(script);
  });

  return gsiLoadPromise;
}

function parseSlotStart(slotLabel) {
  const match = String(slotLabel || '').match(/^(\d{2}):(\d{2})/);
  if (!match) return { hour: 8, minute: 0 };
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

function getDayOffsets() {
  return { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4 };
}

function buildWeekEventEntries(schedule) {
  const weeks = Array.isArray(schedule?.weeks) && schedule.weeks.length
    ? schedule.weeks
    : [{ startDate: new Date().toISOString().slice(0, 10), timetable: schedule?.timetable || {} }];

  const dayOffsets = getDayOffsets();
  const entries = [];

  weeks.forEach((week) => {
    const weekStart = new Date(`${week.startDate}T00:00:00`);
    Object.entries(week.timetable || {}).forEach(([day, slots]) => {
      (slots || []).forEach((cell) => {
        if (!cell || cell.type === 'break') return;
        const dayOffset = dayOffsets[day];
        if (dayOffset === undefined) return;

        const start = new Date(weekStart);
        start.setDate(start.getDate() + dayOffset);
        const { hour, minute } = parseSlotStart(cell.time);
        start.setHours(hour, minute, 0, 0);

        const duration = Number(cell.durationMinutes);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + (Number.isFinite(duration) && duration > 0 ? duration : 60));

        const type = String(cell.type || 'task');
        const eventKey = [
          schedule?.id || 'unsaved',
          start.toISOString(),
          end.toISOString(),
          cell.title || 'Task'
        ].join('|');

        entries.push({
          summary: cell.title,
          description: cell.detail || '',
          type,
          duration: Number.isFinite(duration) && duration > 0 ? duration : 60,
          eventKey,
          start,
          end,
        });
      });
    });
  });

  return entries;
}

async function getAccessToken(clientId, loginHint) {
  await loadGoogleIdentityScript();

  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_SCOPE,
      hint: loginHint || '',
      callback: (response) => {
        if (response?.error) {
          if (response.error === 'access_denied') {
            reject(toSyncError('permission-denied', 'Permission denied by user', response));
            return;
          }
          reject(toSyncError('token-failed', 'Failed to fetch Google access token', response));
          return;
        }
        if (response?.access_token) {
          resolve(response.access_token);
          return;
        }
        reject(toSyncError('token-failed', 'Google sign-in did not return an access token', response));
      },
      error_callback: (err) => {
        const type = String(err?.type || err?.error || '').toLowerCase();
        if (type.includes('popup_closed')) {
          reject(toSyncError('login-cancelled', 'Login cancelled', err));
          return;
        }
        reject(toSyncError('oauth-failed', err?.error_description || 'Google OAuth failed', err));
      },
    });

    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

function fmtDateTime(dt) {
  const offsetMinutes = -dt.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}${sign}${hh}:${mm}`;
}

const EVENT_COLORS = {
  coding: '1',
  workout: '2',
  interview: '5',
  music: '11',
  language: '9',
  creative: '6',
  study: '3'
};

export async function createCalendarEvent(accessToken, event, timeZone) {
  const generatedMeta = [
    'Generated by Smart Scheduler',
    `Category: ${event.type || 'task'}`,
    `Duration: ${event.duration || 0} min`,
    `EventKey: ${event.eventKey}`
  ].join('\n');

  let response;
  try {
    response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: event.summary,
        description: [event.description || '', generatedMeta].filter(Boolean).join('\n\n'),
        colorId: EVENT_COLORS[event.type] || undefined,
        extendedProperties: {
          private: {
            smartSchedulerEventKey: event.eventKey,
            smartSchedulerCategory: event.type || 'task'
          }
        },
        start: {
          dateTime: fmtDateTime(event.start),
          timeZone,
        },
        end: {
          dateTime: fmtDateTime(event.end),
          timeZone,
        },
      }),
    });
  } catch (err) {
    throw toSyncError('network-failed', 'Network error while syncing Google Calendar events', err);
  }

  if (!response.ok) {
    const text = await response.text();
    throw toSyncError('api-failed', text || 'Failed to create Google Calendar event', text);
  }

  return response.json();
}

function chunkArray(arr, chunkSize) {
  const out = [];
  for (let i = 0; i < arr.length; i += chunkSize) out.push(arr.slice(i, i + chunkSize));
  return out;
}

export async function syncAllEvents({ accessToken, events, timeZone, onStatus }) {
  const failed = [];
  let synced = 0;
  const batches = chunkArray(events, 8);

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    onStatus?.(`Syncing ${Math.min((bi + 1) * 8, events.length)}/${events.length} events...`);
    const results = await Promise.allSettled(
      batch.map((event) => createCalendarEvent(accessToken, event, timeZone))
    );

    results.forEach((r, idx) => {
      const event = batch[idx];
      if (r.status === 'fulfilled') {
        synced += 1;
        sessionSyncedEventKeys.add(event.eventKey);
      } else {
        failed.push({ event, error: r.reason });
        console.error('Google Calendar sync event failed:', event, r.reason);
      }
    });

    if (bi < batches.length - 1) {
      await wait(BATCH_DELAY_MS);
    }
  }

  return { synced, failed };
}

export async function syncScheduleToGoogleCalendar({ schedule, accountHint = '', onStatus, forceSync = false }) {
  const setup = getGoogleSyncSetupState();
  if (!setup.configured) {
    throw toSyncError('not-configured', setup.message);
  }

  const startedAt = Date.now();
  const scheduleHash = getScheduleSyncHash(schedule);
  const lastHash = localStorage.getItem(LAST_SYNC_HASH_KEY) || '';
  if (!forceSync && scheduleHash && lastHash && scheduleHash === lastHash) {
    return {
      synced: 0,
      failed: 0,
      skipped: 0,
      attempted: 0,
      alreadySynced: true,
      reason: 'hash-match',
      failedDetails: []
    };
  }

  const entries = buildWeekEventEntries(schedule);
  if (!entries.length) {
    throw toSyncError('no-events', 'No events to sync');
  }

  const freshEntries = forceSync
    ? entries
    : entries.filter((e) => !sessionSyncedEventKeys.has(e.eventKey));
  if (!forceSync && !freshEntries.length) {
    return { synced: 0, failed: 0, skipped: entries.length, alreadySynced: true };
  }

  onStatus?.('Signing in to Google...');
  let accessToken;
  try {
    accessToken = await getAccessToken(getClientId(), accountHint);
  } catch (err) {
    if (err?.code) throw err;
    throw toSyncError('oauth-failed', err?.message || 'Google OAuth failed', err);
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  onStatus?.(`Syncing ${freshEntries.length} events...`);
  const { synced, failed } = await syncAllEvents({
    accessToken,
    events: freshEntries,
    timeZone,
    onStatus,
  });

  const failedDetails = failed.map((f) => ({
    title: f?.event?.summary || 'Untitled',
    key: f?.event?.eventKey || '',
    message: f?.error?.message || String(f?.error || 'Unknown error'),
    code: f?.error?.code || ''
  }));

  if (scheduleHash && failed.length === 0 && synced > 0) {
    localStorage.setItem(LAST_SYNC_HASH_KEY, scheduleHash);
  }

  if (import.meta.env.DEV) {
    console.info('[Google Sync] Summary', {
      attempted: freshEntries.length,
      success: synced,
      failed: failed.length,
      durationMs: Date.now() - startedAt,
      forceSync,
      timeZone,
    });
  }

  return {
    synced,
    failed: failed.length,
    attempted: freshEntries.length,
    skipped: entries.length - freshEntries.length,
    alreadySynced: false,
    failedDetails
  };
}

export function clearSessionGoogleSyncCache() {
  sessionSyncedEventKeys.clear();
}
