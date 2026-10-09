// Builds src/data/sticker-words.json: the core picture-sticker word list (docs/pictures-and-junior-concept.md).
// kind: 'thing' = object sticker; 'person' | 'action' | 'feeling' = drawn as crew-style characters.
// Run: node scripts/stickers/word-list.mjs
import { writeFileSync } from 'fs';

const things = {
  animals: 'cat dog bird fish rabbit horse cow pig sheep goat chicken duck mouse frog turtle snake lion tiger elephant giraffe monkey bear zebra panda kangaroo penguin owl dolphin whale shark crocodile hippo camel fox wolf deer squirrel butterfly bee ant spider snail octopus crab parrot eagle bat koala jellyfish ladybug lamb puppy kitten seal polar_bear peacock flamingo hedgehog worm dinosaur',
  food: 'apple banana orange grapes strawberry watermelon pear pineapple lemon cherry mango peach carrot tomato potato onion corn broccoli cucumber mushroom bread rice egg cheese milk water juice tea coffee cake cookie candy chocolate ice_cream pizza sandwich hamburger hot_dog french_fries noodles soup salad meat sausage butter honey jam cereal popcorn pancake yogurt sugar salt avocado coconut kiwi pumpkin peas beans pasta donut pie muffin lollipop garlic',
  body: 'head face eye ear nose mouth teeth hair hand arm leg foot finger knee shoulder neck tongue toe tummy',
  clothes: 'shirt dress skirt trousers shorts jeans jacket coat sweater hat cap scarf gloves socks shoes boots sandals pajamas glasses bag umbrella belt watch swimsuit raincoat crown necklace ring',
  home: 'house door window bed chair table sofa lamp clock television computer phone kitchen bathroom bedroom garden stairs fridge oven sink bath shower toilet towel soap toothbrush toothpaste cup plate bowl spoon fork knife bottle box key mirror pillow blanket bookshelf basket rug washing_machine candle teapot frying_pan broom bucket hammer ladder bell flag envelope camera headphones lightbulb magnet flashlight rope coin',
  school: 'school classroom book pen pencil eraser ruler crayon paper notebook backpack scissors glue desk whiteboard map globe calculator paintbrush library playground',
  toys: 'ball doll teddy_bear kite balloon puzzle robot blocks toy_car yo-yo skateboard bike scooter swing slide drum guitar piano trumpet video_game marbles board_game trampoline sandcastle bubbles violin flute microphone',
  transport: 'car bus train airplane boat ship motorbike truck taxi helicopter rocket tractor ambulance fire_engine police_car van submarine hot_air_balloon tram canoe sailboat',
  places: 'park beach zoo farm hospital shop supermarket restaurant cinema museum airport station swimming_pool city village mountain river lake sea forest island desert castle bridge road bakery hotel police_station fire_station stadium',
  nature: 'sun moon star cloud rain snow wind storm rainbow tree flower grass leaf rock sand fire volcano sky ice snowman lightning tent shell cactus waterfall cave planet earth puddle acorn feather',
  shapes: 'circle square triangle heart rectangle oval diamond',
  sports: 'football basketball tennis baseball golf hockey karate surfing',
  time: 'morning night birthday party present spring summer autumn winter',
};
const people = 'mother father baby brother sister grandmother grandfather family friend boy girl man woman teacher doctor nurse police_officer firefighter farmer chef pilot dentist astronaut singer driver vet artist';
const actions = 'run walk jump swim dance sing eat drink sleep read write draw paint cook climb ride_a_bike play cry laugh smile talk listen look clap wave sit stand throw catch kick push pull open close wash brush_teeth wake_up get_dressed carry cut build ski skate hug shout whisper think count tidy_up point knock pour sweep water_the_plants feed_the_dog take_a_photo go_shopping go_fishing bake fall';
const feelings = 'happy sad angry scared surprised tired hungry thirsty sick bored excited sleepy shy proud hot cold worried silly brave';

