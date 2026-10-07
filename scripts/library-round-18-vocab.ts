/** Three topic-specific terms per briefing, drawn from the reviewed fact sentences. */
const kids = `
Cats|whiskers~Long hairs that sense things near the face|claws~Curved nails on an animal's feet|kitten~A young cat
Dogs|noses~Body parts used to smell|puppies~Young dogs|fur~Hair covering an animal's body
Horses|hooves~Hard coverings on horses' feet|grass~Green plants that grow close to the ground|ears~Body parts used to hear
Elephants|trunk~A long flexible nose used to lift things|family~Related animals living together|heat~Warmth from the surroundings
Giraffes|neck~The body part joining head and body|tongue~The mouth part used to taste and move food|spot pattern~The arrangement of small colored marks on fur
Zebras|stripe pattern~The arrangement of long bands of color|groups~Several animals together|sounds~Things an animal can hear
Lions|pride~A family group of lions|rest~Time spent not being active|cubs~Young lions
Tigers|stripes~Long bands of a different color|swim~To move through water|paws~Soft feet of many animals
Pandas|bamboo~A fast-growing plant with tall stems|wrist~The part between hand and arm|mothers~Female parents
Koalas|eucalyptus~Trees whose leaves koalas eat|branches~Parts of a tree that grow from its trunk|sleep~To rest with eyes closed
Kangaroos|legs~Body parts used for standing or jumping|pouch~A pocket on a marsupial's body|tail~A long part extending behind an animal
Penguins|flippers~Flat limbs used to swim|chicks~Young birds|calls~Sounds animals make to communicate
Polar Bears|fur~Hair covering an animal's body|paws~The feet of bears and similar animals|ice~Frozen water
Dolphins|air~The gas mammals must breathe|sounds~Things that can be heard|surface~The top layer of water
Whales|breathe~To take air into the body|filter~To separate food from water|calves~Young whales
Sharks|cartilage~Firm flexible material inside a shark's body|teeth~Hard mouth parts for biting|food webs~Connections between living things that eat one another
Sea Turtles|flippers~Flat limbs that help swimming|eggs~Cases that protect developing young animals|beaches~Sandy places beside the sea
Frogs|tadpole~A young frog living in water|skin~The outer covering of a body|tongues~Parts of the mouth used to catch food
Butterflies|caterpillar~The young stage of a butterfly|chrysalis~A case where a caterpillar changes|nectar~Sweet liquid made by flowers
Bees|pollen~Powder made by flowers for reproduction|hives~Homes of some groups of bees|nests~Places animals build for their young
Dinosaurs|fossils~Preserved traces of ancient life|birds~Feathered animals descended from dinosaurs|shapes~Outlines or forms of things
Fossils|bones~Hard parts inside many animals|tracks~Marks left by moving feet|rock layers~Sheets of rock formed at different times
The Moon|craters~Round hollows in rocky ground|gravity~The force that pulls objects together|tides~Regular rises and falls of sea level
The Sun|sunlight~Light that comes from the Sun|plants~Living things that use light to make food|Earth~The planet where we live
Planets|stars~Hot balls of glowing gas|rocky~Made mostly of rock|temperature~How hot or cold something is
Stars|gas~Material that spreads to fill its space|distant~Far away|patterns~Repeated shapes or arrangements
Rockets|fuel~Material that provides energy for movement|launch~To send something upward|stages~Sections that can separate during flight
Astronauts|suits~Special clothes for working in space|exercise~Movement that keeps the body strong|teams~Groups working toward shared goals
Volcanoes|lava~Melted rock above the ground|ash~Tiny pieces of rock from a volcano|change~Becoming different over time
Earthquakes|plates~Large moving pieces of Earth's outer rock|shaking~Fast back-and-forth movement|buildings~Structures people make to live or work in
Mountains|valleys~Low land between higher areas|slopes~Slanted sides of hills or mountains|rivers~Moving streams of water
Rivers|snow~Frozen water falling from clouds|riverbanks~Land beside a river|bridges~Structures built across water or roads
Oceans|waves~Moving rises on water|depths~Distances below the surface|currents~Steady movements of water
Coral Reefs|skeletons~Hard body structures that give support|fish~Animals that live in water and breathe through gills|sunlight~Light from the Sun
Rainforests|roof~A top layer covering what is below|plants~Living things that grow using light|soil~The loose ground where many plants grow
Deserts|rain~Water drops falling from clouds|store~To keep something for later|nights~Times between sunset and sunrise
Forests|leaves~Flat plant parts that catch sunlight|soil~The loose ground under plants|shelter~A place that gives protection
Seasons|tilt~A slant away from a straight position|sunlight~Light from the Sun|wet~Having much water or rain
Rain|clouds~Groups of water drops in the sky|vapor~Water in gas form|heavy~Having much weight
Snow|snowflakes~Small pieces of falling snow|ice crystals~Small solid pieces of frozen water|melt~To change from solid to liquid
Wind|air~The gas surrounding Earth|seeds~Parts of plants that can grow into new plants|sails~Large cloth surfaces that catch wind
Clouds|water drops~Tiny round pieces of liquid water|shapes~Outlines or forms|shade~A darker area sheltered from sunlight
Rainbows|light~Energy that lets our eyes see|colors~Different kinds of visible light|opposite~On the other side
Water Cycle|vapor~Water in gas form|clouds~Groups of water drops in the sky|rivers~Streams of moving water
Plant Growth|roots~Plant parts that take water from soil|leaves~Plant parts that use light to make food|seeds~Small plant parts that can grow
Cooking|heat~Warmth used to change food|recipes~Lists of ingredients and steps|flavors~Tastes of food
Baking|dough~A soft mixture used to make bread|flour~Powder made by grinding grain|measuring~Finding exact amounts
Fruits|seeds~Plant parts that can grow into new plants|berries~Small juicy fruits|ripen~To become ready to eat
Vegetables|roots~Plant parts growing below ground|leaves~Flat green plant parts|texture~How food feels in the mouth
Breakfast|meal~Food eaten at one time|balanced~Including a useful mix of foods|journey~Travel from one place to another
School Lunch|bring~To carry something to a place|water~A clear drink without sugar|classmates~Students in the same class
Caring for Pets|food~Things animals eat|exercise~Movement that keeps bodies active|attention~Time spent noticing and caring
School Day|lessons~Periods of learning|breaks~Short times away from work|subjects~Areas of study
Classroom Rules|listening~Paying attention to what someone says|sharing~Letting others use something too|fair~Treating people with equal care
Making Friends|hello~A friendly greeting|listen~To pay attention to someone's words|invitation~An offer to join an activity
Family Traditions|traditions~Things a family repeats over time|relatives~People in the same wider family|stories~Accounts of events, real or imagined
Birthday Parties|games~Activities with rules played for fun|friends~People who care about each other|gift~Something given to another person
Festivals Around the World|music~Organized sounds with rhythm|customs~Shared ways of doing things|visitors~People who come to a place
Holidays|travel~To go to another place|rest~Time away from hard activity|plans~Ideas about what to do
Jobs People Do|builders~People who make structures|drivers~People who operate vehicles|cooks~People who prepare food
Soccer|goal~The place where teams try to score|passing~Sending the ball to a teammate|goalkeeper~Player who guards the goal
Basketball|hoops~Raised rings that players aim for|bounce~To spring back after hitting a surface|shot~An attempt to score
Swimming|arms~Upper limbs used to push water|breathing~Taking air in and out|strokes~Ways of moving through water
Cycling|pedals~Parts pushed by feet to move a bike|helmet~Hard hat protecting the head|brakes~Parts that slow a bicycle
Running|arms~Upper limbs used for balance|breathe~To take air into the body|rest~Time when the body recovers
Dancing|rhythm~A pattern of sounds or movements|pairs~Groups of two people|practice~Repeated action to improve
Board Games|dice~Small cubes used to choose moves|rules~Instructions for playing fairly|plan~An idea for future actions
Puzzles|solution~An answer to a problem|pieces~Separate parts of a whole|patterns~Repeated shapes or arrangements
Building Blocks|shapes~Different forms or outlines|base~The bottom supporting part|design~A plan for how to build
Kites|wind~Moving air|string~Thin cord used to hold a kite|tails~Long parts that help some kites balance
Playgrounds|slides~Smooth slopes for moving down|swings~Seats moving back and forth|balance~Staying steady without falling
Superheroes|abilities~Things someone can do|teamwork~Working together toward a goal|choices~Options a character selects
Robots|instructions~Directions telling a machine what to do|sensors~Parts that notice changes nearby|motors~Parts that make a machine move
Trains|tracks~Rails guiding train wheels|stations~Places where travelers board|carriages~Cars connected to a train
Airplanes|wings~Parts that help an aircraft stay in air|engines~Machines that provide power|pilots~People who guide aircraft
Boats|sails~Cloth surfaces that catch wind|paddles~Tools pushed through water|hull~The main body of a boat
Musical Instruments|drums~Instruments played by striking surfaces|strings~Thin parts that vibrate to make sound|air~The gas moving through wind instruments
Drawing|lines~Long marks made by a tool|pencils~Tools with graphite for drawing|shapes~Outlines or forms
Painting|colors~Different shades seen by eyes|brushes~Tools used to spread paint|mood~A feeling shown by art
The Five Senses|eyes~Organs that detect light|ears~Organs that detect sound|skin~The outer body covering that senses touch
`.trim().split('\n');

