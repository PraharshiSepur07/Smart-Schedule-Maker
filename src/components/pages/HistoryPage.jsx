import { useApp } from '../../context/AppContext';
import { getSaved, deleteSaved } from '../../utils/storage';
import { DAYS, SLOTS } from '../../data/constants';

export default function HistoryPage() {
  const { currentUser, showPage, setGlobalSchedule, setTickState, showToast } = useApp();
  const uid = currentUser ? currentUser.id : 'guest';
  const all = getSaved();
  const items = all.filter(s => s.userId === uid || s.userId === 'guest');

  const doDelete = (targetId) => {
    deleteSaved(targetId);
    showToast('Deleted');
    // force re-render by changing a key — we'll just reload by showing the page again
    showPage('history');
  };

  const doView = (s) => {
    const ts = s.tickState || {};
    DAYS.forEach(day => { if (!ts[day]) ts[day] = new Array(SLOTS.length).fill(false); });
    setGlobalSchedule(s);
    setTickState(ts);
    showPage('plan');
    // We need plan page to go to step 3 — use a small hack via sessionStorage
    sessionStorage.setItem('ssp_view_step', '3');
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>Saved Schedules</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>{items.length} schedule{items.length !== 1 ? 's' : ''} saved</div>
        </div>
        <button className="btn-p" style={{ width: 'auto', padding: '9px 18px', fontSize: 13 }} onClick={() => showPage('plan')}>+ New schedule</button>
      </div>

      {!items.length ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text3)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📅</div>
          <p style={{ fontSize: 14 }}>No schedules saved yet.</p>
        </div>
      ) : (
        items.map(s => {
          const date = new Date(s.created).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          const ts = s.tickState || {};
          let ticked = 0, total = 0;
          Object.values(ts).forEach(arr => { if (Array.isArray(arr)) arr.forEach(v => { total++; if (v) ticked++; }); });
          const prog = total > 0 ? Math.round(ticked / total * 100) : 0;
          return (
            <div className="hist-card" key={s.id}>
              <div className="hist-info">
                <h3>{(s.userName || 'My')}'s schedule</h3>
                <div className="hist-meta">
                  <span>{date}</span>
                  <span>{Object.keys(s.timetable || {}).length} days</span>
                </div>
                <div className="hist-pills">
                  {(s.domains || []).map(d => (
                    <span key={d} className={`dpill dp-${d}`}>{d.charAt(0).toUpperCase() + d.slice(1)}</span>
                  ))}
                </div>
                {total > 0 && <div className="hist-prog">✓ {prog}% completed ({ticked}/{total})</div>}
              </div>
              <div className="hist-actions">
                <button className="hbtn-view" onClick={() => doView(s)}>View</button>
                <button className="hbtn-del" onClick={() => doDelete(s.id)}>✕</button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
