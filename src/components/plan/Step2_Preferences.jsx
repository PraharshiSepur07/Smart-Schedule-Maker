import { useApp } from '../../context/AppContext';

function ChipGroup({ chips, value, onChange, colorClass = 'on' }) {
  return (
    <div className="chip-row">
      {chips.map(chip => (
        <div key={chip} className={`chip${value === chip ? ' ' + colorClass : ''}`} onClick={() => onChange(chip === value ? '' : chip)}>{chip}</div>
      ))}
    </div>
  );
}

export default function Step2_Preferences({ prefs, setPrefs, userName, setUserName, onBack, onNext }) {
  const { currentUser } = useApp();

  return (
    <div>
      <div className="q-card">
        <div className="q-title">Daily availability &amp; preferences</div>
        <div className="q-subtitle">Tell us when you're free — we'll fit everything to your real schedule (8 AM–4 PM).</div>

        <div className="two-col">
          <div className="qg">
            <span className="qlabel">Available from (time)</span>
            <ChipGroup chips={['8:00 AM','8:30 AM','9:00 AM']} value={prefs.avFrom || '8:30 AM'} onChange={v => setPrefs(p => ({ ...p, avFrom: v }))} colorClass="on" />
          </div>
          <div className="qg">
            <span className="qlabel">Available until (time)</span>
            <ChipGroup chips={['2:00 PM','3:00 PM','4:00 PM']} value={prefs.avTo || '4:00 PM'} onChange={v => setPrefs(p => ({ ...p, avTo: v }))} colorClass="on" />
          </div>
        </div>

        <div className="two-col">
          <div className="qg">
            <span className="qlabel">Workout hours per session</span>
            <ChipGroup chips={['30 min','1 hour','1.5 hours']} value={prefs.wHrs || '1 hour'} onChange={v => setPrefs(p => ({ ...p, wHrs: v }))} colorClass="on-g" />
          </div>
          <div className="qg">
            <span className="qlabel">Workout slots in timetable</span>
            <ChipGroup chips={['1 slot/day','2 slots/day']} value={prefs.wSlots || '1 slot/day'} onChange={v => setPrefs(p => ({ ...p, wSlots: v }))} colorClass="on-g" />
          </div>
        </div>

        <div className="two-col">
          <div className="qg">
            <span className="qlabel">Study hours per session</span>
            <ChipGroup chips={['30 min','1 hour','2 hours']} value={prefs.sHrs || '1 hour'} onChange={v => setPrefs(p => ({ ...p, sHrs: v }))} colorClass="on-v" />
          </div>
          <div className="qg">
            <span className="qlabel">Study slots in timetable</span>
            <ChipGroup chips={['1 slot/day','2 slots/day','3 slots/day']} value={prefs.sSlots || '1 slot/day'} onChange={v => setPrefs(p => ({ ...p, sSlots: v }))} colorClass="on-v" />
          </div>
        </div>

        <div className="qg">
          <span className="qlabel">Preferred workout time</span>
          <ChipGroup chips={['Morning (8–9 AM)','Midday (1–2 PM)','Evening (3–4 PM)']} value={prefs.workoutTime || 'Evening (3–4 PM)'} onChange={v => setPrefs(p => ({ ...p, workoutTime: v }))} colorClass="on-g" />
        </div>

        <div className="qg">
          <span className="qlabel">Include wellness activities (meditation, breathing)?</span>
          <ChipGroup chips={['Yes, daily','Yes, 3x/week','No']} value={prefs.wellness || 'Yes, daily'} onChange={v => setPrefs(p => ({ ...p, wellness: v }))} colorClass="on" />
        </div>

        <div className="qg">
          <span className="qlabel">Your name (for schedule header)</span>
          <input type="text" className="form-input" placeholder="e.g. Arjun" style={{ maxWidth: 260 }}
            value={userName} onChange={e => setUserName(e.target.value)}
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
