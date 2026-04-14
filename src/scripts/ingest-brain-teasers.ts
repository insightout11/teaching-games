/**
 * Batch-ingest the curated Brain Teasers riddle bank into the content cache.
 *
 * Run via:
 *   pnpm ingest-brain-teasers
 *
 * Requirements:
 *   - CONTENT_INGEST_API_KEY env var set (in .env.local)
 *   - BASE_URL env var set, or defaults to http://localhost:3000
 *   - Dev server running (pnpm dev) OR target a deployed URL
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const API_KEY = process.env.CONTENT_INGEST_API_KEY;

if (!API_KEY) {
  console.error('❌  CONTENT_INGEST_API_KEY is not set. Add it to .env.local and retry.');
  process.exit(1);
}

interface RiddleEntry {
  difficulty: string;
  content_json: {
    riddle: string;
    answers: string[];
    explanation: string;
    category: string;
  };
}

const RIDDLES: RiddleEntry[] = [
  // ── Beginner (15) ──────────────────────────────────────────────────────────
  { difficulty: 'beginner', content_json: { riddle: 'Before Mount Everest was discovered, what was the tallest mountain on Earth?', answers: ['mount everest', 'everest'], explanation: 'Mount Everest was always the tallest — it just hadn\'t been discovered yet.', category: 'lateral-thinking' } },
  { difficulty: 'beginner', content_json: { riddle: 'You are running a race and you pass the person in second place. What place are you in now?', answers: ['second', 'second place'], explanation: 'You took their spot — second place. You\'d only be first if you passed the person in first.', category: 'lateral-thinking' } },
  { difficulty: 'beginner', content_json: { riddle: 'How does Bill manage to go 8 days without sleep?', answers: ['he sleeps at night', 'sleeps at night'], explanation: 'Bill sleeps at night — the riddle only says he goes without sleep during the day.', category: 'lateral-thinking' } },
  { difficulty: 'beginner', content_json: { riddle: 'A rooster sits on the peak of a barn roof and lays an egg. Which way does the egg roll?', answers: ['it doesnt', 'it does not roll', 'roosters dont lay eggs', 'nowhere'], explanation: 'Roosters are male — they don\'t lay eggs.', category: 'lateral-thinking' } },
  { difficulty: 'beginner', content_json: { riddle: 'Some months have 30 days, some have 31. How many months have 28 days?', answers: ['all of them', 'all 12', 'twelve', '12'], explanation: 'Every single month has at least 28 days.', category: 'wordplay' } },
  { difficulty: 'beginner', content_json: { riddle: 'You enter a room with a candle, an oil lamp, and a fireplace. You have only one match. What do you light first?', answers: ['the match', 'match'], explanation: 'You must light the match before you can light anything else.', category: 'lateral-thinking' } },
  { difficulty: 'beginner', content_json: { riddle: 'A farmer has 17 sheep. All but 9 die. How many sheep does he have left?', answers: ['9', 'nine'], explanation: '\'All but 9\' means 9 survive.', category: 'wordplay' } },
  { difficulty: 'beginner', content_json: { riddle: 'If you have a bowl with six apples and you take away four, how many apples do you have?', answers: ['4', 'four'], explanation: 'You took four apples — so you have four. The bowl has two left, but those aren\'t yours.', category: 'lateral-thinking' } },
  { difficulty: 'beginner', content_json: { riddle: 'What word is spelled incorrectly in every dictionary?', answers: ['incorrectly'], explanation: 'The word \'incorrectly\' is always spelled i-n-c-o-r-r-e-c-t-l-y — exactly as the riddle says.', category: 'wordplay' } },
  { difficulty: 'beginner', content_json: { riddle: 'An electric train is heading north. The wind is blowing from the east. Which direction does the smoke blow?', answers: ['there is no smoke', 'no smoke', 'electric trains dont produce smoke', 'none'], explanation: 'Electric trains have no combustion engine — they produce no smoke.', category: 'lateral-thinking' } },
  { difficulty: 'beginner', content_json: { riddle: 'A doctor has a brother, but that brother has no brothers. How is this possible?', answers: ['the doctor is a woman', 'the doctor is female', 'she is a woman'], explanation: 'The doctor is a woman. Her brother has no brothers — only a sister (her).', category: 'lateral-thinking' } },
  { difficulty: 'beginner', content_json: { riddle: 'How far can a dog run into the woods?', answers: ['halfway', 'half way'], explanation: 'Once the dog is halfway in, it\'s running out of the woods.', category: 'lateral-thinking' } },
  { difficulty: 'beginner', content_json: { riddle: 'What five-letter word becomes shorter when you add two letters to it?', answers: ['short'], explanation: 'Add \'er\' to \'short\' and you get \'shorter\'.', category: 'wordplay' } },
  { difficulty: 'beginner', content_json: { riddle: 'What can you keep after giving it to someone else?', answers: ['your word', 'a promise', 'your name'], explanation: 'Your word — a promise — is still yours after you give it.', category: 'wordplay' } },
  { difficulty: 'beginner', content_json: { riddle: 'A man walks into a store and buys a $3 item. He hands the cashier a $10 bill and gets $7 back. What did he buy?', answers: ['a 3 dollar item', 'something worth 3 dollars'], explanation: 'The riddle already tells you — a $3 item. The change math is a distraction.', category: 'lateral-thinking' } },

  // ── Intermediate (18) ──────────────────────────────────────────────────────
  { difficulty: 'intermediate', content_json: { riddle: 'A man rode into town on Friday, stayed for three days, and left on Friday. How is this possible?', answers: ['friday is the name of his horse', 'his horse is named friday'], explanation: 'Friday is the name of the man\'s horse, not the day of the week.', category: 'lateral-thinking' } },
  { difficulty: 'intermediate', content_json: { riddle: 'A woman shoots her husband, then holds him underwater for five minutes. Twenty minutes later they go to dinner together. How?', answers: ['she took a photo of him', 'she photographed him', 'she is a photographer'], explanation: 'She\'s a photographer. She \'shot\' his photo and developed it in a darkroom tank.', category: 'lateral-thinking' } },
  { difficulty: 'intermediate', content_json: { riddle: 'Two men play five complete games of chess. Each wins the same number of games and there are no draws. How?', answers: ['they played different opponents', 'they did not play each other', 'they played against other people'], explanation: 'The two men never played each other — they played different opponents.', category: 'logic' } },
  { difficulty: 'intermediate', content_json: { riddle: 'A man lives on the 30th floor. Every morning he takes the elevator down. When he returns he takes it to the 15th floor and walks up — except on rainy days, when he rides to the 30th. Why?', answers: ['he is too short to reach the button', 'he cant reach the 30th floor button', 'he is short'], explanation: 'He\'s too short to reach the 30th floor button. On rainy days he uses his umbrella to press it.', category: 'lateral-thinking' } },
  { difficulty: 'intermediate', content_json: { riddle: 'A man is found dead in a locked room. The only objects are a puddle of water and a piece of rope. How did he die?', answers: ['he stood on a block of ice and hanged himself', 'he used a block of ice to hang himself', 'ice melted under him'], explanation: 'He stood on a block of ice, tied the rope around his neck, and the ice melted — leaving only the puddle.', category: 'lateral-thinking' } },
  { difficulty: 'intermediate', content_json: { riddle: 'A man is found dead in a field. Next to him is an unopened package. There are no other people or animals around. What happened?', answers: ['his parachute failed to open', 'his parachute didnt open', 'parachute'], explanation: 'His parachute (the unopened package) failed to deploy.', category: 'lateral-thinking' } },
  { difficulty: 'intermediate', content_json: { riddle: 'In a marathon, you overtake the person in 100th place. What place are you in now?', answers: ['100th', 'one hundredth', '100'], explanation: 'You took their position — 100th. You\'d need to pass the 99th-place person too to be in 99th.', category: 'lateral-thinking' } },
  { difficulty: 'intermediate', content_json: { riddle: 'You see a boat filled with people, yet there isn\'t a single person on board. How?', answers: ['everyone is married', 'they are all married', 'no single people'], explanation: 'There isn\'t a single (unmarried) person — everyone on board is married.', category: 'wordplay' } },
  { difficulty: 'intermediate', content_json: { riddle: 'A man buys rice at $1, sells it at $2. Buys a horse at $3, sells at $4. Buys a car at $5, sells at $6. What is his total profit?', answers: ['3 dollars', 'three dollars', '3'], explanation: '$1 profit on each of three transactions = $3 total.', category: 'math' } },
  { difficulty: 'intermediate', content_json: { riddle: 'You are in a race and pass the person in last place. What place are you in?', answers: ['second to last', 'second from last'], explanation: 'You can\'t pass last place and then be in last place — you\'re second to last.', category: 'lateral-thinking' } },
  { difficulty: 'intermediate', content_json: { riddle: 'A woman has 7 daughters, and each daughter has one brother. How many children does the woman have?', answers: ['8', 'eight'], explanation: 'All 7 daughters share the same one brother — 7 + 1 = 8 children total.', category: 'logic' } },
  { difficulty: 'intermediate', content_json: { riddle: 'I have two coins that add up to 30 cents. One of them is not a nickel. What are the two coins?', answers: ['a quarter and a nickel', 'quarter and nickel', '25 cents and 5 cents'], explanation: 'One coin is a quarter — that\'s the one that\'s not a nickel. The other coin is a nickel.', category: 'wordplay' } },
  { difficulty: 'intermediate', content_json: { riddle: 'There are 6 mangoes in a basket and 6 kids each want one. You give one to each of the first 5 kids and still have one left for the sixth. How?', answers: ['give the last mango in the basket', 'give the basket with the mango inside', 'give the sixth child the mango still in the basket'], explanation: 'Give the sixth child the basket with the last mango still inside it.', category: 'lateral-thinking' } },
  { difficulty: 'intermediate', content_json: { riddle: 'A man shaves several times a day but still has a beard. How?', answers: ['he is a barber', 'he shaves other people'], explanation: 'He\'s a barber — he shaves his customers, not himself.', category: 'lateral-thinking' } },
  { difficulty: 'intermediate', content_json: { riddle: 'A woman walks into a bar and asks for a glass of water. The bartender pulls out a gun and points it at her. She says \'Thank you\' and walks out. Why?', answers: ['she had hiccups', 'the gun scared her hiccups away', 'hiccups'], explanation: 'She had the hiccups. The bartender scared her to cure them, making the water unnecessary.', category: 'lateral-thinking' } },
  { difficulty: 'intermediate', content_json: { riddle: 'A windowless, doorless room. On the lawn outside: coal, a carrot, and a scarf. Nobody put them there. Why?', answers: ['they were parts of a snowman that melted', 'a snowman melted'], explanation: 'A snowman\'s eyes (coal), nose (carrot), and scarf melted away.', category: 'lateral-thinking' } },
  { difficulty: 'intermediate', content_json: { riddle: 'What is the minimum number of cuts to cut a log into 8 equal pieces (one cut at a time)?', answers: ['7', 'seven'], explanation: 'Each cut adds one piece. To go from 1 piece to 8, you need exactly 7 cuts.', category: 'math' } },
  { difficulty: 'intermediate', content_json: { riddle: 'Jack\'s father has five sons: Mat, Met, Mit, and Mot. What is the name of the fifth son?', answers: ['jack'], explanation: 'The riddle tells you — Jack\'s father. Jack is the fifth son!', category: 'lateral-thinking' } },

  // ── Advanced (7) ───────────────────────────────────────────────────────────
  { difficulty: 'advanced', content_json: { riddle: 'A man is looking at a portrait. He says: \'Brothers and sisters I have none, but that man\'s father is my father\'s son.\' Who is in the portrait?', answers: ['his son', 'the mans son'], explanation: '\'My father\'s son\' with no siblings = himself. So \'that man\'s father is me\' — the portrait shows his son.', category: 'logic' } },
  { difficulty: 'advanced', content_json: { riddle: 'A prisoner must choose between two rooms: Room A has a raging fire, Room B has a dozen assassins with loaded guns. Which is safer?', answers: ['room b', 'the room with assassins', 'room 2', 'room with the assassins'], explanation: 'The assassins were executed — they\'re dead. An empty room beats an active fire.', category: 'lateral-thinking' } },
  { difficulty: 'advanced', content_json: { riddle: 'A man pushes his car and stops in front of a hotel. He immediately knows he is bankrupt. How?', answers: ['he is playing monopoly', 'its a monopoly game', 'monopoly'], explanation: 'He\'s playing Monopoly — he pushed his car token and landed on a hotel he can\'t afford.', category: 'lateral-thinking' } },
  { difficulty: 'advanced', content_json: { riddle: 'There are two doors — one leads to freedom, one to death. Two guards: one always tells the truth, one always lies. You may ask one guard one question. What do you ask?', answers: ['what door would the other guard say leads to freedom then choose the opposite', 'ask what the other guard would say then go the other way', 'which door would the other guard recommend'], explanation: 'Ask either guard what the other guard would say. Both point to the death door — go through the other one.', category: 'logic' } },
  { difficulty: 'advanced', content_json: { riddle: 'Two women were born to the same mother, on the same day, at the same hour, in the same year, yet they are not twins. How?', answers: ['they are triplets', 'they are part of a set of triplets', 'triplets'], explanation: 'They are triplets (or more). Twins means exactly two — nothing stops multiples from being three or more.', category: 'lateral-thinking' } },
  { difficulty: 'advanced', content_json: { riddle: 'A man walks into a bar urgently asking for water. The bartender fires a gun into the air. The man thanks him and leaves. Why?', answers: ['the man had hiccups the gun cured them', 'hiccups the gunshot scared them away', 'hiccups'], explanation: 'The man had severe hiccups. The sudden shock cured them — no water needed.', category: 'lateral-thinking' } },
  { difficulty: 'advanced', content_json: { riddle: 'A man dies and goes to Heaven. He immediately identifies Adam and Eve among thousands of people. He has never seen a painting or image of them. How?', answers: ['they have no belly buttons', 'adam and eve have no navels', 'no navels', 'no belly buttons'], explanation: 'Adam and Eve were never born — they were created. They have no belly buttons.', category: 'lateral-thinking' } },
];

// ── Ingest ──────────────────────────────────────────────────────────────────

async function ingest(entry: RiddleEntry): Promise<{ ok: boolean; status: number; body: unknown }> {
  const payload = {
    game_key: 'brain-teasers',
    topic: 'general',
    difficulty: entry.difficulty,
    content_json: entry.content_json,
    schema_version: 1,
  };

  const res = await fetch(`${BASE_URL}/api/admin/content-ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

async function main() {
  console.log(`\nIngesting ${RIDDLES.length} riddles → ${BASE_URL}\n`);

  const counts = { ok: 0, fail: 0 };

  for (let i = 0; i < RIDDLES.length; i++) {
    const entry = RIDDLES[i];
    const label = `[${String(i + 1).padStart(2, '0')}/${RIDDLES.length}] (${entry.difficulty}) ${entry.content_json.riddle.slice(0, 60)}…`;

    const result = await ingest(entry);
    if (result.ok) {
      console.log(`  ✓ ${label}`);
      counts.ok++;
    } else {
      console.error(`  ✗ ${label}`);
      console.error(`    status=${result.status} body=${JSON.stringify(result.body)}`);
      counts.fail++;
    }
  }

  console.log(`\nDone: ${counts.ok} ingested, ${counts.fail} failed.\n`);
  if (counts.fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