const ING = {
  run: 'running', swim: 'swimming', sit: 'sitting on a chair', cut: 'cutting a sheet of paper in half with scissors', skate: 'ice skating',
  write: 'writing in a notebook', ride_a_bike: 'riding a bike', brush_teeth: 'brushing their teeth',
  wake_up: 'waking up and stretching in bed', get_dressed: 'getting dressed, pulling on a sweater',
  tidy_up: 'tidying up toys into a box', dance: 'dancing', smile: 'smiling', close: 'closing a door',
  open: 'opening a door', look: 'looking through binoculars', listen: 'listening with a hand behind one ear',
  think: 'thinking, finger on chin, with a small thought bubble', count: 'counting on their fingers',
  whisper: "whispering into a friend's ear", shout: 'shouting with hands around the mouth', wave: 'waving hello',
  clap: 'clapping hands', hug: 'hugging a friend', carry: 'carrying a big box', climb: 'climbing a ladder',
  build: 'building a tower of blocks', throw: 'throwing a ball', catch: 'catching a ball', kick: 'kicking a ball',
  push: 'pushing a big box', pull: 'pulling a wagon', wash: 'washing hands with soap', eat: 'eating a sandwich',
  drink: 'drinking a glass of water', sleep: 'sleeping in bed', read: 'reading a book',
  draw: 'drawing a picture with a crayon', paint: 'painting at an easel', cook: 'cooking with a pan',
  play: 'playing with toys', ski: 'skiing down snow', stand: 'standing up straight', sing: 'singing with music notes',
  talk: 'talking with a friend, speech bubble with no words', walk: 'walking', jump: 'jumping in the air',
  cry: 'crying', laugh: 'laughing', point: 'pointing at something', knock: 'knocking on a door', pour: 'pouring juice into a cup',
  sweep: 'sweeping with a broom', water_the_plants: 'watering plants with a watering can', feed_the_dog: 'feeding a dog from a bowl',
  take_a_photo: 'taking a photo with a camera', go_shopping: 'shopping with a basket of food', go_fishing: 'fishing with a rod by water',
  bake: 'baking cookies with an oven mitt', fall: 'falling over (not hurt)',
};
const FEEL = {
  hot: 'very hot, sweating under the sun', cold: 'cold, shivering in a scarf',
  hungry: 'hungry, holding their tummy', thirsty: 'thirsty, reaching for a glass of water',
  sick: 'sick in bed with a thermometer', sleepy: 'sleepy, yawning', tired: 'tired, slumped with heavy eyes',
  shy: 'shy, hiding a little behind their hands', proud: 'proud, smiling, with a gold medal hanging on their chest',
  bored: 'bored, chin resting on one hand', silly: 'silly, pulling a funny face', brave: 'brave, standing tall like a hero with a cape',
  worried: 'worried, biting their lip',
};
const PERSON = {
  family: 'a family: mother, father and two children together', friend: 'two children as friends, arm in arm',
  baby: 'a baby', vet: 'a vet holding a puppy', chef: 'a chef in a white hat',
  pilot: "a pilot in a captain's cap and uniform", astronaut: 'an astronaut in a space suit',
  driver: 'a driver at a steering wheel', police_officer: 'a police officer in uniform',
  firefighter: 'a firefighter in a helmet', dentist: 'a dentist holding a giant toothbrush',
  nurse: 'a nurse in scrubs', doctor: 'a doctor with a stethoscope', farmer: 'a farmer in a straw hat',
  artist: 'an artist with a paint palette', singer: 'a singer with a microphone',
  teacher: 'an adult teacher holding a book', man: 'an adult man', woman: 'an adult woman',
  grandmother: 'a kind grandmother with grey hair in a bun and glasses',
  grandfather: 'a kind grandfather with grey hair and glasses', mother: 'a mother (adult woman) smiling',
  father: 'a father (adult man) smiling', brother: 'a young boy, the brother, next to his little sister',
  sister: 'a young girl, the sister, next to her little brother', boy: 'a boy', girl: 'a girl',
};
// Body words are drawn as crew characters pointing at the part.
const BODY_PERSON = {
  tummy: 'a child pointing at their tummy', toe: 'a bare foot with five toes, the big toe shown clearly', finger: 'a child holding up one finger',
  face: 'a smiling child face', hair: 'a child with long flowing hair', teeth: 'a child with a big smile showing white teeth',
  tongue: 'a child sticking out their tongue', knee: 'a child pointing at their knee', shoulder: 'a child with hands on their shoulders',
  neck: 'a child pointing to their neck', karate: 'a child in a white karate uniform doing a kick',
};
// Thing hints where the plain word is ambiguous or easily drawn wrong.
const THING = {
  orange: 'an orange (the fruit)', star: 'a yellow five-pointed star', bat: 'a bat (the flying animal)',
  glasses: 'a pair of eyeglasses', watch: 'a wristwatch', present: 'a wrapped gift box with a bow',
  morning: 'a sunrise over hills', night: 'a dark blue night sky with a moon and stars',
  party: 'party balloons and a party hat', birthday: 'a birthday cake with candles', sky: 'a blue sky with one small cloud',
  wind: 'a tree bending in the wind with swirls of air', water: 'a glass of water', fire: 'a campfire', ice: 'ice cubes',
  golf: 'a golf club and ball', hockey: 'an ice hockey stick and puck', surfing: 'a surfboard on a wave',
  football: 'a soccer ball', meat: 'a steak', city: 'a small city skyline', village: 'a few small houses with trees',
  station: 'a train station platform with a train', classroom: 'a classroom with desks and a board',
  library: 'tall shelves full of colourful books, no signs', diamond: 'a diamond shape (the geometric shape)', rain: 'a grey-blue cloud with raindrops falling',
  school: 'a simple school building with a bell tower', hand: "one open child's hand with five fingers, palm forward",
  eye: 'one cartoon eye', ear: 'one cartoon ear', mouth: 'a smiling cartoon mouth',
  nose: 'a cartoon nose', head: 'a cartoon head (no body)',
  kiwi: 'a kiwi fruit cut in half, green inside', hat: 'a sun hat with a wide brim', flag: 'a plain red flag on a pole (not a country flag)',
  spider: 'a friendly black spider with eight legs', egg: 'one whole white egg', spoon: 'one metal spoon',
  square: 'one blue square shape', rectangle: 'one green rectangle shape', oval: 'one purple oval shape', circle: 'one red circle shape',
  summer: 'a sunny beach with an umbrella and the sea', spring: 'a small tree with pink blossom and tulips',
  autumn: 'a tree with orange leaves falling', winter: 'a snowy tree and snowflakes',
  sky: 'a wide blue sky with a sun and two small clouds', ice: 'three blue-white ice cubes', earth: 'the planet Earth seen from space',
  planet: 'the planet Saturn with its rings', lightning: 'a yellow lightning bolt from a dark cloud', puddle: 'a blue rain puddle with ripples',
  cave: 'the entrance of a rocky cave', waterfall: 'a waterfall falling over rocks into a pool', shell: 'a pink seashell',
  tent: 'a camping tent', cactus: 'a green cactus in a pot', acorn: 'an acorn', snowman: 'a snowman with a carrot nose and scarf',
};

