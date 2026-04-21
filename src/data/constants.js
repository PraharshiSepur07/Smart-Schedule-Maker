// ══════════════════════════════════════════════════
// DATA TABLES — all constants from the original HTML
// ══════════════════════════════════════════════════
export const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
export const SLOT_HOURS = Array.from({ length: 17 }, (_, i) => 6 + i); // 06:00..22:00
export const SLOTS = SLOT_HOURS.map((h) => {
  const start = String(h).padStart(2, '0') + ':00';
  const endHour = (h + 1) % 24;
  const end = String(endHour).padStart(2, '0') + ':00';
  return start + '-' + end;
});

export const PRACTICE_PLATFORMS = [
  'LeetCode','HackerRank','GeeksforGeeks','Codeforces','CodeChef',
  'AtCoder','HackerEarth','InterviewBit','Exercism','Codewars','TopCoder'
];

export const TARGET_ROLES = [
  'Frontend Developer','Backend Developer','Full Stack Developer','Software Engineer',
  'SDE Intern','Data Analyst','Data Scientist','ML Engineer','DevOps Engineer',
  'Cloud Engineer','QA Engineer','Cybersecurity Analyst','Product Manager','UI/UX Designer'
];

export const LEETCODE = {
  'Data structures':[{n:'Two Sum',u:'https://leetcode.com/problems/two-sum/'},{n:'Reverse Linked List',u:'https://leetcode.com/problems/reverse-linked-list/'},{n:'Valid Parentheses',u:'https://leetcode.com/problems/valid-parentheses/'},{n:'Maximum Depth of Binary Tree',u:'https://leetcode.com/problems/maximum-depth-of-binary-tree/'},{n:'Top K Frequent Elements',u:'https://leetcode.com/problems/top-k-frequent-elements/'},{n:'Number of Islands',u:'https://leetcode.com/problems/number-of-islands/'},{n:'LRU Cache',u:'https://leetcode.com/problems/lru-cache/'}],
  'Algorithms':[{n:'Binary Search',u:'https://leetcode.com/problems/binary-search/'},{n:'Merge Sorted Array',u:'https://leetcode.com/problems/merge-sorted-array/'},{n:'Climbing Stairs',u:'https://leetcode.com/problems/climbing-stairs/'},{n:'Coin Change',u:'https://leetcode.com/problems/coin-change/'},{n:'Jump Game',u:'https://leetcode.com/problems/jump-game/'},{n:'Word Break',u:'https://leetcode.com/problems/word-break/'},{n:'Longest Increasing Subsequence',u:'https://leetcode.com/problems/longest-increasing-subsequence/'}],
  'HTML & CSS':[{n:'Frontend Mentor Card',u:'https://www.frontendmentor.io/challenges/product-preview-card-component-GO7UmttRfa'},{n:'Flexbox Froggy',u:'https://flexboxfroggy.com/'},{n:'CSS Grid Garden',u:'https://cssgridgarden.com/'},{n:'CSS Battle',u:'https://cssbattle.dev/'},{n:'100 Days CSS',u:'https://100dayscss.com/'}],
  'React':[{n:'React Tutorial',u:'https://react.dev/learn'},{n:'React hooks sandbox',u:'https://codesandbox.io/s/new'},{n:'React Router tutorial',u:'https://reactrouter.com/en/main/start/tutorial'},{n:'React query intro',u:'https://tanstack.com/query/latest/docs/framework/react/quick-start'}],
  'Python Flask':[{n:'Flask quickstart',u:'https://flask.palletsprojects.com/quickstart/'},{n:'Flask SQLAlchemy',u:'https://flask-sqlalchemy.palletsprojects.com/quickstart/'},{n:'Flask-JWT guide',u:'https://flask-jwt-extended.readthedocs.io/en/stable/basic_usage.html'},{n:'Build REST API',u:'https://realpython.com/flask-connexion-rest-api/'}],
  'MySQL':[{n:'LeetCode SQL 50',u:'https://leetcode.com/studyplan/top-sql-50/'},{n:'Combine Two Tables',u:'https://leetcode.com/problems/combine-two-tables/'},{n:'Employees Earning > Managers',u:'https://leetcode.com/problems/employees-earning-more-than-their-managers/'},{n:'Department Top 3',u:'https://leetcode.com/problems/department-top-three-salaries/'}],
  'JavaScript':[{n:'JS30 challenges',u:'https://javascript30.com/'},{n:'Exercism JS track',u:'https://exercism.org/tracks/javascript'},{n:'JS Algorithms repo',u:'https://github.com/trekhleb/javascript-algorithms'},{n:'Frontend challenges',u:'https://www.frontendmentor.io/'}],
  'Node.js':[{n:'Node.js official guide',u:'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs'},{n:'Express tutorial',u:'https://expressjs.com/en/starter/hello-world.html'},{n:'Build REST API — FCC',u:'https://www.freecodecamp.org/learn/back-end-development-and-apis/'},{n:'Node best practices',u:'https://github.com/goldbergyoni/nodebestpractices'}]
};

