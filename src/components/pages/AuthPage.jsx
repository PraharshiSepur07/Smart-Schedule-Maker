import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getUsers, saveUsers } from '../../utils/auth';

export default function AuthPage() {
  const { login, showPage, showToast } = useApp();
  const [tab, setTab] = useState('login');
  const [err, setErr] = useState('');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPw, setRegPw] = useState('');

  const showErr = (m) => setErr(m);

  const doRegister = () => {
    if (!regName || !regEmail || !regPw) return showErr('All fields required');
    if (regPw.length < 6) return showErr('Password min 6 chars');
    const users = getUsers();
    if (users.find(u => u.email === regEmail)) return showErr('Email already registered');
    const u = { id: Date.now(), name: regName, email: regEmail, pass: regPw };
    saveUsers([...users, u]);
    login(u); showToast('Welcome, ' + u.name + '! 👋'); showPage('plan');
  };

  const doLogin = () => {
    if (!loginEmail || !loginPw) return showErr('Enter email and password');
    const u = getUsers().find(u => u.email === loginEmail && u.pass === loginPw);
    if (!u) return showErr('Incorrect email or password');
    login(u); showToast('Welcome, ' + u.name + '! 👋'); showPage('plan');
  };

  const doGuest = () => {
    login({ id: 'guest', name: 'Guest', email: 'guest@local' });
    showToast('Welcome, Guest! 👋'); showPage('plan');
  };

  return (
    <div className="page">
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-header">
            <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
            <h2>Welcome to SmartSchedule</h2>
            <p>Sign in to save schedules, track streaks &amp; get reminders</p>
          </div>

          <div className="auth-tabs">
            <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => { setTab('login'); setErr(''); }}>Sign in</button>
            <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => { setTab('register'); setErr(''); }}>Create account</button>
          </div>

          {err && <div className="auth-err">{err}</div>}

          {tab === 'login' ? (
            <div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" placeholder="you@email.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" placeholder="••••••••" value={loginPw} onChange={e => setLoginPw(e.target.value)} />
              </div>
              <button className="auth-btn" onClick={doLogin}>Sign in</button>
              <div className="divider">or</div>
              <button className="auth-btn" style={{ background: 'var(--surface)', color: 'var(--text)', border: '1.5px solid var(--border)', boxShadow: 'none' }} onClick={doGuest}>Continue as guest</button>
            </div>
          ) : (
            <div>
              <div className="form-group">
                <label className="form-label">Full name</label>
                <input type="text" className="form-input" placeholder="Your name" value={regName} onChange={e => setRegName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" placeholder="you@email.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" placeholder="Min 6 characters" value={regPw} onChange={e => setRegPw(e.target.value)} />
              </div>
              <button className="auth-btn" onClick={doRegister}>Create account</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
