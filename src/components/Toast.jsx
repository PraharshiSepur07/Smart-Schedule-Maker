import { useApp } from '../context/AppContext';

export default function Toast() {
  const { toastMsg, toastVisible } = useApp();
  return (
    <div className={`toast${toastVisible ? ' show' : ''}`}>
      {toastMsg}
    </div>
  );
}