// Round 21 (Codex) missing-word list, Oct 9 2026.
const EXTRA = {
  places: 'bench seesaw climbing_frame sandbox merry-go-round', nature: 'seagull raindrop snowflake icicle fog seed seedling',
  toys: 'lifebuoy snorkel', home: 'sunscreen beach_towel watering_can shovel rake hose wheelbarrow bandage thermometer tissue comb hairbrush chopsticks spatula whisk rolling_pin napkin straw stroller high_chair bib crib',
  people: 'wheelchair hearing_aid', clothes: 'button zipper shoelace slippers mitten', school: 'lunchbox pencil_case folder stapler',
  transport: 'school_bus traffic_light crosswalk seat_belt bus_stop ferry', sports: 'goalpost racket baseball_bat surfboard', animals: 'foal calf chick',
};
Object.assign(THING, {
  seed: 'a few seeds in an open hand-free pile on soil', seedling: 'a tiny green seedling sprouting from soil', fog: 'thick grey fog hiding a small tree and a lamp post', napkin: 'a folded paper napkin', rolling_pin: 'a wooden rolling pin',
  straw: 'a striped drinking straw in a glass', button: 'one round clothing button', crosswalk: 'a zebra crossing with white stripes on a road',
  racket: 'a tennis racket', foal: 'a baby horse (foal)', calf: 'a baby cow (calf)', chick: 'a small yellow baby chick',
  folder: 'a paper folder for school', mitten: 'one warm mitten', hose: 'a green garden hose', tissue: 'a box of tissues',
  wheelchair: 'an empty wheelchair', hearing_aid: 'a small hearing aid', bib: 'a baby bib', crib: "a baby's crib",
});

