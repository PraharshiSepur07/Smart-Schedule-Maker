import { useEffect, useState } from 'react';
import TimePickerModal from '../TimePickerModal';

const TIME_OPTIONS = [
  '8:00 AM',
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
  '6:00 PM',
  '7:00 PM',
  '8:00 PM', 
  '9:00 PM'
];

const TASK_TIME_CHIPS = ['Morning (8-11 AM)', 'Midday (11 AM-2 PM)', 'Afternoon (2-4 PM)', 'Any time'];

const DOMAIN_LABELS = {
  coding: 'Coding',
  workout: 'Workout',
  interview: 'Interview',
  music: 'Music',
  language: 'Language',
  creative: 'Creative',
  study: 'Study'
};

const PERIOD_OPTIONS = ['morning', 'afternoon', 'evening', 'night'];
const PERIOD_LABELS = {
  morning: 'Morning (6-12)',
  afternoon: 'Afternoon (12-17)',
  evening: 'Evening (17-22)',
  night: 'Night (22-6)'
};

function parseTimeToMinutes(label) {
  if (!label || typeof label !== 'string') return null;
  const m = label.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!m) return null;

  let h = parseInt(m[1], 10);
  const mins = Math.max(0, Math.min(59, parseInt(m[2], 10)));
  const ap = m[3] ? m[3].toUpperCase() : null;

  if (ap) {
    if (h < 1 || h > 12) return null;
    if (ap === 'PM' && h !== 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
  } else {
    if (h < 0 || h > 23) return null;
  }

  return h * 60 + mins;
}

