import { buildSchedule } from '../src/utils/scheduleBuilder.js';

async function run() {
  const D = {
    domains: ['coding','interview','language','workout','study'],
    userName: 'Tester',
    c: { topics: ['Data structures'], priority: 'Medium', deadline: '' },
    i: { focusAreas: ['DSA & problem solving'], priority: 'Medium', deadline: '' },
    w: { goal: 'maintenance', days: '3 days', priority: 'Medium' },
    m: {}, l: {}, cr: {}, st: { subject: 'Math', deadline: '' },
    p: {
      taskPrefs: {
        coding: { periods: ['morning','evening'], times: [], minutesPerDay: 90, slotsPerDay: 2 },
        interview: { periods: ['morning','evening'], times: [], minutesPerDay: 60, slotsPerDay: 1 },
        language: { periods: ['morning','evening'], times: [], minutesPerDay: 30, slotsPerDay: 1 },
        workout: { periods: ['morning','evening'], times: [], minutesPerDay: 45, slotsPerDay: 1 },
        study: { periods: ['morning','evening'], times: [], minutesPerDay: 60, slotsPerDay: 1 }
      },
      wellness: 'Yes, 3x/week',
      scheduleDeadline: ''
    }
  };

  const out = buildSchedule(D);
  // Print a compact view: for each domain, list placed times on Monday
  const monday = out.timetable.Monday || [];
  const inspectRange = (start, end) => monday.slice(start, end + 1).map((c, i) => ({ slotIndex: start + i, cell: c }));
  console.log(JSON.stringify({ summary: { domains: out.domains }, mondayRange: inspectRange(40, 50) }, null, 2));
}

run().catch(err => { console.error(err); process.exit(1); });
