import type { LensId } from './briefs';

/** Evergreen follow-on topics, not current-event claims. News/Politics still
 * require teen eligibility, teacher class opt-in and dated sources at display time.
 * Kid seeds contain no news, politics, war or disaster topics. Single-speaker
 * discussion is assumed; no paired tasks or Junior rankings are implied.
 */
export type LensSeed = { readonly topic: string; readonly reason: string };
export const LENS_WHERE_NEXT: Readonly<Record<LensId, readonly LensSeed[]>> = {
  "films": [
    {
      "topic": "Animation studios",
      "reason": "Discover how drawings become moving stories."
    },
    {
      "topic": "Film locations",
      "reason": "Compare a real street with its screen role."
    },
    {
      "topic": "Silent films",
      "reason": "Try explaining action without spoken dialogue."
    },
    {
      "topic": "Stop-motion films",
      "reason": "Notice how small models seem to move."
    },
    {
      "topic": "Film music",
      "reason": "Explore how sound changes a scene's mood."
    },
    {
      "topic": "Costume design",
      "reason": "Use clothing to describe a character."
    },
    {
      "topic": "Movie posters",
      "reason": "Discuss what a title and image make us expect."
    },
    {
      "topic": "Film props",
      "reason": "Find ordinary objects with important story jobs."
    },
    {
      "topic": "Documentaries",
      "reason": "Compare an observed event with a fictional story."
    },
    {
      "topic": "Short films",
      "reason": "Follow a complete story in a small space."
    },
    {
      "topic": "Family adventures",
      "reason": "Choose the kind of journey a character might take."
    },
    {
      "topic": "Voice acting",
      "reason": "Describe how a voice gives a character personality."
    },
    {
      "topic": "Cinema buildings",
      "reason": "Explore where audiences gather to watch."
    },
    {
      "topic": "Subtitles",
      "reason": "Talk about watching across different languages."
    },
    {
      "topic": "Film festivals",
      "reason": "Imagine choosing a varied programme for visitors."
    },
    {
      "topic": "Opening scenes",
      "reason": "Notice how a story welcomes its audience."
    },
    {
      "topic": "Camera angles",
      "reason": "See how a different viewpoint changes an image."
    },
    {
      "topic": "Practical effects",
      "reason": "Discover tricks made with real objects."
    },
    {
      "topic": "Storyboards",
      "reason": "Put pictures into a clear sequence."
    },
    {
      "topic": "Film editing",
      "reason": "Compare ways to join the same moments."
    },
    {
      "topic": "Local television",
      "reason": "Explore programmes made for a nearby audience."
    },
    {
      "topic": "Nature filmmaking",
      "reason": "Discuss how to film wildlife without disturbing it."
    },
    {
      "topic": "Book adaptations",
      "reason": "Compare a written setting with its screen version."
    },
    {
      "topic": "Comedy timing",
      "reason": "Explain a gentle joke without mocking a person."
    },
    {
      "topic": "Film credits",
      "reason": "Discover the many jobs behind one scene."
    }
  ],
  "music": [
    {
      "topic": "Local instruments",
      "reason": "Hear how materials shape a sound."
    },
    {
      "topic": "Folk songs",
      "reason": "Explore stories carried between generations."
    },
    {
      "topic": "Street musicians",
      "reason": "Imagine choosing music for a public space."
    },
    {
      "topic": "Concert halls",
      "reason": "Notice how buildings make room for listening."
    },
    {
      "topic": "Dance rhythms",
      "reason": "Describe a beat without needing to dance."
    },
    {
      "topic": "Music festivals",
      "reason": "Build a varied imaginary performance programme."
    },
    {
      "topic": "Choirs",
      "reason": "Explore how different voices work together."
    },
    {
      "topic": "Drum traditions",
      "reason": "Compare ways to make a strong rhythm."
    },
    {
      "topic": "String instruments",
      "reason": "Notice how players change pitch."
    },
    {
      "topic": "Wind instruments",
      "reason": "Discover music made by moving air."
    },
    {
      "topic": "Piano music",
      "reason": "Describe contrasts between quiet and loud passages."
    },
    {
      "topic": "Film scores",
      "reason": "Connect a sound with a screen mood."
    },
    {
      "topic": "Lullabies",
      "reason": "Compare gentle music for quiet moments."
    },
    {
      "topic": "Songwriting",
      "reason": "Choose words and sounds for an imagined place."
    },
    {
      "topic": "Recording studios",
      "reason": "Explore how a performance is saved."
    },
    {
      "topic": "Live performances",
      "reason": "Discuss what changes when an audience is present."
    },
    {
      "topic": "Musical journeys",
      "reason": "Follow an instrument between different places."
    },
    {
      "topic": "Traditional dances",
      "reason": "Explore their music respectfully without ranking cultures."
    },
    {
      "topic": "Jazz improvisation",
      "reason": "Notice choices musicians make while playing."
    },
    {
      "topic": "Music museums",
      "reason": "Choose an object you would ask about."
    },
    {
      "topic": "Community bands",
      "reason": "Discover reasons people play together."
    },
    {
      "topic": "Animal sounds in music",
      "reason": "Describe how composers suggest the natural world."
    },
    {
      "topic": "Music and celebrations",
      "reason": "Compare how sound marks a special occasion."
    },
    {
      "topic": "Album covers",
      "reason": "Discuss visual design without copying artwork."
    },
    {
      "topic": "Music practice",
      "reason": "Share ways to learn a difficult passage."
    }
  ],
  "sport": [
    {
      "topic": "Football clubs",
      "reason": "Compare how teams connect with their communities."
    },
    {
      "topic": "Cricket skills",
      "reason": "Explore what a batter or bowler tries to do."
    },
    {
      "topic": "Basketball courts",
      "reason": "Notice how the playing space shapes the game."
    },
    {
      "topic": "Tennis surfaces",
      "reason": "Discuss how a surface can change a match."
    },
    {
      "topic": "Running routes",
      "reason": "Design a route with clear distance and access information."
    },
    {
      "topic": "Swimming pools",
      "reason": "Explore the work behind a swimming event."
    },
    {
      "topic": "Cycling tracks",
      "reason": "Compare racing with everyday bicycle travel."
    },
    {
      "topic": "Winter sports",
      "reason": "Find equipment designed for snow or ice."
    },
    {
      "topic": "Martial arts",
      "reason": "Describe movement and practice respectfully."
    },
    {
      "topic": "Traditional sports",
      "reason": "Learn a rule that visitors may not know."
    },
    {
      "topic": "Stadium design",
      "reason": "Choose features that help different spectators."
    },
    {
      "topic": "Team colours",
      "reason": "Discuss identity without insulting rival supporters."
    },
    {
      "topic": "Sports museums",
      "reason": "Choose an object with a story to investigate."
    },
    {
      "topic": "Coaching",
      "reason": "Suggest encouraging ways to teach a new skill."
    },
    {
      "topic": "Refereeing",
      "reason": "Compare decisions using the sport's rules."
    },
    {
      "topic": "Accessible sport",
      "reason": "Explore adaptations that let more people take part."
    },
    {
      "topic": "Youth sport",
      "reason": "Discuss enjoyment and participation without rankings."
    },
    {
      "topic": "Athlete routines",
      "reason": "Ask what safe practice and rest might involve."
    },
    {
      "topic": "Sporting equipment",
      "reason": "Explain why an object has its shape."
    },
    {
      "topic": "Relay races",
      "reason": "Explore how a team coordinates separate efforts."
    },
    {
      "topic": "Goalkeepers",
      "reason": "Describe a role with special responsibilities."
    },
    {
      "topic": "Sports photography",
      "reason": "Notice how an image captures movement."
    },
    {
      "topic": "Historic events",
      "reason": "Investigate a dated result without inventing current standings."
    },
    {
      "topic": "Fan traditions",
      "reason": "Compare friendly ways to support a team."
    },
    {
      "topic": "Fair play",
      "reason": "Discuss a practical example of respectful competition."
    }
  ],
  "food": [
    {
      "topic": "Street snacks",
      "reason": "Explore small dishes sold in public places."
    },
    {
      "topic": "Noodle dishes",
      "reason": "Compare shapes, ingredients and serving styles."
    },
    {
      "topic": "Rice dishes",
      "reason": "Discover different ways to prepare one staple."
    },
    {
      "topic": "Bread traditions",
      "reason": "Notice how dough becomes different kinds of bread."
    },
    {
      "topic": "Soup bowls",
      "reason": "Describe what gives a broth its flavour."
    },
    {
      "topic": "Local markets",
      "reason": "Plan questions for an ingredient seller."
    },
    {
      "topic": "Seasonal fruit",
      "reason": "Compare colours and growing conditions."
    },
    {
      "topic": "Cooking herbs",
      "reason": "Explore fresh leaves used for seasoning."
    },
    {
      "topic": "Spice markets",
      "reason": "Discover the plant parts behind familiar flavours."
    },
    {
      "topic": "Food sharing",
      "reason": "Discuss ways a meal can bring people together."
    },
    {
      "topic": "Family recipes",
      "reason": "Explore variation without asking for private family stories."
    },
    {
      "topic": "Festival food",
      "reason": "Connect a named dish with a celebration."
    },
    {
      "topic": "Tea customs",
      "reason": "Compare preparation and serving without claiming universal rules."
    },
    {
      "topic": "Breakfast dishes",
      "reason": "Discover different ways to start a day."
    },
    {
      "topic": "Vegetarian cooking",
      "reason": "Explore dishes built around plants."
    },
    {
      "topic": "Food textures",
      "reason": "Practise words for crisp, soft and chewy food."
    },
    {
      "topic": "Kitchen tools",
      "reason": "Explain the job of a familiar object."
    },
    {
      "topic": "Food preservation",
      "reason": "Discover ways people keep ingredients for later."
    },
    {
      "topic": "Bakery windows",
      "reason": "Describe shapes and colours before choosing."
    },
    {
      "topic": "Dumplings",
      "reason": "Compare wrappers, fillings and cooking methods."
    },
    {
      "topic": "Sauces",
      "reason": "Explore how a small addition changes a dish."
    },
    {
      "topic": "Regional variations",
      "reason": "Compare recipes without declaring one the only authentic version."
    },
    {
      "topic": "Restaurant menus",
      "reason": "Design clear ingredient information for visitors."
    },
    {
      "topic": "Cooking methods",
      "reason": "Compare steaming, baking and roasting."
    },
    {
      "topic": "Food origins",
      "reason": "Investigate a claim while keeping uncertainty visible."
    }
  ],
  "news": [
    {
      "topic": "Museum announcements",
      "reason": "Use a dated source to explore a new exhibition."
    },
    {
      "topic": "Science reports",
      "reason": "Separate a study's finding from a headline's promise."
    },
    {
      "topic": "Transport updates",
      "reason": "Compare dated practical information for travellers."
    },
    {
      "topic": "Sports reports",
      "reason": "Check the event date before discussing a result."
    },
    {
      "topic": "Weather records",
      "reason": "Read a calm dated account without disaster imagery."
    },
    {
      "topic": "Local arts coverage",
      "reason": "Discover a performance through a factual announcement."
    },
    {
      "topic": "Space missions",
      "reason": "Compare a planned milestone with a completed one."
    },
    {
      "topic": "Library programmes",
      "reason": "Explore public activities using the organiser's dated notice."
    },
    {
      "topic": "Public park projects",
      "reason": "Compare stated aims and different community viewpoints."
    },
    {
      "topic": "Conservation research",
      "reason": "Distinguish measured changes from predictions."
    },
    {
      "topic": "Food research",
      "reason": "Check what a study does and does not establish."
    },
    {
      "topic": "Technology announcements",
      "reason": "Separate demonstrated features from advertising claims."
    },
    {
      "topic": "Historic discoveries",
      "reason": "Ask what evidence supports a newly reported interpretation."
    },
    {
      "topic": "Festival programmes",
      "reason": "Read an organiser's dated information without treating it as permanent."
    },
    {
      "topic": "Photo captions",
      "reason": "Check whether an image belongs to the reported event."
    },
    {
      "topic": "Headline comparisons",
      "reason": "Notice differences in wording across accounts."
    },
    {
      "topic": "Source dates",
      "reason": "Explore how an old story can look new online."
    },
    {
      "topic": "Corrections",
      "reason": "Discuss how a report can openly fix an error."
    },
    {
      "topic": "Interview questions",
      "reason": "Plan neutral questions about a public topic."
    },
    {
      "topic": "Local journalism",
      "reason": "Explore how a reporter gathers information."
    },
    {
      "topic": "Maps in reports",
      "reason": "Check what a map shows and leaves out."
    },
    {
      "topic": "Numbers in news",
      "reason": "Find the units, date and source behind a number."
    },
    {
      "topic": "Uncertainty in reporting",
      "reason": "Practise saying what has not yet been established."
    },
    {
      "topic": "Community viewpoints",
      "reason": "Hear several perspectives without demanding personal political disclosure."
    },
    {
      "topic": "Fact and opinion",
      "reason": "Compare a checkable statement with a judgement."
    }
  ],
  "politics": [
    {
      "topic": "Local councils",
      "reason": "Explore which decisions are made near home."
    },
    {
      "topic": "Public libraries",
      "reason": "Compare different reasons to fund a shared service."
    },
    {
      "topic": "Park planning",
      "reason": "Discuss how a public space can meet different needs."
    },
    {
      "topic": "Public transport",
      "reason": "Compare access, cost and travel priorities fairly."
    },
    {
      "topic": "School councils",
      "reason": "Explore representation through a familiar setting."
    },
    {
      "topic": "Parliament buildings",
      "reason": "Connect a visible place with its institutional purpose."
    },
    {
      "topic": "How laws are made",
      "reason": "Follow a sourced explanation without endorsing a party."
    },
    {
      "topic": "Voting systems",
      "reason": "Compare processes using neutral examples."
    },
    {
      "topic": "Public budgets",
      "reason": "Consider trade-offs without asking about family income."
    },
    {
      "topic": "Community meetings",
      "reason": "Practise listening to more than one viewpoint."
    },
    {
      "topic": "Access to public spaces",
      "reason": "Explore how design choices affect different users."
    },
    {
      "topic": "Shared resources",
      "reason": "Compare fair ways to care for a common place."
    },
    {
      "topic": "Public information",
      "reason": "Discuss why clear language and dates matter."
    },
    {
      "topic": "Rights and responsibilities",
      "reason": "Compare a protected entitlement with an everyday duty."
    },
    {
      "topic": "Citizen questions",
      "reason": "Write respectful questions for a public representative."
    },
    {
      "topic": "Constitutions",
      "reason": "Explore the role of a foundational public document."
    },
    {
      "topic": "Local and national decisions",
      "reason": "Sort example responsibilities without guessing legal powers."
    },
    {
      "topic": "Public service jobs",
      "reason": "Discover work that supports a community."
    },
    {
      "topic": "Consultations",
      "reason": "Explore how institutions ask for different views."
    },
    {
      "topic": "Media literacy",
      "reason": "Compare evidence with persuasive wording."
    },
    {
      "topic": "Public art choices",
      "reason": "Discuss several reasons for selecting a shared artwork."
    },
    {
      "topic": "Environmental policy",
      "reason": "Compare evidence and competing priorities neutrally."
    },
    {
      "topic": "Heritage decisions",
      "reason": "Explore different views about preserving a building."
    },
    {
      "topic": "Policy evaluation",
      "reason": "Ask what evidence would show a proposal's effects."
    },
    {
      "topic": "Respectful disagreement",
      "reason": "Practise responding to a reason rather than attacking a person."
    }
  ],
  "science-tech": [
    {
      "topic": "Space probes",
      "reason": "Explore the instruments sent to distant worlds."
    },
    {
      "topic": "Bridge design",
      "reason": "Compare how shapes carry loads."
    },
    {
      "topic": "Railway engineering",
      "reason": "Investigate how trains move and stop."
    },
    {
      "topic": "Water filters",
      "reason": "Explain a process using visible steps."
    },
    {
      "topic": "Solar cells",
      "reason": "Explore turning light into electrical energy."
    },
    {
      "topic": "Wind turbines",
      "reason": "Connect moving air with useful work."
    },
    {
      "topic": "Robotics",
      "reason": "Compare sensors, instructions and actions."
    },
    {
      "topic": "Materials testing",
      "reason": "Ask which observation would support a design choice."
    },
    {
      "topic": "Scientific instruments",
      "reason": "Discover how a measurement is made."
    },
    {
      "topic": "Ocean research",
      "reason": "Choose a question a research vessel could investigate."
    },
    {
      "topic": "Plant science",
      "reason": "Compare observations under clearly described conditions."
    },
    {
      "topic": "Sound waves",
      "reason": "Explore how a vibration reaches a listener."
    },
    {
      "topic": "Light and colour",
      "reason": "Use safe examples to discuss reflection and colour."
    },
    {
      "topic": "Weather measurements",
      "reason": "Separate observations from forecasts."
    },
    {
      "topic": "Computer instructions",
      "reason": "Explain a simple sequence without claiming a machine thinks like a person."
    },
    {
      "topic": "Satellite maps",
      "reason": "Discover how images help researchers compare places."
    },
    {
      "topic": "Museum inventions",
      "reason": "Choose an object whose mechanism you want to understand."
    },
    {
      "topic": "Everyday machines",
      "reason": "Explain the hidden work in a familiar device."
    },
    {
      "topic": "Food science",
      "reason": "Explore texture and heating without health promises."
    },
    {
      "topic": "Transport materials",
      "reason": "Compare strength, weight and purpose."
    },
    {
      "topic": "Models and simulations",
      "reason": "Discuss what a simplified model leaves out."
    },
    {
      "topic": "Scientific teamwork",
      "reason": "Discover different jobs in one research project."
    },
    {
      "topic": "Fair tests",
      "reason": "Decide what to keep the same when comparing results."
    },
    {
      "topic": "Research uncertainty",
      "reason": "Practise explaining the limits of a finding."
    },
    {
      "topic": "Repair and reuse",
      "reason": "Explore a design that makes an object easier to mend."
    }
  ],
  "history": [
    {
      "topic": "Old maps",
      "reason": "Compare how people represented familiar places."
    },
    {
      "topic": "Everyday objects",
      "reason": "Use a small object to investigate past routines."
    },
    {
      "topic": "Historic buildings",
      "reason": "Ask what a building's features reveal."
    },
    {
      "topic": "Travel diaries",
      "reason": "Compare one person's account with other evidence."
    },
    {
      "topic": "Trade routes",
      "reason": "Follow connections between goods, ideas and places."
    },
    {
      "topic": "Printing",
      "reason": "Explore how texts and images reached readers."
    },
    {
      "topic": "Transport history",
      "reason": "Compare journeys before and after a new invention."
    },
    {
      "topic": "Food history",
      "reason": "Investigate how ingredients moved between regions."
    },
    {
      "topic": "Clothing history",
      "reason": "Connect materials and design with daily life."
    },
    {
      "topic": "Museum labels",
      "reason": "Ask how a short caption supports its claims."
    },
    {
      "topic": "Local archives",
      "reason": "Discover the records a town keeps."
    },
    {
      "topic": "Historic photographs",
      "reason": "Notice change without assuming a photograph tells everything."
    },
    {
      "topic": "Craft traditions",
      "reason": "Explore skills passed on and adapted."
    },
    {
      "topic": "Archaeology",
      "reason": "Distinguish an excavated object from an interpretation."
    },
    {
      "topic": "Historic gardens",
      "reason": "Discover how people shaped outdoor spaces."
    },
    {
      "topic": "Music history",
      "reason": "Follow a style through dated recordings or documents."
    },
    {
      "topic": "Games from the past",
      "reason": "Compare familiar rules with older examples."
    },
    {
      "topic": "School history",
      "reason": "Explore learning materials from another period."
    },
    {
      "topic": "Timekeeping",
      "reason": "Discover how people measured and organised time."
    },
    {
      "topic": "City growth",
      "reason": "Compare maps showing different stages of development."
    },
    {
      "topic": "Oral history",
      "reason": "Discuss memory respectfully alongside other sources."
    },
    {
      "topic": "Restoration",
      "reason": "Ask what should be repaired, kept or explained."
    },
    {
      "topic": "Timelines",
      "reason": "Arrange evidence in a clear sequence."
    },
    {
      "topic": "Changing place names",
      "reason": "Explore dated names without erasing different perspectives."
    },
    {
      "topic": "History in fiction",
      "reason": "Separate a story setting from documented events."
    }
  ],
  "art-design": [
    {
      "topic": "Woodblock prints",
      "reason": "Notice how a carved surface creates an image."
    },
    {
      "topic": "Ceramic bowls",
      "reason": "Compare shape, surface and practical use."
    },
    {
      "topic": "Textile patterns",
      "reason": "Describe repetition without copying branded artwork."
    },
    {
      "topic": "Public sculptures",
      "reason": "Explore how a three-dimensional work changes a space."
    },
    {
      "topic": "Poster design",
      "reason": "Discuss what a layout makes easy to notice."
    },
    {
      "topic": "Street art",
      "reason": "Compare a visible feature with a personal interpretation."
    },
    {
      "topic": "Garden design",
      "reason": "Follow paths, views and materials."
    },
    {
      "topic": "Furniture",
      "reason": "Ask how an object supports its user."
    },
    {
      "topic": "Museum architecture",
      "reason": "Compare a building's practical and visual choices."
    },
    {
      "topic": "Traditional crafts",
      "reason": "Explore materials and skills respectfully."
    },
    {
      "topic": "Colour palettes",
      "reason": "Describe the mood created by selected colours."
    },
    {
      "topic": "Photography",
      "reason": "Compare framing choices in pictures of one place."
    },
    {
      "topic": "Typography",
      "reason": "Notice how letter shapes affect readability."
    },
    {
      "topic": "Fashion materials",
      "reason": "Explore construction without judging bodies or spending."
    },
    {
      "topic": "Product packaging",
      "reason": "Compare useful information with visual persuasion."
    },
    {
      "topic": "Art galleries",
      "reason": "Choose a work you would ask about."
    },
    {
      "topic": "Mosaics",
      "reason": "Discover images made from many small pieces."
    },
    {
      "topic": "Paper art",
      "reason": "Explore folding, cutting and layering."
    },
    {
      "topic": "Light in buildings",
      "reason": "Notice how windows shape an indoor space."
    },
    {
      "topic": "Accessible design",
      "reason": "Discuss how visual choices can include more users."
    },
    {
      "topic": "Maps as design",
      "reason": "Compare clarity, emphasis and missing detail."
    },
    {
      "topic": "Sculpture materials",
      "reason": "Explain how stone, wood or metal changes a form."
    },
    {
      "topic": "Book covers",
      "reason": "Discuss expectations without judging an entire story by its cover."
    },
    {
      "topic": "Exhibition design",
      "reason": "Plan a clear path between related objects."
    },
    {
      "topic": "Art conservation",
      "reason": "Ask how fragile work can be cared for."
    }
  ],
  "nature-environment": [
    {
      "topic": "Forest animals",
      "reason": "Connect named species with their habitat needs."
    },
    {
      "topic": "Coastal habitats",
      "reason": "Explore life where land and sea meet."
    },
    {
      "topic": "River life",
      "reason": "Follow relationships along a watercourse."
    },
    {
      "topic": "Pollinators",
      "reason": "Discover how small animals connect with plants."
    },
    {
      "topic": "Urban wildlife",
      "reason": "Notice animals sharing green spaces with people."
    },
    {
      "topic": "Mountain habitats",
      "reason": "Compare conditions at different heights."
    },
    {
      "topic": "Wetlands",
      "reason": "Explore why shallow water supports varied life."
    },
    {
      "topic": "Desert adaptations",
      "reason": "Explain a body feature without promising a sighting."
    },
    {
      "topic": "Seasonal changes",
      "reason": "Compare observations made at different times."
    },
    {
      "topic": "Native plants",
      "reason": "Discover species connected to a particular region."
    },
    {
      "topic": "Wildlife corridors",
      "reason": "Explore how animals move between habitats."
    },
    {
      "topic": "Nature reserves",
      "reason": "Ask what a protected place is trying to conserve."
    },
    {
      "topic": "Bird migration",
      "reason": "Distinguish a usual seasonal route from a live location."
    },
    {
      "topic": "Marine mammals",
      "reason": "Connect movement, food and coastal habitat."
    },
    {
      "topic": "Recycling systems",
      "reason": "Compare what a local scheme actually accepts."
    },
    {
      "topic": "Water use",
      "reason": "Explore where shared water supplies come from."
    },
    {
      "topic": "Soil life",
      "reason": "Discover organisms beneath an ordinary patch of ground."
    },
    {
      "topic": "Community gardens",
      "reason": "Connect plant care with a shared place."
    },
    {
      "topic": "Habitat restoration",
      "reason": "Ask what evidence would show improvement."
    },
    {
      "topic": "Trees in cities",
      "reason": "Explore shade, habitat and practical care."
    },
    {
      "topic": "Invasive species",
      "reason": "Discuss ecological effects without blaming groups of people."
    },
    {
      "topic": "Wildlife photography",
      "reason": "Plan ways to observe without disturbance."
    },
    {
      "topic": "Climate records",
      "reason": "Compare dated long-term evidence with one day's weather."
    },
    {
      "topic": "Citizen science",
      "reason": "Explore a clearly defined observation task."
    },
    {
      "topic": "Nature soundscapes",
      "reason": "Describe a habitat through the sounds it contains."
    }
  ],
  "money-business": [
    {
      "topic": "Local shops",
      "reason": "Explore how a business meets a nearby need."
    },
    {
      "topic": "Craft businesses",
      "reason": "Connect skill, materials and a product's value."
    },
    {
      "topic": "Markets",
      "reason": "Compare different ways sellers reach customers."
    },
    {
      "topic": "Transport jobs",
      "reason": "Discover work behind a passenger journey."
    },
    {
      "topic": "Museum shops",
      "reason": "Discuss choices about useful souvenirs."
    },
    {
      "topic": "Company histories",
      "reason": "Compare a business's early products with later ones."
    },
    {
      "topic": "Food stalls",
      "reason": "Plan clear information for a customer."
    },
    {
      "topic": "Repair businesses",
      "reason": "Explore value created by making things last."
    },
    {
      "topic": "Tourism services",
      "reason": "Ask what a guide or booking service provides."
    },
    {
      "topic": "Public and private services",
      "reason": "Compare purposes without assuming one is always better."
    },
    {
      "topic": "Product design",
      "reason": "Connect a customer's need with a proposed object."
    },
    {
      "topic": "Packaging costs",
      "reason": "Notice resources beyond the product itself."
    },
    {
      "topic": "Currencies",
      "reason": "Read units clearly without guessing exchange rates."
    },
    {
      "topic": "Dated prices",
      "reason": "Discuss why a quoted cost needs context."
    },
    {
      "topic": "Pretend budgets",
      "reason": "Allocate an imaginary sum without personal financial disclosure."
    },
    {
      "topic": "Supply chains",
      "reason": "Follow steps between making and buying."
    },
    {
      "topic": "Advertising",
      "reason": "Separate a claim from supporting evidence."
    },
    {
      "topic": "Customer service",
      "reason": "Practise a clear and respectful question."
    },
    {
      "topic": "Business locations",
      "reason": "Compare access, space and customer needs."
    },
    {
      "topic": "Digital shops",
      "reason": "Explore a buying process without making purchases."
    },
    {
      "topic": "Cooperatives",
      "reason": "Discover a different way people organise work."
    },
    {
      "topic": "Seasonal businesses",
      "reason": "Discuss how demand can change across a year."
    },
    {
      "topic": "Jobs in music",
      "reason": "Explore work behind a concert."
    },
    {
      "topic": "Business trade-offs",
      "reason": "Compare cost, time and quality in a neutral example."
    },
    {
      "topic": "Value and price",
      "reason": "Discuss why a useful object is not always the most expensive."
    }
  ],
  "games": [
    {
      "topic": "Traditional board games",
      "reason": "Compare a rule unfamiliar to visitors."
    },
    {
      "topic": "Video game settings",
      "reason": "Separate an imagined world from a real place."
    },
    {
      "topic": "Puzzle design",
      "reason": "Discuss what makes a challenge understandable."
    },
    {
      "topic": "Game controllers",
      "reason": "Connect a button with a player's action."
    },
    {
      "topic": "Cooperative games",
      "reason": "Explore shared goals without classroom pair work."
    },
    {
      "topic": "Strategy games",
      "reason": "Compare reasons for different moves."
    },
    {
      "topic": "Card games",
      "reason": "Describe rules without gambling or stakes."
    },
    {
      "topic": "Game museums",
      "reason": "Choose an object with a design story."
    },
    {
      "topic": "Playground traditions",
      "reason": "Learn how a familiar game varies by place."
    },
    {
      "topic": "Word games",
      "reason": "Explore playful ways to use language."
    },
    {
      "topic": "Maze games",
      "reason": "Describe routes and choices clearly."
    },
    {
      "topic": "Building games",
      "reason": "Compare open-ended making with fixed goals."
    },
    {
      "topic": "Racing games",
      "reason": "Discuss imagined tracks rather than risky real driving."
    },
    {
      "topic": "Game music",
      "reason": "Notice how sound signals a change."
    },
    {
      "topic": "Character design",
      "reason": "Discuss traits without copying copyrighted artwork."
    },
    {
      "topic": "Game maps",
      "reason": "Compare useful information and hidden areas."
    },
    {
      "topic": "Turn-taking",
      "reason": "Explore how rules give everyone a chance."
    },
    {
      "topic": "Difficulty settings",
      "reason": "Discuss ways to welcome beginners."
    },
    {
      "topic": "Game instructions",
      "reason": "Rewrite a confusing rule more clearly."
    },
    {
      "topic": "Historic toys",
      "reason": "Connect old objects with familiar play."
    },
    {
      "topic": "Tabletop pieces",
      "reason": "Explain how shape shows a piece's job."
    },
    {
      "topic": "Digital feedback",
      "reason": "Notice what a game tells a player after an action."
    },
    {
      "topic": "Fair rules",
      "reason": "Compare a challenging rule with an unfair one."
    },
    {
      "topic": "Game accessibility",
      "reason": "Explore control and display options for different players."
    },
    {
      "topic": "Design a tiny game",
      "reason": "Explain one goal, one action and one rule."
    }
  ],
  "travel": [
    {
      "topic": "Railway stations",
      "reason": "Practise questions about routes and signs."
    },
    {
      "topic": "Walking routes",
      "reason": "Choose clear, accessible stops for a visitor."
    },
    {
      "topic": "Local museums",
      "reason": "Connect a place with one object worth asking about."
    },
    {
      "topic": "City parks",
      "reason": "Build a quieter stop into an imagined journey."
    },
    {
      "topic": "Public markets",
      "reason": "Explore products without assuming a purchase."
    },
    {
      "topic": "Ferry journeys",
      "reason": "Compare a water route with a land route."
    },
    {
      "topic": "Cycle routes",
      "reason": "Discuss access and practical planning safely."
    },
    {
      "topic": "Historic centres",
      "reason": "Choose visible details rather than a long checklist."
    },
    {
      "topic": "Botanical gardens",
      "reason": "Follow a plant or habitat theme between stops."
    },
    {
      "topic": "Public transport maps",
      "reason": "Work out what information a visitor needs."
    },
    {
      "topic": "Food stops",
      "reason": "Plan ingredient questions before choosing a dish."
    },
    {
      "topic": "Local customs",
      "reason": "Check context rather than claiming everyone acts alike."
    },
    {
      "topic": "Accessible visits",
      "reason": "Compare information for visitors with different needs."
    },
    {
      "topic": "Travel vocabulary",
      "reason": "Practise useful requests for an unfamiliar place."
    },
    {
      "topic": "Museum tickets",
      "reason": "Check a dated source before describing access."
    },
    {
      "topic": "Scenic railways",
      "reason": "Connect a route with the places it passes."
    },
    {
      "topic": "Harbour walks",
      "reason": "Explore how a city meets the water."
    },
    {
      "topic": "Library visits",
      "reason": "Discover a public place beyond usual tourist sights."
    },
    {
      "topic": "Craft workshops",
      "reason": "Ask how a local object is made."
    },
    {
      "topic": "Visitor signs",
      "reason": "Compare wording and symbols that help people navigate."
    },
    {
      "topic": "Rainy-day plans",
      "reason": "Build an indoor alternative into an itinerary."
    },
    {
      "topic": "Two-stop itineraries",
      "reason": "Explain why two places work well together."
    },
    {
      "topic": "Neighbourhood stories",
      "reason": "Explore one area without stereotyping its residents."
    },
    {
      "topic": "Travel photography",
      "reason": "Choose a subject respectfully without copying protected artwork."
    },
    {
      "topic": "Responsible visits",
      "reason": "Discuss care for a place through practical choices."
    }
  ],
  "animals-kid": [
    {
      "topic": "Animal tails",
      "reason": "Describe shapes and what tails can do."
    },
    {
      "topic": "Bird beaks",
      "reason": "Notice different beaks in friendly photos."
    },
    {
      "topic": "Baby animals",
      "reason": "Compare a baby with an adult gently."
    },
    {
      "topic": "Animal homes",
      "reason": "Find safe places where animals live."
    },
    {
      "topic": "Forest animals",
      "reason": "Spot bodies suited to life among trees."
    },
    {
      "topic": "River animals",
      "reason": "Talk about swimming, food and water."
    },
    {
      "topic": "Animal feet",
      "reason": "Compare paws, hooves and webbed feet."
    },
    {
      "topic": "Animal colours",
      "reason": "Describe a clear colour or pattern."
    },
    {
      "topic": "Animal food",
      "reason": "Match a named animal with ordinary food."
    },
    {
      "topic": "Animal sounds",
      "reason": "Wonder how animals send messages."
    },
    {
      "topic": "Climbing animals",
      "reason": "Notice hands, feet and long arms."
    },
    {
      "topic": "Swimming animals",
      "reason": "Explore bodies that move through water."
    },
    {
      "topic": "Tiny animals",
      "reason": "Look closely at small friendly subjects."
    },
    {
      "topic": "Night animals",
      "reason": "Ask what helps an animal in the dark."
    },
    {
      "topic": "Animal shelters",
      "reason": "Choose what a safe animal home needs."
    }
  ],
  "space-kid": [
    {
      "topic": "The Moon",
      "reason": "Notice round shapes and surface marks."
    },
    {
      "topic": "Mars",
      "reason": "Describe the colour of a real space photo."
    },
    {
      "topic": "Saturn",
      "reason": "Look at a planet with bright rings."
    },
    {
      "topic": "Earth from space",
      "reason": "Find land, sea and clouds."
    },
    {
      "topic": "Space suits",
      "reason": "Ask what each visible part does."
    },
    {
      "topic": "Rocket shapes",
      "reason": "Compare pointed tops and broad bottoms."
    },
    {
      "topic": "Astronaut tools",
      "reason": "Choose an object to ask about."
    },
    {
      "topic": "Space food",
      "reason": "Wonder how a meal is packed."
    },
    {
      "topic": "Stars",
      "reason": "Notice tiny lights in a night-sky photo."
    },
    {
      "topic": "Telescopes",
      "reason": "Explore a tool for looking far away safely."
    },
    {
      "topic": "Space stations",
      "reason": "Imagine useful rooms for astronauts."
    },
    {
      "topic": "Moon rocks",
      "reason": "Compare real samples with ordinary stones."
    },
    {
      "topic": "Planet colours",
      "reason": "Use simple words for different worlds."
    },
    {
      "topic": "Space robots",
      "reason": "Explore machines that help researchers."
    },
    {
      "topic": "Space drawings",
      "reason": "Explain an imagined trip without calling it real."
    }
  ],
  "dinosaurs-kid": [
    {
      "topic": "Dinosaur tails",
      "reason": "Describe long and short model tails."
    },
    {
      "topic": "Fossil footprints",
      "reason": "Wonder what an old foot mark can show."
    },
    {
      "topic": "Dinosaur eggs",
      "reason": "Notice shapes in a museum photo."
    },
    {
      "topic": "Long necks",
      "reason": "Compare gentle pictures of long-necked dinosaurs."
    },
    {
      "topic": "Dinosaur models",
      "reason": "Tell a made model from a living animal."
    },
    {
      "topic": "Fossil leaves",
      "reason": "Find old plant shapes in rock."
    },
    {
      "topic": "Museum bones",
      "reason": "Point out one visible body part."
    },
    {
      "topic": "Tiny fossils",
      "reason": "Look closely at a small preserved shape."
    },
    {
      "topic": "Dinosaur names",
      "reason": "Choose one real name to say together."
    },
    {
      "topic": "Digging tools",
      "reason": "Ask what a scientist's tool does."
    },
    {
      "topic": "Rock layers",
      "reason": "Notice stripes in a safe rock photo."
    },
    {
      "topic": "Fossil shells",
      "reason": "Compare spirals and curved shapes."
    },
    {
      "topic": "Dinosaur feet",
      "reason": "Count toes on a clearly labelled model."
    },
    {
      "topic": "Museum questions",
      "reason": "Choose a gentle question for a fossil expert."
    },
    {
      "topic": "Prehistoric plants",
      "reason": "Explore leaves from very long ago."
    }
  ],
  "stories-kid": [
    {
      "topic": "Forest stories",
      "reason": "Choose a friendly setting for a tale."
    },
    {
      "topic": "Helpful characters",
      "reason": "Talk about one kind action in fiction."
    },
    {
      "topic": "Story puppets",
      "reason": "Give a simple line to a pretend character."
    },
    {
      "topic": "Fairy-tale houses",
      "reason": "Describe doors, roofs and windows."
    },
    {
      "topic": "Talking animals",
      "reason": "Mark make-believe and imagine a gentle voice."
    },
    {
      "topic": "Story beginnings",
      "reason": "Choose how a new tale opens."
    },
    {
      "topic": "Funny mistakes",
      "reason": "Explain a harmless mix-up in a story."
    },
    {
      "topic": "Magic objects",
      "reason": "Describe a pretend object's power as fiction."
    },
    {
      "topic": "Story journeys",
      "reason": "Pick a safe place for a character to visit."
    },
    {
      "topic": "Picture books",
      "reason": "Notice what a picture adds to a page."
    },
    {
      "topic": "Gentle dragons",
      "reason": "Imagine a friendly made-up creature."
    },
    {
      "topic": "Story gardens",
      "reason": "Choose colours and plants for a setting."
    },
    {
      "topic": "Lost-and-found tales",
      "reason": "Think of a kind way to return an object."
    },
    {
      "topic": "Story sounds",
      "reason": "Choose a gentle sound for a scene."
    },
    {
      "topic": "New endings",
      "reason": "Suggest another ending without spoilers for an unread tale."
    }
  ],
  "food-kid": [
    {
      "topic": "Fruit colours",
      "reason": "Describe bright real fruit photos."
    },
    {
      "topic": "Rice shapes",
      "reason": "Look at balls, grains and simple dishes."
    },
    {
      "topic": "Bread shapes",
      "reason": "Compare long, round and flat breads."
    },
    {
      "topic": "Noodle bowls",
      "reason": "Notice long noodles and colourful ingredients."
    },
    {
      "topic": "Soup spoons",
      "reason": "Choose a useful tool for a pretend meal."
    },
    {
      "topic": "Market fruit",
      "reason": "Pick a subject to ask a seller about."
    },
    {
      "topic": "Snack shapes",
      "reason": "Describe a circle, square or triangle."
    },
    {
      "topic": "Sweet and sour",
      "reason": "Use taste words without food dares."
    },
    {
      "topic": "Pretend picnics",
      "reason": "Choose a friendly imaginary menu."
    },
    {
      "topic": "Simple ingredients",
      "reason": "Notice what goes into a named snack."
    },
    {
      "topic": "Food textures",
      "reason": "Compare soft, smooth and crunchy words."
    },
    {
      "topic": "Fruit bowls",
      "reason": "Describe a mix of colours and shapes."
    },
    {
      "topic": "Bakery windows",
      "reason": "Look at real breads and cakes."
    },
    {
      "topic": "Sharing food",
      "reason": "Imagine ways to offer food politely."
    },
    {
      "topic": "Food questions",
      "reason": "Practise asking about ingredients before trying anything."
    }
  ],
  "sport-games-kid": [
    {
      "topic": "Playground balls",
      "reason": "Describe big, small and bouncing shapes."
    },
    {
      "topic": "Throwing games",
      "reason": "Explain an imagined safe action."
    },
    {
      "topic": "Rolling games",
      "reason": "Choose a simple target for a ball."
    },
    {
      "topic": "Skipping ropes",
      "reason": "Notice the shape and movement of a rope."
    },
    {
      "topic": "Wooden toys",
      "reason": "Explore a real toy's moving parts."
    },
    {
      "topic": "Simple board games",
      "reason": "Explain one turn in easy words."
    },
    {
      "topic": "Catch and pass",
      "reason": "Describe safe movements without pair work."
    },
    {
      "topic": "Playground shapes",
      "reason": "Find circles, lines and squares in photos."
    },
    {
      "topic": "Toy wheels",
      "reason": "Compare wheels on small model vehicles."
    },
    {
      "topic": "Gentle movement",
      "reason": "Choose ways different bodies can join in."
    },
    {
      "topic": "Game rules",
      "reason": "Make one kind rule for an imagined game."
    },
    {
      "topic": "Taking turns",
      "reason": "Explain how everyone gets time to speak."
    },
    {
      "topic": "Ball colours",
      "reason": "Notice shapes and colours in a sports photo."
    },
    {
      "topic": "Game equipment",
      "reason": "Name one useful piece of equipment."
    },
    {
      "topic": "Invent a toy",
      "reason": "Describe a safe pretend toy and its job."
    }
  ],
  "robots-kid": [
    {
      "topic": "Robot hands",
      "reason": "Ask what a gripping part can do."
    },
    {
      "topic": "Robot wheels",
      "reason": "Describe movement using round parts."
    },
    {
      "topic": "Helpful machines",
      "reason": "Choose an ordinary job for a machine."
    },
    {
      "topic": "Robot buttons",
      "reason": "Imagine one clear instruction for a button."
    },
    {
      "topic": "Toy robots",
      "reason": "Distinguish a toy from a working research robot."
    },
    {
      "topic": "Robot eyes",
      "reason": "Explore sensors without pretending machines see like people."
    },
    {
      "topic": "Walking robots",
      "reason": "Notice legs and balance in a real photo."
    },
    {
      "topic": "Train models",
      "reason": "Describe wheels, doors and tracks."
    },
    {
      "topic": "Robot lights",
      "reason": "Ask what a small light could signal."
    },
    {
      "topic": "Building blocks",
      "reason": "Plan a simple pretend machine."
    },
    {
      "topic": "Robot instructions",
      "reason": "Say actions in a clear order."
    },
    {
      "topic": "Museum machines",
      "reason": "Choose a real invention to ask about."
    },
    {
      "topic": "Moving arms",
      "reason": "Compare a straight arm with a bent one."
    },
    {
      "topic": "Robot helpers",
      "reason": "Imagine a useful, safe task."
    },
    {
      "topic": "Parts and whole",
      "reason": "Explain how one small part helps a machine."
    }
  ],
  "weather-nature-kid": [
    {
      "topic": "Rainy gardens",
      "reason": "Notice drops on leaves without scary weather."
    },
    {
      "topic": "Snow shapes",
      "reason": "Describe soft patterns in a calm photo."
    },
    {
      "topic": "Cloud pictures",
      "reason": "Imagine gentle shapes in ordinary clouds."
    },
    {
      "topic": "Rainbow colours",
      "reason": "Name colours in a real sky photo."
    },
    {
      "topic": "Autumn leaves",
      "reason": "Compare simple leaf colours and shapes."
    },
    {
      "topic": "Spring flowers",
      "reason": "Notice petals without claiming a current bloom date."
    },
    {
      "topic": "Garden ponds",
      "reason": "Spot plants and water in a calm scene."
    },
    {
      "topic": "Mountain shapes",
      "reason": "Describe peaks in a still landscape photo."
    },
    {
      "topic": "Smooth stones",
      "reason": "Compare ordinary rock surfaces."
    },
    {
      "topic": "Sunny parks",
      "reason": "Choose comfortable clothes for a pretend day."
    },
    {
      "topic": "Wind in trees",
      "reason": "Notice how leaves show moving air."
    },
    {
      "topic": "Seeds and plants",
      "reason": "Follow a simple plant-growing idea."
    },
    {
      "topic": "River bends",
      "reason": "Trace a gentle curve in a river photo."
    },
    {
      "topic": "Nature colours",
      "reason": "Find green, brown, blue and white outdoors."
    },
    {
      "topic": "Warm and cold",
      "reason": "Choose clothes for an imagined season."
    }
  ]
};
