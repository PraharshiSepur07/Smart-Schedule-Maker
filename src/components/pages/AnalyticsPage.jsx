import { useApp } from '../../context/AppContext';
import { getSaved, getStreak } from '../../utils/storage';
import { tagLabel } from '../../utils/scheduleBuilder';

export default function AnalyticsPage() {
  const { currentUser, showPage } = useApp();
  const uid = currentUser ? currentUser.id : 'guest';
  const saved = getSaved().filter(s => s.userId === uid || s.userId === 'guest').slice(0, 7);
  const streak = getStreak();

  if (!saved.length) {
    return (
      <div className="page">
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <p style={{ fontSize: 14 }}>No schedules saved yet. Generate and save a schedule to see analytics.</p>
          <button className="btn-p" style={{ marginTop: '1rem', width: 'auto', padding: '10px 20px' }} onClick={() => showPage('plan')}>Create first schedule</button>
        </div>
      </div>
    );
  }

  const domainTotals = {}, dayCompletions = [];
  saved.forEach(s => {
    (s.domains || []).forEach(d => {
      const tt = s.timetable || {};
      Object.values(tt).forEach(day => day.forEach(c => { if (c.type === d) domainTotals[d] = (domainTotals[d] || 0) + 1; }));
    });
    const ts = s.tickState || {};
    let ticked = 0, total = 0;
    Object.values(ts).forEach(arr => { if (Array.isArray(arr)) arr.forEach(v => { total++; if (v) ticked++; }); });
    dayCompletions.push({ name: new Date(s.created).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), pct: total > 0 ? Math.round(ticked / total * 100) : 0 });
  });

  const avgCompletion = dayCompletions.length ? Math.round(dayCompletions.reduce((s, d) => s + d.pct, 0) / dayCompletions.length) : 0;
  const bestStreak = Math.max(streak, parseInt(localStorage.getItem('ssp_best_streak') || streak));

  const domColors = { coding: 'var(--blue)', workout: 'var(--green)', interview: 'var(--amber)', music: 'var(--red)', language: 'var(--teal)', creative: 'var(--orange)', study: 'var(--purple)' };
  const maxD = Math.max(...Object.values(domainTotals), 1);

  const tips = [];
  if (avgCompletion < 50) tips.push("Your average completion is below 50%. Try reducing daily slots or choosing lighter domains for a few days.");
  else if (avgCompletion >= 80) tips.push("Excellent! You're consistently completing your schedule. Consider increasing difficulty or adding a new domain.");
  if (streak >= 7) tips.push("🔥 7-day streak! You're building a strong habit. Keep going!");
  if (streak === 0) tips.push("Start a streak today — complete all slots and check them off!");
  const topDomain = Object.entries(domainTotals).sort((a, b) => b[1] - a[1])[0];
  if (topDomain) tips.push(`Your most scheduled domain is ${topDomain[0]}. Great focus! Make sure other domains also get enough attention.`);

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>Weekly Analytics</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>Your performance over the past 7 days</div>
        </div>
        <button className="btn-p" style={{ width: 'auto', padding: '9px 18px', fontSize: 13 }} onClick={() => showPage('plan')}>+ New schedule</button>
      </div>

      {/* Top stats */}
      <div className="stats-row" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-box"><div className="sl">Current streak</div><div className="sv" style={{ color: 'var(--blue)' }}>🔥 {streak} days</div></div>
        <div className="stat-box"><div className="sl">Avg completion</div><div className="sv" style={{ color: 'var(--green)' }}>{avgCompletion}%</div></div>
        <div className="stat-box"><div className="sl">Schedules saved</div><div className="sv">{saved.length}</div></div>
        <div className="stat-box"><div className="sl">Best streak</div><div className="sv" style={{ color: 'var(--amber)' }}>🏆 {bestStreak}</div></div>
      </div>

      {/* Charts */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Completion by schedule</h3>
          <div className="bar-chart">
            {dayCompletions.map((d, i) => {
              const color = d.pct >= 80 ? 'var(--green)' : d.pct >= 50 ? 'var(--blue)' : 'var(--amber)';
              return (
                <div className="bar-row" key={i}>
                  <div className="bar-label">{d.name}</div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: d.pct + '%', background: color }} /></div>
                  <div className="bar-val">{d.pct}%</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="analytics-card">
          <h3>Domain distribution</h3>
          <div className="bar-chart">
            {Object.entries(domainTotals).map(([d, v]) => (
              <div className="bar-row" key={d}>
                <div className="bar-label" style={{ textTransform: 'capitalize' }}>{d}</div>
                <div className="bar-track"><div className="bar-fill" style={{ width: Math.round(v / maxD * 100) + '%', background: domColors[d] || 'var(--blue)' }} /></div>
                <div className="bar-val">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', marginTop: '1rem', boxShadow: 'var(--shadow)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: '1rem' }}>💡 Personalised tips</h3>
        {tips.map((t, i) => (
          <div key={i} style={{ padding: '8px 12px', background: 'var(--blue-light)', borderLeft: '3px solid var(--blue)', borderRadius: '0 8px 8px 0', marginBottom: 8, fontSize: 13, color: 'var(--text)' }}>{t}</div>
        ))}
      </div>
    </div>
  );
}
