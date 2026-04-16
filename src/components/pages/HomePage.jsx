import { useApp } from '../../context/AppContext';

export default function HomePage() {
  const { showPage } = useApp();

  return (
    <div className="page">
      <div className="hero">
        <div className="hero-badge">✨ Your smart daily planner</div>
        <h1>Build habits.<br /><span>Own your time.</span></h1>
        <p>Answer a few questions and get a personalised Mon–Fri schedule from 8 AM–4 PM — with real resources, progress tracking, streaks, and wellness activities built in.</p>
        <div className="hero-btns">
          <button className="btn-hero btn-hero-p" onClick={() => showPage('plan')}>Get started free →</button>
          <button className="btn-hero btn-hero-s" onClick={() => showPage('history')}>View my schedules</button>
        </div>
      </div>

      <div className="features-grid">
        {[
          { icon: '🎯', title: 'Smart scheduling', desc: 'Every domain gets at least one slot. High-priority topics get prime morning hours. No domain left behind.' },
          { icon: '🔔', title: 'Timed notifications', desc: 'Real-time reminders saying "Hey! It\'s 9 AM — time to solve a LeetCode problem" with direct links.' },
          { icon: '🧘', title: 'Mental wellness', desc: 'Meditation, breathing exercises, and brain games like Sudoku are woven into your schedule daily.' },
          { icon: '🔥', title: 'Streak system', desc: 'Track your daily completion streaks. Build momentum and never break the chain.' },
          { icon: '📊', title: 'Weekly analytics', desc: 'After 7 days, see your completion chart, domain breakdown, and consistency score.' },
          { icon: '📅', title: 'Google Calendar', desc: 'Export your schedule directly to Google Calendar — one click syncs your whole week.' },
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
            { n: 1, lbl: 'Pick domains', sub: 'Coding, workout, interview, music, language, creative, study' },
            { n: 2, lbl: 'Set your goals', sub: 'Topics, targets, deadlines, availability, intensity' },
            { n: 3, lbl: 'Get your plan', sub: 'Balanced schedule with real links, wellness slots, lunch ideas' },
            { n: 4, lbl: 'Track & win', sub: 'Tick slots, grow streaks, earn game rewards, see analytics' },
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
