import { useApp } from '../context/AppContext';

export default function LoadingOverlay() {
  const { loadingVisible, loadingText } = useApp();
  return (
    <div className={`loading-overlay${loadingVisible ? ' show' : ''}`}>
      <div className="spinner" />
      <div className="loading-text">{loadingText}</div>
    </div>
  );
}
