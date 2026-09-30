import fs from 'node:fs';

const ted = [
  ['WJhCa12UTsg', 'What lack of sleep does to the teenage brain', 404, 'sleep, neuroscience, adolescence', 'A neuroscience lesson explores how sleep affects the developing teenage brain.', true],
  ['CqgmozFr_GM', 'How to stay calm under pressure', 268, 'performance, psychology, strategies', 'An animated lesson explains why people choke under pressure and how practice can help.', false],
  ['lmP0l5udNCE', 'Why doesn’t everyone have a jetpack?', 302, 'engineering, physics, flight', 'A technology lesson examines the engineering and physics challenges of personal jetpacks.', false],
  ['1xcvWSeZPbw', 'Why do we see illusions?', 441, 'optical-illusions, vision, brain', 'A lesson explores how the brain interprets visual information and creates optical illusions.', false],
];

const bbc = [
  ['O3tp5Y9lH88', 'How bubble tea got its bubbles - 6 Minute English', 382, 'food, history, culture', 'A discussion of the origins of bubble tea and how the popular drink developed.', false],
  ['H5BVbrZ64bQ', 'Are we getting more allergic to things? - 6 Minute English', 373, 'health, allergies, science', 'The presenters discuss possible reasons for the rise in allergies.', true],
  ['c5Ppkvg7xHI', 'How green is your money? - 6 Minute English', 382, 'finance, environment, consumer-choices', 'A discussion of how financial choices can relate to environmental impact.', true],
  ['a66Gx6c-ZeE', 'Kids and climate change - 6 Minute English', 381, 'climate, youth, environment', 'The presenters discuss how climate change affects young people and how they respond.', true],
  ['fWzD45xDQDo', 'Mushrooms: Medicine or myth? - 6 Minute English', 374, 'fungi, medicine, evidence', 'A discussion explores claims about medicinal mushrooms and the evidence behind them.', true],
  ['eoXv4JgwjeM', 'Saving dead languages - 6 Minute English', 384, 'languages, culture, preservation', 'The presenters discuss efforts to document and preserve languages with few speakers.', true],
  ['fKg0nLaQzn4', 'Sounds that make you want to scream - 6 Minute English', 381, 'sound, senses, psychology', 'A discussion of why some everyday sounds cause strong reactions for some people.', true],
  ['xf2RF9vx-G4', 'Space saving solar hacks - 6 Minute English', 383, 'solar-energy, engineering, environment', 'The presenters explore creative ways to generate solar power where space is limited.', false],
  ['wAV-vbHLn3Q', 'Making male friends - 6 Minute English', 384, 'friendship, communication, society', 'A conversation about friendship, social expectations, and building connections.', true],
  ['ACG6qr4waWU', 'Heatwaves: Can we adapt? - 6 Minute English', 384, 'climate, heatwaves, adaptation', 'The presenters discuss ways communities can adapt to hotter weather.', true],
  ['Ag7-U4ga9mA', 'The right way to say sorry - 6 Minute English', 384, 'communication, apologies, social-skills', 'A discussion of what makes an apology effective and how people repair misunderstandings.', false],
  ['Y681hXWwhQY', 'The benefits of doing nothing - 6 Minute English', 379, 'rest, wellbeing, habits', 'The presenters consider how taking breaks and allowing time to rest can be useful.', false],
  ['wNJQPn-SLk8', 'Can sounds make food taste better? - 6 Minute English', 381, 'food, sound, senses', 'A discussion explores how sound and other senses can shape the experience of eating.', false],
  ['MY1Rk1polgM', 'Women in politics - 6 Minute English', 382, 'politics, representation, gender', 'The presenters discuss women’s representation in political leadership.', true],
  ['UEH3oRSgVXQ', 'Can you stop a disaster? - 6 Minute English', 381, 'disaster-preparedness, science, safety', 'A discussion of how prediction and preparedness can reduce disaster impacts.', true],
  ['WunqZ9SF4hU', 'How learning to read changes lives - 6 Minute English', 382, 'literacy, education, society', 'The presenters discuss literacy and how learning to read can affect people’s opportunities.', true],
];

function append(file, rows, source, prefix) {
  const path = `src/data/${file}`;
  const all = JSON.parse(fs.readFileSync(path, 'utf8'));
  for (const [youtubeId, title, durationSecs, topicString, summary, needsReview = false] of rows) {
    if (all.some((item) => item.youtubeId?.toLowerCase() === youtubeId.toLowerCase())) throw new Error(`Duplicate YouTube ID: ${youtubeId}`);
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
