import { useState } from 'react';
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
const TASK_HOUR_CHIPS = ['1 hour/day', '2 hours/day', '3 hours/day'];

const DOMAIN_LABELS = {
  coding: 'Coding',
  workout: 'Workout',
  interview: 'Interview',
  music: 'Music',
  language: 'Language',
  creative: 'Creative',
  study: 'Study'
};

function parseTimeToHour(label) {
  if (!label || typeof label !== 'string') return null;
  const m = label.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const ap = m[3].toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h;
}

function hourToLabel(h) {
  return String(h).padStart(2, '0') + ':00';
}

function getAvailableTimeWindows(unavailableRanges) {
  if (!Array.isArray(unavailableRanges) || !unavailableRanges.length) {
    return ['08:00-11:00', '11:00-14:00', '14:00-17:00', '17:00-21:00'];
  }

  const blocked = Array(24).fill(false);
  unavailableRanges.forEach((r) => {
    if (!r || !r.from || !r.to) return;
    const fromHour = parseTimeToHour(r.from);
    const toHour = parseTimeToHour(r.to);
    if (fromHour !== null && toHour !== null && fromHour < toHour) {
      for (let h = fromHour; h < toHour && h < 24; h++) {
        blocked[h] = true;
      }
    }
  });

  const windows = [];
  let windowStart = null;

  for (let h = 0; h < 24; h++) {
    if (!blocked[h]) {
      if (windowStart === null) windowStart = h;
    } else {
      if (windowStart !== null) {
        const label = hourToLabel(windowStart) + '-' + hourToLabel(h);
        windows.push(label);
        windowStart = null;
      }
    }
  }

  if (windowStart !== null) {
    windows.push(hourToLabel(windowStart) + '-23:59');
  }

  return windows.length ? windows : ['08:00-11:00', '11:00-14:00', '14:00-17:00', '17:00-21:00'];
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
  const [activeTimePicker, setActiveTimePicker] = useState(null); // { rangeIdx, field: 'from'|'to' }

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
          ...((p.taskPrefs || {})[domain] || { time: 'Any time', slotsPerDay: '1 slot/day' }),
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
        </div>

        {!!(domains && domains.length) && (
          <div className="qg">
            <span className="qlabel">Task timing and hours per day</span>
            <div className="q-subhint">For each task: pick which times of day AND how many hours you want to spend on it. Example: Workout in Morning + Evening, 2 hours/day.</div>
            <div className="task-pref-grid">
              {domains.map((domain) => {
                const pref = (prefs.taskPrefs || {})[domain] || { times: [], slotsPerDay: '1 hour/day' };
                const availableTimes = getAvailableTimeWindows(unavailableRanges);
                return (
                  <div className="task-pref-card" key={domain}>
                    <div className="task-pref-title">{DOMAIN_LABELS[domain] || domain}</div>
                    <div className="task-pref-line">Preferred times (select one or more)</div>
                    <MultiChipGroup
                      chips={availableTimes}
                      values={Array.isArray(pref.times) ? pref.times : []}
                      onChange={(v) => updateTaskPref(domain, 'times', v)}
                      colorClass="on"
                    />
                    <div className="task-pref-line">How many hours per day?</div>
                    <ChipGroup
                      chips={TASK_HOUR_CHIPS}
                      value={pref.slotsPerDay || '1 hour/day'}
                      onChange={(v) => updateTaskPref(domain, 'slotsPerDay', v || '1 hour/day')}
                      colorClass="on-a"
                    />
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