export const GFG = {
  'Data structures':{n:'DSA on GFG',u:'https://www.geeksforgeeks.org/data-structures/'},
  'Algorithms':{n:'Algorithms GFG',u:'https://www.geeksforgeeks.org/fundamentals-of-algorithms/'},
  'HTML & CSS':{n:'HTML/CSS GFG',u:'https://www.geeksforgeeks.org/html/'},
  'React':{n:'React GFG',u:'https://www.geeksforgeeks.org/reactjs/'},
  'Python Flask':{n:'Flask GFG',u:'https://www.geeksforgeeks.org/flask-tutorial/'},
  'MySQL':{n:'MySQL GFG',u:'https://www.geeksforgeeks.org/mysql-tutorial/'},
  'JavaScript':{n:'JS GFG',u:'https://www.geeksforgeeks.org/javascript/'},
  'Node.js':{n:'Node.js GFG',u:'https://www.geeksforgeeks.org/nodejs/'}
};

export const WORKOUT_VID = {
  'Chest + Triceps':'https://www.youtube.com/results?search_query=chest+triceps+workout+tutorial',
  'Back + Biceps':'https://www.youtube.com/results?search_query=back+biceps+workout+guide',
  'Legs + Shoulders':'https://www.youtube.com/results?search_query=leg+shoulder+workout+tutorial',
  'Full body compound':'https://www.youtube.com/results?search_query=full+body+compound+workout',
  'HIIT full body':'https://www.youtube.com/results?search_query=hiit+workout+beginners',
  'Run + abs':'https://www.youtube.com/results?search_query=running+ab+workout',
  'Cycling + core':'https://www.youtube.com/results?search_query=cycling+core+workout',
  'Tabata sprint':'https://www.youtube.com/results?search_query=tabata+workout+20+minutes',
  'Upper body':'https://www.youtube.com/results?search_query=upper+body+workout+home',
  'Lower body':'https://www.youtube.com/results?search_query=lower+body+workout+home',
  'Cardio':'https://www.youtube.com/results?search_query=cardio+workout+30+minutes',
  'Full body':'https://www.youtube.com/results?search_query=full+body+workout+beginners',
  'Active recovery':'https://www.youtube.com/results?search_query=active+recovery+yoga+stretching',
  'Yoga / rest':'https://www.youtube.com/results?search_query=yoga+recovery+flexibility',
  'Rest / recovery':'https://www.youtube.com/results?search_query=foam+rolling+recovery',
  'Long run':'https://www.youtube.com/results?search_query=beginner+running+form+tutorial',
  'Tempo run':'https://www.youtube.com/results?search_query=tempo+run+guide',
  'Cross training':'https://www.youtube.com/results?search_query=cross+training+workout'
};

