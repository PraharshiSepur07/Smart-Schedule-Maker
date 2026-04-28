import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getAuthSession, persistAuthSession, clearUser } from '../utils/auth';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Theme
  const [theme, setTheme] = useState(() => localStorage.getItem('ssp_theme') || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ssp_theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  // Auth
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState('');

  useEffect(() => {
    const session = getAuthSession();
    if (!session) return;
    setCurrentUser(session.user || null);
    setAuthToken(session.token || '');
  }, []);

  const login = useCallback((userOrSession, token = '') => {
    const session = userOrSession && userOrSession.user
      ? userOrSession
      : { user: userOrSession, token };
    persistAuthSession(session);
    setCurrentUser(session.user || null);
    setAuthToken(String(session.token || ''));
  }, []);
  const logout = useCallback(() => {
    clearUser();
    setCurrentUser(null);
    setAuthToken('');
  }, []);

  // Page routing
  const [activePage, setActivePage] = useState('home');
  const showPage = useCallback((name) => {
    setActivePage(name);
    window.scrollTo(0, 0);
    setNotifOpen(false);
  }, []);

  // Global schedule state
  const [globalSchedule, setGlobalSchedule] = useState(null);
  const [tickState, setTickState] = useState({});

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef(null);
  const showToast = useCallback((msg, dur = 2800) => {
    setToastMsg(msg);
    setToastVisible(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), dur);
  }, []);

  // Loading overlay
  const [loadingVisible, setLoadingVisible] = useState(false);
  const [loadingText, setLoadingText] = useState('Building your schedule...');
  const showLoad = useCallback((msg) => { setLoadingText(msg); setLoadingVisible(true); }, []);
  const hideLoad = useCallback(() => setLoadingVisible(false), []);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifBadge, setNotifBadge] = useState(false);
  const addNotif = useCallback((n) => {
    setNotifications(prev => [n, ...prev]);
    setNotifBadge(true);
  }, []);
  const clearNotifs = useCallback(() => { setNotifications([]); }, []);
  const toggleNotif = useCallback(() => {
    setNotifOpen(o => !o);
    setNotifBadge(false);
  }, []);

  // Game modal
  const [gameModalOpen, setGameModalOpen] = useState(false);
  const openGameModal = useCallback(() => setGameModalOpen(true), []);
  const closeGameModal = useCallback(() => setGameModalOpen(false), []);

  return (
    <AppContext.Provider value={{
      theme, toggleTheme,
      currentUser, authToken, login, logout,
      activePage, showPage,
      globalSchedule, setGlobalSchedule,
      tickState, setTickState,
      toastMsg, toastVisible, showToast,
      loadingVisible, loadingText, showLoad, hideLoad,
      notifications, addNotif, clearNotifs,
      notifOpen, notifBadge, toggleNotif, setNotifOpen,
      gameModalOpen, openGameModal, closeGameModal,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
