/** Static picture-round data. Source URLs are review provenance, never runtime downloads. */
import type { PictureQuestion } from './picture-question';

/** Reviewed range exclusions include native and known introduced populations or visitors.
 * They prevent other true wild-country answers; they are not a complete distribution atlas. */
export interface AnimalQuestion extends PictureQuestion {
  rangeIso2: readonly string[];
}

export const ANIMAL_QUESTIONS: readonly AnimalQuestion[] = [
  {
    "id": "animal-koala",
    "iso2": "au",
    "level": 1,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Australia",
      "New Zealand",
      "Papua New Guinea",
      "Fiji"
    ],
    "correctIndex": 0,
    "picture": "Koala eucalyptus",
    "fact": "Koalas live in eucalyptus forests in Australia.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Koala",
    "rangeIso2": [
      "au"
    ]
  },
  {
    "id": "animal-common-wombat",
    "iso2": "au",
    "level": 2,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Papua New Guinea",
      "Australia",
      "Fiji",
      "New Zealand"
    ],
    "correctIndex": 1,
    "picture": "Common wombat",
    "fact": "Wombats dig burrows using strong claws.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Common_wombat",
    "rangeIso2": [
      "au"
    ]
  },
  {
    "id": "animal-tasmanian-devil",
    "iso2": "au",
    "level": 2,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Fiji",
      "New Zealand",
      "Australia",
      "Papua New Guinea"
    ],
    "correctIndex": 2,
    "picture": "Tasmanian devil",
    "fact": "Tasmanian devils are meat-eating marsupials native to Australia.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Tasmanian_devil",
    "rangeIso2": [
      "au"
    ]
  },
  {
    "id": "animal-platypus",
    "iso2": "au",
    "level": 1,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "New Zealand",
      "Papua New Guinea",
      "Fiji",
      "Australia"
    ],
    "correctIndex": 3,
    "picture": "Platypus swimming",
    "fact": "Platypuses are Australian mammals that lay eggs.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Platypus",
    "rangeIso2": [
      "au"
    ]
  },
  {
    "id": "animal-quokka",
    "iso2": "au",
    "level": 2,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Australia",
      "Papua New Guinea",
      "Fiji",
      "New Zealand"
    ],
    "correctIndex": 0,
    "picture": "Quokka animal",
    "fact": "Quokkas are small marsupials native to southwestern Australia.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Quokka",
    "rangeIso2": [
      "au"
    ]
  },
  {
    "id": "animal-red-kangaroo",
    "iso2": "au",
    "level": 1,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Fiji",
      "Australia",
      "New Zealand",
      "Papua New Guinea"
    ],
    "correctIndex": 1,
    "picture": "Red kangaroo",
    "fact": "Red kangaroos live in Australia's dry interior.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Red_kangaroo",
    "rangeIso2": [
      "au"
    ]
  },
  {
    "id": "animal-numbat",
    "iso2": "au",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "New Zealand",
      "Papua New Guinea",
      "Australia",
      "Fiji"
    ],
    "correctIndex": 2,
    "picture": "Numbat animal",
    "fact": "Numbats use long tongues to eat termites.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Numbat",
    "rangeIso2": [
      "au"
    ]
  },
  {
    "id": "animal-emu",
    "iso2": "au",
    "level": 1,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Papua New Guinea",
      "Fiji",
      "New Zealand",
      "Australia"
    ],
    "correctIndex": 3,
    "picture": "Emu bird",
    "fact": "Emus are large flightless birds native to Australia.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Emu",
    "rangeIso2": [
      "au"
    ]
  },
  {
    "id": "animal-thorny-devil",
    "iso2": "au",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Australia",
      "Fiji",
      "New Zealand",
      "Papua New Guinea"
    ],
    "correctIndex": 0,
    "picture": "Moloch horridus lizard",
    "fact": "Thorny devils are spiny Australian lizards that eat ants.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Thorny_devil",
    "rangeIso2": [
      "au"
    ]
  },
  {
    "id": "animal-honey-possum",
    "iso2": "au",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "New Zealand",
      "Australia",
      "Papua New Guinea",
      "Fiji"
    ],
    "correctIndex": 1,
    "picture": "Honey possum",
    "fact": "Honey possums feed on nectar and pollen in southwestern Australia.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Honey_possum",
    "rangeIso2": [
      "au"
    ]
  },
  {
    "id": "animal-greater-bilby",
    "iso2": "au",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Papua New Guinea",
      "Fiji",
      "Australia",
      "New Zealand"
    ],
    "correctIndex": 2,
    "picture": "Greater bilby",
    "fact": "Bilbies have long ears and dig burrows in Australia.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Greater_bilby",
    "rangeIso2": [
      "au"
    ]
  },
  {
    "id": "animal-northern-hairy-nosed-wombat",
    "iso2": "au",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Fiji",
      "New Zealand",
      "Papua New Guinea",
      "Australia"
    ],
    "correctIndex": 3,
    "picture": "Northern hairy nosed wombat",
    "fact": "Northern hairy-nosed wombats are rare Australian burrowing marsupials.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Northern_hairy-nosed_wombat",
    "rangeIso2": [
      "au"
    ]
  },
  {
    "id": "animal-southern-hairy-nosed-wombat",
    "iso2": "au",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Australia",
      "New Zealand",
      "Papua New Guinea",
      "Fiji"
    ],
    "correctIndex": 0,
    "picture": "Southern hairy nosed wombat",
    "fact": "Southern hairy-nosed wombats live in dry parts of southern Australia.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Southern_hairy-nosed_wombat",
    "rangeIso2": [
      "au"
    ]
  },
  {
    "id": "animal-western-grey-kangaroo",
    "iso2": "au",
    "level": 2,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Papua New Guinea",
      "Australia",
      "Fiji",
      "New Zealand"
    ],
    "correctIndex": 1,
    "picture": "Western grey kangaroo",
    "fact": "Western grey kangaroos are native to southern Australia.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Western_grey_kangaroo",
    "rangeIso2": [
      "au"
    ]
  },
  {
    "id": "animal-kiwi",
    "iso2": "nz",
    "level": 1,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Fiji",
      "Australia",
      "New Zealand",
      "Papua New Guinea"
    ],
    "correctIndex": 2,
    "picture": "Kiwi bird",
    "fact": "Kiwi are flightless birds native to New Zealand.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Kiwi_(bird)",
    "rangeIso2": [
      "nz"
    ]
  },
  {
    "id": "animal-kakapo",
    "iso2": "nz",
    "level": 2,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Australia",
      "Papua New Guinea",
      "Fiji",
      "New Zealand"
    ],
    "correctIndex": 3,
    "picture": "Kakapo parrot",
    "fact": "Kākāpō are flightless, nocturnal parrots from New Zealand.",
    "sourceUrl": "https://en.wikipedia.org/wiki/K%C4%81k%C4%81p%C5%8D",
    "rangeIso2": [
      "nz"
    ]
  },
  {
    "id": "animal-kea",
    "iso2": "nz",
    "level": 2,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "New Zealand",
      "Papua New Guinea",
      "Fiji",
      "Australia"
    ],
    "correctIndex": 0,
    "picture": "Kea parrot",
    "fact": "Kea are mountain parrots native to New Zealand.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Kea",
    "rangeIso2": [
      "nz"
    ]
  },
  {
    "id": "animal-takahe",
    "iso2": "nz",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Fiji",
      "New Zealand",
      "Australia",
      "Papua New Guinea"
    ],
    "correctIndex": 1,
    "picture": "Takahe bird",
    "fact": "Takahē are large flightless birds from New Zealand.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Takah%C4%93",
    "rangeIso2": [
      "nz"
    ]
  },
  {
    "id": "animal-tuatara",
    "iso2": "nz",
    "level": 2,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Australia",
      "Papua New Guinea",
      "New Zealand",
      "Fiji"
    ],
    "correctIndex": 2,
    "picture": "Tuatara reptile",
    "fact": "Tuatara are New Zealand reptiles from an ancient lineage.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Tuatara",
    "rangeIso2": [
      "nz"
    ]
  },
  {
    "id": "animal-hector-s-dolphin",
    "iso2": "nz",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Papua New Guinea",
      "Fiji",
      "Australia",
      "New Zealand"
    ],
    "correctIndex": 3,
    "picture": "Hectors dolphin",
    "fact": "Hector's dolphins live in coastal waters around New Zealand.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Hector's_dolphin",
    "rangeIso2": [
      "nz"
    ]
  },
  {
    "id": "animal-yellow-eyed-penguin",
    "iso2": "nz",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "New Zealand",
      "Fiji",
      "Australia",
      "Papua New Guinea"
    ],
    "correctIndex": 0,
    "picture": "Yellow eyed penguin",
    "fact": "Yellow-eyed penguins breed in New Zealand.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Yellow-eyed_penguin",
    "rangeIso2": [
      "nz"
    ]
  },
  {
    "id": "animal-new-zealand-falcon",
    "iso2": "nz",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Australia",
      "New Zealand",
      "Papua New Guinea",
      "Fiji"
    ],
    "correctIndex": 1,
    "picture": "New Zealand falcon",
    "fact": "The New Zealand falcon hunts birds and other small animals.",
    "sourceUrl": "https://en.wikipedia.org/wiki/New_Zealand_falcon",
    "rangeIso2": [
      "nz"
    ]
  },
  {
    "id": "animal-ring-tailed-lemur",
    "iso2": "mg",
    "level": 1,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Chad",
      "Mali",
      "Madagascar",
      "Niger"
    ],
    "correctIndex": 2,
    "picture": "Ring tailed lemur",
    "fact": "Ring-tailed lemurs are native to Madagascar.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Ring-tailed_lemur",
    "rangeIso2": [
      "mg"
    ]
  },
  {
    "id": "animal-aye-aye",
    "iso2": "mg",
    "level": 2,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Mali",
      "Niger",
      "Rwanda",
      "Madagascar"
    ],
    "correctIndex": 3,
    "picture": "Aye aye lemur",
    "fact": "Aye-ayes use long fingers to find food in wood.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Aye-aye",
    "rangeIso2": [
      "mg"
    ]
  },
  {
    "id": "animal-indri",
    "iso2": "mg",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Madagascar",
      "Niger",
      "Rwanda",
      "Ivory Coast"
    ],
    "correctIndex": 0,
    "picture": "Indri lemur",
    "fact": "Indri are large lemurs from Madagascar's forests.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Indri",
    "rangeIso2": [
      "mg"
    ]
  },
  {
    "id": "animal-verreaux-s-sifaka",
    "iso2": "mg",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Rwanda",
      "Madagascar",
      "Ivory Coast",
      "DR Congo"
    ],
    "correctIndex": 1,
    "picture": "Verreaux sifaka",
    "fact": "Verreaux's sifakas leap between trees in Madagascar.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Verreaux's_sifaka",
    "rangeIso2": [
      "mg"
    ]
  },
  {
    "id": "animal-fossa",
    "iso2": "mg",
    "level": 2,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Ivory Coast",
      "DR Congo",
      "Madagascar",
      "Mauritania"
    ],
    "correctIndex": 2,
    "picture": "Fossa animal",
    "fact": "Fossas are meat-eating mammals native to Madagascar.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Fossa_(animal)",
    "rangeIso2": [
      "mg"
    ]
  },
  {
    "id": "animal-madagascar-tomato-frog",
    "iso2": "mg",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "DR Congo",
      "Mauritania",
      "South Africa",
      "Madagascar"
    ],
    "correctIndex": 3,
    "picture": "Madagascar tomato frog",
    "fact": "Madagascar tomato frogs can have bright orange-red bodies.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Dyscophus_antongilii",
    "rangeIso2": [
      "mg"
    ]
  },
  {
    "id": "animal-giraffe-weevil",
    "iso2": "mg",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Madagascar",
      "Mauritania",
      "South Africa",
      "Namibia"
    ],
    "correctIndex": 0,
    "picture": "Trachelophorus giraffa",
    "fact": "Giraffe weevils have long necks and live in Madagascar.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Giraffe_weevil",
    "rangeIso2": [
      "mg"
    ]
  },
  {
    "id": "animal-radiated-tortoise",
    "iso2": "mg",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "South Africa",
      "Madagascar",
      "Namibia",
      "Botswana"
    ],
    "correctIndex": 1,
    "picture": "Radiated tortoise",
    "fact": "Radiated tortoises have star-like patterns on their shells.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Radiated_tortoise",
    "rangeIso2": [
      "mg",
      "re",
      "mu"
    ]
  },
  {
    "id": "animal-satanic-leaf-tailed-gecko",
    "iso2": "mg",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Namibia",
      "Botswana",
      "Madagascar",
      "Zimbabwe"
    ],
    "correctIndex": 2,
    "picture": "Satanic leaf tailed gecko",
    "fact": "This Madagascan gecko's tail resembles a dry leaf.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Uroplatus_phantasticus",
    "rangeIso2": [
      "mg"
    ]
  },
  {
    "id": "animal-madagascar-pochard",
    "iso2": "mg",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Botswana",
      "Zimbabwe",
      "Zambia",
      "Madagascar"
    ],
    "correctIndex": 3,
    "picture": "Madagascar pochard",
    "fact": "The Madagascar pochard is a rare diving duck.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Madagascar_pochard",
    "rangeIso2": [
      "mg"
    ]
  },
  {
    "id": "animal-giant-panda",
    "iso2": "cn",
    "level": 1,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "China",
      "Georgia",
      "Armenia",
      "Japan"
    ],
    "correctIndex": 0,
    "picture": "Giant panda bamboo",
    "fact": "Giant pandas live wild in China's mountain forests.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Giant_panda",
    "rangeIso2": [
      "cn"
    ]
  },
  {
    "id": "animal-golden-snub-nosed-monkey",
    "iso2": "cn",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Armenia",
      "China",
      "Japan",
      "South Korea"
    ],
    "correctIndex": 1,
    "picture": "Golden snub nosed monkey",
    "fact": "Golden snub-nosed monkeys live in mountain forests in China.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Golden_snub-nosed_monkey",
    "rangeIso2": [
      "cn"
    ]
  },
  {
    "id": "animal-chinese-alligator",
    "iso2": "cn",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Japan",
      "South Korea",
      "China",
      "Mongolia"
    ],
    "correctIndex": 2,
    "picture": "Chinese alligator",
    "fact": "Chinese alligators live in the lower Yangtze region.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Chinese_alligator",
    "rangeIso2": [
      "cn"
    ]
  },
  {
    "id": "animal-komodo-dragon",
    "iso2": "id",
    "level": 1,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Vietnam",
      "Philippines",
      "Malaysia",
      "Indonesia"
    ],
    "correctIndex": 3,
    "picture": "Komodo dragon",
    "fact": "Komodo dragons live on several Indonesian islands.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Komodo_dragon",
    "rangeIso2": [
      "id"
    ]
  },
  {
    "id": "animal-bali-myna",
    "iso2": "id",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Indonesia",
      "Philippines",
      "Malaysia",
      "Cambodia"
    ],
    "correctIndex": 0,
    "picture": "Bali myna",
    "fact": "The Bali myna is a white bird native to Bali.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Bali_myna",
    "rangeIso2": [
      "id"
    ]
  },
  {
    "id": "animal-javan-rhinoceros",
    "iso2": "id",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Malaysia",
      "Indonesia",
      "Cambodia",
      "Laos"
    ],
    "correctIndex": 1,
    "picture": "Javan rhinoceros",
    "fact": "Surviving wild Javan rhinoceroses live on Java.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Javan_rhinoceros",
    "rangeIso2": [
      "id"
    ]
  },
  {
    "id": "animal-japanese-macaque",
    "iso2": "jp",
    "level": 2,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Thailand",
      "Vietnam",
      "Japan",
      "Indonesia"
    ],
    "correctIndex": 2,
    "picture": "Japanese macaque",
    "fact": "Japanese macaques are also called snow monkeys.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Japanese_macaque",
    "rangeIso2": [
      "jp",
      "us"
    ]
  },
  {
    "id": "animal-japanese-serow",
    "iso2": "jp",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Vietnam",
      "Indonesia",
      "Philippines",
      "Japan"
    ],
    "correctIndex": 3,
    "picture": "Japanese serow",
    "fact": "Japanese serows are goat-antelopes found in Japanese forests.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Japanese_serow",
    "rangeIso2": [
      "jp"
    ]
  },
  {
    "id": "animal-philippine-eagle",
    "iso2": "ph",
    "level": 2,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Philippines",
      "Myanmar",
      "Brunei",
      "Japan"
    ],
    "correctIndex": 0,
    "picture": "Philippine eagle",
    "fact": "The Philippine eagle lives in forests on several Philippine islands.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Philippine_eagle",
    "rangeIso2": [
      "ph"
    ]
  },
  {
    "id": "animal-philippine-tarsier",
    "iso2": "ph",
    "level": 2,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Brunei",
      "Philippines",
      "Japan",
      "China"
    ],
    "correctIndex": 1,
    "picture": "Philippine tarsier",
    "fact": "Philippine tarsiers are small primates with very large eyes.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Philippine_tarsier",
    "rangeIso2": [
      "ph"
    ]
  },
  {
    "id": "animal-ethiopian-wolf",
    "iso2": "et",
    "level": 2,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Senegal",
      "Cameroon",
      "Ethiopia",
      "Libya"
    ],
    "correctIndex": 2,
    "picture": "Ethiopian wolf",
    "fact": "Ethiopian wolves hunt rodents in high mountain grasslands.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Ethiopian_wolf",
    "rangeIso2": [
      "et"
    ]
  },
  {
    "id": "animal-gelada",
    "iso2": "et",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Cameroon",
      "Libya",
      "Sudan",
      "Ethiopia"
    ],
    "correctIndex": 3,
    "picture": "Gelada monkey",
    "fact": "Geladas eat mainly grasses in Ethiopia's highlands.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Gelada",
    "rangeIso2": [
      "et"
    ]
  },
  {
    "id": "animal-american-alligator",
    "iso2": "us",
    "level": 2,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "United States",
      "Cuba",
      "Jamaica",
      "Costa Rica"
    ],
    "correctIndex": 0,
    "picture": "American alligator",
    "fact": "American alligators live in the southeastern United States.",
    "sourceUrl": "https://en.wikipedia.org/wiki/American_alligator",
    "rangeIso2": [
      "us"
    ]
  },
  {
    "id": "animal-hawaiian-monk-seal",
    "iso2": "us",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Jamaica",
      "United States",
      "Costa Rica",
      "Panama"
    ],
    "correctIndex": 1,
    "picture": "Hawaiian monk seal",
    "fact": "Hawaiian monk seals live around the Hawaiian Islands.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Hawaiian_monk_seal",
    "rangeIso2": [
      "us"
    ]
  },
  {
    "id": "animal-asiatic-lion",
    "iso2": "in",
    "level": 2,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Malaysia",
      "Turkey",
      "India",
      "Saudi Arabia"
    ],
    "correctIndex": 2,
    "picture": "Asiatic lion",
    "fact": "Wild Asiatic lions live in India's Gujarat state.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Asiatic_lion",
    "rangeIso2": [
      "in"
    ]
  },
  {
    "id": "animal-lion-tailed-macaque",
    "iso2": "in",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Turkey",
      "Saudi Arabia",
      "United Arab Emirates",
      "India"
    ],
    "correctIndex": 3,
    "picture": "Lion tailed macaque",
    "fact": "Lion-tailed macaques live in rainforests of India's Western Ghats.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Lion-tailed_macaque",
    "rangeIso2": [
      "in"
    ]
  },
  {
    "id": "animal-nilgiri-tahr",
    "iso2": "in",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "India",
      "Saudi Arabia",
      "United Arab Emirates",
      "Mongolia"
    ],
    "correctIndex": 0,
    "picture": "Nilgiri tahr",
    "fact": "Nilgiri tahr live on grassy slopes in India's Western Ghats.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Nilgiri_tahr",
    "rangeIso2": [
      "in"
    ]
  },
  {
    "id": "animal-purple-faced-langur",
    "iso2": "lk",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "United Arab Emirates",
      "Sri Lanka",
      "Mongolia",
      "Cambodia"
    ],
    "correctIndex": 1,
    "picture": "Purple faced langur",
    "fact": "Purple-faced langurs live in Sri Lanka.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Purple-faced_langur",
    "rangeIso2": [
      "lk"
    ]
  },
  {
    "id": "animal-proboscis-monkey",
    "iso2": "id",
    "level": 2,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Iran",
      "Iraq",
      "Indonesia",
      "Israel"
    ],
    "correctIndex": 2,
    "picture": "Proboscis monkey",
    "fact": "Proboscis monkeys live on Borneo, shared by Indonesia, Malaysia, and Brunei.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Proboscis_monkey",
    "rangeIso2": [
      "id",
      "my",
      "bn"
    ]
  },
  {
    "id": "animal-sumatran-orangutan",
    "iso2": "id",
    "level": 2,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Nepal",
      "Sri Lanka",
      "Mongolia",
      "Indonesia"
    ],
    "correctIndex": 3,
    "picture": "Sumatran orangutan",
    "fact": "Sumatran orangutans live in forests on Sumatra.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Sumatran_orangutan",
    "rangeIso2": [
      "id"
    ]
  },
  {
    "id": "animal-bornean-orangutan",
    "iso2": "my",
    "level": 2,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Malaysia",
      "Iran",
      "Iraq",
      "Israel"
    ],
    "correctIndex": 0,
    "picture": "Bornean orangutan",
    "fact": "Bornean orangutans live wild in both Malaysia and Indonesia.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Bornean_orangutan",
    "rangeIso2": [
      "my",
      "id"
    ]
  },
  {
    "id": "animal-cape-mountain-zebra",
    "iso2": "za",
    "level": 2,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Niger",
      "South Africa",
      "Rwanda",
      "Ivory Coast"
    ],
    "correctIndex": 1,
    "picture": "Cape mountain zebra",
    "fact": "Cape mountain zebras are native to South Africa.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Cape_mountain_zebra",
    "rangeIso2": [
      "za"
    ]
  },
  {
    "id": "animal-african-penguin",
    "iso2": "za",
    "level": 2,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Zimbabwe",
      "Zambia",
      "South Africa",
      "Egypt"
    ],
    "correctIndex": 2,
    "picture": "African penguin",
    "fact": "African penguins breed along the coasts of South Africa and Namibia.",
    "sourceUrl": "https://en.wikipedia.org/wiki/African_penguin",
    "rangeIso2": [
      "za",
      "na",
      "ao",
      "mz"
    ]
  },
  {
    "id": "animal-riverine-rabbit",
    "iso2": "za",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Ivory Coast",
      "DR Congo",
      "Mauritania",
      "South Africa"
    ],
    "correctIndex": 3,
    "picture": "Riverine rabbit",
    "fact": "Riverine rabbits live in South Africa's Karoo region.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Riverine_rabbit",
    "rangeIso2": [
      "za"
    ]
  },
  {
    "id": "animal-okapi",
    "iso2": "cd",
    "level": 2,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "DR Congo",
      "Namibia",
      "Rwanda",
      "Cameroon"
    ],
    "correctIndex": 0,
    "picture": "Okapi forest",
    "fact": "Okapi live in forests of DR Congo.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Okapi",
    "rangeIso2": [
      "cd"
    ]
  },
  {
    "id": "animal-bonobo",
    "iso2": "cd",
    "level": 2,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Rwanda",
      "DR Congo",
      "Cameroon",
      "Nigeria"
    ],
    "correctIndex": 1,
    "picture": "Bonobo ape",
    "fact": "Bonobos live wild only in DR Congo.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Bonobo",
    "rangeIso2": [
      "cd"
    ]
  },
  {
    "id": "animal-congo-peafowl",
    "iso2": "cd",
    "level": 3,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "Cameroon",
      "Nigeria",
      "DR Congo",
      "Ivory Coast"
    ],
    "correctIndex": 2,
    "picture": "Congo peafowl",
    "fact": "Congo peafowl are forest birds native to DR Congo.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Congo_peafowl",
    "rangeIso2": [
      "cd"
    ]
  },
  {
    "id": "animal-mountain-gorilla",
    "iso2": "rw",
    "level": 2,
    "prompt": "Where does this animal live in the wild?",
    "options": [
      "South Africa",
      "Nigeria",
      "Morocco",
      "Rwanda"
    ],
    "correctIndex": 3,
    "picture": "Mountain gorilla",
    "fact": "Mountain gorillas live wild in Rwanda, Uganda, and DR Congo.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Mountain_gorilla",
    "rangeIso2": [
      "rw",
      "ug",
      "cd"
    ]
  },
];
