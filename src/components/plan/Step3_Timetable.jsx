import { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DAYS, SLOTS } from '../../data/constants';
import { tagCls, tagLabel, exportGCal } from '../../utils/scheduleBuilder';
import { getStreak, saveSchedule } from '../../utils/storage';

export default function Step3_Timetable({ timetable, tickState, setTickState, userName, onBack, onNext }) {
  const { globalSchedule, setGlobalSchedule, showToast, openGameModal, currentUser } = useApp();
  const streak = getStreak();
  const slotCount = SLOTS.length;

  const isUnavailableCell = (cell) => {
    if (!cell) return true;
    return cell.type === 'break' && String(cell.title || '').toLowerCase().includes('unavailable');
  };

  const getWeekMarker = () => {
    const now = new Date();
    const day = now.getDay();
    const deltaToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + deltaToMonday);
    return monday.toISOString().slice(0, 10);
  };

  const visibleSlotIndexes = SLOTS
    .map((_, si) => si)
    .filter((si) => {
      return DAYS.some((day) => {
        const c = timetable?.[day]?.[si];
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

  const today = (() => {
    const day = new Date().getDay();
    if (day === 0 || day === 6) return 'Monday';
    return DAYS[Math.min(day - 1, 4)];
  })();

  const progressIndexes = visibleSlotIndexes.filter((si) => !isUnavailableCell(timetable?.[today]?.[si]));
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

  const doExport = () => {
    if (exportGCal(globalSchedule, userName)) {
      showToast('📅 Calendar file downloaded! Import it in Google Calendar (Settings → Import).');
    } else { showToast('Generate a schedule first'); }
  };

  const counts = {};
  if (timetable) Object.values(timetable).forEach(day => day.forEach(c => { counts[c.type] = (counts[c.type] || 0) + 1; }));

  if (!timetable) return null;

  return (
    <div>
      {/* Header */}
      <div className="tt-header">
        <div className="tt-title">{userName}'s weekly schedule</div>
        <div className="tt-actions">
          <button className="tt-btn gcal" onClick={doExport}>📅 Google Calendar</button>
          <button className="tt-btn" onClick={() => window.print()}>Print</button>
          <button className="tt-btn save" onClick={doSave}>Save schedule</button>
        </div>
      </div>

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
          <thead><tr><th>Time</th>{DAYS.map(d => <th key={d}>{d}</th>)}</tr></thead>
          <tbody>
            {visibleSlotIndexes.map((si) => {
              const sl = SLOTS[si];
              return (
              <tr key={sl}>
                <td>{sl}</td>
                {DAYS.map(day => {
                  const c = timetable[day][si];
                  const [bgCls, tgCls] = tagCls(c.type);
                  const ticked = (tickState[day] || [])[si];
                  return (
                    <td key={day} className={bgCls}>
                      {c.type !== 'break' && <span className={`ctag ${tgCls}`}>{tagLabel(c.type)}</span>}
                      <div className="ctitle">{c.title}</div>
                      <div className="cdet">{c.detail}</div>
                      <div className="res-links">
                        {c.lc && <a className="res-link rl-lc" href={c.lc.u} target="_blank" rel="noreferrer">🔗 LeetCode</a>}
                        {c.gfg && <a className="res-link rl-gfg" href={c.gfg.u} target="_blank" rel="noreferrer">📗 GFG</a>}
                        {c.gfgLink && <a className="res-link rl-gfg" href={c.gfgLink} target="_blank" rel="noreferrer">📗 GFG</a>}
                        {c.ytLink && <a className="res-link rl-yt" href={c.ytLink} target="_blank" rel="noreferrer">▶ Tutorial</a>}
                        {c.duoLink && <a className="res-link rl-duo" href={c.duoLink} target="_blank" rel="noreferrer">🦜 Duolingo</a>}
                        {c.link && <a className="res-link rl-med" href={c.link} target="_blank" rel="noreferrer">🔗 Guide</a>}
                        {c.isLunch && <span className="res-link rl-food" title={c.lunchNote}>🥗 Meal tip</span>}
                      </div>
                      <div className="tick-wrap">
                        <button className={`tick-btn${ticked ? ' ticked' : ''}`} onClick={() => doTick(day, si)}>✓</button>
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
        <button className="btn-s" onClick={onBack}>← Back</button>
        <button className="btn-p" onClick={onNext}>Session guide →</button>
      </div>
    </div>
  );
}
