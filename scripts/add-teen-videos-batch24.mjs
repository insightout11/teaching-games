import fs from 'node:fs';

const ted = [
  ['BlK23YzqXOM', 'Why your best ideas usually start as bad ones | Think Like A Musician', 293, 'creativity, music, songwriting', 'How musicians use rough first attempts to develop stronger ideas.'],
  ['2x3rJMBVB28', 'Write every day, even if it’s terrible | Think Like A Musician', 361, 'writing, music, songwriting', 'Songwriters describe how regular writing practice helps them develop ideas and craft.'],
  ['QUQyf_irWlw', 'How to improve your singing | Think Like A Musician', 346, 'music, singing, performance', 'A practical look at the habits and techniques singers use to improve their voices.'],
  ['yYPnos84NDY', 'Inside the mind of a drummer | Think Like A Musician', 453, 'music, drums, performance', 'A drummer shares how rhythm, practice, and performance shape a musician’s work.'],
  ['YtCpZnBhWZ0', 'How to become a great singer | Think Like A Musician', 587, 'music, singing, performance', 'Musicians discuss the skills and choices that help singers connect with listeners.'],
  ['zrjhaYc-9pg', '10 musicians weigh in on what makes for a great performance | Think Like A Musician', 407, 'music, performance, creativity', 'Ten musicians reflect on the preparation and presence behind a memorable performance.'],
  ['ybftH3XSd0Q', 'Which instrument should you play? | Think Like A Musician', 456, 'music, instruments, hobbies', 'A guide to choosing an instrument based on interests, sound, and the experience of learning.'],
  ['Lq_TYsGwTfM', 'How top songwriters craft the perfect pop song | Think Like A Musician', 523, 'music, songwriting, creativity', 'Songwriters explain how they shape ideas into polished and memorable pop songs.'],
  ['MBir652KZPE', 'How expert songwriters find the right lyrics | Think Like A Musician', 517, 'music, songwriting, writing', 'Songwriters discuss how they develop ideas and make choices while writing lyrics.'],
  ['UDdkgOoeNcQ', 'Do artists really write their own songs? | Think Like A Musician', 464, 'music, songwriting, collaboration', 'Professional songwriters explain collaboration and the different roles involved in making songs.'],
];

const bbc = [
  ['YAsDeXcYyTg', 'Scared to speak English? - 6 Minute English', 408, 'language learning, confidence, communication', 'The presenters discuss anxiety about speaking English and ways learners can build confidence.', true],
  ['fUn_LTwaogU', 'Working for yourself - 6 Minute English', 377, 'careers, work, entrepreneurship', 'A discussion of self-employment and what working for yourself can involve.', false],
  ['tHZRXN_pVi8', 'Can AI have a mind of its own? - 6 Minute English', 380, 'technology, artificial intelligence, ethics', 'The presenters explore questions about artificial intelligence and whether machines can think independently.', true],
  ['DxR2waii1Ck', 'Should we fear chatbots? - 6 Minute English', 377, 'technology, artificial intelligence, media literacy', 'A discussion of chatbots, their growing abilities, and questions about how people should use them.', true],
  ['5ZQ65RbsAB8', 'Young women on social media - 6 Minute English', 371, 'social media, wellbeing, society', 'The presenters consider how social media affects young women and their everyday lives.', true],
  ['KLz5u2pH-yM', 'Can music mend a broken heart? - 6 Minute English', 371, 'music, emotions, wellbeing', 'A discussion of why people turn to music when dealing with difficult feelings.', true],
  ['0UOdAKVdbMo', 'US and China vs climate change - 6 Minute English', 376, 'climate, environment, international relations', 'The presenters discuss how cooperation between major countries can affect climate action.', true],
  ['xGhbhWUqL-w', 'The art of conversation - 6 Minute English', 383, 'communication, conversation, social skills', 'A look at what helps people have engaging and thoughtful conversations.', false],
  ['gfnyMyCZjqA', 'Is gaming a sport? - 6 Minute English', 372, 'gaming, sports, technology', 'The presenters consider whether competitive video gaming shares the qualities of traditional sport.', false],
  ['rCIs5x0SGTY', 'Is rejection good for us? - 6 Minute English', 381, 'psychology, social media, wellbeing', 'A discussion of an online rejection trend and what it may reveal about how people respond to setbacks.', true],
];

function append(file, rows, source, prefix) {
  const path = `src/data/${file}`;
  const all = JSON.parse(fs.readFileSync(path, 'utf8'));
  for (const [youtubeId, title, durationSecs, topicString, summary, needsReview = false] of rows) {
    if (all.some((item) => item.youtubeId?.toLowerCase() === youtubeId.toLowerCase())) {
      throw new Error(`Duplicate YouTube ID: ${youtubeId}`);
    }
    all.push({
      id: prefix + youtubeId.toLowerCase().replaceAll('-', '_'), title, speaker: source,
      url: `https://www.youtube.com/watch?v=${youtubeId}`, youtubeId, durationSecs,
      topicTags: [...topicString.split(', '), 'teen-interests'], difficultyLevel: 'Intermediate',
      cefr: 'B1', ageBand: 'teens', description: summary, summary, genre: 'dialogue',
      place: null, needsReview, kind: 'video',
    });
  }
  fs.writeFileSync(path, `${JSON.stringify(all, null, 2)}\n`);
}

append('teded-library.json', ted, 'TED-Ed', 'teded_');
append('bbc-library.json', bbc, 'BBC Learning English', 'bbc_');
console.log(`Added TED-Ed ${ted.length}, BBC ${bbc.length}`);