export const WORKOUT_PLANS = {
  gain:{0:['Chest + Triceps',['Bench press 4×8','Incline DB press 3×10','Cable fly 3×12','Tricep pushdown 3×15','Dips 3×fail']],1:['Back + Biceps',['Pull-ups 4×max','Barbell rows 4×8','Lat pulldown 3×12','Hammer curls 3×15','Face pulls 3×15']],2:['Legs + Shoulders',['Squats 4×8','Romanian deadlift 3×10','Leg press 3×12','OHP 4×8','Lateral raises 3×15']],3:['Rest / recovery',['Foam rolling 15 min','Full body stretching','Light yoga']],4:['Full body compound',['Deadlift 4×6','Pull-ups 4×max','Dips 3×fail','Farmer carry 3×30m']]},
  loss:{0:['HIIT full body',['Jump squats 4×15','Mountain climbers 3×30s','Burpees 3×10','High knees 1 min','Core circuit 3×']],1:['Run + abs',['5km run / 30 min jog','Crunches 3×20','Leg raises 3×15','Russian twists 3×20']],2:['Cycling + core',['Cycling 40 min','Plank 3×60s','Side plank 3×30s','Ab circuit 3×']],3:['Yoga / rest',['20 min yoga','Full body stretching','Foam rolling']],4:['Tabata sprint',['Tabata 8 rounds (20s/10s)','Jump rope 10 min','Cool-down walk 15 min']]},
  maintenance:{0:['Upper body',['Push-ups 3×15','DB rows 3×12','Shoulder press 3×10','Plank 3×45s']],1:['Lower body',['Squats 3×15','Lunges 3×12','Leg press 3×10','Calf raises 3×20']],2:['Cardio',['30 min jog','Jump rope 10 min','Stretching 15 min']],3:['Full body',['Deadlifts 3×8','Pull-ups 3×max','DB lunges 3×12','Core circuit']],4:['Active recovery',['Light walk 30 min','Yoga 20 min','Foam rolling']]},
  endurance:{0:['Long run',['5km comfortable pace','Cool-down walk','Stretching']],1:['Tempo run',['3km at 80% effort','6×200m intervals']],2:['Cross training',['Cycling 45 min','Core work 20 min']],3:['Yoga / rest',['Rest or 20 min yoga']],4:['Active recovery',['4km at race pace','Cool-down & stretch']]}
};

export const LUNCH = {
  gain:{meals:['Chicken rice bowl — 200g chicken, 1.5 cups rice, broccoli','Paneer wrap + whole wheat roti + curd','Tuna/soya sandwich + boiled eggs + banana','Dal rice + ghee + salad + buttermilk'],note:'High protein + high carb. Target: 600–800 cal, 40–50g protein.'},
  loss:{meals:['Grilled chicken salad — olive oil dressing, no croutons','Moong dal chilla + mint chutney + cucumber','Quinoa veggie bowl + lemon dressing','Brown rice + dal + sabzi (no ghee)'],note:'High protein + low carb. Target: 400–500 cal, 30–40g protein.'},
  maintenance:{meals:['Dal rice + sabzi + curd + salad','Roti + paneer curry + lassi','Chicken wrap + fruit bowl','Mix veg pulao + raita + boiled eggs'],note:'Balanced macros. Target: 500–600 cal with good carb/protein/fat split.'},
  endurance:{meals:['Banana oat smoothie + whole wheat sandwich','Rice + rajma + salad (carb-heavy for fuel)','Sweet potato bowl + grilled chicken','Pasta + lean protein + coconut water'],note:'High carbs for energy. Target: 600–700 cal. Prioritise complex carbs.'}
};