export type ExtraTerm = { word: string; definition: string };
function parse(lines: string[]): Record<string, ExtraTerm[]> {
  const result: Record<string, ExtraTerm[]> = {};
  for (const line of lines) {
    const [title, ...entries] = line.trim().split('|');
    if (entries.length !== 3 || result[title]) throw new Error(`Bad topic vocab row: ${line}`);
    result[title] = entries.map((entry) => {
      const [word, definition] = entry.split('~');
      if (!word || !definition) throw new Error(`Bad topic vocab entry: ${entry}`);
      return { word, definition };
    });
  }
  return result;
}
export const kidsExtraTerms = parse(kids);

const teens = `
Video Games|planning~Thinking ahead about steps and choices|difficulty~The level of challenge|cooperative~Working together toward a shared goal
Game Design|rules~Instructions shaping what players can do|playtesting~Trying a game to find problems|feedback~Information about how something works
Esports|teams~Groups playing together|tactics~Planned moves to reach a goal|training~Repeated practice to improve
Social Media|feed~A changing list of online posts|comments~Written replies to online posts|share~To make something available to others
Online Privacy|password~A secret used to enter an account|settings~Controls that change how a service works|screenshots~Pictures copied from a screen
Screen Time|purpose~The reason for doing something|scrolling~Moving through content on a screen|notifications~Alerts from a device or app
Digital Footprints|comments~Written replies to posts|context~Background needed to understand something|copied~Made into another version
Internet Memes|captions~Words placed with images|joke~Something said or shown for humor|versions~Different forms of one idea
Artificial Intelligence|patterns~Repeated arrangements in information|training examples~Data used to teach a system|sources~Places where information comes from
Robots and Automation|sensors~Devices that notice changes|precise~Exact and careful|workers~People doing paid jobs
Virtual Reality|headsets~Devices worn over eyes and ears|simulation~A model of a real or imagined situation|accessibility~Ease of use for people with different needs
Coding|programs~Sets of computer instructions|error~A mistake that changes a result|testing~Checking whether something works
Cybersecurity|updates~Changes that repair or improve software|login~The process of entering an account|links~Connections to other web pages
Online Learning|recorded lessons~Classes saved to watch later|discussions~Talks where people share views|access~The ability to reach or use something
Digital Art|layers~Separate parts of a digital picture|stylus~Pen-shaped tool for a screen|undo~A command that reverses an action
Friendship|trust~Belief that someone will act with care|boundaries~Limits someone sets for themselves|support~Help offered to someone
Peer Pressure|influences~Changes another person's thoughts or actions|refusal~Saying no to something|habits~Actions repeated often
Teamwork|roles~Different jobs within a group|disagreement~A difference of opinion|progress~Movement toward a goal
Music Genres|rhythm~A pattern of beats|instruments~Tools used to make music|labels~Names used to group things
Live Music|timing~When an action or sound happens|venue~A place where an event occurs|audiences~Groups watching or listening
Songwriting|melody~A sequence of musical notes|chorus~A repeated section of a song|revise~To change something to improve it
Film Genres|comedy~A film style that aims to make people laugh|mystery~A story built around unanswered questions|lighting~The way light shapes a scene
Film Making|shot~A continuous piece of filmed action|editors~People who arrange recorded scenes|sound~What listeners hear in a film
Fashion|materials~Substances used to make clothes|uniforms~Clothes worn by a group|repairing~Fixing something so it lasts longer
Personal Style|color~The visual quality of light or objects|shape~The form or outline of clothing|trends~Styles many people follow for a time
Food Culture|ingredients~Foods used to prepare a meal|recipes~Instructions for cooking a dish|traditions~Practices passed between people
Cooking Skills|chopping~Cutting food into smaller pieces|heat~Warmth that changes food|seasoning~Ingredients added for flavor
Language Learning|conversations~Talks between people|mistakes~Things done incorrectly that can teach us|grammar~Patterns that organize a language
Travel Etiquette|greetings~Ways of saying hello|observing~Watching carefully before acting|permission~Agreement given before someone does something
Local Traditions|custom~A practice shared by a community|younger~Less old in age|ownership~The right to control or claim something
Exams|timed test~An assessment with a fixed time|gaps~Things not yet known or learned|concentration~Careful attention to a task
Homework|practice~Repeated work to improve|feedback~Advice about what worked and what can improve|conditions~Surrounding circumstances that affect work
School Clubs|interests~Activities or ideas people care about|roles~Jobs or parts taken in a group|newcomers~People joining a group recently
Part-Time Jobs|schedules~Plans showing when work happens|pay~Money received for work|rules~Instructions people must follow
Future Jobs|roles~Types of work people do|adaptability~Ability to adjust to new conditions|judgment~Careful decisions based on understanding
Entrepreneurship|need~A problem or requirement people have|feedback~Information about what users think|costs~Money or resources needed
Money and Saving|goal~Something a person hopes to reach|trade-offs~Choices where one benefit costs another|resources~Things available for use
Budgeting|needs~Things important for living or functioning|tracking~Following information over time|budget~A plan for how money is used
Volunteering|local groups~Organizations rooted in a community|listening~Paying attention to others' views|reliable~Able to be trusted to do what was promised
Public Speaking|opening~The first part of a speech|examples~Specific cases used to explain ideas|pauses~Short breaks in speaking
Study Habits|review~Looking at material again|memory~The ability to keep and recall information|distractions~Things that pull attention away
Sleep and Learning|bedtime~The time someone goes to bed|screens~Displays on electronic devices|memory~The ability to keep and recall information
Choosing Subjects|interest~A feeling of wanting to learn more|advice~Suggestions that help a decision|strengths~Things someone does well
Gap Years|volunteer~To work without pay to help others|opportunities~Chances to do something useful|reflection~Careful thought about experience
Career Skills|communication~Sharing ideas clearly with others|commitments~Promises or agreed responsibilities|feedback~Advice about what to improve
Climate Change|greenhouse gases~Gases that hold heat in the atmosphere|atmosphere~The layer of gases around Earth|habitats~Natural homes of living things
Renewable Energy|solar panels~Devices turning sunlight into electricity|wind turbines~Machines using moving air to make power|storage~Keeping energy for later use
Plastic Waste|fragments~Small pieces broken from a larger item|recycling~Turning used materials into new products|reuse~Using something again rather than discarding it
Wildlife Conservation|habitats~Natural homes of plants and animals|ecosystem~Living things and their surroundings interacting|species~Kinds of living things
Urban Nature|shade~An area sheltered from direct sun|nesting~Making places for animals to raise young|green areas~Places with plants in a city
Public Transport|routes~Paths followed by vehicles|transfers~Changes from one service to another|accessible~Usable by people with different needs
Cities of the Future|neighborhoods~Local areas where people live|maintenance~Work keeping a system in good condition|residents~People who live in a place
Space Exploration|spacecraft~Vehicles built for travel beyond Earth|instruments~Tools used to take measurements|missions~Planned journeys with a purpose
Mars Missions|robotic vehicles~Machines that travel and gather information|dust~Fine dry particles|signals~Messages sent between devices
Satellites|orbit~A path around another body|signals~Messages sent through a system|debris~Broken pieces left in space
Inventions|prototype~An early model used for testing|failures~Attempts that do not work as hoped|effects~Changes caused by something
Medical Technology|imaging tools~Devices that create pictures inside the body|devices~Tools made for a purpose|access~The ability to obtain or use something
Food Waste|storage~Keeping food in suitable conditions|leftovers~Food remaining after a meal|discarded~Thrown away
Sustainable Fashion|garment~An item of clothing|secondhand~Previously owned by someone else|fabric~Material used to make clothes
Water Conservation|leaks~Places where water escapes by accident|rain~Water falling from clouds|freshwater~Water with very little salt
Team Sports|roles~Different jobs players take|communication~Sharing information with teammates|trust~Belief that others will do their part
Solo Sports|personal goal~A target chosen for oneself|competition~An event where people compare performance|rest~Time when the body recovers
Fitness|stamina~Ability to keep moving without tiring quickly|recovery~The process of returning to normal after effort|movement~Changing position through physical action
Outdoor Adventures|weather~Conditions of air and sky|navigate~To find and follow a route|trace~A sign left behind
Mysteries and Clues|clue~A detail helping explain a mystery|false leads~Details that suggest a wrong answer|ending~The final part of a story
Unexplained Places|evidence~Information supporting an explanation|claims~Statements people say are true|curiosity~A desire to understand something
Optical Illusions|context~Surrounding information that shapes understanding|shadow~A dark area where light is blocked|interpreting~Giving meaning to what is seen
Healthy Eating|nutrients~Useful substances supplied by food|concentration~Careful attention|varied~Including different kinds
Stress Management|pressure~A feeling of demands or difficulty|responses~Actions taken after something happens|strategies~Plans for handling a problem
Travel Planning|routes~Ways of getting from one place to another|schedule~A plan showing times|backup option~A second choice if the first fails
`.trim().split('\n');

export const teensExtraTerms = parse(teens);
