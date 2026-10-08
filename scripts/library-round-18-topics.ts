export type TopicSeed = { id: string; title: string; aliases: string[]; ageBand: 'kids' | 'teens'; category: string };

// category | title | additional phrases a teacher might type. The title is also an alias.
const kidsLines = `
animals|Cats|cat,kittens,house cats
animals|Dogs|dog,puppies,pet dogs
animals|Horses|horse,ponies,riding horses
animals|Elephants|elephant,elephant trunks,elephant families
animals|Giraffes|giraffe,long-necked animals,giraffe spots
animals|Zebras|zebra,zebra stripes,wild striped horses
animals|Lions|lion,lion pride,big cats in grasslands
animals|Tigers|tiger,tiger stripes,wild striped cats
animals|Pandas|panda,giant pandas,bamboo bears
animals|Koalas|koala,tree-dwelling koalas,eucalyptus eaters
animals|Kangaroos|kangaroo,kangaroo pouches,jumping marsupials
animals|Penguins|penguin,penguin colonies,birds on ice
animals|Polar Bears|polar bear,arctic bears,bears on sea ice
animals|Dolphins|dolphin,dolphin pods,smart sea mammals
animals|Whales|whale,whale songs,giants of the sea
animals|Sharks|shark,shark teeth,ocean predators
animals|Sea Turtles|sea turtle,ocean turtles,turtle shells at sea
animals|Frogs|frog,tadpoles,frog life cycle
animals|Butterflies|butterfly,caterpillars,butterfly wings
animals|Bees|bee,honeybees,bees and flowers
earth and space|Dinosaurs|dinosaur,prehistoric reptiles,giant ancient animals
earth and space|Fossils|fossil,old bones in rock,fossil footprints
earth and space|The Moon|moon,moon phases,night sky moon
earth and space|The Sun|sun,sunlight,our star
earth and space|Planets|planet,solar system worlds,planets around the sun
earth and space|Stars|star,constellations,twinkling stars
earth and space|Rockets|rocket,rocket launch,space rockets
earth and space|Astronauts|astronaut,space travellers,living in space
earth and space|Volcanoes|volcano,volcanoes,eruption,lava
earth and space|Earthquakes|earthquake,shaking ground,earth tremors
earth and space|Mountains|mountain,high peaks,mountain slopes
earth and space|Rivers|river,flowing rivers,riverbanks
earth and space|Oceans|ocean,deep ocean,seas of the world
earth and space|Coral Reefs|coral reef,reef fish,underwater coral
earth and space|Rainforests|rainforest,tropical forests,jungle layers
weather and nature|Deserts|desert,sandy deserts,dry lands
weather and nature|Forests|forest,woodlands,trees in woods
weather and nature|Seasons|season,spring summer autumn winter,changing seasons
weather and nature|Rain|rain,raindrops,rainy days
weather and nature|Snow|snow,snowflakes,snowy days
weather and nature|Wind|wind,breezes,windy weather
weather and nature|Clouds|cloud,cloud shapes,cloudy sky
weather and nature|Rainbows|rainbow,colors in a rainbow,rainbow colors
weather and nature|Water Cycle|water cycle,evaporation and rain,where rain comes from
weather and nature|Plant Growth|growing plants,seeds to plants,how plants grow
everyday life|Cooking|cook,make a meal,cooking food
everyday life|Baking|bake,baking bread,using an oven
everyday life|Fruits|fruit,apples and oranges,fruit from trees
everyday life|Vegetables|vegetable,carrots and greens,garden vegetables
everyday life|Breakfast|morning meal,breakfast foods,eating in the morning
everyday life|School Lunch|lunch at school,lunchbox,school meals
everyday life|Caring for Pets|pet care,feeding a pet,looking after animals
everyday life|School Day|a day at school,school routines,school timetable
everyday life|Classroom Rules|class rules,sharing in class,being fair at school
everyday life|Making Friends|new friends,how to make friends,playground friends
everyday life|Family Traditions|family customs,things families do,family celebrations
everyday life|Birthday Parties|birthday party,birthday games,celebrating a birthday
everyday life|Festivals Around the World|world festivals,festival customs,celebrations worldwide
everyday life|Holidays|school holidays,holiday activities,time off school
everyday life|Jobs People Do|community jobs,people at work,what adults do at work
play and creativity|Soccer|football game,kicking a ball,soccer teams
play and creativity|Basketball|basketball game,shooting hoops,basketball teams
play and creativity|Swimming|swim,swimming lessons,pool swimming
play and creativity|Cycling|ride a bike,cycling safety,bike rides
play and creativity|Running|run,running races,jogging for kids
play and creativity|Dancing|dance,dance moves,dancing together
play and creativity|Board Games|board game,tabletop games,dice and boards
play and creativity|Puzzles|puzzle,jigsaw puzzles,solving puzzles
play and creativity|Building Blocks|blocks,building toys,stacking blocks
play and creativity|Kites|kite,flying a kite,kites in the wind
play and creativity|Playgrounds|playground,slides and swings,playing outside
play and creativity|Superheroes|superhero,imaginary heroes,hero powers
play and creativity|Robots|robot,helpful robots,robot helpers
play and creativity|Trains|train,rail journeys,train stations
play and creativity|Airplanes|airplane,aeroplanes,planes in the sky
play and creativity|Boats|boat,sailing boats,boats on water
play and creativity|Musical Instruments|instrument,playing an instrument,instruments and sounds
play and creativity|Drawing|draw,sketching pictures,drawing with pencils
play and creativity|Painting|paint,painting pictures,paintbrush art
play and creativity|The Five Senses|body senses,seeing hearing smelling,senses of the body
`.trim().split('\n');

