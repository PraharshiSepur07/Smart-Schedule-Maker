import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { tagCls, tagLabel } from '../../utils/scheduleBuilder';

function ChipMulti({ chips, value, onChange }) {
  const toggle = (chip) => onChange(prev => prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]);
  return (
    <div className="chip-row">
      {chips.map(chip => (
        <div key={chip} className={`chip${value.includes(chip) ? ' on' : ''}`} onClick={() => toggle(chip)}>{chip}</div>
      ))}
    </div>
  );
}

export default function CompensatePage() {
  const { globalSchedule, showToast } = useApp();
  const [missedDay, setMissedDay] = useState(null);
  const [what, setWhat] = useState([]);
  const [compResult, setCompResult] = useState(null);

  const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

  const genComp = () => {
    if (!missedDay) { showToast('Select a day first'); return; }
    if (!globalSchedule) { showToast('Generate a schedule first from New Plan'); return; }
    const missed = globalSchedule.timetable[missedDay] || [];
    const filtered = missed.filter(c => {
      if (c.type === 'break') return false;
      if (what.length === 0 || what.includes('Everything')) return true;
      return what.some(w => w.toLowerCase().includes(c.type));
    });
    if (!filtered.length) { setCompResult('empty'); return; }
    const remaining = DAYS.filter(d => d !== missedDay);
    setCompResult({ filtered, remaining });
    showToast('Compensation schedule ready ✓');
  };

  return (
    <div className="page">
      <div className="q-card">
        <div className="q-title">🔄 Missed a day? No problem.</div>
        <div className="q-subtitle">Tell us which day you missed — we'll redistribute those sessions across the remaining weekdays for you.</div>

        <div className="qg">
          <span className="qlabel">Which day did you miss?</span>
          <div className="day-chips">
            {DAYS.map(d => (
              <div key={d} className={`day-chip${missedDay === d ? ' sel' : ''}`}
                onClick={() => { setMissedDay(d); setCompResult(null); }}>
                {d}
              </div>
            ))}
          </div>
        </div>

        {missedDay && (
          <div>
            <div className="qg">
              <span className="qlabel">What did you miss?</span>
              <ChipMulti
                chips={['Coding','Workout','Interview prep','Music','Language','Creative','Study','Everything']}
                value={what}
                onChange={setWhat}
              />
            </div>
            <button className="btn-p" style={{ maxWidth: 280 }} onClick={genComp}>Generate compensation plan →</button>
          </div>
        )}

        {compResult && (
          <div style={{ marginTop: '1.25rem' }}>
            {compResult === 'empty' ? (
              <div className="info-box info-green">No sessions to compensate — you may have already covered the important parts!</div>
            ) : (
              <>
                <div className="info-box info-green"><strong>Compensation plan ready</strong> — {compResult.filtered.length} session(s) redistributed across remaining weekdays.</div>
                <div className="tt-wrap">
                  <table className="tt">
                    <thead><tr><th>Missed session</th><th>Move to</th><th>Details</th></tr></thead>
                    <tbody>
                      {compResult.filtered.map((c, i) => {
                        const tday = compResult.remaining[i % compResult.remaining.length];
                        const [bgCls, tgCls] = tagCls(c.type);
                        return (
                          <tr key={i}>
                            <td className={bgCls}>
                              <span className={`ctag ${tgCls}`}>{tagLabel(c.type)}</span>
                              <div className="ctitle">{c.title}</div>
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--blue)' }}>{tday}</td>
                            <td style={{ fontSize: 12, color: 'var(--text2)' }}>
                              {c.detail}
                              {c.lc && <><br /><a className="res-link rl-lc" href={c.lc.u} target="_blank" rel="noreferrer">LeetCode</a></>}
                              {c.ytLink && <><br /><a className="res-link rl-yt" href={c.ytLink} target="_blank" rel="noreferrer">▶ Tutorial</a></>}
                              {c.duoLink && <><br /><a className="res-link rl-duo" href={c.duoLink} target="_blank" rel="noreferrer">Duolingo</a></>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
