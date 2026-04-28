import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DAYS, SLOTS, SLOT_MINUTES } from '../../data/constants';
import { tagCls, tagLabel } from '../../utils/scheduleBuilder';
import { getGoogleSyncSetupState, syncScheduleToGoogleCalendar, warmupGoogleIdentity } from '../../utils/googleCalendar';
import { getStreak, saveSchedule } from '../../utils/storage';

export default function Step3_Timetable({ timetable, tickState, setTickState, userName, onBack, onNext }) {
  const LAST_SYNC_STATUS_KEY = 'ssp_google_last_sync_status_v1';
  const { globalSchedule, setGlobalSchedule, showToast, openGameModal, currentUser } = useApp();
  const streak = getStreak();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [lastSyncDetails, setLastSyncDetails] = useState(null);
  const syncInFlightRef = useRef(false);
  const [lastSyncStatus, setLastSyncStatus] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LAST_SYNC_STATUS_KEY) || 'null');
    } catch {
      return null;
    }
  });
  const [timeTick, setTimeTick] = useState(Date.now());
  const syncSetup = getGoogleSyncSetupState();
  const [activeWeek, setActiveWeek] = useState(0);
  const weeks = (globalSchedule && Array.isArray(globalSchedule.weeks) && globalSchedule.weeks.length)
    ? globalSchedule.weeks
    : null;
  const activeWeekData = weeks ? weeks[Math.max(0, Math.min(activeWeek, weeks.length - 1))] : null;
  const activeTimetable = activeWeekData ? activeWeekData.timetable : timetable;
  const columnLabels = activeWeekData ? activeWeekData.dates : Object.fromEntries(DAYS.map((d) => [d, d]));
  const slotCount = SLOTS.length;
  const normalizeGfgLink = (href) => {
    if (!href || typeof href !== 'string') return '';
    try {
      const url = new URL(href);
      const host = (url.hostname || '').toLowerCase();
      const path = (url.pathname || '').toLowerCase();
      if (!host.includes('geeksforgeeks.org')) return '';
      if (path.includes('music-and-arts')) return 'https://www.geeksforgeeks.org/?s=music';
      if (path.includes('digital-art')) return 'https://www.geeksforgeeks.org/?s=digital+art';
      if (path.includes('adobe-photoshop-tutorial')) return 'https://www.geeksforgeeks.org/?s=digital+art';
      if (path.includes('ui-ux-design')) return 'https://www.geeksforgeeks.org/?s=ui+ux+design';
      return url.toString();
    } catch {
      return '';
    }
  };

  const getStudyFallbackLinks = (cell) => {
    if (!cell || cell.type !== 'study') return null;
    const raw = String(cell.title || '').replace(/^Study\s*[-:]\s*/i, '').replace(/\(session\s*\d+\)\s*$/i, '').trim();
    const subject = raw || 'study';
    const q = encodeURIComponent(subject);
    return {
      guide: cell.link || `https://www.khanacademy.org/search?page_search_query=${q}`,
      yt: cell.ytLink || `https://www.youtube.com/results?search_query=${encodeURIComponent(subject + ' tutorial')}`,
      gfg: cell.gfgLink || `https://www.geeksforgeeks.org/?s=${q}`,
    };
  };

  const parseSlotStartMinutes = (slotLabel) => {
    const start = String(slotLabel || '').split('-')[0] || '';
    const m = start.match(/^(\d{2}):(\d{2})$/);
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]);
  };

  const formatTime = (totalMinutes) => {
    const mins = ((Math.floor(totalMinutes) % (24 * 60)) + (24 * 60)) % (24 * 60);
    const h = String(Math.floor(mins / 60)).padStart(2, '0');
    const m = String(mins % 60).padStart(2, '0');
    return `${h}:${m}`;
  };

  const getCellTimeRange = (slotLabel, durationMinutes, cell = null) => {
    if (cell && cell.displayTimeRange) return cell.displayTimeRange;
    const startMins = parseSlotStartMinutes(slotLabel);
    const dur = Number(durationMinutes);
    if (startMins === null || !Number.isFinite(dur) || dur <= 0) return slotLabel;
    return `${formatTime(startMins)}-${formatTime(startMins + Math.round(dur))}`;
  };

  const getRowTimeLabel = (slotLabel, slotIndex) => {
    const rowCells = DAYS.map((day) => activeTimetable?.[day]?.[slotIndex]).filter(Boolean);
    const representative = rowCells.find((c) => !isContinuationCell(c));
    if (representative && representative.displayTimeRange) return representative.displayTimeRange;
    const duration = representative && Number.isFinite(Number(representative.durationMinutes)) && Number(representative.durationMinutes) > 0
      ? Number(representative.durationMinutes)
      : SLOT_MINUTES;
    return getCellTimeRange(slotLabel, duration);
  };

  const isUnavailableCell = (cell) => {
    if (!cell) return true;
    return cell.type === 'break' && String(cell.title || '').toLowerCase().includes('unavailable');
  };

  const isContinuationCell = (cell) => {
    if (!cell) return false;
    return cell.type === 'break' && Boolean(cell.isContinuation);
  };

  const getContinuationDisplayCell = (day, slotIndex, cell) => {
    if (!cell || !isContinuationCell(cell)) return cell;
    const daySlots = activeTimetable?.[day] || [];

    // Backtrack to the start cell this continuation belongs to.
    for (let i = slotIndex - 1; i >= 0; i--) {
      const prev = daySlots[i];
      if (!prev || isContinuationCell(prev)) continue;
      if (cell.continuationOf && prev.title && prev.title !== cell.continuationOf) continue;
      return {
        ...prev,
        durationMinutes: SLOT_MINUTES,
      };
    }

    // Fallback: keep it as a break block but avoid "Session continues" wording.
    return {
      type: 'break',
      title: cell.isRelax ? '😌 Relax break' : (cell.continuationOf || 'Break'),
      detail: cell.detail || '',
      tag: 'break',
      durationMinutes: SLOT_MINUTES,
    };
  };

  const getWeekMarker = () => {
    const now = new Date();
    const day = now.getDay();
    const deltaToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + deltaToMonday);
    return monday.toISOString().slice(0, 10);
  };

  const formatLastSyncTime = (timestamp) => {
    if (!timestamp || !Number.isFinite(Number(timestamp))) return 'Not synced yet';
    const now = timeTick;
    const then = Number(timestamp);
    const deltaMs = Math.max(0, now - then);
    const min = Math.floor(deltaMs / 60000);
    const hour = Math.floor(min / 60);
    const thenDate = new Date(then);
    const nowDate = new Date(now);
    const isToday = thenDate.toDateString() === nowDate.toDateString();

    if (deltaMs < 60000) return 'Just now';
    if (min < 60) return `${min} min${min === 1 ? '' : 's'} ago`;
    if (isToday) return `${hour} hour${hour === 1 ? '' : 's'} ago`;

    const yesterday = new Date(nowDate);
    yesterday.setDate(nowDate.getDate() - 1);
    if (thenDate.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return thenDate.toLocaleDateString();
  };

  const formatExactSyncTime = (timestamp) => {
    if (!timestamp || !Number.isFinite(Number(timestamp))) return '';
    return new Date(Number(timestamp)).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const persistLastSyncStatus = ({ total, success, failed }) => {
    const payload = {
      timestamp: Date.now(),
      total: Number(total) || 0,
      success: Number(success) || 0,
      failed: Number(failed) || 0,
    };
    setLastSyncStatus(payload);
    localStorage.setItem(LAST_SYNC_STATUS_KEY, JSON.stringify(payload));
  };

  const visibleSlotIndexes = SLOTS
    .map((_, si) => si)
    .filter((si) => {
      const hasRenderableStart = DAYS.some((day) => {
        const c = activeTimetable?.[day]?.[si];
        return c && !isContinuationCell(c);
      });
      if (!hasRenderableStart) return false;
      return DAYS.some((day) => {
        const c = activeTimetable?.[day]?.[si];
        return !isUnavailableCell(c);
      });
    });

  useEffect(() => {
    const weekMarker = getWeekMarker();
    const lastResetWeek = localStorage.getItem('ssp_tick_reset_week');
    if (lastResetWeek === weekMarker) return;

    const reset = {};
    DAYS.forEach((day) => {
      reset[day] = new Array(slotCount).fill(false);
    });
    setTickState(reset);

    if (globalSchedule && globalSchedule.id) {
      const saved = JSON.parse(localStorage.getItem('ssp_schedules') || '[]');
      const idx = saved.findIndex((s) => s.id === globalSchedule.id);
      if (idx >= 0) {
        saved[idx].tickState = reset;
        localStorage.setItem('ssp_schedules', JSON.stringify(saved));
        setGlobalSchedule({ ...saved[idx] });
      }
    }

    localStorage.setItem('ssp_tick_reset_week', weekMarker);
  }, [globalSchedule, setGlobalSchedule, setTickState, slotCount]);

  useEffect(() => {
    const id = setInterval(() => setTimeTick(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!syncSetup.configured) return;
    warmupGoogleIdentity().catch((err) => {
      console.warn('Google Identity warmup failed:', err);
    });
  }, [syncSetup.configured]);

  useEffect(() => {
    if (!isSyncing) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isSyncing]);

  const today = (() => {
    const day = new Date().getDay();
    if (day === 0 || day === 6) return 'Monday';
    return DAYS[Math.min(day - 1, 4)];
  })();

  const progressIndexes = visibleSlotIndexes.filter((si) => !isUnavailableCell(activeTimetable?.[today]?.[si]));
  const todayTicks = progressIndexes.filter((si) => Boolean((tickState[today] || [])[si])).length;
  const pct = Math.round(todayTicks / Math.max(1, progressIndexes.length) * 100);

  const doTick = (day, si) => {
    setTickState(prev => {
      const updated = { ...prev, [day]: [...(prev[day] || new Array(slotCount).fill(false))] };
      updated[day][si] = !updated[day][si];
      // Update saved if exists
      if (globalSchedule && globalSchedule.id) {
        const saved = JSON.parse(localStorage.getItem('ssp_schedules') || '[]');
        const idx = saved.findIndex(s => s.id === globalSchedule.id);
        if (idx >= 0) { saved[idx].tickState = updated; localStorage.setItem('ssp_schedules', JSON.stringify(saved)); }
      }
      // Check day complete
      if ((updated[today] || []).every(Boolean)) {
        setTimeout(() => openGameModal(), 300);
      }
      return updated;
    });
  };

  const doSave = () => {
    if (!globalSchedule) { showToast('No schedule to save'); return; }
    const result = saveSchedule(globalSchedule, tickState, currentUser);
    if (result === 'exists') { showToast('Already saved!'); return; }
    setGlobalSchedule(result);
    showToast('Schedule saved! ✓');
  };

  const setupChecklistText = [
    '1. Go to Google Cloud Console',
    '2. Create OAuth Client ID (Web)',
    '3. Enable Google Calendar API',
    '4. Add Authorized JavaScript Origins:',
    '   - http://localhost:5173',
    '   - http://localhost:5174',
    '   - Your deployed domain',
    '5. Add .env:',
    '   VITE_GOOGLE_CLIENT_ID=your_client_id_here'
  ].join('\n');

  const copySetupChecklist = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(setupChecklistText);
      } else {
        const ta = document.createElement('textarea');
        ta.value = setupChecklistText;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      showToast('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy setup checklist:', err);
      showToast('Could not copy. Please copy manually.');
    }
  };

  const doExport = (forceSync = false) => {
    if (isSyncing || syncInFlightRef.current) return;
    const account = window.prompt('Which Google account do you want to sync this schedule with? (email)');
    if (account === null) return;
    const loginHint = String(account || '').trim();
    if (!globalSchedule) { showToast('Generate a schedule first'); return; }
    if (!syncSetup.configured) {
      showToast('Google Calendar Sync is not configured');
      return;
    }

    syncInFlightRef.current = true;
    setIsSyncing(true);
    setSyncSuccess(false);
    setLastSyncDetails(null);
    setSyncStatus('Signing in to Google...');
    syncScheduleToGoogleCalendar({
      schedule: globalSchedule,
      accountHint: loginHint,
      forceSync,
      onStatus: (msg) => setSyncStatus(msg),
    })
      .then(({ synced, failed, skipped, alreadySynced, failedDetails, attempted }) => {
        if (alreadySynced) {
          showToast('This schedule is already synced');
          return;
        }

        persistLastSyncStatus({ total: attempted, success: synced, failed });

        if (failed > 0) {
          setLastSyncDetails({ failedDetails: failedDetails || [], attempted: attempted || 0, synced, failed });
        }

        if (failed > 0 && synced > 0) {
          showToast(`${synced} events synced, ${failed} failed`);
          console.groupCollapsed('Google sync partial failures');
          console.table((failedDetails || []).map((f) => ({ title: f.title, code: f.code, message: f.message })));
          console.groupEnd();
          return;
        }
        if (failed > 0 && synced === 0) {
          showToast('Failed to sync events. Please try again.');
          if (failedDetails?.length) {
            console.groupCollapsed('Google sync failures');
            console.table(failedDetails.map((f) => ({ title: f.title, code: f.code, message: f.message })));
            console.groupEnd();
          }
          return;
        }
        const skippedMsg = skipped > 0 ? ` (${skipped} skipped)` : '';
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 1800);
        showToast(`✓ Schedule successfully added to Google Calendar${skippedMsg}`.trim());
      })
      .catch((err) => {
        console.error('Google Calendar sync error:', err);
        const code = err?.code || '';
        if (code === 'login-cancelled') {
          showToast('Login cancelled');
        } else if (code === 'popup-blocked') {
          showToast('Popup blocked. Allow popups for this site and try again.');
        } else if (code === 'permission-denied') {
          showToast('Permission denied');
        } else if (code === 'token-failed' || code === 'oauth-failed') {
          const detail = err?.detail?.error_description || err?.detail?.error || '';
          showToast(detail ? `Google login failed: ${detail}` : 'Google login failed. Please try again.');
        } else if (code === 'api-failed' || code === 'network-failed') {
          showToast('Failed to sync events');
        } else if (code === 'not-configured') {
          showToast('Google Calendar Sync is not configured');
        } else {
          showToast(err?.message || 'Failed to sync events');
        }
      })
      .finally(() => {
        setIsSyncing(false);
        setSyncStatus('');
        syncInFlightRef.current = false;
      });
  };

  const counts = {};
  if (activeTimetable) Object.values(activeTimetable).forEach(day => day.forEach(c => { if (c && c.type) counts[c.type] = (counts[c.type] || 0) + 1; }));

  if (!activeTimetable) return null;

  return (
    <div>
      {/* Header */}
      <div className="tt-header">
        <div className="tt-title">{userName}'s weekly schedule</div>
        <div className="tt-actions">
          {weeks && weeks.length > 1 && (
            <select className="tt-btn" value={activeWeek} onChange={(e) => setActiveWeek(Number(e.target.value) || 0)}>
              {weeks.map((w, idx) => (
                <option key={w.startDate || idx} value={idx}>{w.label || `Week ${idx + 1}`}</option>
              ))}
            </select>
          )}
          <button
            className="tt-btn gcal"
            onClick={() => doExport(false)}
            disabled={isSyncing || syncInFlightRef.current}
            title="This will add your schedule directly to your Google Calendar. Events will be added to your primary calendar."
            style={{
              opacity: isSyncing ? 0.7 : 1,
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              transition: 'opacity 180ms ease, transform 180ms ease, filter 180ms ease',
              filter: syncSuccess ? 'saturate(1.2)' : 'none',
              transform: syncSuccess ? 'translateY(-1px)' : 'translateY(0)'
            }}
          >
            {isSyncing ? 'Syncing...' : (syncSuccess ? '✓ Synced' : '🔄 Sync to Google Calendar')}
          </button>
          <button
            className="tt-btn"
            onClick={() => doExport(true)}
            disabled={isSyncing || syncInFlightRef.current || !syncSetup.configured}
            title="Force re-sync and add events again, even if this schedule was synced before"
            style={isSyncing ? { opacity: 0.7, cursor: 'not-allowed' } : undefined}
          >
            Force Sync
          </button>
          <button className="tt-btn" onClick={() => window.print()} disabled={isSyncing}>Print</button>
          <button className="tt-btn save" onClick={doSave} disabled={isSyncing}>Save schedule</button>
        </div>
      </div>

      <div
        className="info-box"
        title={lastSyncStatus?.timestamp ? `Synced on: ${formatExactSyncTime(lastSyncStatus.timestamp)}` : ''}
        style={{
          marginBottom: '0.9rem',
          borderColor: (lastSyncStatus?.failed || 0) > 0 ? '#D6C489' : '#A6D8C8',
          background: (lastSyncStatus?.failed || 0) > 0 ? '#FFF8E6' : '#F3FBF7',
        }}
      >
        {isSyncing
          ? <div style={{ fontWeight: 700 }}>Sync in progress...</div>
          : lastSyncStatus
          ? (
            <>
              <div style={{ fontWeight: 700 }}>Last synced: {formatLastSyncTime(lastSyncStatus.timestamp)}</div>
              <div style={{ marginTop: 4, color: 'var(--text2)' }}>
                {lastSyncStatus.total} events • {lastSyncStatus.success} success • {lastSyncStatus.failed} failed
              </div>
            </>
          )
          : <div style={{ fontWeight: 700 }}>Not synced yet</div>}
      </div>

      {!syncSetup.configured && (
        <div className="info-box info-amber" style={{ marginBottom: '0.9rem' }}>
          <strong>Google Calendar Sync is not configured.</strong>
          <div style={{ marginTop: 6 }}>
            1) Create OAuth client in Google Cloud Console.
          </div>
          <div>2) Enable Google Calendar API for the same project.</div>
          <div>3) Add authorized origins (http://localhost:5173, http://localhost:5174, and deployed URL).</div>
          <div>4) Set VITE_GOOGLE_CLIENT_ID in your .env file.</div>
          <div style={{ marginTop: 10 }}>
            <button className="tt-btn" onClick={copySetupChecklist}>Copy Setup Steps</button>
          </div>
        </div>
      )}

      {isSyncing && syncStatus && (
        <div className="info-box info-blue" style={{ marginBottom: '0.9rem' }}>
          {syncStatus}
        </div>
      )}

      {!isSyncing && lastSyncDetails?.failed > 0 && (
        <div className="info-box info-amber" style={{ marginBottom: '0.9rem' }}>
          {`${lastSyncDetails.synced} events synced, ${lastSyncDetails.failed} failed.`}
          <button
            className="tt-btn"
            style={{ marginLeft: 10 }}
            onClick={() => {
              console.groupCollapsed('Google sync failure details');
              console.table((lastSyncDetails.failedDetails || []).map((f) => ({ title: f.title, code: f.code, message: f.message })));
              console.groupEnd();
              showToast('Failure details printed in console');
            }}
          >
            View details
          </button>
        </div>
      )}

      {/* Streak */}
      <div className="streak-bar">
        <div className="streak-fire">🔥</div>
        <div className="streak-info">
          <h4>Current streak</h4>
          <p>Complete today's schedule to grow your streak!</p>
        </div>
        <div className="streak-count">{streak}<span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text3)' }}> days</span></div>
      </div>

      {/* Progress */}
      <div className="prog-wrap">
        <div className="prog-label">Today's progress</div>
        <div className="prog-track"><div className="prog-fill" style={{ width: pct + '%' }} /></div>
        <div className="prog-pct">{pct}%</div>
      </div>

      {/* Legend */}
      <div className="legend">
        {[['coding','var(--blue)'],['workout','var(--green)'],['interview','var(--amber)'],['music','var(--red)'],['language','var(--teal)'],['creative','var(--orange)'],['study','var(--purple)'],['well','#6366F1'],['break','var(--text3)']].map(([t, c]) => (
          <div className="leg-item" key={t}><div className="leg-dot" style={{ background: c }} />{tagLabel(t)}</div>
        ))}
      </div>

      {/* Table */}
      <div className="tt-wrap">
        <table className="tt">
          <thead><tr><th>Time</th>{DAYS.map(d => <th key={d}>{columnLabels[d] || d}</th>)}</tr></thead>
          <tbody>
            {visibleSlotIndexes.map((si) => {
              const sl = SLOTS[si];
              const rowTimeLabel = getRowTimeLabel(sl, si);
              return (
              <tr key={sl}>
                <td>{rowTimeLabel}</td>
                {DAYS.map(day => {
                  const rawCell = activeTimetable[day][si];
                  if (!rawCell) return <td key={day} className="c-break" />;
                  // Revert: do not render continuation cells as separate cards — hide them like before
                  if (isContinuationCell(rawCell)) return <td key={day} className="c-break" />;
                  const c = rawCell;
                  const [bgCls, tgCls] = tagCls(c.type);
                  const ticked = (tickState[day] || [])[si];
                  const cellTimeRange = getCellTimeRange(sl, c.durationMinutes, c);
                  return (
                    <td key={day} className={bgCls}>
                      {c.type !== 'break' && <span className={`ctag ${tgCls}`}>{tagLabel(c.type)}</span>}
                      {c.type !== 'break' && Number.isFinite(Number(c.durationMinutes)) && (
                        <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--text3)', fontWeight: 700 }}>
                          ⏱ {Math.max(1, Math.round(Number(c.durationMinutes)))} min
                        </span>
                      )}
                      {c.type !== 'break' && (
                        <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, marginTop: 2 }}>
                          {cellTimeRange}
                        </div>
                      )}
                      <div className="ctitle">{c.title}</div>
                      <div className="cdet">{c.detail}</div>
                      {(() => {
                        const studyFallback = getStudyFallbackLinks(c);
                        return (
                      <div className="res-links">
                        {c.lc && <a className="res-link rl-lc" href={c.lc.u} target="_blank" rel="noreferrer">🔗 LeetCode</a>}
                        {c.gfg && normalizeGfgLink(c.gfg.u) && <a className="res-link rl-gfg" href={normalizeGfgLink(c.gfg.u)} target="_blank" rel="noreferrer">📗 GFG</a>}
                        {c.gfgLink && normalizeGfgLink(c.gfgLink) && <a className="res-link rl-gfg" href={normalizeGfgLink(c.gfgLink)} target="_blank" rel="noreferrer">📗 GFG</a>}
                        {!c.gfg && !c.gfgLink && studyFallback?.gfg && <a className="res-link rl-gfg" href={studyFallback.gfg} target="_blank" rel="noreferrer">📗 GFG</a>}
                        {c.ytLink && <a className="res-link rl-yt" href={c.ytLink} target="_blank" rel="noreferrer">▶ Tutorial</a>}
                        {!c.ytLink && studyFallback?.yt && <a className="res-link rl-yt" href={studyFallback.yt} target="_blank" rel="noreferrer">▶ Tutorial</a>}
                        {c.duoLink && <a className="res-link rl-duo" href={c.duoLink} target="_blank" rel="noreferrer">🦜 Duolingo</a>}
                        {(c.link || studyFallback?.guide) && <a className="res-link rl-med" href={c.link || studyFallback?.guide} target="_blank" rel="noreferrer">🔗 Guide</a>}
                        {c.isLunch && <span className="res-link rl-food" title={c.lunchNote}>🥗 Meal tip</span>}
                      </div>
                        );
                      })()}
                      <div className="tick-wrap">
                        {c.type !== 'break' && <button className={`tick-btn${ticked ? ' ticked' : ''}`} onClick={() => doTick(day, si)}>✓</button>}
                      </div>
                    </td>
                  );
                })}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div className="stats-row">
        {['coding','workout','interview','other'].map(k => {
          const cnt = k === 'other'
            ? Object.entries(counts).filter(([t]) => !['coding','workout','interview','break'].includes(t)).reduce((s, [, v]) => s + v, 0)
            : (counts[k] || 0);
          return (
            <div className="stat-box" key={k}>
              <div className="sl">{{ coding:'Coding', workout:'Workout', interview:'Interview', other:'Other domains' }[k]}</div>
              <div className="sv">{cnt}</div>
            </div>
          );
        })}
      </div>

      <div className="btn-row" style={{ marginTop: '1.4rem' }}>
        <button className="btn-s" onClick={onBack} disabled={isSyncing}>← Back</button>
        <button className="btn-p" onClick={onNext} disabled={isSyncing}>Session guide →</button>
      </div>
    </div>
  );
}
