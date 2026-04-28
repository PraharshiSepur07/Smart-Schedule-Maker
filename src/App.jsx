import { AppProvider, useApp } from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import Nav from './components/Nav';
import Toast from './components/Toast';
import LoadingOverlay from './components/LoadingOverlay';
import NotifPanel from './components/NotifPanel';
import GameModal from './components/GameModal';
import HomePage from './components/pages/HomePage';
import AuthPage from './components/pages/AuthPage';
import PlanPage from './components/pages/PlanPage';
import AnalyticsPage from './components/pages/AnalyticsPage';
import CompensatePage from './components/pages/CompensatePage';
import HistoryPage from './components/pages/HistoryPage';

function AppInner() {
  const { activePage } = useApp();

  const pages = {
    home: <HomePage />,
    auth: <AuthPage />,
    plan: <PlanPage />,
    analytics: <AnalyticsPage />,
    compensate: <CompensatePage />,
    history: <HistoryPage />,
  };

  return (
    <>
      <Nav />
      <NotifPanel />
      {pages[activePage] || <HomePage />}
      <Toast />
      <LoadingOverlay />
      <GameModal />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ErrorBoundary>
        <AppInner />
      </ErrorBoundary>
    </AppProvider>
  );
}
