const DOMAIN_CARDS = [
  { id: 'coding', icon: '💻', name: 'Coding', sub: 'DSA, web dev, projects' },
  { id: 'workout', icon: '🏋️', name: 'Workout', sub: 'Gym, home, outdoor' },
  { id: 'interview', icon: '📋', name: 'Interview Prep', sub: 'DSA, system design, HR' },
  { id: 'music', icon: '🎵', name: 'Music', sub: 'Instrument, theory, DAW' },
  { id: 'language', icon: '🗣️', name: 'Language Learning', sub: 'Speaking, vocabulary, Duolingo' },
  { id: 'creative', icon: '🎨', name: 'Creative Arts', sub: 'Drawing, painting, design' },
  { id: 'study', icon: '📝', name: 'General Study', sub: 'College, exams, courses' },
];
const DCLS = { coding: 'd-coding', workout: 'd-workout', interview: 'd-interview', music: 'd-music', language: 'd-language', creative: 'd-creative', study: 'd-study' };

export default function Step0_Domains({ domains, setDomains, onNext }) {
  const toggle = (id) => {
    setDomains(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  return (
    <div>
      <div className="q-card">
        <div className="q-title">Which domains do you want to schedule?</div>
        <div className="q-subtitle">Select all that apply — every selected domain gets at least one slot in your timetable.</div>
        <div className="domain-grid">
          {DOMAIN_CARDS.map(dc => (
            <div
              key={dc.id}
              className={`domain-card${domains.includes(dc.id) ? ' ' + DCLS[dc.id] : ''}`}
              onClick={() => toggle(dc.id)}
            >
              <div className="dicon">{dc.icon}</div>
              <div className="dname">{dc.name}</div>
              <div className="dsub">{dc.sub}</div>
            </div>
          ))}
        </div>
        <button className="btn-p" onClick={onNext}>Continue →</button>
      </div>
    </div>
  );
}
