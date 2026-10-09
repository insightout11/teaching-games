/** Add reviewed topic links to the 110 pre-Round-27 Speak situations. */
import fs from 'node:fs';

const file = 'src/data/speak-situations.json';
const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
const briefingIds = new Set(JSON.parse(fs.readFileSync('src/data/topic-briefings.json', 'utf8')).map((row) => row.id));
// Keys omit the shared "speak-" prefix. Empty links are intentional for broad scenarios.
const links = {
  'kids-school-pencil': ['school-day', 'classroom-rules'],
  'kids-friend-plan': ['making-friends'],
  'kids-hobby-drawing': ['drawing'],
  'kids-weather-plan': ['clouds', 'rain'],
  'kids-doctor-headache': ['jobs-people-do'],
  'kids-lost-pet': ['dogs', 'caring-for-pets'],
  'kids-festival-invite': ['festivals-around-the-world', 'family-traditions'],
  'kids-animal-care': ['caring-for-pets'],
  'kids-school-question': ['school-day'],
  'r12-kids-directions-library': ['school-day'],
  'r12-kids-invite-party': ['birthday-parties', 'making-friends'],
  'r12-kids-apology-bump': ['making-friends', 'classroom-rules'],
  'r12-kids-apology-late': ['making-friends'],
  'r12-kids-compliment-drawing': ['drawing'],
  'r12-kids-compliment-effort': ['school-day'],
  'r12-kids-borrow-ruler': ['school-day', 'classroom-rules'],
  'r12-kids-project-role': ['school-day'],
  'r12-kids-feelings-nervous': ['school-day'],
  'r12-kids-feelings-cheer-up': ['making-friends'],

  'teens-restaurant-split-bill': ['budgeting', 'money-and-saving'],
  'teens-school-deadline': ['homework', 'study-habits'],
  'teens-friend-cancel': ['friendship'],
  'teens-hobby-invite': ['school-clubs'],
  'teens-travel-delay': ['public-transport', 'travel-planning'],
  'teens-weather-event': ['outdoor-adventures'],
  'teens-tech-privacy': ['online-privacy', 'social-media', 'digital-footprints'],
  'teens-music-feedback': ['songwriting'],
  'teens-festival-custom': ['local-traditions', 'food-culture'],
  'teens-weekend-conflict': ['friendship'],
  'teens-shop-budget': ['budgeting', 'money-and-saving'],
  'teens-school-group': ['teamwork'],
  'teens-travel-host': ['travel-etiquette', 'food-culture'],
  'r12-teens-directions-transfer': ['public-transport', 'travel-planning'],
  'r12-teens-invite-new-student': ['friendship'],
  'r12-teens-apology-message': ['online-privacy', 'social-media', 'digital-footprints'],
  'r12-teens-compliment-work': ['teamwork'],
  'r12-teens-borrow-notes': ['homework', 'study-habits'],
  'r12-teens-project-deadline': ['teamwork', 'study-habits'],
  'r12-teens-team-bench': ['team-sports'],
  'r12-teens-game-spending': ['video-games', 'budgeting', 'money-and-saving'],
  'r12-teens-social-photo': ['social-media', 'online-privacy', 'digital-footprints'],
  'r12-teens-money-split': ['budgeting', 'money-and-saving'],
  'r12-teens-feelings-exam': ['exams', 'stress-management'],
  'r12-teens-cinema-disagree': ['film-genres'],
  'r12-teens-job-interview': ['part-time-jobs', 'career-skills'],
  'r12-teens-job-shift': ['part-time-jobs'],
  'r12-teens-apology-group': ['teamwork'],
  'r12-teens-compliment-idea': ['teamwork'],

  'junior-return-toy': ['making-friends'],
  'junior-say-sorry': ['making-friends'],
  'junior-invite-play': ['playgrounds', 'making-friends'],
  'junior-join-game': ['building-blocks', 'making-friends'],
  'junior-doctor-tummy': ['jobs-people-do'],
  'junior-birthday-greeting': ['birthday-parties'],
  'junior-teacher-help': ['school-day'],
  'junior-lost-dog': ['dogs', 'caring-for-pets'],
  'junior-borrow-pencil': ['school-day'],
  'junior-ask-water': ['school-day'],
  'junior-share-crayons': ['drawing', 'classroom-rules'],
  'junior-swing-turn': ['playgrounds'],
  'junior-hurt-friend': ['playgrounds', 'making-friends'],
  'junior-find-toilet': ['school-day'],
  'junior-missing-spoon': ['school-lunch'],
  'junior-spilled-water': ['classroom-rules'],
  'junior-greet-new-child': ['making-friends', 'school-day'],
  'junior-thank-driver': ['jobs-people-do'],
  'junior-apple-price': ['fruits'],
  'junior-pet-water': ['dogs', 'caring-for-pets'],
  'junior-repeat-word': ['school-day'],
  'junior-thank-gift': ['birthday-parties'],
  'junior-borrow-eraser': ['school-day'],
  'junior-bus-seat': ['making-friends'],
};

const knownRows = new Set(rows.map((row) => row.id));
for (const key of Object.keys(links)) if (!knownRows.has(`speak-${key}`)) throw new Error(`Unknown situation link key ${key}`);
let linked = 0;
for (const row of rows) {
  if (row.id.startsWith('speak-r27-')) continue;
  const age = row.ageBand === 'teens' ? 'teens' : 'kids';
  const suffixes = links[row.id.replace(/^speak-/, '')] ?? [];
  row.topicIds = suffixes.map((suffix) => `topic-${age}-${suffix}`);
  for (const id of row.topicIds) if (!briefingIds.has(id)) throw new Error(`${row.id}: unknown topic ${id}`);
  if (row.topicIds.length) linked += 1;
}
fs.writeFileSync(file, JSON.stringify(rows, null, 2) + '\n');
console.log(`Linked ${linked} of ${rows.length} existing situations; all have topicIds.`);
