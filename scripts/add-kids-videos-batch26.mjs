import fs from 'node:fs';

const rows = [
  ['XyFUqFQfl30', 'Defining Success: Crash Course Kids #18.2', 239, ['engineering', 'design', 'problem-solving'], 'Explains how engineers decide whether a solution meets the criteria they set.'],
  ['BXFU86GNmrg', 'Bowled Over - Isolating Variables: Crash Course Kids #39.1', 278, ['science', 'experiments', 'variables'], 'Uses a bowling experiment to show why changing one variable at a time helps make a fair test.'],
  ['DkJLbCCI6Zs', 'Architecture Adventure: Crash Course Kids #47.2', 267, ['architecture', 'engineering', 'design'], 'Introduces how architects plan buildings around needs, materials, and design choices.'],
  ['gnnUid8Hof0', "Let’s Build a City: Crash Course Kids #48.1", 253, ['cities', 'engineering', 'community'], 'Looks at how engineers and planners design the systems a city needs.'],
  ['8LfD_EKze2M', "Resources: Welcome to the Neighborhood - Crash Course Kids #2.1", 195, ['communities', 'natural resources', 'environment'], 'Introduces natural resources and how people use them in their communities.'],
  ['UXh_7wbnS3A', 'Four Spheres Part 2 (Hydro and Atmo): Crash Course Kids #6.2', 211, ['Earth science', 'water', 'atmosphere'], 'Explains how Earth’s water and air systems interact with the other parts of the planet.'],
  ['7vTfyAMu6G4', 'Land and Water: Crash Course Kids #16.1', 213, ['Earth science', 'landforms', 'water'], 'Explores how land and water shape places and support living things.'],
  ['AHCOzc143Ec', 'Feed Me: Classifying Organisms - Crash Course Kids #1.2', 194, ['biology', 'food chains', 'animals'], 'Shows how plants and animals get energy and introduces herbivores, carnivores, and omnivores.'],
  ['eCSIrlk0GTs', 'Who Needs Dirt?: Crash Course Kids #27.1', 255, ['biology', 'soil', 'plants'], 'Explains why soil matters to plants and the living things that depend on them.'],
  ['ELchwUIlWa8', "What's Matter? - Crash Course Kids #3.1", 211, ['physical science', 'matter', 'states of matter'], 'Introduces matter and the ways scientists describe the materials around us.'],
  ['ZZYnERZe3Cg', 'Hunting for Properties: Crash Course Kids #9.1', 240, ['physical science', 'materials', 'observation'], 'Models how to observe and compare the properties of different materials.'],
  ['3lHHOiTdmK4', 'Vacation or Conservation (Of Mass): Crash Course Kids #23.1', 249, ['physical science', 'matter', 'conservation'], 'Uses an everyday example to explain that matter is conserved during changes.'],
  ['RrJ1-YofCaA', 'Astronaut Experiment: Crash Course Kids #32.2', 241, ['space', 'astronauts', 'experiments'], 'Demonstrates how scientists can test questions about life and work in space.'],
  ['zD7W5O0BH7g', 'Organizing Properties: Crash Course Kids #35.1', 272, ['physical science', 'materials', 'classification'], 'Shows how grouping materials by their properties can help answer science questions.'],
  ['tGfLhPslEjQ', 'Material World: Crash Course Kids #40.1', 277, ['physical science', 'materials', 'matter'], 'Explores how materials are selected and used in everyday objects.'],
  ['MraHoI-Yik4', 'Material Magic - Making Diamonds: Crash Course Kids #40.2', 282, ['geology', 'materials', 'diamonds'], 'Explains how diamonds form and why their properties make them useful.'],
  ['Fnd-2jetT1w', 'Oobleck and Non-Newtonian Fluids: Crash Course Kids #46.1', 260, ['physical science', 'fluids', 'experiments'], 'Uses oobleck to explore how some materials behave differently under different forces.'],
  ['T7hK6OMpvbE', 'Normal Stuff in Not-So-Normal Places: Crash Course Kids #46.2', 286, ['physical science', 'states of matter', 'space'], 'Compares familiar materials with unusual conditions in space.'],
  ['aGVXyCrpUn8', 'Orbits are Odd: Crash Course Kids #22.2', 271, ['space', 'orbits', 'gravity'], 'Introduces the different paths that objects follow as they orbit planets, stars, and other objects.'],
  ['8gHDCOSI5Es', 'Life on Other Planets: Crash Course Kids #45.1', 268, ['space', 'astrobiology', 'planets'], 'Considers what conditions might be needed for life beyond Earth.'],
];

const path = 'src/data/kids-library.json';
const entries = JSON.parse(fs.readFileSync(path, 'utf8'));
for (const [youtubeId, title, durationSecs, topics, summary] of rows) {
  if (entries.some((entry) => entry.youtubeId?.toLowerCase() === youtubeId.toLowerCase())) {
    throw new Error(`Duplicate YouTube ID: ${youtubeId}`);
  }
  entries.push({
    id: `kids_${youtubeId.toLowerCase().replaceAll('-', '_')}`,
    title,
    speaker: 'Crash Course Kids',
    url: `https://www.youtube.com/watch?v=${youtubeId}`,
    youtubeId,
    durationSecs,
    topicTags: [...topics, 'stem'],
    difficultyLevel: 'Easy',
    cefr: 'A2',
    ageBand: 'kids',
    description: summary,
    summary,
    genre: 'expository',
    place: null,
    needsReview: false,
    kind: 'video',
  });
}
fs.writeFileSync(path, `${JSON.stringify(entries, null, 2)}\n`);
console.log(`Added ${rows.length} kids videos.`);