function minsToLabel(totalMinutes) {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, totalMinutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function getAvailableTimeWindows(unavailableRanges) {
  if (!Array.isArray(unavailableRanges) || !unavailableRanges.length) {
    return ['00:00-23:59'];
  }

  const blocked = Array(24 * 60).fill(false);
  let hasValidRange = false;

  const blockRange = (start, end) => {
    for (let i = start; i < end && i < 24 * 60; i++) {
      if (i >= 0) blocked[i] = true;
    }
  };

  unavailableRanges.forEach((r) => {
    if (!r || !r.from || !r.to) return;
    const fromMins = parseTimeToMinutes(r.from);
    const toMins = parseTimeToMinutes(r.to);
    if (fromMins === null || toMins === null || fromMins === toMins) return;

    hasValidRange = true;
    if (fromMins < toMins) {
      blockRange(fromMins, toMins);
    } else {
      // Overnight range, e.g. 23:00 -> 06:00
      blockRange(fromMins, 24 * 60);
      blockRange(0, toMins);
    }
  });

  if (!hasValidRange) {
    return ['00:00-23:59'];
  }

  const windows = [];
  let windowStart = null;

  for (let i = 0; i < 24 * 60; i++) {
    if (!blocked[i]) {
      if (windowStart === null) windowStart = i;
    } else {
      if (windowStart !== null) {
        const label = minsToLabel(windowStart) + '-' + minsToLabel(i);
        windows.push(label);
        windowStart = null;
      }
    }
  }

  if (windowStart !== null) {
    windows.push(minsToLabel(windowStart) + '-23:59');
  }

  return windows;
}

function getDailyAvailableMinutes(unavailableRanges) {
  if (!Array.isArray(unavailableRanges) || !unavailableRanges.length) return 24 * 60;

  const blocked = Array(24 * 60).fill(false);

  const blockRange = (start, end) => {
    for (let i = start; i < end && i < 24 * 60; i++) {
      if (i >= 0) blocked[i] = true;
    }
  };

  unavailableRanges.forEach((r) => {
    if (!r || !r.from || !r.to) return;
    const fromMins = parseTimeToMinutes(r.from);
    const toMins = parseTimeToMinutes(r.to);
    if (fromMins === null || toMins === null || fromMins === toMins) return;

    if (fromMins < toMins) {
      blockRange(fromMins, toMins);
    } else {
      blockRange(fromMins, 24 * 60);
      blockRange(0, toMins);
    }
  });

  let blockedCount = 0;
  for (let i = 0; i < blocked.length; i++) {
    if (blocked[i]) blockedCount += 1;
  }

  return 24 * 60 - blockedCount;
}

function formatMinutesAsHours(mins) {
  const clamped = Math.max(0, mins);
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

function ChipGroup({ chips, value, onChange, colorClass = 'on' }) {
  return (
    <div className="chip-row">
      {chips.map((chip) => (
        <div
          key={chip}
          className={`chip${value === chip ? ' ' + colorClass : ''}`}
          onClick={() => onChange(chip)}
        >
          {chip}
        </div>
      ))}
    </div>
  );
}

function MultiChipGroup({ chips, values, onChange, colorClass = 'on' }) {
  const selected = Array.isArray(values) ? values : [];
  return (
    <div className="chip-row">
      {chips.map((chip) => (
        <div
          key={chip}
          className={`chip${selected.includes(chip) ? ' ' + colorClass : ''}`}
          onClick={() => {
            const next = selected.includes(chip)
              ? selected.filter((c) => c !== chip)
              : [...selected, chip];
            onChange(next);
          }}
        >
          {chip}
        </div>
      ))}
    </div>
  );
}

function normalizeRanges(ranges) {
  if (!Array.isArray(ranges) || !ranges.length) return [{ from: '', to: '' }];
  return ranges;
}

export default function Step2_Preferences({ domains, prefs, setPrefs, userName, setUserName, onBack, onNext }) {
  const unavailableRanges = normalizeRanges(prefs.unavailableRanges);
  const availableTimeWindows = getAvailableTimeWindows(unavailableRanges);
  const dailyAvailableMinutes = getDailyAvailableMinutes(unavailableRanges);
  const [activeTimePicker, setActiveTimePicker] = useState(null); // { rangeIdx, field: 'from'|'to' }

  useEffect(() => {
    if (prefs.scheduleDeadline) return;
    const target = new Date();
    target.setDate(target.getDate() + 30);
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    setPrefs((p) => ({ ...p, scheduleDeadline: `${y}-${m}-${d}` }));
  }, [prefs.scheduleDeadline, setPrefs]);

  useEffect(() => {
    const allowed = new Set(availableTimeWindows);
    if (!domains || !domains.length) return;

    setPrefs((p) => {
      const currentTaskPrefs = p.taskPrefs || {};
      let changed = false;
      const nextTaskPrefs = { ...currentTaskPrefs };

      domains.forEach((domain) => {
        const pref = currentTaskPrefs[domain];
        if (!pref || !Array.isArray(pref.times)) return;
        const filtered = pref.times.filter((t) => allowed.has(t));
        if (filtered.length !== pref.times.length) {
          changed = true;
          nextTaskPrefs[domain] = { ...pref, times: filtered };
        }
      });

      if (!changed) return p;
      return { ...p, taskPrefs: nextTaskPrefs };
    });
  }, [availableTimeWindows, domains, setPrefs]);

  const updateRange = (idx, key, value) => {
    setPrefs((p) => {
      const nextRanges = normalizeRanges(p.unavailableRanges).map((r) => ({ ...r }));
      nextRanges[idx] = { ...(nextRanges[idx] || { from: '', to: '' }), [key]: value };
      return { ...p, unavailableRanges: nextRanges };
    });
  };

  const addRange = () => {
    setPrefs((p) => ({
      ...p,
      unavailableRanges: [...normalizeRanges(p.unavailableRanges), { from: '', to: '' }]
    }));
  };

  const removeRange = (idx) => {
    setPrefs((p) => {
      const next = normalizeRanges(p.unavailableRanges).filter((_, i) => i !== idx);
      return { ...p, unavailableRanges: next.length ? next : [{ from: '', to: '' }] };
    });
  };

  const updateTaskPref = (domain, key, value) => {
    setPrefs((p) => ({
      ...p,
      taskPrefs: {
        ...(p.taskPrefs || {}),
        [domain]: {
          ...((p.taskPrefs || {})[domain] || { time: 'Any time', minutesPerDay: 60, periods: [] }),
          [key]: value
        }
      }
    }));
  };

  return (
    <div>
      {/* Time Picker Modal */}
      {activeTimePicker && (
        <TimePickerModal
          value={unavailableRanges[activeTimePicker.rangeIdx]?.[activeTimePicker.field] || ''}
          onChange={(newTime) => {
            updateRange(activeTimePicker.rangeIdx, activeTimePicker.field, newTime);
          }}
          onClose={() => setActiveTimePicker(null)}
        />
      )}

      <div className="q-card">
        <div className="q-title">Daily availability &amp; preferences</div>

        <div className="qg">
          <span className="qlabel">Whole schedule deadline</span>
          <div className="q-subhint">Set when this plan should finish. We will generate multiple weekly schedules up to this date.</div>
          <input
            type="date"
            className="form-input"
            value={prefs.scheduleDeadline || ''}
            onChange={(e) => setPrefs((p) => ({ ...p, scheduleDeadline: e.target.value }))}
            style={{ maxWidth: 260 }}
          />
        </div>

        <div className="qg">
          <span className="qlabel">When are you not available?</span>
          <div className="q-subhint">Example: 09:00 to 13:00 and 18:00 to 21:00. Click to select times.</div>
          {unavailableRanges.map((range, idx) => (
            <div className="range-row" key={`range-${idx}`}>
              <div
                className="time-input"
                onClick={() => setActiveTimePicker({ rangeIdx: idx, field: 'from' })}
              >
                <span className="time-input-label">From</span>
                <span className="time-input-value">{range.from || 'Pick start time'}</span>
              </div>
              <div
                className="time-input"
                onClick={() => setActiveTimePicker({ rangeIdx: idx, field: 'to' })}
              >
                <span className="time-input-label">To</span>
                <span className="time-input-value">{range.to || 'Pick end time'}</span>
              </div>
              <button type="button" className="mini-btn danger" onClick={() => removeRange(idx)}>Remove</button>
            </div>
          ))}
          <button type="button" className="mini-btn" onClick={addRange}>+ Add unavailable range</button>
          <div className="q-subhint" style={{ marginTop: 8 }}>
            Available time: {availableTimeWindows.length ? availableTimeWindows.join(', ') : 'No available time left'}
          </div>
        </div>

        {!!(domains && domains.length) && (
          <div className="qg">
            <span className="qlabel">Task timing and hours per day</span>
            <div className="q-subhint">For each task: pick which times of day AND how many hours you want to spend on it. Example: Workout in Morning + Evening, 2 hours/day.</div>
            <div className="q-subhint" style={{ marginTop: 4 }}>
              Time available per day after unavailable slots: {formatMinutesAsHours(dailyAvailableMinutes)}
            </div>
            <div className="task-pref-grid">
              {domains.map((domain) => {
                const pref = (prefs.taskPrefs || {})[domain] || { times: [], periods: [], minutesPerDay: 60, slotsPerDay: 1 };
                const prefMinutes = Number.isFinite(Number(pref.minutesPerDay))
                  ? Number(pref.minutesPerDay)
                  : 60;
                return (
                  <div className="task-pref-card" key={domain}>
                    <div className="task-pref-title">{DOMAIN_LABELS[domain] || domain}</div>
                    <div className="task-pref-line">Preferred times (select one or more)</div>
                    <MultiChipGroup
                      chips={availableTimeWindows}
                      values={Array.isArray(pref.times) ? pref.times : []}
                      onChange={(v) => updateTaskPref(domain, 'times', v)}
                      colorClass="on"
                    />
                    <div className="task-pref-line">Preferred periods</div>
                    <MultiChipGroup
                      chips={PERIOD_OPTIONS}
                      values={Array.isArray(pref.periods) ? pref.periods : []}
                      onChange={(v) => updateTaskPref(domain, 'periods', v)}
                      colorClass="on"
                    />
                    <div className="q-subhint" style={{ marginTop: 6 }}>
                      {Array.isArray(pref.periods) && pref.periods.length
                        ? pref.periods.map((p) => PERIOD_LABELS[p] || p).join(', ')
                        : 'No period selected'}
                    </div>
                    <div className="task-pref-line">Total minutes per day</div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          type="number"
                          className="form-input"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          value={Math.floor(prefMinutes / 60)}
                          onChange={(e) => {
                            const hours = Math.max(0, Number(e.target.value) || 0);
                            const mins = prefMinutes % 60;
                            updateTaskPref(domain, 'minutesPerDay', hours * 60 + mins);
                          }}
                          style={{ maxWidth: 80 }}
                          placeholder="0"
                        />
                        <span style={{ fontSize: 12, color: '#64748b' }}>hours</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          type="number"
                          className="form-input"
                          min="0"
                          max="59"
                          step="5"
                          inputMode="numeric"
                          value={prefMinutes % 60}
                          onChange={(e) => {
                            const hours = Math.floor(prefMinutes / 60);
                            const mins = Math.max(0, Math.min(59, Number(e.target.value) || 0));
                            updateTaskPref(domain, 'minutesPerDay', hours * 60 + mins);
                          }}
                          style={{ maxWidth: 80 }}
                          placeholder="0"
                        />
                        <span style={{ fontSize: 12, color: '#64748b' }}>mins</span>
                      </div>
                    </div>
                    <div className="task-pref-line" style={{ marginTop: 10 }}>How many times per day?</div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="number"
                        className="form-input"
                        min="1"
                        max="8"
                        step="1"
                        inputMode="numeric"
                        value={Number.isFinite(Number(pref.slotsPerDay)) ? Number(pref.slotsPerDay) : 1}
                        onChange={(e) => updateTaskPref(domain, 'slotsPerDay', Math.max(1, Math.min(8, Number(e.target.value) || 1)))}
                        style={{ maxWidth: 120 }}
                        placeholder="e.g. 2"
                      />
                      <span style={{ fontSize: 12, color: '#64748b' }}>times (e.g. morning, evening)</span>
                    </div>
                    <div className="q-subhint" style={{ marginTop: 6 }}>
                      Per session: ~{Math.round(prefMinutes / (Number.isFinite(Number(pref.slotsPerDay)) ? Number(pref.slotsPerDay) : 1))} min
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="qg">
          <span className="qlabel">Include wellness activities (meditation, breathing)?</span>
          <ChipGroup
            chips={['Yes, daily', 'Yes, 3x/week', 'No']}
            value={prefs.wellness || 'Yes, daily'}
            onChange={(v) => setPrefs((p) => ({ ...p, wellness: v }))}
            colorClass="on"
          />
        </div>

        <div className="qg">
          <span className="qlabel">Your name (for schedule header)</span>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Arjun"
            style={{ maxWidth: 260 }}
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>
      </div>

      <div className="btn-row">
        <button className="btn-s" onClick={onBack}>← Back</button>
        <button className="btn-p" onClick={onNext}>Build my schedule →</button>
      </div>
    </div>
  );
}