export const WELLNESS_SLOTS = [
  {title:'🧘 Morning meditation',detail:'5-min guided breathing — box breathing (4-4-4-4 method)',link:'https://www.youtube.com/results?search_query=5+minute+morning+meditation'},
  {title:'🌬️ Breathing exercise',detail:'Wim Hof breathing — 3 rounds, clear your mind before study',link:'https://www.youtube.com/watch?v=tybOi4hjZFQ'},
  {title:'🧠 Brain warm-up',detail:'Solve a quick Sudoku or number puzzle — 10 minutes',link:'https://www.websudoku.com/'},
  {title:'🧩 Logic puzzle',detail:'Solve a crossword or visual logic puzzle to boost focus',link:'https://www.nytimes.com/crosswords'},
  {title:'🌿 Mindfulness break',detail:'2-min body scan — release tension from shoulders and neck',link:'https://www.headspace.com/'},
  {title:'💆 Quick stretch',detail:'5-min desk stretch — neck, shoulders, back — highly recommended',link:'https://www.youtube.com/results?search_query=5+minute+desk+stretch'}
];

export const CODING_CONTENT = {
  'Data structures':[['Arrays & two pointers','Sliding window, prefix sum, two-sum'],['Linked lists','Reverse, detect cycle, merge sorted'],['Stacks & queues','Implement from scratch, monotonic stack'],['Hash maps','Frequency count, anagrams, LRU cache'],['Trees','BFS, DFS, height, LCA'],['Heaps / priority queues','Top-K elements, merge K lists'],['Graphs','BFS/DFS, Dijkstra shortest path']],
  'Algorithms':[['Sorting fundamentals','Bubble, insertion, merge sort — code each'],['Quick sort & heap sort','Divide & conquer, in-place'],['Binary search variants','Rotated array, find range, matrix'],['Recursion & backtracking','Permutations, subsets, N-Queens'],['Dynamic programming','Memoisation, tabulation, knapsack'],['Greedy algorithms','Activity selection, intervals'],['Complexity analysis','Big O for time & space']],
  'HTML & CSS':[['Box model & layout','Display types, positioning, margin/padding'],['Flexbox mastery','10 exercises — Flexbox Froggy'],['CSS Grid','Responsive 12-column page'],['Responsive design','Media queries, mobile-first'],['CSS variables & animations','Transitions, keyframes'],['Semantic HTML','Accessibility, ARIA roles'],['Full landing page','Navbar, hero, cards, footer']],
  'React':[['JSX & components','Functional components, props'],['useState & events','Controlled inputs, forms'],['useEffect','API calls, cleanup, dependencies'],['React Router','SPA, nested routes, params'],['Context API','Global state management'],['Custom hooks','Reusable stateful logic'],['Optimisation','memo, useMemo, useCallback']],
  'Python Flask':[['Flask basics','App factory, routes, GET/POST'],['Request & response','JSON API, status codes'],['Jinja2 templates','Inheritance, blocks, loops'],['SQLAlchemy ORM','Models, migrations, CRUD'],['REST API design','Error handling, validation'],['JWT auth','Register, login, protected routes'],['Deployment','Gunicorn, Render/Railway']],
  'MySQL':[['Basic queries','SELECT, WHERE, ORDER BY, LIMIT'],['JOINs','INNER, LEFT, RIGHT JOIN'],['Aggregation','GROUP BY, HAVING, COUNT'],['Subqueries','Nested, correlated, EXISTS'],['Indexes','B-tree, EXPLAIN, optimisation'],['Stored procedures','Procedures, triggers, views'],['DB design','ER diagram, normalisation']],
  'JavaScript':[['Variables & scope','let, const, hoisting, closures'],['Functions & arrays','Arrow fn, map, filter, reduce'],['DOM manipulation','querySelector, events'],['Promises & async','Async/await, fetch API'],['OOP in JS','Classes, prototypes, this'],['ES6+ features','Destructuring, spread, modules'],['JS30 challenge','Build something small daily']],
  'Node.js':[['Node basics','Modules, fs, path, process'],['Express routes','GET/POST/PUT/DELETE'],['Middleware','Body-parser, CORS, auth'],['Database','Connect MySQL/MongoDB'],['REST API','Full CRUD + validation'],['Auth','JWT with bcrypt'],['Deploy','PM2, Railway/Render']]
};

