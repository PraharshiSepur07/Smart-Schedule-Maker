import { useApp } from '../context/AppContext';

export default function Nav() {
  const { currentUser, logout, showPage, activePage, theme, toggleTheme, toggleNotif, notifBadge } = useApp();

  const pageMap = { home: 'Home', plan: 'New Plan', history: 'My Schedules', analytics: 'Analytics', compensate: 'Missed a Day?' };

  const initials = currentUser
    ? currentUser.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '';

  return (
    <nav>
      <div className="nav-brand" onClick={() => showPage('home')}>
        <div className="nav-brand-icon">📅</div>
        SmartSchedule <span style={{ fontWeight: 400, opacity: 0.7 }}>Pro</span>
      </div>

      <div className="nav-links">
        {Object.entries(pageMap).map(([key, label]) => (
          <button
            key={key}
            className={`nav-link${activePage === key ? ' active' : ''}`}
            onClick={() => showPage(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="nav-right">
        <button className="icon-btn" onClick={toggleTheme} title="Toggle dark mode">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="icon-btn" onClick={toggleNotif} id="notifBtn">
          🔔
          {notifBadge && <div className="badge" />}
        </button>
        <div id="navAuth">
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="nav-avatar">{initials}</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{currentUser.name}</span>
              <button
                onClick={() => { logout(); showPage('home'); }}
                style={{ fontSize: 12, color: 'var(--text3)', border: '1px solid var(--border)', background: 'none', padding: '4px 10px', borderRadius: 7, cursor: 'pointer' }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              style={{ background: 'var(--blue)', color: '#fff', padding: '7px 16px', borderRadius: 9, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 3px 10px rgba(26,86,219,.3)' }}
              onClick={() => showPage('auth')}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