// Round 23 (Codex) story words, Oct 9 2026.
const EXTRA2 = {
  nature: 'hill mud nest bamboo burrow seaweed coral', home: 'cupboard jar flour easel food_bowl collar leash picnic_mat',
  toys: 'paper_boat kite_string toy_tower', transport: 'train_ticket road_sign bike_wheel', places: 'stage', clothes: 'costume',
};
Object.assign(THING, {
  burrow: 'a rabbit hole in a grassy bank', flour: 'a bag of flour', collar: 'a dog collar', leash: 'a dog leash',
  kite_string: 'a ball of kite string', toy_tower: 'a tall tower of toy blocks', stage: 'an empty theatre stage with red curtains',
  costume: 'a colourful dress-up costume on a hanger', food_bowl: 'a pet food bowl with food', picnic_mat: 'a checked picnic blanket on grass',
  road_sign: 'a round road sign on a post', train_ticket: 'a small paper train ticket',
});
const EXTRA_PEOPLE = { actor: 'an actor on stage taking a bow', station_worker: 'a train station worker in uniform with a whistle' };

const out = [];
const add = (w, category, kind, hint) =>
  out.push({ word: w.replace(/_/g, ' '), id: w.replace(/_/g, '-'), category, kind, ...(hint ? { hint } : {}) });
for (const [cat, list] of Object.entries(things))
  for (const w of list.split(' ')) BODY_PERSON[w] ? add(w, cat, 'person', BODY_PERSON[w]) : add(w, cat, 'thing', THING[w]);
for (const [cat, list] of Object.entries(EXTRA)) for (const w of list.split(' ')) add(w, cat === 'people' ? 'home' : cat, 'thing', THING[w]);
for (const [cat, list] of Object.entries(EXTRA2)) for (const w of list.split(' ')) add(w, cat, 'thing', THING[w]);
for (const [w, hint] of Object.entries(EXTRA_PEOPLE)) add(w, 'people', 'person', hint);
for (const w of people.split(' ')) add(w, 'people', 'person', PERSON[w] ?? `a ${w.replace(/_/g, ' ')}`);
for (const w of actions.split(' ')) add(w, 'actions', 'action', `a child ${ING[w] ?? w + 'ing'}`);
for (const w of feelings.split(' ')) add(w, 'feelings', 'feeling', `a child looking ${FEEL[w] ?? w}`);

const ids = new Set();
for (const e of out) {
  if (ids.has(e.id)) throw new Error('duplicate ' + e.id);
  ids.add(e.id);
}
writeFileSync('src/data/sticker-words.json', JSON.stringify(out, null, 1) + '\n');
console.log(out.length, 'words');
