/** Apply the original 80-situation editorial review with exact-text guards. */
import fs from 'node:fs';

const file = 'src/data/speak-situations.json';
const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
const fixes = [
  ['speak-kids-weather-plan', 'after', 'Let us stay inside and play a board game.', "Let's stay inside and play a board game."],
  ['speak-r12-kids-phone-answer', 'after', 'Please wait a second. I will tell her you called.', "Please wait. I'll give her the phone."],
  ['speak-r12-kids-cinema-choice', 'before', 'Let us watch the space film because we all like adventures.', "Let's watch the space film; we all like adventures."],
  ['speak-teens-weather-event', 'after', 'The current meteorological forecast warrants relocation.', 'Rain good, library next.'],
  ['speak-teens-doctor-symptom', 'before', 'I have experienced pharyngeal discomfort for 72 hours.', 'The clinic waiting room is full.'],
  ['speak-teens-travel-delay', 'before', 'The delay may disrupt my onward itinerary.', 'I travel yesterday tomorrow.'],
  ['speak-teens-weekend-conflict', 'after', 'I am unavailable due to a prior engagement.', 'My friend am other plan.'],
  ['speak-r12-teens-home-energy', 'after', 'A reduction in cooling-system runtime is advisable.', 'The air conditioner is blue.'],
  ['speak-r12-teens-job-shift', 'after', 'I cannot work Friday because of my exam. Is Saturday useful?', 'I cannot work Friday because of my exam. Could I work Saturday instead?'],
  ['speak-r12-teens-compliment-idea', 'before', 'Your proposal substantially improves communicative clarity.', 'The survey is made of pencils.'],
  ['speak-r12-teens-project-deadline', 'before', 'Let us keep the research but shorten the presentation instead.', "Let's keep the research but shorten the presentation instead."],
];

for (const [id, phase, oldText, newText] of fixes) {
  const row = rows.find((item) => item.id === id);
  if (!row) throw new Error(`Missing reviewed situation ${id}`);
  const round = row[phase];
  const index = round.replies.indexOf(oldText);
  if (index < 0) {
    if (round.replies.includes(newText)) continue;
    throw new Error(`${id} ${phase}: original reply changed unexpectedly`);
  }
  round.replies[index] = newText;
}
fs.writeFileSync(file, JSON.stringify(rows, null, 2) + '\n');
console.log(`Applied ${fixes.length} reply edits to ${new Set(fixes.map((fix) => fix[0])).size} of the original 80 situations.`);
