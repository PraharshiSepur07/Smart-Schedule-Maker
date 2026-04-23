import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DAYS, SLOTS } from '../../data/constants';
import { buildSchedule, scheduleNotifsSetup } from '../../utils/scheduleBuilder';
import { updateStreak } from '../../utils/storage';
import Step0_Domains from '../plan/Step0_Domains';
import Step1_Details from '../plan/Step1_Details';
import Step2_Preferences from '../plan/Step2_Preferences';
import Step3_Timetable from '../plan/Step3_Timetable';
import Step4_SessionGuide from '../plan/Step4_SessionGuide';

const STEP_LABELS = [
  'Step 1 of 5 — Pick your domains',
  'Step 2 of 5 — Domain details',
  'Step 3 of 5 — Availability & preferences',
  'Step 4 of 5 — Your timetable',
  'Step 5 of 5 — Session guide',
];
const STEP_PCT = ['20%', '40%', '60%', '80%', '100%'];

export default function PlanPage() {
  const { showToast, showLoad, hideLoad, setGlobalSchedule, globalSchedule, tickState, setTickState, addNotif, currentUser } = useApp();

  const [step, setStep] = useState(0);

  // Form state
  const [domains, setDomains] = useState([]);
  const [coding, setCoding] = useState({ priority: 'Medium' });
  const [workout, setWorkout] = useState({ days: '4 days', priority: 'Medium' });
  const [interview, setInterview] = useState({ priority: 'Medium' });
  const [music, setMusic] = useState({ priority: 'Medium' });
  const [language, setLanguage] = useState({ priority: 'Medium' });
  const [creative, setCreative] = useState({ priority: 'Medium' });
  const [study, setStudy] = useState({ priority: 'Medium' });
  const [prefs, setPrefs] = useState({
    avFrom: '8:30 AM',
    avTo: '4:00 PM',
    wHrs: '1 hour',
    wSlots: '1 slot/day',
    sHrs: '1 hour',
    sSlots: '1 slot/day',
    workoutTime: 'Evening (3–4 PM)',
    wellness: 'Yes, daily',
    scheduleDeadline: '',
    unavailableRanges: [{ from: '', to: '' }],
    taskPrefs: {}
  });
  const [userName, setUserName] = useState(currentUser ? currentUser.name : '');

  // Timetable
  const [timetable, setTimetable] = useState(null);

  useEffect(() => {
    const viewStep = sessionStorage.getItem('ssp_view_step');
    if (viewStep !== '3' || !globalSchedule) return;

    // Rehydrate form state so back/forward inside plan keeps consistent data.
    setDomains(globalSchedule.domains || []);
    setCoding(globalSchedule.coding || { priority: 'Medium' });
    setWorkout(globalSchedule.workout || { days: '4 days', priority: 'Medium' });
    setInterview(globalSchedule.interview || { priority: 'Medium' });
    setMusic(globalSchedule.music || { priority: 'Medium' });
    setLanguage(globalSchedule.language || { priority: 'Medium' });
    setCreative(globalSchedule.creative || { priority: 'Medium' });
    setStudy(globalSchedule.study || { priority: 'Medium' });
    setPrefs(globalSchedule.prefs || {
      avFrom: '8:30 AM',
      avTo: '4:00 PM',
      wHrs: '1 hour',
      wSlots: '1 slot/day',
      sHrs: '1 hour',
      sSlots: '1 slot/day',
      workoutTime: 'Evening (3–4 PM)',
      wellness: 'Yes, daily',
      scheduleDeadline: '',
      unavailableRanges: [{ from: '', to: '' }],
      taskPrefs: {}
    });
    setUserName(globalSchedule.userName || (currentUser ? currentUser.name : 'You'));
    setTimetable(globalSchedule.timetable || null);
    setStep(3);
    sessionStorage.removeItem('ssp_view_step');
  }, [globalSchedule, currentUser]);

  const goTo = (s) => { setStep(s); window.scrollTo(0, 0); };

  // Rehydrate from a saved schedule (called by HistoryPage)
  // Expose a way to load saved data via prop
  const handleNext0 = () => {
    if (!domains.length) { showToast('Select at least one domain'); return; }
    goTo(1);
  };

  const handleNext1 = () => goTo(2);

  const handleNext2 = async () => {
    showLoad('Building your schedule...');
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const D = {
      domains,
      c: { ...coding, topics: coding.topics || [] },
      w: workout,
      i: { ...interview, focusAreas: interview.focusAreas || [] },
      m: music,
      l: { ...language, focus: language.focus || [] },
      cr: creative,
      st: study,
      p: prefs,
      userName: userName || (currentUser ? currentUser.name : 'You'),
    };
    try {
      const result = buildSchedule(D);
      const ts = {};
      DAYS.forEach(day => { ts[day] = new Array(SLOTS.length).fill(false); });
      setTimetable(result.timetable);
      setTickState(ts);
      setGlobalSchedule(result);
      updateStreak();
      // schedule notifications
      const ntimer = scheduleNotifsSetup(result.timetable, D.userName, addNotif, showToast);
      goTo(3);
    } catch (err) {
      console.error('Schedule build failed:', err);
      showToast(err?.message || 'Failed to build schedule');
    } finally {
      hideLoad();
    }
  };

  // If globalSchedule is loaded from history, use that timetable
  const activeTimetable = timetable || (globalSchedule ? globalSchedule.timetable : null);
  const activeUserName = userName || (globalSchedule ? globalSchedule.userName : 'You');

  return (
    <div className="page">
      {/* Progress bar */}
      <div className="pbar-wrap">
        <div className="pbar-label">
          <span>{STEP_LABELS[step]}</span>
          <span>{STEP_PCT[step]}</span>
        </div>
        <div className="pbar"><div className="pfill" style={{ width: STEP_PCT[step] }} /></div>
      </div>

      {step === 0 && (
        <Step0_Domains domains={domains} setDomains={setDomains} onNext={handleNext0} />
      )}
      {step === 1 && (
        <Step1_Details
          domains={domains}
          coding={coding} setCoding={setCoding}
          workout={workout} setWorkout={setWorkout}
          interview={interview} setInterview={setInterview}
          music={music} setMusic={setMusic}
          language={language} setLanguage={setLanguage}
          creative={creative} setCreative={setCreative}
          study={study} setStudy={setStudy}
          onBack={() => goTo(0)} onNext={handleNext1}
        />
      )}
      {step === 2 && (
        <Step2_Preferences
          domains={domains}
          prefs={prefs} setPrefs={setPrefs}
          userName={userName} setUserName={setUserName}
          onBack={() => goTo(1)} onNext={handleNext2}
        />
      )}
      {step === 3 && activeTimetable && (
        <Step3_Timetable
          timetable={activeTimetable}
          tickState={tickState} setTickState={setTickState}
          userName={activeUserName}
          onBack={() => goTo(2)} onNext={() => goTo(4)}
        />
      )}
      {step === 4 && (
        <Step4_SessionGuide
          domains={domains.length ? domains : (globalSchedule ? globalSchedule.domains : [])}
          coding={coding} workout={workout} interview={interview}
          music={music} language={language} creative={creative} study={study}
          onBack={() => goTo(3)}
        />
      )}
    </div>
  );
}
