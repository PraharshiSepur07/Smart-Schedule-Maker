const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const GOOGLE_API_SRC = 'https://apis.google.com/js/api.js';
const GOOGLE_DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
const GOOGLE_TIME_ZONE = 'Asia/Kolkata';
const LAST_SYNC_HASH_KEY = 'ssp_google_last_sync_hash_v1';
const BATCH_DELAY_MS = 180;

let gapiLoadPromise = null;
let gapiInitPromise = null;
const sessionSyncedEventKeys = new Set();

function getClientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
}

function getApiKey() {
  return import.meta.env.VITE_GOOGLE_API_KEY || getClientId() || '';
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

function loadGoogleApiScript() {
  if (window.gapi?.client && window.gapi?.auth2) return Promise.resolve();
  if (gapiLoadPromise) return gapiLoadPromise;

  gapiLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GOOGLE_API_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google API script')), { once: true });
      if (window.gapi) resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_API_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google API script'));
    document.head.appendChild(script);
  });

  return gapiLoadPromise;
}

export async function warmupGoogleIdentity() {
  await ensureGoogleClientReady();
}

async function ensureGoogleClientReady() {
  if (gapiInitPromise) return gapiInitPromise;

  gapiInitPromise = (async () => {
    await loadGoogleApiScript();
    const apiKey = getApiKey();
    const clientId = getClientId();
    if (!apiKey || !clientId) {
      throw toSyncError('not-configured', 'Google Calendar Sync is not configured. Missing API key or client ID.');
    }

    await new Promise((resolve, reject) => {
      window.gapi.load('client:auth2', async () => {
        try {
          await window.gapi.client.init({
            apiKey,
            clientId,
            discoveryDocs: GOOGLE_DISCOVERY_DOCS,
            scope: GOOGLE_SCOPE,
          });
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  })();

  return gapiInitPromise;
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
  await ensureGoogleClientReady();
  const normalizedHint = String(loginHint || '').trim();

  const auth = window.gapi.auth2.getAuthInstance();
  if (!auth) {
    throw toSyncError('oauth-failed', 'Google auth client is not available');
  }

  try {
    const user = await auth.signIn({
      prompt: normalizedHint ? 'consent' : 'select_account consent',
      login_hint: normalizedHint || undefined,
    });
    const response = user?.getAuthResponse ? user.getAuthResponse(true) : null;
    const accessToken = response?.access_token;
    if (!accessToken) {
      throw toSyncError('token-failed', 'Google sign-in did not return an access token', response);
    }
    return accessToken;
  } catch (err) {
    const message = String(err?.error || err?.details || err?.message || '').toLowerCase();
    if (message.includes('popup_closed') || message.includes('popup_closed_by_user')) {
      throw toSyncError('login-cancelled', 'Login cancelled', err);
    }
    if (message.includes('popup_blocked')) {
      throw toSyncError('popup-blocked', 'Google sign-in popup was blocked by the browser', err);
    }
    throw toSyncError('oauth-failed', err?.message || 'Google OAuth failed', err);
  }
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

  try {
    await ensureGoogleClientReady();
    return await window.gapi.client.calendar.events.insert({
      calendarId: 'primary',
      sendUpdates: 'all',
      resource: {
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
      },
    });
  } catch (err) {
    if (err?.result?.error?.message) {
      throw toSyncError('api-failed', err.result.error.message, err.result.error);
    }
    throw toSyncError('network-failed', err?.message || 'Network error while syncing Google Calendar events', err);
  }
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

  const timeZone = GOOGLE_TIME_ZONE;

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