export const INTERVIEW_CONTENT = {
  'DSA & problem solving':[['Arrays & strings','LeetCode easy — 2 timed problems'],['Linked lists & stacks','Medium — explain complexity'],['Trees & graphs','BFS/DFS, draw recursion tree'],['DP foundations','Climbing stairs, coin change']],
  'System design':[['URL shortener','Hash, DB schema, caching'],['Twitter feed','Fanout, timeline storage'],['File storage','Chunking, CDN, metadata'],['Rate limiter','Token bucket vs leaky bucket']],
  'HR & behavioural':[['Tell me about yourself','Write & rehearse 90-sec script'],['Leadership story','STAR: led project under pressure'],['Conflict resolution','STAR: disagreement resolved'],['Failure & growth','STAR: lesson from failure']],
  'Resume & portfolio':[['Resume pass 1','Tailor to JD, match keywords'],['GitHub cleanup','README for each project'],['Portfolio site','Deploy 2–3 projects live'],['LinkedIn profile','Headline, about, endorsements']],
  'Mock interviews':[['30-min mock','Record: 1 DSA + 2 HR'],['Watch & review','Filler words, clarity gaps'],['Peer mock','Swap roles, structured feedback'],['Final simulation','Full 45-min with stranger']]
};

export const MUSIC_VID = {
  'Guitar':'https://www.youtube.com/results?search_query=guitar+lessons+beginners',
  'Piano':'https://www.youtube.com/results?search_query=piano+lessons+beginners',
  'Vocals':'https://www.youtube.com/results?search_query=singing+lessons+beginners',
  'Drums':'https://www.youtube.com/results?search_query=drum+lessons+beginners',
  'Music theory':'https://www.youtube.com/results?search_query=music+theory+basics',
  'Production (DAW)':'https://www.youtube.com/results?search_query=fl+studio+ableton+beginners'
};
export const MUSIC_GFG = 'https://www.geeksforgeeks.org/music-and-arts/';

export const LANG_LINKS = {
  'Spanish':{duo:'https://www.duolingo.com/course/es/en/Learn-Spanish',yt:'https://www.youtube.com/results?search_query=spanish+for+beginners'},
  'French':{duo:'https://www.duolingo.com/course/fr/en/Learn-French',yt:'https://www.youtube.com/results?search_query=french+for+beginners'},
  'Japanese':{duo:'https://www.duolingo.com/course/ja/en/Learn-Japanese',yt:'https://www.youtube.com/results?search_query=japanese+for+beginners'},
  'German':{duo:'https://www.duolingo.com/course/de/en/Learn-German',yt:'https://www.youtube.com/results?search_query=german+for+beginners'},
  'Hindi':{duo:'https://www.duolingo.com/course/hi/en/Learn-Hindi',yt:'https://www.youtube.com/results?search_query=hindi+for+beginners'}
};
export const defaultLangLink = {duo:'https://www.duolingo.com/',yt:'https://www.youtube.com/results?search_query=language+learning+tips'};

export const CREATIVE_VID = {
  'Drawing / Sketching':'https://www.youtube.com/results?search_query=drawing+for+beginners+tutorial',
  'Painting (watercolor)':'https://www.youtube.com/results?search_query=watercolor+painting+tutorial+beginners',
  'Digital art':'https://www.youtube.com/results?search_query=digital+art+procreate+beginners',
  'UI/UX design':'https://www.youtube.com/results?search_query=figma+ui+ux+design+tutorial',
  'Photography':'https://www.youtube.com/results?search_query=photography+basics+beginners'
};
export const CREATIVE_GFG = {
  'Drawing / Sketching':'https://www.geeksforgeeks.org/digital-art/',
  'Painting (watercolor)':'https://www.youtube.com/results?search_query=watercolor+tutorial',
  'Digital art':'https://www.geeksforgeeks.org/adobe-photoshop-tutorial/',
  'UI/UX design':'https://www.geeksforgeeks.org/ui-ux-design/',
  'Photography':'https://www.youtube.com/results?search_query=photography+tips'
};
