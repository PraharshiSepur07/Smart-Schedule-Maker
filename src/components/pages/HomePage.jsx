import { useApp } from '../../context/AppContext';

export default function HomePage() {
  const { showPage } = useApp();

  return (
    <div className="page home-shell">
      <section className="home-hero">
        <div className="home-hero-copy">
          <div className="home-pill">Professional Time Planning</div>
          <h1>Plan smart weeks, not random days.</h1>
          <p>
            SmartSchedule Pro turns your goals into practical date-based weekly plans,
            balanced sessions, and export-ready calendars.
          </p>
          <div className="home-cta-row">
            <button className="btn-hero btn-hero-p" onClick={() => showPage('plan')}>Create Schedule</button>
            <button className="btn-hero btn-hero-s" onClick={() => showPage('history')}>Open Saved Plans</button>
          </div>
        </div>
        <div className="home-hero-panel">
          <div className="home-panel-title">This Week Snapshot</div>
          <div className="home-panel-list">
            <div><span>Focus Hours</span><strong>21h 40m</strong></div>
            <div><span>Break Balance</span><strong>Healthy</strong></div>
            <div><span>Domains Active</span><strong>5</strong></div>
            <div><span>Calendar Ready</span><strong>Yes</strong></div>
          </div>
          <div className="home-panel-note">Built for students and professionals who need consistency.</div>
        </div>
      </section>

      <section className="home-metrics">
        {[
          ['Adaptive Weekly Plans', 'Deadline-aware weekly schedules with topic variation.'],
          ['Intelligent Session Flow', 'Time blocks with optional relax breaks when space allows.'],
          ['Trackable Execution', 'Tick progress, keep streaks, and review your consistency.'],
          ['Calendar Export', 'Export by week and import into your Google Calendar workflow.']
        ].map(([title, desc]) => (
          <article key={title} className="home-metric-card">
            <h3>{title}</h3>
            <p>{desc}</p>
          </article>
        ))}
      </section>

      <div className="features-grid">
        {[
          { icon: '🎯', title: 'Goal-aligned planning', desc: 'Schedule intensity adapts to your selected domains, priorities, and available hours.' },
          { icon: '🧩', title: 'Structured slot design', desc: 'Multi-slot sessions, date headings, and cleaner sequencing reduce burnout.' },
          { icon: '📊', title: 'Execution analytics', desc: 'Monitor what you completed, where you missed, and how your streak evolves.' },
          { icon: '🔔', title: 'Time reminders', desc: 'Session reminders are generated directly from your active timetable.' },
          { icon: '📅', title: 'Calendar integration', desc: 'Download your schedule in calendar format and import to your preferred account.' },
          { icon: '🧘', title: 'Wellness balancing', desc: 'Mindful recovery moments are included to keep focus sustainable.' },
        ].map(f => (
          <div className="feature-card" key={f.title}>
            <div className="feature-icon">{f.icon}</div>
            <div className="feature-title">{f.title}</div>
            <div className="feature-desc">{f.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2.5rem' }}>
        <div style={{ fontSize: 17, fontWeight: 700, textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text)' }}>How it works</div>
        <div className="steps-row">
          {[
            { n: 1, lbl: 'Select domains', sub: 'Choose what you are actively building this month.' },
            { n: 2, lbl: 'Set timing & deadline', sub: 'Define daily minutes, slots, and overall schedule end date.' },
            { n: 3, lbl: 'Generate weekly plan', sub: 'Get date-based columns and rotating weekly content.' },
            { n: 4, lbl: 'Execute & iterate', sub: 'Track completion, export calendar, and improve every week.' },
          ].map(s => (
            <div className="step-box" key={s.n}>
              <div className="step-num">{s.n}</div>
              <div className="step-lbl">{s.lbl}</div>
              <div className="step-sub">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
