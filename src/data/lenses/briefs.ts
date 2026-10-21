/** Writer instructions only. Claude owns class eligibility, voting and room wiring.
 * News and Politics are teen-only, off by default, and require teacher class opt-in.
 * Kid lenses are Junior content: picture-first, never ranked, one speaker at a time.
 */
export type LensBrief = {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly kid: boolean;
  readonly perClass: boolean;
  readonly brief: string;
  readonly goodExample: string;
  readonly badExample: string;
};

export const LENS_BRIEFS = [
  { id: 'films', label: 'Films and TV', icon: 'Clapperboard', kid: false, perClass: false,
    brief: 'Find named films, television programmes, studios and people connected to the topic. Explain one concrete choice in acting, animation, sound or filming. Distinguish a filming location from the place where a story happens. Avoid spoilers, graphic scenes and claims that everyone enjoys the same film.',
    goodExample: 'My Neighbour Totoro was made by Studio Ghibli', badExample: 'Japan makes the best films in the world' },
  { id: 'music', label: 'Music', icon: 'Music', kid: false, perClass: false,
    brief: 'Find named musicians, instruments, styles and musical places connected to the topic. Give listeners something specific to notice, such as rhythm, sound or performance. Include different traditions without calling one more advanced than another. Avoid explicit lyrics, celebrity gossip and unlicensed copies of songs.',
    goodExample: 'A shamisen has three strings', badExample: 'Everyone in Japan listens to the same music' },
  { id: 'sport', label: 'Sport', icon: 'Trophy', kid: false, perClass: false,
    brief: 'Find named sports, teams, athletes and venues with a clear connection to the topic. Explain a rule, a skill or how people take part. Date any historical result and distinguish it from a current ranking. Avoid gambling, body shaming, rivalry insults and unsupported claims about national ability.',
    goodExample: 'Sumo wrestlers compete inside a ring', badExample: 'Japan wins every sporting event' },
  { id: 'food', label: 'Food', icon: 'Utensils', kid: false, perClass: false,
    brief: 'Find named dishes, ingredients, markets and eating customs connected to the topic. Explain what a cook does or how a food is shared. Describe regional variations without treating one recipe as the only authentic version. Avoid diet judgement, food dares, allergy assumptions and disputed origin claims presented as certain.',
    goodExample: 'Sushi rice is seasoned with vinegar', badExample: 'All Japanese food is raw fish' },
  { id: 'news', label: 'News', icon: 'Newspaper', kid: false, perClass: true,
    brief: 'Use News for teens only after the teacher enables it for this class; it is off by default. Find a factual development connected to the topic and show its source date on the card, never presenting an old report as live. Stay neutral and include more than one viewpoint on anything disputed, making clear what is known and uncertain. Use nothing graphic, make no election predictions and do not tell students what to think. Avoid jokes about living politicians, sensational headlines and personal pressure to share beliefs.',
    goodExample: 'In 2020, Hayabusa2 returned asteroid samples to Earth', badExample: 'Japan has just changed everything, according to an undated post' },
  { id: 'politics', label: 'Politics and society', icon: 'Landmark', kid: false, perClass: true,
    brief: 'Use Politics and society for teens only after the teacher enables it for this class; it is off by default. Explain institutions, public choices and everyday civic questions with factual sources and dates when needed. Stay neutral and include more than one viewpoint on anything disputed, separating evidence from opinion. Use nothing graphic, make no election predictions and do not tell students what to think. Avoid jokes about living politicians and never ask students to disclose private political beliefs.',
    goodExample: 'Japan’s National Diet has two houses', badExample: 'Only one political opinion deserves to be heard' },
  { id: 'science-tech', label: 'Science and tech', icon: 'FlaskConical', kid: false, perClass: false,
    brief: 'Find named inventions, researchers, missions or natural processes connected to the topic. Explain how one thing works using observable steps. Separate tested findings from ideas still being studied and date achievements. Avoid miracle claims, unsafe experiments and treating a brand advertisement as scientific proof.',
    goodExample: 'Hayabusa2 collected material from the asteroid Ryugu', badExample: 'Japanese robots can solve every problem' },
  { id: 'history', label: 'History', icon: 'History', kid: false, perClass: false,
    brief: 'Find a dated event, object or person that helps explain the topic today. Connect the past to an ordinary choice, place or custom. Explain whose account is being used when interpretations differ. Avoid graphic conflict, national stereotypes and presenting a contested story as the only possible account.',
    goodExample: 'Kyoto was once Japan’s capital', badExample: 'Nothing in Japan has changed for centuries' },
  { id: 'art-design', label: 'Art and design', icon: 'Palette', kid: false, perClass: false,
    brief: 'Find named artists, buildings, objects or design traditions connected to the topic. Give students a visible feature to notice, such as colour, material or shape. Distinguish a personal response from a factual description. Discuss characters and brands without copying their artwork, and avoid unsupported claims about what an artist intended.',
    goodExample: 'Hokusai made The Great Wave as a woodblock print', badExample: 'Every Japanese artist uses the same style' },
  { id: 'nature-environment', label: 'Nature and environment', icon: 'Leaf', kid: false, perClass: false,
    brief: 'Find named species, habitats and environmental processes connected to the topic. Show how an animal, plant or place depends on its surroundings. Give a source and a date for a changing environmental claim. Avoid guaranteed wildlife sightings, graphic harm and guilt-based messages about personal choices.',
    goodExample: 'Japanese macaques live in forests on Honshu', badExample: 'Every visitor to Japan will meet a wild monkey' },
  { id: 'money-business', label: 'Money and business', icon: 'Store', kid: false, perClass: false,
    brief: 'Find named businesses, jobs, products and ways people exchange goods connected to the topic. Explain an everyday decision about making, buying or selling. Use dates and currency units for prices and distinguish a company’s history from its current performance. Avoid investment advice, promises of profit and pressure to disclose family income.',
    goodExample: 'Nintendo began by making playing cards in Kyoto', badExample: 'Buying Japanese company shares always makes money' },
  { id: 'games', label: 'Games', icon: 'Gamepad2', kid: false, perClass: false,
    brief: 'Find named board games, video games and traditional games connected to the topic. Explain a rule, a design choice or a way players cooperate. Distinguish a game’s setting from where its makers work. Avoid gambling, manipulative spending, graphic content and copying copyrighted character art.',
    goodExample: 'Shogi players can reuse captured pieces', badExample: 'All games from Japan have identical rules' },
  { id: 'travel', label: 'Travel', icon: 'Map', kid: false, perClass: false,
    brief: 'Find named sights, routes, transport and everyday customs connected to the topic. Build a small journey with a reason to visit each stop. Check changing access rules and label dated transport information. Avoid universal claims about local people, risky travel dares and treating an advertisement as a guarantee.',
    goodExample: 'Kyoto and Tokyo are linked by the Tokaido Shinkansen', badExample: 'Every train in Japan goes to every city' },
  { id: 'animals-kid', label: 'Animals', icon: 'PawPrint', kid: true, perClass: false,
    brief: 'Keep this short, friendly, picture-first and in A1 words. Find real local animals and one clear thing about their food, bodies or babies. Use a child-safe photo subject and invite one student at a time to describe it; Junior classes are never ranked. Never include news, politics, war or disasters, graphic hunting or promised sightings.',
    goodExample: 'Japanese macaques have warm winter coats', badExample: 'Japan’s animals are discussing today’s election' },
  { id: 'space-kid', label: 'Space', icon: 'Rocket', kid: true, perClass: false,
    brief: 'Keep this short, friendly, picture-first and in A1 words. Find real planets, sky objects, astronauts or space machines connected to the topic. Explain one visible feature and invite one student at a time to wonder about it; Junior classes are never ranked. Never include news, politics, war or disasters, frightening impacts or unsafe sky-watching advice.',
    goodExample: 'Hayabusa2 brought small space rocks back to Earth', badExample: 'A space disaster is about to happen in Japan' },
  { id: 'dinosaurs-kid', label: 'Dinosaurs and fossils', icon: 'Bone', kid: true, perClass: false,
    brief: 'Keep this short, friendly, picture-first and in A1 words. Find named fossils and ancient animals with a documented connection to the topic. Distinguish a fossil from a model and invite one student at a time to notice its shape; Junior classes are never ranked. Never include news, politics, war or disasters, frightening extinction stories or invented dinosaur features.',
    goodExample: 'Fukuiraptor fossils were found in Japan', badExample: 'Live dinosaurs walk around Japan today' },
  { id: 'stories-kid', label: 'Cartoons and stories', icon: 'BookOpen', kid: true, perClass: false,
    brief: 'Keep this short, friendly, picture-first and in A1 words. Find named cartoons, gentle tales or story characters connected to the topic. Mark story events as fiction and let one student at a time predict or describe; Junior classes are never ranked. Never include news, politics, war or disasters, frightening scenes, spoilers or copied character artwork.',
    goodExample: 'Totoro is a forest character in a Japanese film', badExample: 'Totoro is a real animal living in every Japanese forest' },
  { id: 'food-kid', label: 'Yummy food', icon: 'Apple', kid: true, perClass: false,
    brief: 'Keep this short, friendly, picture-first and in A1 words. Find named snacks, fruit or simple dishes connected to the topic. Show shape, colour or ingredients and invite one student at a time to describe; Junior classes are never ranked. Never include news, politics, war or disasters, eating challenges, food judgement or assumptions that a food is safe for everyone.',
    goodExample: 'Onigiri are rice balls', badExample: 'Every child must eat this Japanese snack' },
  { id: 'sport-games-kid', label: 'Sport and games', icon: 'Balloon', kid: true, perClass: false,
    brief: 'Keep this short, friendly, picture-first and in A1 words. Find named games, toys or sports connected to the topic and explain one easy action. Use one student at a time with the class listening; Junior classes are never ranked and there is no pair work. Never include news, politics, war or disasters, dangerous dares, gambling or assumptions about physical ability.',
    goodExample: 'A kendama has a ball and a wooden handle', badExample: 'Only the strongest children may play games in Japan' },
  { id: 'robots-kid', label: 'Inventions and robots', icon: 'Bot', kid: true, perClass: false,
    brief: 'Keep this short, friendly, picture-first and in A1 words. Find a named real machine or invention connected to the topic and show what one part does. Distinguish a robot from a story character and invite one student at a time to explain; Junior classes are never ranked. Never include news, politics, war or disasters, unsafe experiments or claims that machines can do everything.',
    goodExample: 'ASIMO was a walking robot made by Honda', badExample: 'Every robot in Japan can read minds' },
  { id: 'weather-nature-kid', label: 'Weather and nature', icon: 'CloudSun', kid: true, perClass: false,
    brief: 'Keep this short, friendly, picture-first and in A1 words. Find ordinary rain, snow, plants, rainbows or gentle explanations of natural features connected to the topic. Separate usual seasonal patterns from today’s weather and invite one student at a time to notice; Junior classes are never ranked. Never include news, politics, war or disasters, frightening event footage or promised weather.',
    goodExample: 'Snow covers parts of Hokkaido in winter', badExample: 'Today’s worst disaster will be our Japan weather story' },
] as const satisfies readonly LensBrief[];

export type LensId = typeof LENS_BRIEFS[number]['id'];