const teenLines = `
digital life|Video Games|gaming,computer games,gameplay
digital life|Game Design|designing games,game makers,how games are made
digital life|Esports|competitive gaming,esports teams,game tournaments
digital life|Social Media|social networks,sharing posts,online feeds
digital life|Online Privacy|privacy online,protecting personal data,private accounts
digital life|Screen Time|time on screens,phone time,device habits
digital life|Digital Footprints|online trace,posts that last,what the internet remembers
digital life|Internet Memes|meme,funny online pictures,sharing memes
digital life|Artificial Intelligence|AI tools,machine learning,computer intelligence
digital life|Robots and Automation|automation,automated machines,robots at work
digital life|Virtual Reality|VR headsets,virtual worlds,immersive technology
digital life|Coding|computer code,programming,writing code
digital life|Cybersecurity|online security,computer safety,protecting accounts
digital life|Online Learning|learning online,remote classes,digital lessons
digital life|Digital Art|art on tablets,computer drawing,creating digital images
culture and relationships|Friendship|close friends,being a good friend,friendship problems
culture and relationships|Peer Pressure|pressure from friends,following the crowd,saying no to friends
culture and relationships|Teamwork|working together,group projects,team roles
culture and relationships|Music Genres|styles of music,hip-hop and jazz,music styles
culture and relationships|Live Music|concerts,live performances,music on stage
culture and relationships|Songwriting|writing songs,song lyrics,making a melody
culture and relationships|Film Genres|types of films,comedies and mysteries,movie genres
culture and relationships|Film Making|making films,behind the camera,filmmaking
culture and relationships|Fashion|clothing trends,what people wear,fashion choices
culture and relationships|Personal Style|individual style,dressing to express yourself,style choices
culture and relationships|Food Culture|food traditions,meals around the world,cultural food
culture and relationships|Cooking Skills|learning to cook,kitchen skills,preparing food
culture and relationships|Language Learning|learning languages,how to learn a language,language practice
culture and relationships|Travel Etiquette|travel manners,being a good visitor,respectful travel
culture and relationships|Local Traditions|local customs,traditions where we live,community customs
school and work|Exams|school exams,testing at school,exam nerves
school and work|Homework|homework habits,after-school work,school assignments
school and work|School Clubs|after-school clubs,student groups,joining a club
school and work|Part-Time Jobs|after-school jobs,weekend work,teen employment
school and work|Future Jobs|jobs of the future,changing careers,work in the future
school and work|Entrepreneurship|starting a small business,young entrepreneurs,business ideas
school and work|Money and Saving|saving money,pocket money,savings goals
school and work|Budgeting|making a budget,planning spending,tracking costs
school and work|Volunteering|community service,helping without pay,volunteer work
school and work|Public Speaking|giving a speech,speaking to a group,presentations
school and work|Study Habits|how to study,study routines,revision habits
school and work|Sleep and Learning|sleep for students,rest and memory,bedtime and school
school and work|Choosing Subjects|school subject choices,selecting classes,subject decisions
school and work|Gap Years|year before college,taking a gap year,time between school and study
school and work|Career Skills|workplace skills,skills for a job,communication at work
science and environment|Climate Change|global warming,changing climate,climate action
science and environment|Renewable Energy|clean energy,solar and wind power,renewable power
science and environment|Plastic Waste|plastic pollution,single-use plastic,plastic trash
science and environment|Wildlife Conservation|protecting wildlife,animal habitats,conservation work
science and environment|Urban Nature|nature in cities,city parks,urban wildlife
science and environment|Public Transport|buses and trains,shared transport,getting around a city
science and environment|Cities of the Future|future cities,smart cities,tomorrow's cities
science and environment|Space Exploration|exploring space,space missions,space science
science and environment|Mars Missions|travel to Mars,exploring Mars,Mars spacecraft
science and environment|Satellites|satellite,objects in orbit,space satellites
science and environment|Inventions|inventors,new ideas and inventions,how inventions work
science and environment|Medical Technology|tools in medicine,health technology,medical devices
science and environment|Food Waste|wasted food,saving leftover food,throwing food away
science and environment|Sustainable Fashion|clothes and the environment,reusing clothes,eco-friendly fashion
science and environment|Water Conservation|saving water,using less water,protecting freshwater
wellbeing and adventure|Team Sports|sports teams,playing on a team,team games
wellbeing and adventure|Solo Sports|individual sports,sports you play alone,personal sports goals
wellbeing and adventure|Fitness|staying fit,exercise routines,physical fitness
wellbeing and adventure|Outdoor Adventures|hiking and camping,exploring outdoors,adventure trips
wellbeing and adventure|Mysteries and Clues|solving mysteries,detective clues,mystery stories
wellbeing and adventure|Unexplained Places|strange places,places with mysteries,unusual places
wellbeing and adventure|Optical Illusions|visual tricks,eyes and illusions,images that fool us
wellbeing and adventure|Healthy Eating|balanced meals,food for energy,eating well
wellbeing and adventure|Stress Management|managing stress,calming down,stress at school
wellbeing and adventure|Travel Planning|planning a trip,travel itinerary,getting ready to travel
`.trim().split('\n');

function slug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function parse(lines: string[], ageBand: 'kids' | 'teens'): TopicSeed[] {
  return lines.map(line => {
    const [category, title, otherAliases] = line.trim().split('|');
    if (!category || !title || !otherAliases) throw new Error(`Invalid topic row: ${line}`);
    const aliases = Array.from(new Set([title.toLowerCase(), ...otherAliases.split(',').map(s => s.trim())]));
    return { id: `topic-${ageBand}-${slug(title)}`, title, aliases, ageBand, category };
  });
}
export const topicSeeds = [...parse(kidsLines, 'kids'), ...parse(teenLines, 'teens')];
