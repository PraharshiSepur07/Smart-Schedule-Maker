import { DAYS, LEETCODE, GFG, WORKOUT_PLANS, WORKOUT_VID, LUNCH, MUSIC_VID, MUSIC_GFG, LANG_LINKS, defaultLangLink, CREATIVE_VID, CREATIVE_GFG, CODING_CONTENT, INTERVIEW_CONTENT } from '../../data/constants';
import { useApp } from '../../context/AppContext';
import { saveSchedule } from '../../utils/storage';

function mapGoal(s) {
  s = (s || '').toLowerCase();
  if (s.includes('gain') || s.includes('muscle')) return 'gain';
  if (s.includes('loss') || s.includes('burn')) return 'loss';
  if (s.includes('endur')) return 'endurance';
  return 'maintenance';
}

function RecCard({ children }) {
  return <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.4rem', marginBottom: '.9rem', boxShadow: 'var(--shadow)' }}>{children}</div>;
}
function RecTitle({ t }) {
  return <div style={{ fontSize: 15, fontWeight: 800, marginBottom: '1rem', color: 'var(--text)' }}>{t}</div>;
}

export default function Step4_SessionGuide({ domains, coding: C, workout: W, interview: I, music: M, language: L, creative: CR, study: ST, onBack }) {
  const { showToast, globalSchedule, setGlobalSchedule, tickState, currentUser } = useApp();

  const doSave = () => {
    if (!globalSchedule) { showToast('No schedule to save'); return; }
    const result = saveSchedule(globalSchedule, tickState, currentUser);
    if (result === 'exists') { showToast('Already saved!'); return; }
    setGlobalSchedule(result);
    showToast('Schedule saved! ✓');
  };

  const priCls = p => p === 'High' ? 'ph' : p === 'Low' ? 'pl' : 'pm';

  const hC = domains.includes('coding');
  const hW = domains.includes('workout');
  const hI = domains.includes('interview');
  const hM = domains.includes('music');
  const hL = domains.includes('language');
  const hCr = domains.includes('creative');
  const hS = domains.includes('study');

  return (
    <div>
      {/* CODING */}
      {hC && (() => {
        const topics = (C.topics && C.topics.length) ? C.topics : ['Data structures','HTML & CSS'];
        return (
          <RecCard>
            <RecTitle t="💻 Coding session guide" />
            {topics.map(topic => {
              const bank = CODING_CONTENT[topic] || [];
              const pri = C.priority || 'Medium';
              return (
                <div key={topic}>
                  <div className="section-hdr">{topic} <span className={`pri-badge ${priCls(pri)}`}>{pri}</span></div>
                  <table className="rec-tt">
                    <thead><tr><th style={{ width: 70 }}>Session</th><th>Topic</th><th>LeetCode</th><th>GFG</th></tr></thead>
                    <tbody>
                      {bank.map(([t, d], i) => {
                        const lc = (LEETCODE[topic] || [])[i % Math.max((LEETCODE[topic] || []).length, 1)];
                        const gfg = GFG[topic];
                        return (
                          <tr key={i}>
                            <td style={{ color: 'var(--text3)', fontWeight: 700 }}>Day {i + 1}</td>
                            <td><strong>{t}</strong><br /><span style={{ fontSize: 11, color: 'var(--text3)' }}>{d}</span></td>
                            <td>{lc ? <a href={lc.u} target="_blank" rel="noreferrer" className="res-link rl-lc">{lc.n}</a> : '—'}</td>
                            <td>{gfg ? <a href={gfg.u} target="_blank" rel="noreferrer" className="res-link rl-gfg">GFG</a> : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </RecCard>
        );
      })()}

      {/* WORKOUT */}
      {hW && (() => {
        const goal = W.goal || 'Maintenance', place = W.place || 'Gym';
        const wg = mapGoal(goal);
        const plan = WORKOUT_PLANS[wg] || WORKOUT_PLANS.maintenance;
        const lData = LUNCH[wg] || LUNCH.maintenance;
        const curr = W.currWeight, tgt = W.targetWeight;
        const weightNote = curr && tgt ? `Current: ${curr}kg → Target: ${tgt}kg (${Math.abs(tgt - curr)}kg ${tgt > curr ? 'to gain' : 'to lose'})` : curr ? `Current: ${curr}kg` : 'Set your target weight for personalised tips';
        return (
          <RecCard>
            <RecTitle t={`🏋️ Workout plan — ${goal} (${place})`} />
            {(curr || tgt) && <div className="info-box info-blue" style={{ marginBottom: '1rem', fontSize: 12 }}><strong>Weight goal:</strong> {weightNote}</div>}
            <table className="rec-tt">
              <thead><tr><th>Day</th><th>Focus</th><th>Exercises</th><th>Video</th></tr></thead>
              <tbody>
                {DAYS.map((day, di) => {
                  const [focus, ex] = plan[di] || ['Rest', ['Light stretch']];
                  const yt = WORKOUT_VID[focus] || '#';
                  return (
                    <tr key={day}>
                      <td style={{ color: 'var(--text3)', fontWeight: 700 }}>{day}</td>
                      <td style={{ fontWeight: 700 }}>{focus}</td>
                      <td><ul style={{ listStyle: 'none', padding: 0 }}>{ex.map(e => <li key={e} style={{ padding: '1px 0', fontSize: 11, borderBottom: '1px dotted var(--border2)' }}>{e}</li>)}</ul></td>
                      <td><a href={yt} target="_blank" rel="noreferrer" className="res-link rl-yt">▶ Watch</a></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="info-box info-amber" style={{ marginTop: '1rem', fontSize: 12 }}>
              <strong>🍱 Lunch for {goal}:</strong> {lData.note}<br />
              <strong>Meal ideas:</strong> {lData.meals.join(' | ')}
            </div>
          </RecCard>
        );
      })()}

      {/* INTERVIEW */}
      {hI && (() => {
        const role = I.role || 'Full stack', exp = I.exp || 'Fresher';
        const wks = [
          { w: 'Week 1', th: 'Foundation', it: [`Arrays, strings, hash maps — 2 easy/day`, `Resume — tailor to ${role} JD`, '"Tell me about yourself" — rehearse daily', 'Research 5 target companies'] },
          { w: 'Week 2', th: 'Core DSA + role', it: ['Linked lists, stacks, queues — 3 problems/day', `Build 1 portfolio project for ${role}`, 'STAR stories: leadership, conflict, growth', 'Role-specific deep-dive'] },
          { w: 'Week 3', th: 'System design + mock', it: ['Design Twitter/URL shortener/file storage', 'Study: load balancing, caching, sharding', 'Record your first mock interview', 'Fix gaps identified in mock'] },
          { w: 'Week 4', th: 'Final sprint', it: ['Hard problems + full revision', 'Full mock on Pramp/Interviewing.io', 'GitHub + portfolio polished & live', 'Prepare 20 company-specific questions'] }
        ];
        return (
          <RecCard>
            <RecTitle t={`📋 Interview roadmap — ${role} (${exp})`} />
            <table className="rec-tt">
              <thead><tr><th style={{ width: 70 }}>Week</th><th style={{ width: 130 }}>Theme</th><th>What to do</th></tr></thead>
              <tbody>
                {wks.map(w => (
                  <tr key={w.w}>
                    <td style={{ color: 'var(--text3)', fontWeight: 700 }}>{w.w}</td>
                    <td style={{ fontWeight: 700 }}>{w.th}</td>
                    <td><ul style={{ listStyle: 'none', padding: 0 }}>{w.it.map(i => <li key={i} style={{ padding: '2px 0', borderBottom: '1px dotted var(--border2)', fontSize: 11 }}>{i}</li>)}</ul></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </RecCard>
        );
      })()}

      {/* MUSIC */}
      {hM && (() => {
        const inst = M.instrument || 'Guitar';
        const yt = MUSIC_VID[inst] || 'https://youtube.com/results?search_query=music+tutorial';
        const days = [['Monday','Warm-up scales 10 min + technique'],['Tuesday','Learn new chord/piece'],['Wednesday','Rhythm & timing — metronome'],['Thursday','Music theory — intervals, scales'],['Friday','Full run-through + self-record']];
        return (
          <RecCard>
            <RecTitle t={`🎵 Music practice guide — ${inst}`} />
            <table className="rec-tt">
              <thead><tr><th>Day</th><th>Focus</th><th>Resource</th></tr></thead>
              <tbody>{days.map(([d, f]) => <tr key={d}><td style={{ color: 'var(--text3)', fontWeight: 700 }}>{d}</td><td>{f}</td><td><a href={yt} target="_blank" rel="noreferrer" className="res-link rl-yt">▶ Tutorial</a> <a href={MUSIC_GFG} target="_blank" rel="noreferrer" className="res-link rl-gfg">GFG</a></td></tr>)}</tbody>
            </table>
          </RecCard>
        );
      })()}

      {/* LANGUAGE */}
      {hL && (() => {
        const lang = L.lang || 'Spanish';
        const ll = LANG_LINKS[lang] || defaultLangLink;
        const days = [['Monday','Vocabulary — 20 words + flashcards'],['Tuesday','Grammar — 1 key rule + 10 sentences'],['Wednesday','Listening — podcast / YouTube 20 min'],['Thursday','Speaking — repeat phrases, record yourself'],['Friday','Full conversation practice or Duolingo streak review']];
        return (
          <RecCard>
            <RecTitle t={`🗣️ Language learning plan — ${lang}`} />
            <div className="info-box info-blue" style={{ marginBottom: '1rem', fontSize: 12 }}>Daily minimum: <strong>15 min Duolingo</strong> + <strong>10 min speaking practice</strong> + <strong>20 new vocabulary words</strong></div>
            <table className="rec-tt">
              <thead><tr><th>Day</th><th>Focus</th><th>Resources</th></tr></thead>
              <tbody>{days.map(([d, f]) => <tr key={d}><td style={{ color: 'var(--text3)', fontWeight: 700 }}>{d}</td><td>{f}</td><td><a href={ll.duo} target="_blank" rel="noreferrer" className="res-link rl-duo">🦜 Duolingo</a> <a href={ll.yt} target="_blank" rel="noreferrer" className="res-link rl-yt">▶ YouTube</a></td></tr>)}</tbody>
            </table>
          </RecCard>
        );
      })()}

      {/* CREATIVE */}
      {hCr && (() => {
        const med = CR.medium || 'Drawing / Sketching';
        const yt2 = CREATIVE_VID[med] || '#';
        const gfg2 = CREATIVE_GFG[med] || '#';
        const days = [['Monday','Warm-up: 5 quick sketches or colour swatches'],['Tuesday','Technique focus: 1 core skill in depth'],['Wednesday','Copy a master work — study light, shadow, form'],['Thursday','Original piece — apply what you\'ve learned'],['Friday','Critique yourself: what worked, what to improve?']];
        return (
          <RecCard>
            <RecTitle t={`🎨 Creative arts guide — ${med}`} />
            <table className="rec-tt">
              <thead><tr><th>Day</th><th>Exercise</th><th>Resource</th></tr></thead>
              <tbody>{days.map(([d, ex]) => <tr key={d}><td style={{ color: 'var(--text3)', fontWeight: 700 }}>{d}</td><td>{ex}</td><td><a href={yt2} target="_blank" rel="noreferrer" className="res-link rl-yt">▶ Tutorial</a>{gfg2 !== '#' && <> <a href={gfg2} target="_blank" rel="noreferrer" className="res-link rl-gfg">GFG</a></>}</td></tr>)}</tbody>
            </table>
          </RecCard>
        );
      })()}

      {/* STUDY */}
      {hS && ST.subject && (() => {
        const days = [['Monday','Chapter overview + concept map','Cornell notes'],['Tuesday','Deep study + worked examples','Pomodoro: 25/5'],['Wednesday','Practice problems (past papers)','Timed exam conditions'],['Thursday','Weak areas revision','Spaced repetition flashcards'],['Friday','Full mock test + review mistakes','Feynman technique']];
        return (
          <RecCard>
            <RecTitle t={`📝 Study plan — ${ST.subject}`} />
            <table className="rec-tt">
              <thead><tr><th>Day</th><th>Task</th><th>Method</th></tr></thead>
              <tbody>{days.map(([d, t, m]) => <tr key={d}><td style={{ color: 'var(--text3)', fontWeight: 700 }}>{d}</td><td>{t}</td><td style={{ fontSize: 11, color: 'var(--text3)' }}>{m}</td></tr>)}</tbody>
            </table>
          </RecCard>
        );
      })()}

      <div className="btn-row">
        <button className="btn-s" onClick={onBack}>← Back to timetable</button>
        <button className="btn-p" onClick={doSave}>Save schedule ✓</button>
      </div>
    </div>
  );
}
