import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

export default function NotifPanel() {
  const { notifOpen, notifications, clearNotifs, setNotifOpen } = useApp();

  const panelRef = useRef(null);
  useEffect(() => {
    function handleClick(e) {
      const btn = document.getElementById('notifBtn');
      if (notifOpen && panelRef.current && !panelRef.current.contains(e.target) && btn && !btn.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [notifOpen, setNotifOpen]);

  return (
    <div className={`notif-panel${notifOpen ? ' open' : ''}`} ref={panelRef}>
      <div className="notif-hdr">
        <span>Notifications</span>
        <button onClick={clearNotifs} style={{ fontSize: 11, color: 'var(--text3)', border: 'none', background: 'none', cursor: 'pointer' }}>Clear all</button>
      </div>
      <div>
        {notifications.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No notifications yet</div>
        ) : (
          notifications.map((n, i) => (
            <div key={i} className="notif-item unread">
              <div className="ni-icon">{n.icon}</div>
              <div className="ni-body">
                <div className="ni-title">{n.title}</div>
                <div className="ni-sub">{n.sub}</div>
                {n.link && <a className="ni-link" href={n.link} target="_blank" rel="noreferrer">Open resource →</a>}
                <div className="ni-time">{n.ts}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
