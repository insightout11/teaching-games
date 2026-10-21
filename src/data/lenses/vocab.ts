import type { LensId } from './briefs';

/** Six speaking stems per lens/level; each word has a definition and a real-topic
 * example. Examples are questions, invitations or explicitly imagined choices,
 * not claims about a learner's experience. B1 retains the core terms and adds
 * fuller definitions and more demanding speaking stems. Kid levels have photos
 * as search strings only; no character artwork is copied or bundled.
 */
export type LensWord = { readonly word: string; readonly definition: string; readonly example: string; readonly picture?: string };
export type LensVocabularyLevel = { readonly words: readonly LensWord[]; readonly stems: readonly string[] };
export type LensVocabulary = { readonly A1: LensVocabularyLevel; readonly B1?: LensVocabularyLevel };

export const LENS_VOCABULARY: Readonly<Record<LensId, LensVocabulary>> = {
  "films": {
    "A1": {
      "words": [
        {
          "word": "film",
          "definition": "a story on a screen",
          "example": "Would you watch a film from Japan?"
        },
        {
          "word": "actor",
          "definition": "a person in a film",
          "example": "Name an actor in Paddington."
        },
        {
          "word": "director",
          "definition": "the person who leads a film",
          "example": "Who is the director of My Neighbour Totoro?"
        },
        {
          "word": "scene",
          "definition": "one part of a film",
          "example": "Describe a scene in Toy Story."
        },
        {
          "word": "story",
          "definition": "what happens in a book or film",
          "example": "Tell us about the story of Finding Nemo."
        },
        {
          "word": "character",
          "definition": "a person or animal in a story",
          "example": "Which character in Totoro would you meet?"
        },
        {
          "word": "camera",
          "definition": "a machine for taking pictures",
          "example": "Where would you put a camera in Kyoto?"
        },
        {
          "word": "sound",
          "definition": "something we can hear",
          "example": "What sound would you add to a Paddington scene?"
        },
        {
          "word": "music",
          "definition": "sounds played or sung",
          "example": "How would you describe the music in Frozen?"
        },
        {
          "word": "costume",
          "definition": "clothes for a story person",
          "example": "Design a costume for a Cinderella film."
        },
        {
          "word": "animation",
          "definition": "pictures made to look alive",
          "example": "Would you learn animation at Studio Ghibli?"
        },
        {
          "word": "studio",
          "definition": "a place where films are made",
          "example": "What would you ask at Aardman studio?"
        },
        {
          "word": "title",
          "definition": "the name of a film",
          "example": "What does the title Finding Nemo make you expect?"
        },
        {
          "word": "audience",
          "definition": "people who watch a show",
          "example": "Who is the audience for a Wallace and Gromit film?"
        },
        {
          "word": "subtitle",
          "definition": "words under a film picture",
          "example": "Would subtitles help you watch a Japanese film?"
        },
        {
          "word": "ending",
          "definition": "the last part of a story",
          "example": "Can you discuss Totoro without giving away its ending?"
        }
      ],
      "stems": [
        "My favourite scene is…",
        "The character I like is…",
        "This film makes me feel…",
        "I would watch it with…",
        "The sound I notice is…",
        "I want to ask the director…"
      ]
    },
    "B1": {
      "words": [
        {
          "word": "film",
          "definition": "a recorded story told with moving images",
          "example": "Would you watch a film from Japan?"
        },
        {
          "word": "actor",
          "definition": "a performer who plays a role on screen",
          "example": "Name an actor in Paddington."
        },
        {
          "word": "director",
          "definition": "the person guiding a film's performances and visual choices",
          "example": "Who is the director of My Neighbour Totoro?"
        },
        {
          "word": "scene",
          "definition": "a section of a film in one time or setting",
          "example": "Describe a scene in Toy Story."
        },
        {
          "word": "story",
          "definition": "the connected events that an audience follows",
          "example": "Tell us about the story of Finding Nemo."
        },
        {
          "word": "character",
          "definition": "a fictional figure whose actions shape a story",
          "example": "Which character in Totoro would you meet?"
        },
        {
          "word": "camera",
          "definition": "equipment used to record the images in a film",
          "example": "Where would you put a camera in Kyoto?"
        },
        {
          "word": "sound",
          "definition": "the voices, effects and other audio accompanying images",
          "example": "What sound would you add to a Paddington scene?"
        },
        {
          "word": "music",
          "definition": "organised sound used to support a film's mood",
          "example": "How would you describe the music in Frozen?"
        },
        {
          "word": "costume",
          "definition": "clothing chosen to show a character's role or period",
          "example": "Design a costume for a Cinderella film."
        },
        {
          "word": "animation",
          "definition": "the process of creating the appearance of movement from images",
          "example": "Would you learn animation at Studio Ghibli?"
        },
        {
          "word": "studio",
          "definition": "a production company or a controlled place for filming",
          "example": "What would you ask at Aardman studio?"
        },
        {
          "word": "title",
          "definition": "the name identifying a screen work",
          "example": "What does the title Finding Nemo make you expect?"
        },
        {
          "word": "audience",
          "definition": "the people a performance or film is made for",
          "example": "Who is the audience for a Wallace and Gromit film?"
        },
        {
          "word": "subtitle",
          "definition": "written translations or captions displayed with screen dialogue",
          "example": "Would subtitles help you watch a Japanese film?"
        },
        {
          "word": "ending",
          "definition": "the final section that resolves or leaves open the story",
          "example": "Can you discuss Totoro without giving away its ending?"
        }
      ],
      "stems": [
        "A scene that stayed with me is…",
        "The director creates a mood by…",
        "I understand this character because…",
        "The sound changes the scene when…",
        "I would recommend this film to…",
        "Without giving away the ending, I think…"
      ]
    }
  },
  "music": {
    "A1": {
      "words": [
        {
          "word": "song",
          "definition": "words with music",
          "example": "Which ABBA song would you discuss?"
        },
        {
          "word": "singer",
          "definition": "a person who sings",
          "example": "What would you ask singer Angélique Kidjo?"
        },
        {
          "word": "band",
          "definition": "people who play music together",
          "example": "Would you see the Beatles in a music museum?"
        },
        {
          "word": "instrument",
          "definition": "a thing used to make music",
          "example": "Which Japanese instrument would you try?"
        },
        {
          "word": "beat",
          "definition": "the steady push in music",
          "example": "Can you tap the beat of a samba?"
        },
        {
          "word": "rhythm",
          "definition": "a pattern of sounds",
          "example": "Describe a rhythm from flamenco."
        },
        {
          "word": "melody",
          "definition": "the tune in music",
          "example": "Could you hum a melody from The Nutcracker?"
        },
        {
          "word": "voice",
          "definition": "the sound a person makes",
          "example": "Describe the voice you hear in a fado song."
        },
        {
          "word": "concert",
          "definition": "a show with live music",
          "example": "What would you take to a concert in London?"
        },
        {
          "word": "stage",
          "definition": "the place for a show",
          "example": "Design a stage for a jazz concert in Paris."
        },
        {
          "word": "drum",
          "definition": "an instrument we hit",
          "example": "Would you try a Japanese taiko drum?"
        },
        {
          "word": "string",
          "definition": "a thin part of some instruments",
          "example": "Find a string on a shamisen."
        },
        {
          "word": "piano",
          "definition": "an instrument with black and white keys",
          "example": "Which piano piece by Chopin would you explore?"
        },
        {
          "word": "lyric",
          "definition": "a line of words in a song",
          "example": "What can a lyric in a folk song describe?"
        },
        {
          "word": "chorus",
          "definition": "a song part that comes back",
          "example": "How could a chorus help you learn an ABBA song?"
        },
        {
          "word": "recording",
          "definition": "sound we can play again",
          "example": "Would you compare two recordings of a Mozart piece?"
        }
      ],
      "stems": [
        "This music sounds…",
        "The instrument I hear is…",
        "I can follow the beat by…",
        "This song makes me think of…",
        "I would play it when…",
        "I want to hear more…"
      ]
    },
    "B1": {
      "words": [
        {
          "word": "song",
          "definition": "a piece of music intended to be sung",
          "example": "Which ABBA song would you discuss?"
        },
        {
          "word": "singer",
          "definition": "a performer who makes music with their voice",
          "example": "What would you ask singer Angélique Kidjo?"
        },
        {
          "word": "band",
          "definition": "a group of musicians performing as one act",
          "example": "Would you see the Beatles in a music museum?"
        },
        {
          "word": "instrument",
          "definition": "an object designed for musical performance",
          "example": "Which Japanese instrument would you try?"
        },
        {
          "word": "beat",
          "definition": "the regular pulse listeners can follow",
          "example": "Can you tap the beat of a samba?"
        },
        {
          "word": "rhythm",
          "definition": "the arrangement of sound lengths and stresses",
          "example": "Describe a rhythm from flamenco."
        },
        {
          "word": "melody",
          "definition": "a recognisable sequence of musical notes",
          "example": "Could you hum a melody from The Nutcracker?"
        },
        {
          "word": "voice",
          "definition": "the sound produced when someone speaks or sings",
          "example": "Describe the voice you hear in a fado song."
        },
        {
          "word": "concert",
          "definition": "a public performance of music",
          "example": "What would you take to a concert in London?"
        },
        {
          "word": "stage",
          "definition": "the area where musicians perform for listeners",
          "example": "Design a stage for a jazz concert in Paris."
        },
        {
          "word": "drum",
          "definition": "a percussion instrument with a vibrating surface",
          "example": "Would you try a Japanese taiko drum?"
        },
        {
          "word": "string",
          "definition": "a stretched cord that vibrates to produce musical sound",
          "example": "Find a string on a shamisen."
        },
        {
          "word": "piano",
          "definition": "a keyboard instrument whose hammers strike strings",
          "example": "Which piano piece by Chopin would you explore?"
        },
        {
          "word": "lyric",
          "definition": "the words written to be sung in a song",
          "example": "What can a lyric in a folk song describe?"
        },
        {
          "word": "chorus",
          "definition": "a repeated section often carrying a song's central idea",
          "example": "How could a chorus help you learn an ABBA song?"
        },
        {
          "word": "recording",
          "definition": "a stored version of a performance",
          "example": "Would you compare two recordings of a Mozart piece?"
        }
      ],
      "stems": [
        "The rhythm stands out because…",
        "The singer uses their voice to…",
        "Compared with the recording, the live version…",
        "This instrument changes the mood by…",
        "The chorus is memorable because…",
        "I would introduce this music by…"
      ]
    }
  },
  "sport": {
    "A1": {
      "words": [
        {
          "word": "team",
          "definition": "people who play together",
          "example": "What makes a good Brazil football team?"
        },
        {
          "word": "player",
          "definition": "a person in a game",
          "example": "What would you ask a player from Ajax?"
        },
        {
          "word": "coach",
          "definition": "a person who helps players learn",
          "example": "What could an India cricket coach teach first?"
        },
        {
          "word": "rule",
          "definition": "something players must follow",
          "example": "Explain one rule of sumo."
        },
        {
          "word": "goal",
          "definition": "a point in some games",
          "example": "How would you celebrate a goal at Wembley?"
        },
        {
          "word": "score",
          "definition": "the number of points",
          "example": "Where would you show the score at a tennis match?"
        },
        {
          "word": "match",
          "definition": "a game between players or teams",
          "example": "Would you watch an Argentina football match?"
        },
        {
          "word": "race",
          "definition": "a game to see who is fastest",
          "example": "How would you prepare for a race in Berlin?"
        },
        {
          "word": "stadium",
          "definition": "a large place for sport",
          "example": "What would you notice at the Maracanã stadium?"
        },
        {
          "word": "fan",
          "definition": "a person who likes a team",
          "example": "What could an Ajax fan explain to a visitor?"
        },
        {
          "word": "practice",
          "definition": "doing something to get better",
          "example": "How could you practice a cricket catch?"
        },
        {
          "word": "skill",
          "definition": "something we learn to do well",
          "example": "Which skill matters in table tennis?"
        },
        {
          "word": "referee",
          "definition": "a person who checks the rules",
          "example": "What would a football referee need to see?"
        },
        {
          "word": "medal",
          "definition": "a small prize worn on a ribbon",
          "example": "Design a medal for a school race in Tokyo."
        },
        {
          "word": "draw",
          "definition": "a game that neither side wins",
          "example": "How might fans react to a draw in football?"
        },
        {
          "word": "training",
          "definition": "work to get ready for sport",
          "example": "What belongs in a Kenyan runner's training diary?"
        }
      ],
      "stems": [
        "The rule I know is…",
        "This player needs to…",
        "I would try this sport because…",
        "A good team can…",
        "The skill I would learn is…",
        "I would cheer when…"
      ]
    },
    "B1": {
      "words": [
        {
          "word": "team",
          "definition": "a group working together in a sport",
          "example": "What makes a good Brazil football team?"
        },
        {
          "word": "player",
          "definition": "someone taking part in a sporting contest",
          "example": "What would you ask a player from Ajax?"
        },
        {
          "word": "coach",
          "definition": "someone responsible for training and guiding a team",
          "example": "What could an India cricket coach teach first?"
        },
        {
          "word": "rule",
          "definition": "an agreed instruction controlling how a sport is played",
          "example": "Explain one rule of sumo."
        },
        {
          "word": "goal",
          "definition": "a score made by sending a ball into the target",
          "example": "How would you celebrate a goal at Wembley?"
        },
        {
          "word": "score",
          "definition": "the recorded points gained during a contest",
          "example": "Where would you show the score at a tennis match?"
        },
        {
          "word": "match",
          "definition": "an organised sporting contest",
          "example": "Would you watch an Argentina football match?"
        },
        {
          "word": "race",
          "definition": "a competition to cover a distance in the least time",
          "example": "How would you prepare for a race in Berlin?"
        },
        {
          "word": "stadium",
          "definition": "a venue with a playing area and spectator seating",
          "example": "What would you notice at the Maracanã stadium?"
        },
        {
          "word": "fan",
          "definition": "a supporter who follows a sport or competitor",
          "example": "What could an Ajax fan explain to a visitor?"
        },
        {
          "word": "practice",
          "definition": "repeated training intended to improve a skill",
          "example": "How could you practice a cricket catch?"
        },
        {
          "word": "skill",
          "definition": "an ability developed through training and experience",
          "example": "Which skill matters in table tennis?"
        },
        {
          "word": "referee",
          "definition": "an official who applies the rules during play",
          "example": "What would a football referee need to see?"
        },
        {
          "word": "medal",
          "definition": "an award recognising a sporting achievement",
          "example": "Design a medal for a school race in Tokyo."
        },
        {
          "word": "draw",
          "definition": "a result in which neither side wins, distinct from a tie in cricket",
          "example": "How might fans react to a draw in football?"
        },
        {
          "word": "training",
          "definition": "planned exercise and practice to develop performance",
          "example": "What belongs in a Kenyan runner's training diary?"
        }
      ],
      "stems": [
        "One rule that changes the game is…",
        "A useful coaching decision would be…",
        "The team could improve by…",
        "A fair result depends on…",
        "This athlete's skill matters because…",
        "I would explain this sport to a visitor by…"
      ]
    }
  },
  "food": {
    "A1": {
      "words": [
        {
          "word": "dish",
          "definition": "food made in a special way",
          "example": "Would you try the Vietnamese dish pho?"
        },
        {
          "word": "ingredient",
          "definition": "one food used to make a dish",
          "example": "Name an ingredient you would look for in sushi."
        },
        {
          "word": "recipe",
          "definition": "words that tell us how to cook",
          "example": "What would you ask before following a dosa recipe?"
        },
        {
          "word": "flavour",
          "definition": "how food tastes",
          "example": "Describe a flavour you might notice in pesto."
        },
        {
          "word": "sweet",
          "definition": "like sugar",
          "example": "Would you choose a sweet stroopwafel?"
        },
        {
          "word": "sour",
          "definition": "like a lemon",
          "example": "What sour ingredient could go with tacos?"
        },
        {
          "word": "spice",
          "definition": "a plant part used for taste",
          "example": "Which spice would you explore in an Indian market?"
        },
        {
          "word": "herb",
          "definition": "a leaf used for taste",
          "example": "Which herb would you add to a bowl of pho?"
        },
        {
          "word": "dough",
          "definition": "flour mixed into soft food",
          "example": "How would you shape dough for Italian pasta?"
        },
        {
          "word": "rice",
          "definition": "small grains we cook and eat",
          "example": "How is rice used in onigiri?"
        },
        {
          "word": "steam",
          "definition": "cook with hot water in the air",
          "example": "Would you steam a Chinese dumpling?"
        },
        {
          "word": "roast",
          "definition": "cook with hot dry air",
          "example": "What would you roast for a meal in Britain?"
        },
        {
          "word": "market",
          "definition": "a place to buy and sell",
          "example": "What would you look for at a market in Mexico City?"
        },
        {
          "word": "portion",
          "definition": "food for one person",
          "example": "How would you choose a portion of paella?"
        },
        {
          "word": "share",
          "definition": "let others have some",
          "example": "Which Turkish dish would you share with the class?"
        },
        {
          "word": "menu",
          "definition": "a list of food to choose",
          "example": "What would you add to a menu in Paris?"
        }
      ],
      "stems": [
        "This dish has…",
        "I think it tastes…",
        "An ingredient I know is…",
        "I would try it with…",
        "Before eating, I would ask…",
        "This food reminds me of…"
      ]
    },
    "B1": {
      "words": [
        {
          "word": "dish",
          "definition": "a prepared food with its own recipe or identity",
          "example": "Would you try the Vietnamese dish pho?"
        },
        {
          "word": "ingredient",
          "definition": "a component combined with others during cooking",
          "example": "Name an ingredient you would look for in sushi."
        },
        {
          "word": "recipe",
          "definition": "instructions explaining ingredients and preparation",
          "example": "What would you ask before following a dosa recipe?"
        },
        {
          "word": "flavour",
          "definition": "the combined taste and smell of a food",
          "example": "Describe a flavour you might notice in pesto."
        },
        {
          "word": "sweet",
          "definition": "having a sugar-like taste",
          "example": "Would you choose a sweet stroopwafel?"
        },
        {
          "word": "sour",
          "definition": "having a sharp acidic taste",
          "example": "What sour ingredient could go with tacos?"
        },
        {
          "word": "spice",
          "definition": "a dried plant substance used to season food",
          "example": "Which spice would you explore in an Indian market?"
        },
        {
          "word": "herb",
          "definition": "a plant whose leaves season or garnish food",
          "example": "Which herb would you add to a bowl of pho?"
        },
        {
          "word": "dough",
          "definition": "a flour mixture shaped before cooking",
          "example": "How would you shape dough for Italian pasta?"
        },
        {
          "word": "rice",
          "definition": "a cereal grain prepared in many different dishes",
          "example": "How is rice used in onigiri?"
        },
        {
          "word": "steam",
          "definition": "cook using water vapour rather than direct immersion",
          "example": "Would you steam a Chinese dumpling?"
        },
        {
          "word": "roast",
          "definition": "cook using dry heat in an oven or near a fire",
          "example": "What would you roast for a meal in Britain?"
        },
        {
          "word": "market",
          "definition": "a place where sellers offer ingredients or prepared food",
          "example": "What would you look for at a market in Mexico City?"
        },
        {
          "word": "portion",
          "definition": "the amount served as one helping",
          "example": "How would you choose a portion of paella?"
        },
        {
          "word": "share",
          "definition": "divide food or an eating experience with other people",
          "example": "Which Turkish dish would you share with the class?"
        },
        {
          "word": "menu",
          "definition": "a list of dishes offered at a meal or restaurant",
          "example": "What would you add to a menu in Paris?"
        }
      ],
      "stems": [
        "The ingredient that changes the flavour is…",
        "One regional variation might be…",
        "I would describe the texture as…",
        "A visitor might need to ask about…",
        "This dish would suit a shared meal because…",
        "Rather than guessing its origin, I would check…"
      ]
    }
  },
  "news": {
    "A1": {
      "words": [
        {
          "word": "report",
          "definition": "a story with information",
          "example": "What date is on this Japan science report?"
        },
        {
          "word": "source",
          "definition": "where information comes from",
          "example": "Which source would you check for JAXA news?"
        },
        {
          "word": "date",
          "definition": "the day something happens",
          "example": "Why show the date of a Hayabusa2 report?"
        },
        {
          "word": "fact",
          "definition": "something true that we can check",
          "example": "Which fact could you check on the JAXA website?"
        },
        {
          "word": "opinion",
          "definition": "what someone thinks",
          "example": "Is this comment about the Olympics an opinion?"
        },
        {
          "word": "headline",
          "definition": "the name at the top of news",
          "example": "Write a calm headline for a Tokyo museum report."
        },
        {
          "word": "event",
          "definition": "something that happens",
          "example": "What source could confirm a Kyoto festival event?"
        },
        {
          "word": "interview",
          "definition": "questions asked to learn more",
          "example": "What would you ask in an interview about a London museum?"
        },
        {
          "word": "quote",
          "definition": "someone's exact words",
          "example": "How would you check a quote from a JAXA researcher?"
        },
        {
          "word": "evidence",
          "definition": "things that show what is true",
          "example": "What evidence supports the Ryugu sample story?"
        },
        {
          "word": "update",
          "definition": "new information",
          "example": "Does this Paris transport update have a date?"
        },
        {
          "word": "context",
          "definition": "facts around a story",
          "example": "What context would a reader need for an Olympics story?"
        },
        {
          "word": "viewpoint",
          "definition": "a way of seeing a topic",
          "example": "What other viewpoint could a museum story include?"
        },
        {
          "word": "check",
          "definition": "look to see if it is right",
          "example": "How would you check a photo labelled Tokyo?"
        },
        {
          "word": "uncertain",
          "definition": "not yet known for sure",
          "example": "What is still uncertain in this space report?"
        },
        {
          "word": "correction",
          "definition": "a change to make something right",
          "example": "How should a report correct a wrong Japan date?"
        }
      ],
      "stems": [
        "The source is…",
        "The report was written on…",
        "One fact I can check is…",
        "This opinion says…",
        "Another view is…",
        "We do not yet know…"
      ]
    },
    "B1": {
      "words": [
        {
          "word": "report",
          "definition": "an account of an event based on gathered information",
          "example": "What date is on this Japan science report?"
        },
        {
          "word": "source",
          "definition": "a person, document or organisation providing evidence",
          "example": "Which source would you check for JAXA news?"
        },
        {
          "word": "date",
          "definition": "the calendar reference showing when an event or report occurred",
          "example": "Why show the date of a Hayabusa2 report?"
        },
        {
          "word": "fact",
          "definition": "a statement supported by verifiable evidence",
          "example": "Which fact could you check on the JAXA website?"
        },
        {
          "word": "opinion",
          "definition": "a judgement or belief rather than a directly verifiable fact",
          "example": "Is this comment about the Olympics an opinion?"
        },
        {
          "word": "headline",
          "definition": "a short title summarising a news report",
          "example": "Write a calm headline for a Tokyo museum report."
        },
        {
          "word": "event",
          "definition": "an occurrence that may become the subject of reporting",
          "example": "What source could confirm a Kyoto festival event?"
        },
        {
          "word": "interview",
          "definition": "a planned conversation used to gather information or views",
          "example": "What would you ask in an interview about a London museum?"
        },
        {
          "word": "quote",
          "definition": "a word-for-word statement attributed to a speaker",
          "example": "How would you check a quote from a JAXA researcher?"
        },
        {
          "word": "evidence",
          "definition": "information used to support or challenge a claim",
          "example": "What evidence supports the Ryugu sample story?"
        },
        {
          "word": "update",
          "definition": "a later report adding to or correcting earlier information",
          "example": "Does this Paris transport update have a date?"
        },
        {
          "word": "context",
          "definition": "background needed to understand an event fairly",
          "example": "What context would a reader need for an Olympics story?"
        },
        {
          "word": "viewpoint",
          "definition": "a perspective shaped by experience or interests",
          "example": "What other viewpoint could a museum story include?"
        },
        {
          "word": "check",
          "definition": "verify a claim using reliable evidence",
          "example": "How would you check a photo labelled Tokyo?"
        },
        {
          "word": "uncertain",
          "definition": "not established with enough reliable evidence",
          "example": "What is still uncertain in this space report?"
        },
        {
          "word": "correction",
          "definition": "a published change fixing an earlier reporting error",
          "example": "How should a report correct a wrong Japan date?"
        }
      ],
      "stems": [
        "The source supports the claim by…",
        "The date matters because…",
        "A viewpoint missing from this report is…",
        "The evidence does not yet show…",
        "To separate fact from opinion, I would…",
        "A fair correction would explain…"
      ]
    }
  },
  "politics": {
    "A1": {
      "words": [
        {
          "word": "law",
          "definition": "a rule for a place",
          "example": "Where could you read a law made in Japan?"
        },
        {
          "word": "vote",
          "definition": "choose by saying what you want",
          "example": "How could a class vote about a Japan topic?"
        },
        {
          "word": "government",
          "definition": "people who run a country",
          "example": "What question would you ask about Japan's government?"
        },
        {
          "word": "parliament",
          "definition": "a group that talks about laws",
          "example": "What could you find out about Japan's parliament?"
        },
        {
          "word": "citizen",
          "definition": "a member of a country",
          "example": "What might a citizen ask about a new park in Tokyo?"
        },
        {
          "word": "community",
          "definition": "people who share a place",
          "example": "How could a Kyoto community discuss a local path?"
        },
        {
          "word": "public",
          "definition": "for people in a community",
          "example": "What public place would you explore in London?"
        },
        {
          "word": "service",
          "definition": "help given to people",
          "example": "Which service could help visitors in Tokyo?"
        },
        {
          "word": "budget",
          "definition": "a plan for using money",
          "example": "What could a school budget include in Japan?"
        },
        {
          "word": "policy",
          "definition": "a plan for what to do",
          "example": "What would you ask about a museum's access policy?"
        },
        {
          "word": "debate",
          "definition": "talk with different views",
          "example": "How could a class debate a new park in Paris?"
        },
        {
          "word": "right",
          "definition": "something a person may have or do",
          "example": "Where could you check information about rights in Japan?"
        },
        {
          "word": "responsibility",
          "definition": "something we should take care of",
          "example": "What responsibility might a London park visitor have?"
        },
        {
          "word": "representative",
          "definition": "a person who speaks for others",
          "example": "What could a class representative ask a Tokyo museum?"
        },
        {
          "word": "election",
          "definition": "a time when people choose leaders",
          "example": "Which dated source explains an election system in Japan?"
        },
        {
          "word": "viewpoint",
          "definition": "one way to think about something",
          "example": "What viewpoints could a Kyoto transport discussion include?"
        }
      ],
      "stems": [
        "One public service is…",
        "A rule could help by…",
        "A different view is…",
        "The evidence I would check is…",
        "A question for a representative is…",
        "We can listen fairly by…"
      ]
    },
    "B1": {
      "words": [
        {
          "word": "law",
          "definition": "a rule formally adopted and enforced by public institutions",
          "example": "Where could you read a law made in Japan?"
        },
        {
          "word": "vote",
          "definition": "express a choice in an election or formal decision",
          "example": "How could a class vote about a Japan topic?"
        },
        {
          "word": "government",
          "definition": "the institutions responsible for public decisions and administration",
          "example": "What question would you ask about Japan's government?"
        },
        {
          "word": "parliament",
          "definition": "an elected or appointed body that debates and makes legislation",
          "example": "What could you find out about Japan's parliament?"
        },
        {
          "word": "citizen",
          "definition": "a person with a recognised legal membership of a state",
          "example": "What might a citizen ask about a new park in Tokyo?"
        },
        {
          "word": "community",
          "definition": "a group linked by location, interests or common life",
          "example": "How could a Kyoto community discuss a local path?"
        },
        {
          "word": "public",
          "definition": "relating to shared services or government responsibility",
          "example": "What public place would you explore in London?"
        },
        {
          "word": "service",
          "definition": "an organised activity meeting a public or private need",
          "example": "Which service could help visitors in Tokyo?"
        },
        {
          "word": "budget",
          "definition": "a plan allocating resources between different purposes",
          "example": "What could a school budget include in Japan?"
        },
        {
          "word": "policy",
          "definition": "an agreed approach guiding decisions and action",
          "example": "What would you ask about a museum's access policy?"
        },
        {
          "word": "debate",
          "definition": "a structured discussion comparing reasons for different positions",
          "example": "How could a class debate a new park in Paris?"
        },
        {
          "word": "right",
          "definition": "a protected entitlement recognised by law or principles",
          "example": "Where could you check information about rights in Japan?"
        },
        {
          "word": "responsibility",
          "definition": "a duty attached to a role or shared decision",
          "example": "What responsibility might a London park visitor have?"
        },
        {
          "word": "representative",
          "definition": "someone chosen to act or speak on behalf of a group",
          "example": "What could a class representative ask a Tokyo museum?"
        },
        {
          "word": "election",
          "definition": "a formal process selecting people for public roles",
          "example": "Which dated source explains an election system in Japan?"
        },
        {
          "word": "viewpoint",
          "definition": "a perspective that can be compared with others fairly",
          "example": "What viewpoints could a Kyoto transport discussion include?"
        }
      ],
      "stems": [
        "One reason supporting this policy is…",
        "A different viewpoint would emphasise…",
        "The public trade-off seems to be…",
        "Before judging the proposal, I would check…",
        "A representative could explain…",
        "We can disagree respectfully by…"
      ]
    }
  },
  "science-tech": {
    "A1": {
      "words": [
        {
          "word": "science",
          "definition": "learning how things work",
          "example": "What science question could you ask about Mount Fuji?"
        },
        {
          "word": "machine",
          "definition": "a thing that helps us do work",
          "example": "Which machine would you explore at JAXA?"
        },
        {
          "word": "invent",
          "definition": "make something new",
          "example": "What would you invent for a journey to Kyoto?"
        },
        {
          "word": "test",
          "definition": "try to find something out",
          "example": "What safe test could compare paper bridges in Tokyo?"
        },
        {
          "word": "result",
          "definition": "what a test shows",
          "example": "How would you record a Ryugu sample result?"
        },
        {
          "word": "energy",
          "definition": "what lets things work or move",
          "example": "Where does a Tokyo train get its energy?"
        },
        {
          "word": "material",
          "definition": "what a thing is made from",
          "example": "What material would you study in a Japanese paper fan?"
        },
        {
          "word": "design",
          "definition": "a plan for making something",
          "example": "How would you improve a Shinkansen seat design?"
        },
        {
          "word": "robot",
          "definition": "a machine that follows instructions",
          "example": "What task would you give ASIMO?"
        },
        {
          "word": "planet",
          "definition": "a large world in space",
          "example": "Which planet would you study at a Tokyo planetarium?"
        },
        {
          "word": "sample",
          "definition": "a small part used to learn more",
          "example": "Why study a sample from Ryugu?"
        },
        {
          "word": "measure",
          "definition": "find how big or how much",
          "example": "How could you measure a paper bridge in Kyoto?"
        },
        {
          "word": "data",
          "definition": "facts saved for study",
          "example": "What data might a JAXA team compare?"
        },
        {
          "word": "method",
          "definition": "a way to do something",
          "example": "Why explain the method in a Ryugu study?"
        },
        {
          "word": "evidence",
          "definition": "facts that support an idea",
          "example": "What evidence would show that a robot can climb stairs?"
        },
        {
          "word": "model",
          "definition": "a small or simple copy",
          "example": "Could a model help explain Mount Fuji?"
        }
      ],
      "stems": [
        "The machine can…",
        "This part helps it…",
        "I would test…",
        "The material feels…",
        "One result could be…",
        "My question about this is…"
      ]
    },
    "B1": {
      "words": [
        {
          "word": "science",
          "definition": "the systematic study of the natural world using evidence",
          "example": "What science question could you ask about Mount Fuji?"
        },
        {
          "word": "machine",
          "definition": "a device using energy or moving parts to perform a task",
          "example": "Which machine would you explore at JAXA?"
        },
        {
          "word": "invent",
          "definition": "create a new device, method or process",
          "example": "What would you invent for a journey to Kyoto?"
        },
        {
          "word": "test",
          "definition": "a procedure used to check a question or prediction",
          "example": "What safe test could compare paper bridges in Tokyo?"
        },
        {
          "word": "result",
          "definition": "an observation or measurement produced by an investigation",
          "example": "How would you record a Ryugu sample result?"
        },
        {
          "word": "energy",
          "definition": "the capacity to produce change or do work",
          "example": "Where does a Tokyo train get its energy?"
        },
        {
          "word": "material",
          "definition": "a substance selected for particular physical properties",
          "example": "What material would you study in a Japanese paper fan?"
        },
        {
          "word": "design",
          "definition": "a planned arrangement intended to solve a problem",
          "example": "How would you improve a Shinkansen seat design?"
        },
        {
          "word": "robot",
          "definition": "a programmable machine performing tasks in the physical world",
          "example": "What task would you give ASIMO?"
        },
        {
          "word": "planet",
          "definition": "a large body orbiting a star that meets a scientific definition",
          "example": "Which planet would you study at a Tokyo planetarium?"
        },
        {
          "word": "sample",
          "definition": "a selected portion examined to understand a larger subject",
          "example": "Why study a sample from Ryugu?"
        },
        {
          "word": "measure",
          "definition": "determine a quantity using an agreed method or unit",
          "example": "How could you measure a paper bridge in Kyoto?"
        },
        {
          "word": "data",
          "definition": "recorded observations or measurements used in analysis",
          "example": "What data might a JAXA team compare?"
        },
        {
          "word": "method",
          "definition": "a documented procedure for carrying out an investigation",
          "example": "Why explain the method in a Ryugu study?"
        },
        {
          "word": "evidence",
          "definition": "observations that support or challenge an explanation",
          "example": "What evidence would show that a robot can climb stairs?"
        },
        {
          "word": "model",
          "definition": "a simplified representation used to explain or test a system",
          "example": "Could a model help explain Mount Fuji?"
        }
      ],
      "stems": [
        "The evidence supports the idea that…",
        "A fair test would keep…",
        "One limitation of this model is…",
        "The design solves the problem by…",
        "I would measure the result using…",
        "Before accepting the claim, I would check…"
      ]
    }
  },
  "history": {
    "A1": {
      "words": [
        {
          "word": "past",
          "definition": "the time before now",
          "example": "What would you explore in Kyoto's past?"
        },
        {
          "word": "date",
          "definition": "the day or year of an event",
          "example": "Why add a date to a Kyoto history card?"
        },
        {
          "word": "century",
          "definition": "one hundred years",
          "example": "Which century would you explore in a Japan museum?"
        },
        {
          "word": "object",
          "definition": "a thing we can see or touch",
          "example": "What object would you study in the British Museum?"
        },
        {
          "word": "museum",
          "definition": "a place that keeps important things",
          "example": "What question would you ask in a Tokyo museum?"
        },
        {
          "word": "record",
          "definition": "information kept from the past",
          "example": "What could an old Kyoto travel record tell us?"
        },
        {
          "word": "source",
          "definition": "where we learn something",
          "example": "Which source could help explain old Amsterdam?"
        },
        {
          "word": "change",
          "definition": "become different",
          "example": "What change would you look for in photos of Tokyo?"
        },
        {
          "word": "tradition",
          "definition": "something people keep doing",
          "example": "Which Japanese craft tradition would you explore?"
        },
        {
          "word": "journey",
          "definition": "travel from one place to another",
          "example": "What would you ask about an old Silk Road journey?"
        },
        {
          "word": "archive",
          "definition": "a place for old records",
          "example": "What might a London archive help you discover?"
        },
        {
          "word": "evidence",
          "definition": "things that help us check a story",
          "example": "What evidence could date an object from Kyoto?"
        },
        {
          "word": "timeline",
          "definition": "events shown in time order",
          "example": "What belongs on a timeline of Nintendo?"
        },
        {
          "word": "period",
          "definition": "a part of history",
          "example": "What would you ask about Japan's Edo period?"
        },
        {
          "word": "interpretation",
          "definition": "a way to explain a story",
          "example": "Could two museums offer a different interpretation of an object?"
        },
        {
          "word": "preserve",
          "definition": "keep something safe",
          "example": "How could a museum preserve old Japanese paper?"
        }
      ],
      "stems": [
        "Long ago, people…",
        "This object tells me…",
        "One thing that changed is…",
        "I would ask someone from the past…",
        "The date helps us…",
        "I want to visit this museum because…"
      ]
    },
    "B1": {
      "words": [
        {
          "word": "past",
          "definition": "the events and conditions of earlier times",
          "example": "What would you explore in Kyoto's past?"
        },
        {
          "word": "date",
          "definition": "a calendar reference placing an event in time",
          "example": "Why add a date to a Kyoto history card?"
        },
        {
          "word": "century",
          "definition": "a period of one hundred years used to organise history",
          "example": "Which century would you explore in a Japan museum?"
        },
        {
          "word": "object",
          "definition": "a material item that can provide historical evidence",
          "example": "What object would you study in the British Museum?"
        },
        {
          "word": "museum",
          "definition": "an institution preserving and interpreting collections",
          "example": "What question would you ask in a Tokyo museum?"
        },
        {
          "word": "record",
          "definition": "a surviving document or account of an earlier event",
          "example": "What could an old Kyoto travel record tell us?"
        },
        {
          "word": "source",
          "definition": "evidence used to investigate the past",
          "example": "Which source could help explain old Amsterdam?"
        },
        {
          "word": "change",
          "definition": "a difference developing between one period and another",
          "example": "What change would you look for in photos of Tokyo?"
        },
        {
          "word": "tradition",
          "definition": "a practice passed between generations with possible changes",
          "example": "Which Japanese craft tradition would you explore?"
        },
        {
          "word": "journey",
          "definition": "travel that can reveal connections between places and people",
          "example": "What would you ask about an old Silk Road journey?"
        },
        {
          "word": "archive",
          "definition": "an organised collection of records kept for study",
          "example": "What might a London archive help you discover?"
        },
        {
          "word": "evidence",
          "definition": "surviving material used to support a historical claim",
          "example": "What evidence could date an object from Kyoto?"
        },
        {
          "word": "timeline",
          "definition": "an arrangement showing the sequence and timing of events",
          "example": "What belongs on a timeline of Nintendo?"
        },
        {
          "word": "period",
          "definition": "a span of time grouped by shared features or events",
          "example": "What would you ask about Japan's Edo period?"
        },
        {
          "word": "interpretation",
          "definition": "an explanation of evidence that may differ between historians",
          "example": "Could two museums offer a different interpretation of an object?"
        },
        {
          "word": "preserve",
          "definition": "protect material from damage or loss for the future",
          "example": "How could a museum preserve old Japanese paper?"
        }
      ],
      "stems": [
        "This source suggests that…",
        "A different interpretation might be…",
        "The object helps explain how…",
        "One continuity across the period is…",
        "I would compare this account with…",
        "The date matters to the explanation because…"
      ]
    }
  },
  "art-design": {
    "A1": {
      "words": [
        {
          "word": "art",
          "definition": "things made to show ideas or feelings",
          "example": "What art would you explore in Kyoto?"
        },
        {
          "word": "artist",
          "definition": "a person who makes art",
          "example": "What would you ask artist Hokusai?"
        },
        {
          "word": "colour",
          "definition": "how something looks, like red or blue",
          "example": "Which colour would you notice in The Great Wave?"
        },
        {
          "word": "shape",
          "definition": "the outside form of something",
          "example": "Describe a shape in a Japanese paper fan."
        },
        {
          "word": "line",
          "definition": "a long thin mark",
          "example": "Where does a line lead in a Hokusai print?"
        },
        {
          "word": "pattern",
          "definition": "shapes or colours that come again",
          "example": "What pattern would you draw for a Kyoto cloth?"
        },
        {
          "word": "paint",
          "definition": "add colour with a brush",
          "example": "What would you paint after visiting Paris?"
        },
        {
          "word": "print",
          "definition": "a picture made from another surface",
          "example": "How would you describe a Hokusai print?"
        },
        {
          "word": "building",
          "definition": "a place with walls and a roof",
          "example": "Which building would you draw in Amsterdam?"
        },
        {
          "word": "material",
          "definition": "what something is made from",
          "example": "What material would you choose for a Japanese lamp?"
        },
        {
          "word": "design",
          "definition": "a plan for how something looks or works",
          "example": "What design choice would you change in a Tokyo chair?"
        },
        {
          "word": "gallery",
          "definition": "a place to show art",
          "example": "What would you ask at a Paris gallery?"
        },
        {
          "word": "sculpture",
          "definition": "art with a solid shape",
          "example": "What sculpture would you explore in London?"
        },
        {
          "word": "texture",
          "definition": "how a surface feels or looks",
          "example": "Describe the texture of a Japanese ceramic bowl."
        },
        {
          "word": "contrast",
          "definition": "a clear difference",
          "example": "Where is the contrast in The Great Wave?"
        },
        {
          "word": "style",
          "definition": "a way of making art",
          "example": "How would you compare two Japanese poster styles?"
        }
      ],
      "stems": [
        "The colour I notice is…",
        "This shape looks like…",
        "The material might be…",
        "I would draw…",
        "This design makes me feel…",
        "One detail I like is…"
      ]
    },
    "B1": {
      "words": [
        {
          "word": "art",
          "definition": "creative work using visual or other forms to communicate",
          "example": "What art would you explore in Kyoto?"
        },
        {
          "word": "artist",
          "definition": "someone creating work in an artistic medium",
          "example": "What would you ask artist Hokusai?"
        },
        {
          "word": "colour",
          "definition": "a visual property used to create contrast or mood",
          "example": "Which colour would you notice in The Great Wave?"
        },
        {
          "word": "shape",
          "definition": "a visible form defined by its outline or structure",
          "example": "Describe a shape in a Japanese paper fan."
        },
        {
          "word": "line",
          "definition": "a drawn or implied path directing the eye",
          "example": "Where does a line lead in a Hokusai print?"
        },
        {
          "word": "pattern",
          "definition": "a repeated arrangement of visual elements",
          "example": "What pattern would you draw for a Kyoto cloth?"
        },
        {
          "word": "paint",
          "definition": "apply coloured material to a surface",
          "example": "What would you paint after visiting Paris?"
        },
        {
          "word": "print",
          "definition": "an image transferred from a prepared block or plate",
          "example": "How would you describe a Hokusai print?"
        },
        {
          "word": "building",
          "definition": "a constructed structure shaped by practical and aesthetic decisions",
          "example": "Which building would you draw in Amsterdam?"
        },
        {
          "word": "material",
          "definition": "a substance selected for function, appearance or meaning",
          "example": "What material would you choose for a Japanese lamp?"
        },
        {
          "word": "design",
          "definition": "a deliberate arrangement meeting a purpose",
          "example": "What design choice would you change in a Tokyo chair?"
        },
        {
          "word": "gallery",
          "definition": "a space in which artworks are exhibited",
          "example": "What would you ask at a Paris gallery?"
        },
        {
          "word": "sculpture",
          "definition": "three-dimensional artwork made by shaping or assembling material",
          "example": "What sculpture would you explore in London?"
        },
        {
          "word": "texture",
          "definition": "the perceived surface quality of an object",
          "example": "Describe the texture of a Japanese ceramic bowl."
        },
        {
          "word": "contrast",
          "definition": "a difference that makes visual elements stand apart",
          "example": "Where is the contrast in The Great Wave?"
        },
        {
          "word": "style",
          "definition": "a recognisable set of creative choices or features",
          "example": "How would you compare two Japanese poster styles?"
        }
      ],
      "stems": [
        "The contrast draws attention to…",
        "The material affects the design by…",
        "My response differs from a fact because…",
        "A visible feature supporting my idea is…",
        "I would adapt this design for…",
        "Without guessing the artist's intention, I notice…"
      ]
    }
  },
  "nature-environment": {
    "A1": {
      "words": [
        {
          "word": "animal",
          "definition": "a living thing that can eat and move",
          "example": "Which animal would you study on Honshu?"
        },
        {
          "word": "plant",
          "definition": "a living thing with roots or leaves",
          "example": "Which plant would you explore in a Kyoto garden?"
        },
        {
          "word": "habitat",
          "definition": "an animal's or plant's home",
          "example": "Describe a Japanese macaque's habitat."
        },
        {
          "word": "forest",
          "definition": "a place with many trees",
          "example": "What would you notice in a Hokkaido forest?"
        },
        {
          "word": "river",
          "definition": "water that moves across land",
          "example": "What would you study beside the Nile?"
        },
        {
          "word": "coast",
          "definition": "land beside the sea",
          "example": "Which animal would you look for on Canada's coast?"
        },
        {
          "word": "climate",
          "definition": "the usual weather over many years",
          "example": "How would you compare Hokkaido and Okinawa climate?"
        },
        {
          "word": "season",
          "definition": "one part of the year",
          "example": "Which season would you explore in Japan?"
        },
        {
          "word": "protect",
          "definition": "keep something safe",
          "example": "How could visitors protect a Japanese forest path?"
        },
        {
          "word": "waste",
          "definition": "things people throw away",
          "example": "What waste could a Tokyo picnic avoid creating?"
        },
        {
          "word": "reuse",
          "definition": "use something again",
          "example": "How could you reuse a shopping bag in Kyoto?"
        },
        {
          "word": "species",
          "definition": "one kind of living thing",
          "example": "Which species name would you check for a macaque?"
        },
        {
          "word": "ecosystem",
          "definition": "living things and their home together",
          "example": "What belongs in a Japanese pond ecosystem?"
        },
        {
          "word": "resource",
          "definition": "something useful from a place",
          "example": "Which resource do trees need in a Kyoto garden?"
        },
        {
          "word": "conservation",
          "definition": "care for nature",
          "example": "What conservation question could you ask about red pandas?"
        },
        {
          "word": "evidence",
          "definition": "facts that help check an idea",
          "example": "What evidence would show a change in a Tokyo pond?"
        }
      ],
      "stems": [
        "This animal lives in…",
        "The plant needs…",
        "I can help care for…",
        "This place changes when…",
        "One thing I would reuse is…",
        "I would look for…"
      ]
    },
    "B1": {
      "words": [
        {
          "word": "animal",
          "definition": "a living organism belonging to the animal kingdom",
          "example": "Which animal would you study on Honshu?"
        },
        {
          "word": "plant",
          "definition": "an organism usually making food using sunlight",
          "example": "Which plant would you explore in a Kyoto garden?"
        },
        {
          "word": "habitat",
          "definition": "the environment supplying a species with what it needs",
          "example": "Describe a Japanese macaque's habitat."
        },
        {
          "word": "forest",
          "definition": "a habitat dominated by trees and their associated life",
          "example": "What would you notice in a Hokkaido forest?"
        },
        {
          "word": "river",
          "definition": "a natural flowing watercourse",
          "example": "What would you study beside the Nile?"
        },
        {
          "word": "coast",
          "definition": "the meeting area between land and ocean",
          "example": "Which animal would you look for on Canada's coast?"
        },
        {
          "word": "climate",
          "definition": "long-term patterns in weather across a region",
          "example": "How would you compare Hokkaido and Okinawa climate?"
        },
        {
          "word": "season",
          "definition": "a recurring annual period with characteristic conditions",
          "example": "Which season would you explore in Japan?"
        },
        {
          "word": "protect",
          "definition": "take action to reduce harm or loss",
          "example": "How could visitors protect a Japanese forest path?"
        },
        {
          "word": "waste",
          "definition": "material discarded after use",
          "example": "What waste could a Tokyo picnic avoid creating?"
        },
        {
          "word": "reuse",
          "definition": "use an item again instead of immediately discarding it",
          "example": "How could you reuse a shopping bag in Kyoto?"
        },
        {
          "word": "species",
          "definition": "a biological grouping used to identify related organisms",
          "example": "Which species name would you check for a macaque?"
        },
        {
          "word": "ecosystem",
          "definition": "organisms interacting with each other and their physical environment",
          "example": "What belongs in a Japanese pond ecosystem?"
        },
        {
          "word": "resource",
          "definition": "a supply used by organisms or people",
          "example": "Which resource do trees need in a Kyoto garden?"
        },
        {
          "word": "conservation",
          "definition": "the protection and management of species and habitats",
          "example": "What conservation question could you ask about red pandas?"
        },
        {
          "word": "evidence",
          "definition": "observations used to assess an environmental claim",
          "example": "What evidence would show a change in a Tokyo pond?"
        }
      ],
      "stems": [
        "The habitat supports this species by…",
        "The source dates this change to…",
        "One interaction in this ecosystem is…",
        "A conservation choice could affect…",
        "The evidence is limited because…",
        "I would compare seasonal observations of…"
      ]
    }
  },
  "money-business": {
    "A1": {
      "words": [
        {
          "word": "money",
          "definition": "what we use to pay",
          "example": "What money would you use in Japan?"
        },
        {
          "word": "price",
          "definition": "how much something costs",
          "example": "What date would you add to a Tokyo ticket price?"
        },
        {
          "word": "shop",
          "definition": "a place to buy things",
          "example": "What would you ask in a Kyoto craft shop?"
        },
        {
          "word": "customer",
          "definition": "a person who buys something",
          "example": "What might a customer ask at a Nintendo shop?"
        },
        {
          "word": "job",
          "definition": "work a person does",
          "example": "Which job would you explore at a Japanese railway company?"
        },
        {
          "word": "company",
          "definition": "people who make or sell things together",
          "example": "What would you ask about Nintendo as a company?"
        },
        {
          "word": "product",
          "definition": "something made to sell",
          "example": "Which Japanese paper product would you design?"
        },
        {
          "word": "cost",
          "definition": "money needed to do something",
          "example": "What cost might a Tokyo café need to plan for?"
        },
        {
          "word": "sell",
          "definition": "give something for money",
          "example": "How would you sell a handmade Kyoto fan respectfully?"
        },
        {
          "word": "buy",
          "definition": "get something with money",
          "example": "What would you check before you buy a Tokyo rail ticket?"
        },
        {
          "word": "budget",
          "definition": "a plan for spending money",
          "example": "What would a museum visit budget include in Paris?"
        },
        {
          "word": "profit",
          "definition": "money left after costs",
          "example": "What would you need to know before estimating a café's profit?"
        },
        {
          "word": "salary",
          "definition": "money paid for a job",
          "example": "Why should a class not guess a Tokyo worker's salary?"
        },
        {
          "word": "currency",
          "definition": "a kind of money",
          "example": "Which source could confirm Japan's currency?"
        },
        {
          "word": "business",
          "definition": "work that sells things or services",
          "example": "How might a Kyoto bicycle business help visitors?"
        },
        {
          "word": "value",
          "definition": "how useful or important something is",
          "example": "What gives a handmade Japanese bowl value for a buyer?"
        }
      ],
      "stems": [
        "The price on this date is…",
        "This shop sells…",
        "A customer might ask…",
        "The job involves…",
        "My pretend budget includes…",
        "Before buying, I would check…"
      ]
    },
    "B1": {
      "words": [
        {
          "word": "money",
          "definition": "a system used to exchange and measure value",
          "example": "What money would you use in Japan?"
        },
        {
          "word": "price",
          "definition": "the amount requested in exchange for a product or service",
          "example": "What date would you add to a Tokyo ticket price?"
        },
        {
          "word": "shop",
          "definition": "a business selling goods to customers",
          "example": "What would you ask in a Kyoto craft shop?"
        },
        {
          "word": "customer",
          "definition": "someone purchasing a product or service",
          "example": "What might a customer ask at a Nintendo shop?"
        },
        {
          "word": "job",
          "definition": "a role carrying out tasks in exchange for pay or another arrangement",
          "example": "Which job would you explore at a Japanese railway company?"
        },
        {
          "word": "company",
          "definition": "an organisation carrying out business activities",
          "example": "What would you ask about Nintendo as a company?"
        },
        {
          "word": "product",
          "definition": "a good or service offered to customers",
          "example": "Which Japanese paper product would you design?"
        },
        {
          "word": "cost",
          "definition": "the resources required to produce or obtain something",
          "example": "What cost might a Tokyo café need to plan for?"
        },
        {
          "word": "sell",
          "definition": "exchange a good or service for payment",
          "example": "How would you sell a handmade Kyoto fan respectfully?"
        },
        {
          "word": "buy",
          "definition": "obtain a product or service by paying for it",
          "example": "What would you check before you buy a Tokyo rail ticket?"
        },
        {
          "word": "budget",
          "definition": "a plan allocating available money between purposes",
          "example": "What would a museum visit budget include in Paris?"
        },
        {
          "word": "profit",
          "definition": "the difference between revenue and relevant costs",
          "example": "What would you need to know before estimating a café's profit?"
        },
        {
          "word": "salary",
          "definition": "regular agreed payment for employment",
          "example": "Why should a class not guess a Tokyo worker's salary?"
        },
        {
          "word": "currency",
          "definition": "the monetary system used in a country or area",
          "example": "Which source could confirm Japan's currency?"
        },
        {
          "word": "business",
          "definition": "an activity organised to supply goods or services",
          "example": "How might a Kyoto bicycle business help visitors?"
        },
        {
          "word": "value",
          "definition": "worth assessed through price, usefulness or personal priorities",
          "example": "What gives a handmade Japanese bowl value for a buyer?"
        }
      ],
      "stems": [
        "The business meets a need by…",
        "A cost that is easy to overlook is…",
        "The dated price does not tell us…",
        "A customer's priorities might include…",
        "I would compare value by…",
        "This is a business example, not a promise that…"
      ]
    }
  },
  "games": {
    "A1": {
      "words": [
        {
          "word": "game",
          "definition": "something we play with rules",
          "example": "Which Japanese game would you try?"
        },
        {
          "word": "player",
          "definition": "a person who plays",
          "example": "What would a new shogi player need to know?"
        },
        {
          "word": "rule",
          "definition": "something players agree to follow",
          "example": "Explain one rule of Go."
        },
        {
          "word": "turn",
          "definition": "one player's time to act",
          "example": "What could happen on a turn in shogi?"
        },
        {
          "word": "move",
          "definition": "one action in a game",
          "example": "Which move would you explain on a chessboard?"
        },
        {
          "word": "piece",
          "definition": "a small thing used in a game",
          "example": "Describe a shogi piece."
        },
        {
          "word": "board",
          "definition": "the flat place for a game",
          "example": "How would you draw a Go board?"
        },
        {
          "word": "level",
          "definition": "one part of a video game",
          "example": "What would you notice in a Super Mario level?"
        },
        {
          "word": "character",
          "definition": "a person or creature in a game",
          "example": "Which Animal Crossing character would you discuss?"
        },
        {
          "word": "goal",
          "definition": "what a player tries to do",
          "example": "How would you explain the goal of chess?"
        },
        {
          "word": "puzzle",
          "definition": "a problem to solve for fun",
          "example": "What makes a Tetris puzzle interesting?"
        },
        {
          "word": "cooperate",
          "definition": "work together",
          "example": "How could a class cooperate to explain Go?"
        },
        {
          "word": "strategy",
          "definition": "a plan for a game",
          "example": "What strategy would you test in shogi?"
        },
        {
          "word": "challenge",
          "definition": "something that is hard to do",
          "example": "What challenge would you design for a Mario game?"
        },
        {
          "word": "choice",
          "definition": "something we can decide",
          "example": "What choice would you make in Animal Crossing?"
        },
        {
          "word": "feedback",
          "definition": "information that helps us improve",
          "example": "What feedback could help a beginner learn Tetris?"
        }
      ],
      "stems": [
        "On my turn, I would…",
        "The rule says…",
        "This piece can…",
        "The goal is to…",
        "I would choose…",
        "The puzzle makes me think…"
      ]
    },
    "B1": {
      "words": [
        {
          "word": "game",
          "definition": "an activity organised around rules, goals or playful exploration",
          "example": "Which Japanese game would you try?"
        },
        {
          "word": "player",
          "definition": "someone taking part in a game",
          "example": "What would a new shogi player need to know?"
        },
        {
          "word": "rule",
          "definition": "an instruction defining permitted actions and outcomes",
          "example": "Explain one rule of Go."
        },
        {
          "word": "turn",
          "definition": "a player's opportunity to make a move",
          "example": "What could happen on a turn in shogi?"
        },
        {
          "word": "move",
          "definition": "an action changing the game state",
          "example": "Which move would you explain on a chessboard?"
        },
        {
          "word": "piece",
          "definition": "an object representing a player's resources or position",
          "example": "Describe a shogi piece."
        },
        {
          "word": "board",
          "definition": "a playing surface marked for positions or movement",
          "example": "How would you draw a Go board?"
        },
        {
          "word": "level",
          "definition": "a stage offering a particular environment or challenge",
          "example": "What would you notice in a Super Mario level?"
        },
        {
          "word": "character",
          "definition": "a playable or non-playable figure in a game world",
          "example": "Which Animal Crossing character would you discuss?"
        },
        {
          "word": "goal",
          "definition": "the objective guiding choices in a game",
          "example": "How would you explain the goal of chess?"
        },
        {
          "word": "puzzle",
          "definition": "a challenge solved through reasoning or experimentation",
          "example": "What makes a Tetris puzzle interesting?"
        },
        {
          "word": "cooperate",
          "definition": "coordinate actions to reach a shared goal",
          "example": "How could a class cooperate to explain Go?"
        },
        {
          "word": "strategy",
          "definition": "an approach connecting several decisions towards a goal",
          "example": "What strategy would you test in shogi?"
        },
        {
          "word": "challenge",
          "definition": "a task requiring effort or skill",
          "example": "What challenge would you design for a Mario game?"
        },
        {
          "word": "choice",
          "definition": "a decision between possible actions",
          "example": "What choice would you make in Animal Crossing?"
        },
        {
          "word": "feedback",
          "definition": "a response showing the effect of a player's action",
          "example": "What feedback could help a beginner learn Tetris?"
        }
      ],
      "stems": [
        "One strategy worth testing is…",
        "The rule creates a choice between…",
        "The feedback helps the player by…",
        "A beginner might misunderstand…",
        "The design encourages cooperation when…",
        "I would change this challenge so that…"
      ]
    }
  },
  "travel": {
    "A1": {
      "words": [
        {
          "word": "journey",
          "definition": "travel from place to place",
          "example": "How would you plan a journey from Tokyo to Kyoto?"
        },
        {
          "word": "ticket",
          "definition": "something that lets us travel or enter",
          "example": "What would you check on a Tokyo train ticket?"
        },
        {
          "word": "station",
          "definition": "a place to get a train",
          "example": "What would you ask at Kyoto Station?"
        },
        {
          "word": "map",
          "definition": "a picture showing places",
          "example": "What would you mark on a map of Japan?"
        },
        {
          "word": "route",
          "definition": "the way from one place to another",
          "example": "Which route would you explore in Amsterdam?"
        },
        {
          "word": "visitor",
          "definition": "a person who comes to a place",
          "example": "What should a visitor ask at a Japanese shrine?"
        },
        {
          "word": "guide",
          "definition": "a person or book that helps visitors",
          "example": "What would you ask a guide in Kyoto?"
        },
        {
          "word": "custom",
          "definition": "something people often do",
          "example": "Which Japanese meal custom would you check before describing it?"
        },
        {
          "word": "market",
          "definition": "a place with shops or sellers",
          "example": "What would you explore at a market in Bangkok?"
        },
        {
          "word": "museum",
          "definition": "a place to learn from old or special things",
          "example": "Which museum would you add to a Tokyo trip?"
        },
        {
          "word": "platform",
          "definition": "the place beside a train",
          "example": "What sign would help you find a platform in Tokyo?"
        },
        {
          "word": "distance",
          "definition": "how far one place is from another",
          "example": "How would you compare travel distance between Kyoto and Osaka?"
        },
        {
          "word": "booking",
          "definition": "a plan saved for a visit",
          "example": "What dated information would you check before a Kyoto booking?"
        },
        {
          "word": "local",
          "definition": "from or near this place",
          "example": "What would you ask about local transport in Paris?"
        },
        {
          "word": "accessible",
          "definition": "easy for someone to use or reach",
          "example": "How could a Tokyo museum explain its accessible entrance?"
        },
        {
          "word": "itinerary",
          "definition": "a list of places for a trip",
          "example": "What would you put in a two-stop Kyoto itinerary?"
        }
      ],
      "stems": [
        "I would go to…",
        "My first stop is…",
        "I need a ticket for…",
        "The map shows…",
        "Before visiting, I would ask…",
        "I would travel by…"
      ]
    },
    "B1": {
      "words": [
        {
          "word": "journey",
          "definition": "the experience of moving between locations",
          "example": "How would you plan a journey from Tokyo to Kyoto?"
        },
        {
          "word": "ticket",
          "definition": "proof of permission or payment for a service",
          "example": "What would you check on a Tokyo train ticket?"
        },
        {
          "word": "station",
          "definition": "a place where passengers board or leave railway services",
          "example": "What would you ask at Kyoto Station?"
        },
        {
          "word": "map",
          "definition": "a representation helping people understand locations and routes",
          "example": "What would you mark on a map of Japan?"
        },
        {
          "word": "route",
          "definition": "a planned or established path between places",
          "example": "Which route would you explore in Amsterdam?"
        },
        {
          "word": "visitor",
          "definition": "someone spending time somewhere away from their usual location",
          "example": "What should a visitor ask at a Japanese shrine?"
        },
        {
          "word": "guide",
          "definition": "a person or resource explaining places and practical choices",
          "example": "What would you ask a guide in Kyoto?"
        },
        {
          "word": "custom",
          "definition": "a shared practice that can vary between groups and settings",
          "example": "Which Japanese meal custom would you check before describing it?"
        },
        {
          "word": "market",
          "definition": "a trading place that can reveal local products and routines",
          "example": "What would you explore at a market in Bangkok?"
        },
        {
          "word": "museum",
          "definition": "an institution collecting and interpreting objects",
          "example": "Which museum would you add to a Tokyo trip?"
        },
        {
          "word": "platform",
          "definition": "the area from which passengers board railway services",
          "example": "What sign would help you find a platform in Tokyo?"
        },
        {
          "word": "distance",
          "definition": "the measured separation between locations",
          "example": "How would you compare travel distance between Kyoto and Osaka?"
        },
        {
          "word": "booking",
          "definition": "an advance reservation for a service or activity",
          "example": "What dated information would you check before a Kyoto booking?"
        },
        {
          "word": "local",
          "definition": "connected with a particular nearby area or community",
          "example": "What would you ask about local transport in Paris?"
        },
        {
          "word": "accessible",
          "definition": "usable by people with different access needs",
          "example": "How could a Tokyo museum explain its accessible entrance?"
        },
        {
          "word": "itinerary",
          "definition": "a timed or ordered plan for a journey",
          "example": "What would you put in a two-stop Kyoto itinerary?"
        }
      ],
      "stems": [
        "My itinerary balances…",
        "A visitor with different access needs might…",
        "The dated transport information suggests…",
        "I would check this custom with…",
        "This route appeals to me because…",
        "A useful question before booking is…"
      ]
    }
  },
  "animals-kid": {
    "A1": {
      "words": [
        {
          "word": "animal",
          "definition": "a living thing that eats and can move",
          "example": "Can you name an animal from Japan?",
          "picture": "Japanese macaque forest"
        },
        {
          "word": "fur",
          "definition": "soft hair on an animal",
          "example": "Look at the fur on a red panda.",
          "picture": "red panda fur"
        },
        {
          "word": "tail",
          "definition": "the long part at an animal's back",
          "example": "Describe a Japanese macaque's tail.",
          "picture": "Japanese macaque tail"
        },
        {
          "word": "paw",
          "definition": "an animal's foot",
          "example": "Look at a red fox's paw.",
          "picture": "red fox paw"
        },
        {
          "word": "wing",
          "definition": "the part a bird uses to fly",
          "example": "Find a wing on a pigeon in London.",
          "picture": "pigeon open wing"
        },
        {
          "word": "beak",
          "definition": "a bird's hard mouth",
          "example": "Describe the beak of a grey heron.",
          "picture": "grey heron beak"
        },
        {
          "word": "feather",
          "definition": "a soft part covering a bird",
          "example": "What colour is a peacock feather?",
          "picture": "peacock tail feather"
        },
        {
          "word": "nest",
          "definition": "a home for eggs or babies",
          "example": "Where could a sparrow in Tokyo make a nest?",
          "picture": "sparrow bird nest"
        },
        {
          "word": "egg",
          "definition": "a round thing a baby bird grows in",
          "example": "What shape is a chicken egg?",
          "picture": "chicken egg nest"
        },
        {
          "word": "baby",
          "definition": "a very young animal or person",
          "example": "Describe a baby elephant in Thailand.",
          "picture": "Asian elephant calf"
        },
        {
          "word": "eat",
          "definition": "put food in your mouth",
          "example": "What do koalas eat in Australia?",
          "picture": "koala eating leaves"
        },
        {
          "word": "drink",
          "definition": "take water into your mouth",
          "example": "Where could a deer in Japan drink?",
          "picture": "sika deer drinking"
        },
        {
          "word": "swim",
          "definition": "move through water",
          "example": "Can you describe an otter's swim?",
          "picture": "otter swimming river"
        },
        {
          "word": "climb",
          "definition": "go up using hands or feet",
          "example": "What could an orangutan in Sumatra climb?",
          "picture": "Sumatran orangutan climbing"
        },
        {
          "word": "hide",
          "definition": "go where others cannot see you",
          "example": "Where could a red fox in Britain hide?",
          "picture": "red fox woodland"
        },
        {
          "word": "home",
          "definition": "the place where something lives",
          "example": "What is a good home for a beaver in Canada?",
          "picture": "beaver river lodge"
        }
      ],
      "stems": [
        "I can see…",
        "This animal has…",
        "It likes to eat…",
        "It can move by…",
        "Its baby looks…",
        "A safe home needs…"
      ]
    }
  },
  "space-kid": {
    "A1": {
      "words": [
        {
          "word": "space",
          "definition": "the place far above Earth",
          "example": "What would you ask about space at JAXA?",
          "picture": "Earth from space"
        },
        {
          "word": "star",
          "definition": "a big hot ball far away",
          "example": "Our Sun is a star.",
          "picture": "stars night sky"
        },
        {
          "word": "Sun",
          "definition": "the star near Earth",
          "example": "Never look at the Sun through a telescope.",
          "picture": "Sun space photograph"
        },
        {
          "word": "Moon",
          "definition": "the round world near Earth",
          "example": "What shape is the Moon above Tokyo tonight?",
          "picture": "Moon surface photograph"
        },
        {
          "word": "Earth",
          "definition": "the world we live on",
          "example": "Can you find Japan on Earth?",
          "picture": "Earth globe Japan"
        },
        {
          "word": "planet",
          "definition": "a big world around a star",
          "example": "Mars is a planet.",
          "picture": "Mars planet photograph"
        },
        {
          "word": "rocket",
          "definition": "a machine that travels into space",
          "example": "What would you pack in a JAXA rocket?",
          "picture": "space rocket launchpad"
        },
        {
          "word": "astronaut",
          "definition": "a person who goes to space",
          "example": "What would you ask a JAXA astronaut?",
          "picture": "astronaut space station"
        },
        {
          "word": "sky",
          "definition": "the space we see above us",
          "example": "What can you see in Kyoto's night sky?",
          "picture": "Kyoto night sky"
        },
        {
          "word": "suit",
          "definition": "special clothes for a job",
          "example": "Why does an astronaut need a space suit?",
          "picture": "astronaut space suit"
        },
        {
          "word": "helmet",
          "definition": "a hard cover for your head",
          "example": "Look at an astronaut's helmet.",
          "picture": "astronaut helmet closeup"
        },
        {
          "word": "telescope",
          "definition": "a thing that helps us see far away",
          "example": "What would you look at through a telescope in Tokyo?",
          "picture": "night sky telescope"
        },
        {
          "word": "crater",
          "definition": "a round hole in rock",
          "example": "Find a crater in a Moon photo.",
          "picture": "Moon crater surface"
        },
        {
          "word": "ring",
          "definition": "a shape like a circle",
          "example": "Saturn has rings.",
          "picture": "Saturn rings photograph"
        },
        {
          "word": "comet",
          "definition": "a space body that can have a tail",
          "example": "What would you ask about Halley's Comet?",
          "picture": "comet sky photograph"
        },
        {
          "word": "satellite",
          "definition": "a thing that goes around a world",
          "example": "The Moon is Earth's natural satellite.",
          "picture": "Moon Earth space"
        }
      ],
      "stems": [
        "I can see in the sky…",
        "This planet looks…",
        "A rocket can…",
        "An astronaut needs…",
        "I would ask about…",
        "In this space photo, I notice…"
      ]
    }
  },
  "dinosaurs-kid": {
    "A1": {
      "words": [
        {
          "word": "dinosaur",
          "definition": "an animal from very long ago",
          "example": "Fukuiraptor was a dinosaur from Japan.",
          "picture": "Fukuiraptor museum model"
        },
        {
          "word": "fossil",
          "definition": "an old sign of a living thing in rock",
          "example": "What would you ask about a fossil in Fukui?",
          "picture": "fossil rock museum"
        },
        {
          "word": "bone",
          "definition": "a hard part inside a body",
          "example": "Find a bone in a dinosaur museum photo.",
          "picture": "dinosaur fossil bone"
        },
        {
          "word": "footprint",
          "definition": "a mark made by a foot",
          "example": "What could a dinosaur footprint show us?",
          "picture": "dinosaur fossil footprint"
        },
        {
          "word": "tooth",
          "definition": "a hard part in a mouth",
          "example": "Look at a Tyrannosaurus tooth in a museum.",
          "picture": "Tyrannosaurus fossil tooth"
        },
        {
          "word": "egg",
          "definition": "a round home for a baby before it hatches",
          "example": "What would you ask about a dinosaur egg?",
          "picture": "dinosaur fossil egg"
        },
        {
          "word": "nest",
          "definition": "a place for eggs",
          "example": "Can a fossil show a dinosaur nest?",
          "picture": "dinosaur fossil nest"
        },
        {
          "word": "rock",
          "definition": "hard natural ground material",
          "example": "What fossil could be inside a rock from Dorset?",
          "picture": "Dorset fossil rock"
        },
        {
          "word": "tail",
          "definition": "the long part behind an animal",
          "example": "Describe the tail on a Diplodocus model.",
          "picture": "Diplodocus museum model"
        },
        {
          "word": "claw",
          "definition": "a sharp part on an animal's foot",
          "example": "Find a claw on a dinosaur model.",
          "picture": "dinosaur model claw"
        },
        {
          "word": "big",
          "definition": "large in size",
          "example": "How big does the Diplodocus model look?",
          "picture": "Diplodocus skeleton museum"
        },
        {
          "word": "small",
          "definition": "not big",
          "example": "Which fossil in the Fukui museum looks small?",
          "picture": "small fossil museum"
        },
        {
          "word": "dig",
          "definition": "make a hole in the ground",
          "example": "What tools could a scientist use to dig in Fukui?",
          "picture": "fossil excavation tools"
        },
        {
          "word": "museum",
          "definition": "a place to see and learn about special things",
          "example": "What would you ask at Fukui Dinosaur Museum?",
          "picture": "Fukui dinosaur museum"
        },
        {
          "word": "old",
          "definition": "from a long time ago",
          "example": "How can we learn about an old fossil?",
          "picture": "ancient fossil stone"
        },
        {
          "word": "model",
          "definition": "a made copy of something",
          "example": "This museum dinosaur is a model, not alive.",
          "picture": "dinosaur model exhibit"
        }
      ],
      "stems": [
        "The fossil looks like…",
        "This model has…",
        "I can find a bone near…",
        "I think the footprint shows…",
        "I would ask the scientist…",
        "Long ago, this animal could…"
      ]
    }
  },
  "stories-kid": {
    "A1": {
      "words": [
        {
          "word": "book",
          "definition": "pages joined together to read",
          "example": "Which Cinderella book would you choose?",
          "picture": "open storybook pages"
        },
        {
          "word": "page",
          "definition": "one side of a sheet in a book",
          "example": "What can you see on this Goldilocks page?",
          "picture": "storybook page closeup"
        },
        {
          "word": "story",
          "definition": "things that happen in a book or film",
          "example": "Tell one part of the Cinderella story.",
          "picture": "storybook reading table"
        },
        {
          "word": "character",
          "definition": "someone in a story",
          "example": "Name a character in Goldilocks.",
          "picture": "storybook character puppet"
        },
        {
          "word": "hero",
          "definition": "someone who helps in a story",
          "example": "Who could be a hero in a new Pinocchio story?",
          "picture": "wooden story puppet"
        },
        {
          "word": "dragon",
          "definition": "a made-up animal in stories",
          "example": "What could a dragon do in a new fairy tale?",
          "picture": "wooden dragon toy"
        },
        {
          "word": "fairy",
          "definition": "a small magic person in a story",
          "example": "Describe a fairy in Cinderella as a story character.",
          "picture": "fairy storybook prop"
        },
        {
          "word": "castle",
          "definition": "a large strong old building",
          "example": "Draw a castle for a Cinderella story.",
          "picture": "European castle photograph"
        },
        {
          "word": "forest",
          "definition": "a place with many trees",
          "example": "What might Goldilocks notice in a story forest?",
          "picture": "sunlit forest path"
        },
        {
          "word": "magic",
          "definition": "made-up powers in a story",
          "example": "The magic in Cinderella is part of a story.",
          "picture": "magic wand prop"
        },
        {
          "word": "start",
          "definition": "the first part",
          "example": "How would you start a new Pinocchio story?",
          "picture": "open book beginning"
        },
        {
          "word": "ending",
          "definition": "the last part",
          "example": "Can you talk about Totoro without telling the ending?",
          "picture": "closed storybook cover"
        },
        {
          "word": "picture",
          "definition": "something we look at to see a thing",
          "example": "What does a picture add to a Goldilocks book?",
          "picture": "storybook reading hands"
        },
        {
          "word": "tell",
          "definition": "say a story or idea",
          "example": "Tell us about Pinocchio as a story character.",
          "picture": "child storytelling puppet"
        },
        {
          "word": "listen",
          "definition": "use your ears to hear",
          "example": "What would you listen for in a Cinderella reading?",
          "picture": "storytime reading book"
        },
        {
          "word": "puppet",
          "definition": "a toy moved to tell a story",
          "example": "What could a Pinocchio puppet say?",
          "picture": "wooden puppet strings"
        }
      ],
      "stems": [
        "The story starts with…",
        "The character I notice is…",
        "In the story, the animal can…",
        "I think the next part could be…",
        "My puppet would say…",
        "This is make-believe because…"
      ]
    }
  },
  "food-kid": {
    "A1": {
      "words": [
        {
          "word": "bread",
          "definition": "food made with flour and water",
          "example": "What shape is a French baguette?",
          "picture": "French baguette bread"
        },
        {
          "word": "rice",
          "definition": "small white or brown grains we cook",
          "example": "Look at the rice in a Japanese onigiri.",
          "picture": "Japanese onigiri rice"
        },
        {
          "word": "noodle",
          "definition": "a long thin piece of food",
          "example": "Describe a noodle in Vietnamese pho.",
          "picture": "pho rice noodles"
        },
        {
          "word": "soup",
          "definition": "food with lots of liquid",
          "example": "What would you ask about a bowl of pho?",
          "picture": "Vietnamese pho bowl"
        },
        {
          "word": "fruit",
          "definition": "a plant food like an apple",
          "example": "Which fruit would you look for in a Thai market?",
          "picture": "Thai fruit market"
        },
        {
          "word": "apple",
          "definition": "a round fruit",
          "example": "What colour apple would you choose in Japan?",
          "picture": "Japanese apple fruit"
        },
        {
          "word": "banana",
          "definition": "a long yellow fruit",
          "example": "What shape is a banana in a Thai market?",
          "picture": "ripe banana bunch"
        },
        {
          "word": "cake",
          "definition": "a sweet food we bake",
          "example": "What would you ask about a Japanese rice cake?",
          "picture": "Japanese rice cake"
        },
        {
          "word": "cookie",
          "definition": "a small sweet baked food",
          "example": "Would you choose a Dutch cookie as a pretend snack?",
          "picture": "Dutch cookie plate"
        },
        {
          "word": "cheese",
          "definition": "food made from milk",
          "example": "Look at the cheese in a Dutch market.",
          "picture": "Dutch cheese wheel"
        },
        {
          "word": "sweet",
          "definition": "tasting like sugar",
          "example": "Would you describe a stroopwafel as sweet?",
          "picture": "Dutch stroopwafel waffle"
        },
        {
          "word": "sour",
          "definition": "tasting like a lemon",
          "example": "What sour fruit could go beside Mexican tacos?",
          "picture": "lime fruit slices"
        },
        {
          "word": "crunchy",
          "definition": "making a sound when we bite",
          "example": "What might be crunchy in a French bakery?",
          "picture": "crusty baguette bread"
        },
        {
          "word": "bowl",
          "definition": "a round deep dish",
          "example": "Describe the bowl for Japanese noodles.",
          "picture": "Japanese noodle bowl"
        },
        {
          "word": "spoon",
          "definition": "a thing we use to lift food",
          "example": "Which spoon would you use for pho?",
          "picture": "soup spoon bowl"
        },
        {
          "word": "mix",
          "definition": "put things together",
          "example": "What would you mix into a pretend fruit bowl?",
          "picture": "fruit salad bowl"
        }
      ],
      "stems": [
        "This food is…",
        "I can see an ingredient called…",
        "The colour looks…",
        "It might taste…",
        "Before trying it, I would ask…",
        "My pretend snack has…"
      ]
    }
  },
  "sport-games-kid": {
    "A1": {
      "words": [
        {
          "word": "ball",
          "definition": "a round thing used in games",
          "example": "What ball would you choose for football in Brazil?",
          "picture": "football grass field"
        },
        {
          "word": "kick",
          "definition": "hit with your foot",
          "example": "How could a player kick a football in Japan?",
          "picture": "football kicking practice"
        },
        {
          "word": "throw",
          "definition": "send something with your hand",
          "example": "How would you throw a cricket ball in India?",
          "picture": "cricket ball practice"
        },
        {
          "word": "catch",
          "definition": "stop and hold something moving",
          "example": "What helps you catch a baseball in Japan?",
          "picture": "baseball glove ball"
        },
        {
          "word": "run",
          "definition": "move fast on your feet",
          "example": "Where could you run safely in a London park?",
          "picture": "park running path"
        },
        {
          "word": "jump",
          "definition": "push up off the ground",
          "example": "What jump could fit a pretend playground game?",
          "picture": "playground jumping game"
        },
        {
          "word": "roll",
          "definition": "move by turning over",
          "example": "How would you roll a ball towards a London park target?",
          "picture": "rolling playground ball"
        },
        {
          "word": "turn",
          "definition": "your time to do something",
          "example": "What would you do on your turn in shogi?",
          "picture": "shogi board pieces"
        },
        {
          "word": "rule",
          "definition": "something we follow in a game",
          "example": "Tell one rule of a Japanese kendama game.",
          "picture": "kendama wooden toy"
        },
        {
          "word": "game",
          "definition": "something we play for fun",
          "example": "Which game would you try in a Tokyo park?",
          "picture": "Japanese playground game"
        },
        {
          "word": "toy",
          "definition": "a thing we play with",
          "example": "Describe a Japanese kendama toy.",
          "picture": "Japanese kendama toy"
        },
        {
          "word": "bat",
          "definition": "a stick used to hit a ball",
          "example": "What would you ask about a cricket bat in India?",
          "picture": "cricket bat ball"
        },
        {
          "word": "racket",
          "definition": "a tool for hitting a ball",
          "example": "Look at a tennis racket at Wimbledon.",
          "picture": "tennis racket grass"
        },
        {
          "word": "goal",
          "definition": "the place a ball should go",
          "example": "Where would you put a football goal in Brazil?",
          "picture": "football goal net"
        },
        {
          "word": "hoop",
          "definition": "a large ring",
          "example": "Find a hoop on a basketball court in Japan.",
          "picture": "basketball hoop court"
        },
        {
          "word": "play",
          "definition": "do a game for fun",
          "example": "How could everyone enjoy a game in Kyoto?",
          "picture": "playground game equipment"
        }
      ],
      "stems": [
        "I can move the ball by…",
        "On my turn, I can…",
        "One safe rule is…",
        "This toy has…",
        "I would like to try…",
        "Everyone can join in by…"
      ]
    }
  },
  "robots-kid": {
    "A1": {
      "words": [
        {
          "word": "robot",
          "definition": "a machine that follows instructions",
          "example": "What would you ask about Honda's ASIMO robot?",
          "picture": "ASIMO robot exhibit"
        },
        {
          "word": "machine",
          "definition": "a thing that helps us do work",
          "example": "Which machine would you explore at a Tokyo museum?",
          "picture": "Tokyo machine museum"
        },
        {
          "word": "wheel",
          "definition": "a round part that turns",
          "example": "Find a wheel on a Japanese train model.",
          "picture": "Japanese train wheel"
        },
        {
          "word": "button",
          "definition": "a small thing we press",
          "example": "What could a button on a robot do?",
          "picture": "robot control button"
        },
        {
          "word": "arm",
          "definition": "a long part that can move",
          "example": "What could a robot arm pick up in a factory?",
          "picture": "robot arm factory"
        },
        {
          "word": "leg",
          "definition": "a part used to stand or walk",
          "example": "Look at a leg on an ASIMO robot.",
          "picture": "ASIMO walking robot"
        },
        {
          "word": "hand",
          "definition": "the part at the end of an arm",
          "example": "What could an ASIMO hand hold?",
          "picture": "ASIMO robot hand"
        },
        {
          "word": "light",
          "definition": "something that helps us see",
          "example": "What light would you put on a toy robot?",
          "picture": "robot indicator light"
        },
        {
          "word": "wire",
          "definition": "a thin part that carries power",
          "example": "What would you ask about a wire in a robot display?",
          "picture": "robot wires exhibit"
        },
        {
          "word": "power",
          "definition": "what makes a machine work",
          "example": "Where could a Tokyo train get power?",
          "picture": "electric train wires"
        },
        {
          "word": "code",
          "definition": "instructions for a computer",
          "example": "What code would make a pretend robot turn?",
          "picture": "robot coding blocks"
        },
        {
          "word": "sensor",
          "definition": "a part that notices things",
          "example": "What could a robot sensor notice in a Tokyo lab?",
          "picture": "robot sensor closeup"
        },
        {
          "word": "tool",
          "definition": "something that helps with a job",
          "example": "Which tool could help make a Japanese toy?",
          "picture": "wooden toy tools"
        },
        {
          "word": "build",
          "definition": "put parts together to make something",
          "example": "What would you build for a Tokyo robot show?",
          "picture": "robot model parts"
        },
        {
          "word": "move",
          "definition": "go to another place",
          "example": "How could a model Shinkansen move?",
          "picture": "Shinkansen model train"
        },
        {
          "word": "help",
          "definition": "make a job easier for someone",
          "example": "How could a robot help in a Japanese museum?",
          "picture": "museum guide robot"
        }
      ],
      "stems": [
        "The robot can…",
        "This button could…",
        "A useful part is…",
        "I would build…",
        "The machine needs…",
        "I can give it the instruction…"
      ]
    }
  },
  "weather-nature-kid": {
    "A1": {
      "words": [
        {
          "word": "rain",
          "definition": "water falling from clouds",
          "example": "What would you take for rain in Kyoto?",
          "picture": "Kyoto rainy street"
        },
        {
          "word": "snow",
          "definition": "soft white ice falling from clouds",
          "example": "What would you wear in Hokkaido snow?",
          "picture": "Hokkaido snow trees"
        },
        {
          "word": "cloud",
          "definition": "a white or grey shape in the sky",
          "example": "Describe a cloud above Mount Fuji.",
          "picture": "Mount Fuji clouds"
        },
        {
          "word": "wind",
          "definition": "air that moves",
          "example": "What could show wind in a Tokyo park?",
          "picture": "park leaves wind"
        },
        {
          "word": "sunny",
          "definition": "with lots of light from the Sun",
          "example": "What would you draw on a sunny Kyoto day?",
          "picture": "sunny Kyoto garden"
        },
        {
          "word": "rainbow",
          "definition": "coloured light in an arc in the sky",
          "example": "What colours could a rainbow above Japan show?",
          "picture": "rainbow sky photograph"
        },
        {
          "word": "tree",
          "definition": "a tall plant with a woody stem",
          "example": "Describe a tree in a Kyoto garden.",
          "picture": "Kyoto garden tree"
        },
        {
          "word": "leaf",
          "definition": "a flat green part of a plant",
          "example": "What colour leaf would you notice in Kyoto in autumn?",
          "picture": "Kyoto autumn leaf"
        },
        {
          "word": "flower",
          "definition": "a colourful plant part",
          "example": "What would you notice about a Japanese cherry flower?",
          "picture": "Japanese cherry blossom"
        },
        {
          "word": "seed",
          "definition": "a small thing a new plant grows from",
          "example": "Where could you plant a seed in a Tokyo garden?",
          "picture": "seed soil closeup"
        },
        {
          "word": "river",
          "definition": "water flowing across land",
          "example": "What could you see beside the Sumida River?",
          "picture": "Sumida River Tokyo"
        },
        {
          "word": "mountain",
          "definition": "very high land",
          "example": "What shape is Mount Fuji?",
          "picture": "Mount Fuji mountain"
        },
        {
          "word": "rock",
          "definition": "hard natural ground material",
          "example": "What would you notice about a rock near Mount Fuji?",
          "picture": "Mount Fuji volcanic rock"
        },
        {
          "word": "pond",
          "definition": "a small place of still water",
          "example": "What could live near a Kyoto garden pond?",
          "picture": "Kyoto garden pond"
        },
        {
          "word": "warm",
          "definition": "not cold and not very hot",
          "example": "What might you wear on a warm day in Tokyo?",
          "picture": "sunny Tokyo park"
        },
        {
          "word": "cold",
          "definition": "with little heat",
          "example": "What helps you stay comfortable on a cold Hokkaido day?",
          "picture": "Hokkaido winter clothing"
        }
      ],
      "stems": [
        "The sky looks…",
        "I would wear…",
        "This leaf feels…",
        "A plant needs…",
        "In this nature photo, I can see…",
        "My question about the mountain is…"
      ]
    }
  }
};
