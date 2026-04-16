// Chip helper components
function ChipGroup({ id, chips, value, onChange, colorClass = 'on', multi = false }) {
  const toggle = (chip) => {
    if (multi) onChange(prev => prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]);
    else onChange(chip === value ? '' : chip);
  };
  const isOn = (chip) => multi ? (Array.isArray(value) && value.includes(chip)) : value === chip;
  return (
    <div className="chip-row" id={id}>
      {chips.map(chip => (
        <div key={chip} className={`chip${isOn(chip) ? ' ' + colorClass : ''}`} onClick={() => toggle(chip)}>{chip}</div>
      ))}
    </div>
  );
}

export default function Step1_Details({ domains, coding, setCoding, workout, setWorkout, interview, setInterview, music, setMusic, language, setLanguage, creative, setCreative, study, setStudy, onBack, onNext }) {
  return (
    <div>
      {/* CODING */}
      {domains.includes('coding') && (
        <div className="q-card">
          <div className="q-title">💻 Coding</div>
          <div className="qg">
            <span className="qlabel">Topics to cover</span>
            <ChipGroup chips={['Data structures','Algorithms','HTML & CSS','React','Python Flask','MySQL','JavaScript','Node.js']} value={coding.topics || []} onChange={v => setCoding(p => ({ ...p, topics: v }))} colorClass="on" multi />
          </div>
          <div className="two-col">
            <div className="qg">
              <span className="qlabel">Practice platform</span>
              <ChipGroup chips={['LeetCode','HackerRank','GeeksforGeeks','Codeforces']} value={coding.platform || ''} onChange={v => setCoding(p => ({ ...p, platform: v }))} colorClass="on" />
            </div>
            <div className="qg">
              <span className="qlabel">Skill level</span>
              <ChipGroup chips={['Beginner','Intermediate','Advanced']} value={coding.level || ''} onChange={v => setCoding(p => ({ ...p, level: v }))} colorClass="on" />
            </div>
          </div>
          <div className="two-col">
            <div className="qg"><span className="qlabel">Deadline</span><input type="date" value={coding.deadline || ''} onChange={e => setCoding(p => ({ ...p, deadline: e.target.value }))} /></div>
            <div className="qg">
              <span className="qlabel">Priority</span>
              <ChipGroup chips={['High','Medium','Low']} value={coding.priority || 'Medium'} onChange={v => setCoding(p => ({ ...p, priority: v }))} colorClass="on" />
            </div>
          </div>
        </div>
      )}

      {/* WORKOUT */}
      {domains.includes('workout') && (
        <div className="q-card">
          <div className="q-title">🏋️ Workout</div>
          <div className="qg">
            <span className="qlabel">Fitness goal</span>
            <ChipGroup chips={['Weight gain / muscle','Weight loss / fat burn','Maintenance','Endurance']} value={workout.goal || ''} onChange={v => setWorkout(p => ({ ...p, goal: v }))} colorClass="on-g" />
          </div>
          <div className="three-col">
            <div className="qg"><span className="qlabel">Current weight (kg)</span><input type="number" placeholder="e.g. 70" min="30" max="200" value={workout.currWeight || ''} onChange={e => setWorkout(p => ({ ...p, currWeight: e.target.value }))} /></div>
            <div className="qg"><span className="qlabel">Target weight (kg)</span><input type="number" placeholder="e.g. 80" min="30" max="200" value={workout.targetWeight || ''} onChange={e => setWorkout(p => ({ ...p, targetWeight: e.target.value }))} /></div>
            <div className="qg">
              <span className="qlabel">Location</span>
              <ChipGroup chips={['Gym','Home','Outdoor']} value={workout.place || ''} onChange={v => setWorkout(p => ({ ...p, place: v }))} colorClass="on-g" />
            </div>
          </div>
          <div className="two-col">
            <div className="qg">
              <span className="qlabel">Days per week</span>
              <ChipGroup chips={['3 days','4 days','5 days']} value={workout.days || '4 days'} onChange={v => setWorkout(p => ({ ...p, days: v }))} colorClass="on-g" />
            </div>
            <div className="qg">
              <span className="qlabel">Fitness level</span>
              <ChipGroup chips={['Beginner','Intermediate','Advanced']} value={workout.fitnessLevel || ''} onChange={v => setWorkout(p => ({ ...p, fitnessLevel: v }))} colorClass="on-g" />
            </div>
          </div>
          <div className="qg">
            <span className="qlabel">Priority</span>
            <ChipGroup chips={['High','Medium','Low']} value={workout.priority || 'Medium'} onChange={v => setWorkout(p => ({ ...p, priority: v }))} colorClass="on-g" />
          </div>
        </div>
      )}

      {/* INTERVIEW */}
      {domains.includes('interview') && (
        <div className="q-card">
          <div className="q-title">📋 Interview Prep</div>
          <div className="two-col">
            <div className="qg">
              <span className="qlabel">Target role</span>
              <ChipGroup chips={['Frontend','Backend','Full stack','Data analyst','PM']} value={interview.role || ''} onChange={v => setInterview(p => ({ ...p, role: v }))} colorClass="on-a" />
            </div>
            <div className="qg">
              <span className="qlabel">Experience</span>
              <ChipGroup chips={['Fresher','Junior','Mid','Senior']} value={interview.exp || ''} onChange={v => setInterview(p => ({ ...p, exp: v }))} colorClass="on-a" />
            </div>
          </div>
          <div className="qg">
            <span className="qlabel">Focus areas</span>
            <ChipGroup chips={['DSA & problem solving','System design','HR & behavioural','Resume & portfolio','Mock interviews']} value={interview.focusAreas || []} onChange={v => setInterview(p => ({ ...p, focusAreas: v }))} colorClass="on-a" multi />
          </div>
          <div className="two-col">
            <div className="qg"><span className="qlabel">Deadline</span><input type="date" value={interview.deadline || ''} onChange={e => setInterview(p => ({ ...p, deadline: e.target.value }))} /></div>
            <div className="qg">
              <span className="qlabel">Priority</span>
              <ChipGroup chips={['High','Medium','Low']} value={interview.priority || 'Medium'} onChange={v => setInterview(p => ({ ...p, priority: v }))} colorClass="on-a" />
            </div>
          </div>
        </div>
      )}

      {/* MUSIC */}
      {domains.includes('music') && (
        <div className="q-card">
          <div className="q-title">🎵 Music</div>
          <div className="two-col">
            <div className="qg">
              <span className="qlabel">Instrument / focus</span>
              <ChipGroup chips={['Guitar','Piano','Vocals','Drums','Music theory','Production (DAW)']} value={music.instrument || ''} onChange={v => setMusic(p => ({ ...p, instrument: v }))} colorClass="on-r" />
            </div>
            <div className="qg">
              <span className="qlabel">Priority</span>
              <ChipGroup chips={['High','Medium','Low']} value={music.priority || 'Medium'} onChange={v => setMusic(p => ({ ...p, priority: v }))} colorClass="on-r" />
            </div>
          </div>
        </div>
      )}

      {/* LANGUAGE */}
      {domains.includes('language') && (
        <div className="q-card">
          <div className="q-title">🗣️ Language Learning</div>
          <div className="two-col">
            <div className="qg"><span className="qlabel">Language</span><input type="text" className="form-input" placeholder="e.g. Spanish, Japanese, French" value={language.lang || ''} onChange={e => setLanguage(p => ({ ...p, lang: e.target.value }))} /></div>
            <div className="qg">
              <span className="qlabel">Current level</span>
              <ChipGroup chips={['Absolute beginner','A1–A2','B1–B2','C1+']} value={language.level || ''} onChange={v => setLanguage(p => ({ ...p, level: v }))} colorClass="on-t" />
            </div>
          </div>
          <div className="qg">
            <span className="qlabel">Focus areas</span>
            <ChipGroup chips={['Speaking','Vocabulary','Grammar','Listening','Writing']} value={language.focus || []} onChange={v => setLanguage(p => ({ ...p, focus: v }))} colorClass="on-t" multi />
          </div>
          <div className="qg">
            <span className="qlabel">Priority</span>
            <ChipGroup chips={['High','Medium','Low']} value={language.priority || 'Medium'} onChange={v => setLanguage(p => ({ ...p, priority: v }))} colorClass="on-t" />
          </div>
        </div>
      )}

      {/* CREATIVE */}
      {domains.includes('creative') && (
        <div className="q-card">
          <div className="q-title">🎨 Creative Arts</div>
          <div className="two-col">
            <div className="qg">
              <span className="qlabel">Medium</span>
              <ChipGroup chips={['Drawing / Sketching','Painting (watercolor)','Digital art','UI/UX design','Photography']} value={creative.medium || ''} onChange={v => setCreative(p => ({ ...p, medium: v }))} colorClass="on-o" />
            </div>
            <div className="qg">
              <span className="qlabel">Skill level</span>
              <ChipGroup chips={['Beginner','Intermediate','Advanced']} value={creative.level || ''} onChange={v => setCreative(p => ({ ...p, level: v }))} colorClass="on-o" />
            </div>
          </div>
          <div className="qg">
            <span className="qlabel">Priority</span>
            <ChipGroup chips={['High','Medium','Low']} value={creative.priority || 'Medium'} onChange={v => setCreative(p => ({ ...p, priority: v }))} colorClass="on-o" />
          </div>
        </div>
      )}

      {/* STUDY */}
      {domains.includes('study') && (
        <div className="q-card">
          <div className="q-title">📝 General Study</div>
          <div className="two-col">
            <div className="qg"><span className="qlabel">Subject</span><input type="text" className="form-input" placeholder="e.g. Data Science, GATE, Economics" value={study.subject || ''} onChange={e => setStudy(p => ({ ...p, subject: e.target.value }))} /></div>
            <div className="qg"><span className="qlabel">Deadline</span><input type="date" value={study.deadline || ''} onChange={e => setStudy(p => ({ ...p, deadline: e.target.value }))} /></div>
          </div>
          <div className="qg">
            <span className="qlabel">Priority</span>
            <ChipGroup chips={['High','Medium','Low']} value={study.priority || 'Medium'} onChange={v => setStudy(p => ({ ...p, priority: v }))} colorClass="on-v" />
          </div>
        </div>
      )}

      <div className="btn-row">
        <button className="btn-s" onClick={onBack}>← Back</button>
        <button className="btn-p" onClick={onNext}>Continue →</button>
      </div>
    </div>
  );
}
