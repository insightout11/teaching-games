/** Resident wildlife examples for every route rank through 150 (Sudan).
 * A resident population need not be visible year-round, and individuals can move.
 * Read scope before displaying a place claim: oceans, countries and cities contain
 * different habitats. City entries may describe explicitly named metropolitan fringes.
 * Cordillera Oriental is withheld because the bare name is ambiguous.
 * Ice-surface microfauna replace misleading large-animal claims on Greenland ice.
 * Reintroductions and established introduced wild populations are labelled in scope.
 * No runtime download or species inference. Sources checked 20 October 2026.
 */
export type RegionAnimal = {
 readonly animal: string;
 readonly scientificName: string;
 readonly fact: string;
 readonly photoSearch: string;
 readonly source: string;
};
export type RegionAnimals = {
 readonly name: string;
 readonly rank: number;
 readonly aliases: readonly string[];
 readonly scope: string;
 readonly animals: readonly RegionAnimal[];
 readonly sources: readonly string[];
};

const SPECIES = {
  "redfox": {
    "animal": "Red fox",
    "scientificName": "Vulpes vulpes",
    "fact": "A fox uses its bushy tail for balance and warmth.",
    "photoSearch": "red fox wildlife",
    "source": "https://animaldiversity.org/accounts/Vulpes_vulpes/"
  },
  "tiger": {
    "animal": "Tiger",
    "scientificName": "Panthera tigris",
    "fact": "A tiger's stripes help break up its outline in vegetation.",
    "photoSearch": "wild tiger stripes",
    "source": "https://animaldiversity.org/accounts/Panthera_tigris/"
  },
  "orca": {
    "animal": "Killer whale",
    "scientificName": "Orcinus orca",
    "fact": "Killer whales live in social groups called pods.",
    "photoSearch": "killer whale pod",
    "source": "https://animaldiversity.org/accounts/Orcinus_orca/"
  },
  "sperm": {
    "animal": "Sperm whale",
    "scientificName": "Physeter catodon",
    "fact": "Sperm whales dive deep to find squid.",
    "photoSearch": "sperm whale ocean",
    "source": "https://animaldiversity.org/accounts/Physeter_catodon/"
  },
  "boar": {
    "animal": "Wild boar",
    "scientificName": "Sus scrofa",
    "fact": "Wild boar use their snouts to dig for food.",
    "photoSearch": "wild boar woodland",
    "source": "https://animaldiversity.org/accounts/Sus_scrofa/"
  },
  "brown": {
    "animal": "Brown bear",
    "scientificName": "Ursus arctos",
    "fact": "Brown bears eat both plants and animals.",
    "photoSearch": "brown bear wildlife",
    "source": "https://animaldiversity.org/accounts/Ursus_arctos/"
  },
  "chipmunk": {
    "animal": "Siberian chipmunk",
    "scientificName": "Tamias sibiricus",
    "fact": "Siberian chipmunks carry food in cheek pouches.",
    "photoSearch": "Siberian chipmunk cheeks",
    "source": "https://animaldiversity.org/accounts/Tamias_sibiricus/"
  },
  "redpanda": {
    "animal": "Red panda",
    "scientificName": "Ailurus fulgens",
    "fact": "Red pandas use a wrist bone to help hold bamboo.",
    "photoSearch": "red panda bamboo",
    "source": "https://animaldiversity.org/accounts/Ailurus_fulgens/"
  },
  "hare": {
    "animal": "European hare",
    "scientificName": "Lepus europaeus",
    "fact": "Hares rest above ground rather than in rabbit burrows.",
    "photoSearch": "European hare grass",
    "source": "https://animaldiversity.org/accounts/Lepus_europaeus/"
  },
  "beaver": {
    "animal": "North American beaver",
    "scientificName": "Castor canadensis",
    "fact": "Beavers use branches and mud to build their lodges.",
    "photoSearch": "North American beaver",
    "source": "https://animaldiversity.org/accounts/Castor_canadensis/"
  },
  "raccoon": {
    "animal": "Raccoon",
    "scientificName": "Procyon lotor",
    "fact": "A raccoon has sensitive front paws for finding food.",
    "photoSearch": "raccoon front paws",
    "source": "https://animaldiversity.org/accounts/Procyon_lotor/"
  },
  "bottlenose": {
    "animal": "Common bottlenose dolphin",
    "scientificName": "Tursiops truncatus",
    "fact": "Bottlenose dolphins use echoes to find food.",
    "photoSearch": "bottlenose dolphin swimming",
    "source": "https://animaldiversity.org/accounts/Tursiops_truncatus/"
  },
  "afelephant": {
    "animal": "African savanna elephant",
    "scientificName": "Loxodonta africana",
    "fact": "An elephant's trunk is both its nose and a tool for grasping.",
    "photoSearch": "African savanna elephant",
    "source": "https://animaldiversity.org/accounts/Loxodonta_africana/"
  },
  "lion": {
    "animal": "Lion",
    "scientificName": "Panthera leo",
    "fact": "Lions live in groups called prides.",
    "photoSearch": "lion pride resting",
    "source": "https://animaldiversity.org/accounts/Panthera_leo/"
  },
  "blackbear": {
    "animal": "American black bear",
    "scientificName": "Ursus americanus",
    "fact": "Black bears climb trees to find food and escape danger.",
    "photoSearch": "American black bear",
    "source": "https://animaldiversity.org/accounts/Ursus_americanus/"
  },
  "elephant": {
    "animal": "Asian elephant",
    "scientificName": "Elephas maximus",
    "fact": "Asian elephants use their trunks to pick up food.",
    "photoSearch": "Asian elephant forest",
    "source": "https://animaldiversity.org/accounts/Elephas_maximus/"
  },
  "canadalynx": {
    "animal": "Canada lynx",
    "scientificName": "Lynx canadensis",
    "fact": "A lynx's broad paws help it travel over snow.",
    "photoSearch": "Canada lynx snow",
    "source": "https://animaldiversity.org/accounts/Lynx_canadensis/"
  },
  "jaguar": {
    "animal": "Jaguar",
    "scientificName": "Panthera onca",
    "fact": "Jaguars are strong swimmers as well as climbers.",
    "photoSearch": "jaguar river bank",
    "source": "https://animaldiversity.org/accounts/Panthera_onca/"
  },
  "capybara": {
    "animal": "Capybara",
    "scientificName": "Hydrochoerus hydrochaeris",
    "fact": "Capybaras have partly webbed feet for swimming.",
    "photoSearch": "capybara river wildlife",
    "source": "https://animaldiversity.org/accounts/Hydrochoerus_hydrochaeris/"
  },
  "condor": {
    "animal": "Andean condor",
    "scientificName": "Vultur gryphus",
    "fact": "Condors soar on rising air to save energy.",
    "photoSearch": "Andean condor soaring",
    "source": "https://animaldiversity.org/accounts/Vultur_gryphus/"
  },
  "puma": {
    "animal": "Puma",
    "scientificName": "Puma concolor",
    "fact": "Pumas can live in habitats from forests to mountains.",
    "photoSearch": "puma mountain wildlife",
    "source": "https://animaldiversity.org/accounts/Puma_concolor/"
  },
  "fennec": {
    "animal": "Fennec fox",
    "scientificName": "Vulpes zerda",
    "fact": "A fennec's large ears help it lose heat.",
    "photoSearch": "fennec fox ears",
    "source": "https://animaldiversity.org/accounts/Vulpes_zerda/"
  },
  "sandcat": {
    "animal": "Sand cat",
    "scientificName": "Felis margarita",
    "fact": "Fur on a sand cat's feet helps protect it from hot ground.",
    "photoSearch": "sand cat desert",
    "source": "https://animaldiversity.org/accounts/Felis_margarita/"
  },
  "saiga": {
    "animal": "Saiga",
    "scientificName": "Saiga tatarica",
    "fact": "A saiga's large nose helps filter dust.",
    "photoSearch": "saiga antelope nose",
    "source": "https://animaldiversity.org/accounts/Saiga_tatarica/"
  },
  "corsac": {
    "animal": "Corsac fox",
    "scientificName": "Vulpes corsac",
    "fact": "Corsac foxes use burrows for shelter on open steppe.",
    "photoSearch": "corsac fox steppe",
    "source": "https://animaldiversity.org/accounts/Vulpes_corsac/"
  },
  "badger": {
    "animal": "European badger",
    "scientificName": "Meles meles",
    "fact": "Badgers live in underground homes called setts.",
    "photoSearch": "European badger woodland",
    "source": "https://animaldiversity.org/accounts/Meles_meles/"
  },
  "ibexspain": {
    "animal": "Iberian ibex",
    "scientificName": "Capra pyrenaica",
    "fact": "Iberian ibex are skilled at climbing rocky slopes.",
    "photoSearch": "Iberian ibex rocks",
    "source": "https://animaldiversity.org/accounts/Capra_pyrenaica/"
  },
  "iberianlynx": {
    "animal": "Iberian lynx",
    "scientificName": "Lynx pardinus",
    "fact": "Wild rabbits are the Iberian lynx's main food.",
    "photoSearch": "Iberian lynx wildlife",
    "source": "https://animaldiversity.org/accounts/Lynx_pardinus/"
  },
  "pheasant": {
    "animal": "Common pheasant",
    "scientificName": "Phasianus colchicus",
    "fact": "Male common pheasants have much brighter feathers than females.",
    "photoSearch": "common pheasant male",
    "source": "https://animaldiversity.org/accounts/Phasianus_colchicus/"
  },
  "reefshark": {
    "animal": "Blacktip reef shark",
    "scientificName": "Carcharhinus melanopterus",
    "fact": "Blacktip reef sharks often swim in shallow tropical water.",
    "photoSearch": "blacktip reef shark",
    "source": "https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/blacktip-reef-shark/"
  },
  "greenturtle": {
    "animal": "Green turtle",
    "scientificName": "Chelonia mydas",
    "fact": "Adult green turtles often feed on seagrass and algae.",
    "photoSearch": "green turtle seagrass",
    "source": "https://animaldiversity.org/accounts/Chelonia_mydas/"
  },
  "pallas": {
    "animal": "Pallas's cat",
    "scientificName": "Otocolobus manul",
    "fact": "Pallas's cats have long, dense fur for cold conditions.",
    "photoSearch": "Pallas cat wildlife",
    "source": "https://www.catsg.org/living-species-pallasscat"
  },
  "orangutan": {
    "animal": "Sumatran orangutan",
    "scientificName": "Pongo abelii",
    "fact": "Sumatran orangutans spend much of their time in trees.",
    "photoSearch": "Sumatran orangutan forest",
    "source": "https://animaldiversity.org/accounts/Pongo_abelii/"
  },
  "siamang": {
    "animal": "Siamang",
    "scientificName": "Symphalangus syndactylus",
    "fact": "Siamangs use an inflatable throat sac when calling.",
    "photoSearch": "siamang throat sac",
    "source": "https://animaldiversity.org/accounts/Symphalangus_syndactylus/"
  },
  "dorcas": {
    "animal": "Dorcas gazelle",
    "scientificName": "Gazella dorcas",
    "fact": "Dorcas gazelles get much of their water from the plants they eat.",
    "photoSearch": "dorcas gazelle desert",
    "source": "https://animaldiversity.org/accounts/Gazella_dorcas/"
  },
  "patas": {
    "animal": "Patas monkey",
    "scientificName": "Erythrocebus patas",
    "fact": "Patas monkeys spend much of their time on the ground.",
    "photoSearch": "patas monkey grassland",
    "source": "https://animaldiversity.org/accounts/Erythrocebus_patas/"
  },
  "kangaroo": {
    "animal": "Red kangaroo",
    "scientificName": "Macropus rufus",
    "fact": "A kangaroo's long tail helps it balance while hopping.",
    "photoSearch": "red kangaroo hopping",
    "source": "https://animaldiversity.org/accounts/Macropus_rufus/"
  },
  "wombat": {
    "animal": "Common wombat",
    "scientificName": "Vombatus ursinus",
    "fact": "Wombats dig burrows with strong claws.",
    "photoSearch": "common wombat burrow",
    "source": "https://animaldiversity.org/accounts/Vombatus_ursinus/"
  },
  "camel": {
    "animal": "Wild Bactrian camel",
    "scientificName": "Camelus ferus",
    "fact": "Wild camels survive in the Gobi deserts of China and Mongolia.",
    "photoSearch": "wild Bactrian camel",
    "source": "https://www.wildcamels.com/camelus-ferus/"
  },
  "snowleopard": {
    "animal": "Snow leopard",
    "scientificName": "Uncia uncia",
    "fact": "A snow leopard uses its long tail for balance.",
    "photoSearch": "snow leopard mountains",
    "source": "https://animaldiversity.org/accounts/Uncia_uncia/"
  },
  "markhor": {
    "animal": "Markhor",
    "scientificName": "Capra falconeri",
    "fact": "A markhor has long spiral-shaped horns.",
    "photoSearch": "markhor spiral horns",
    "source": "https://animaldiversity.org/accounts/Capra_falconeri/"
  },
  "tardigrade": {
    "animal": "Tardigrades",
    "scientificName": "Tardigrada",
    "fact": "Tiny tardigrades inhabit melt holes on the Greenland ice surface.",
    "photoSearch": "Greenland tardigrade microscope",
    "source": "https://www.bas.ac.uk/data/our-data/publication/tardigrades-and-other-cryoconite-biota-on-the-greenland-ice-sheet/"
  },
  "rotifer": {
    "animal": "Rotifers",
    "scientificName": "Rotifera",
    "fact": "Rotifers are microscopic animals found in Greenland ice-surface melt holes.",
    "photoSearch": "cryoconite rotifer microscope",
    "source": "https://www.bas.ac.uk/data/our-data/publication/tardigrades-and-other-cryoconite-biota-on-the-greenland-ice-sheet/"
  },
  "dugong": {
    "animal": "Dugong",
    "scientificName": "Dugong dugon",
    "fact": "Dugongs graze on seagrass in shallow coastal water.",
    "photoSearch": "dugong seagrass meadow",
    "source": "https://animaldiversity.org/accounts/Dugong_dugon/"
  },
  "wildyak": {
    "animal": "Wild yak",
    "scientificName": "Bos mutus",
    "fact": "Wild yaks graze on high Tibetan Plateau grasslands.",
    "photoSearch": "wild yak plateau",
    "source": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6402692/"
  },
  "antelope": {
    "animal": "Tibetan antelope",
    "scientificName": "Pantholops hodgsonii",
    "fact": "Tibetan antelope live on high, open plateau country.",
    "photoSearch": "Tibetan antelope plateau",
    "source": "https://animaldiversity.org/accounts/Pantholops_hodgsonii/"
  },
  "grayseal": {
    "animal": "Gray seal",
    "scientificName": "Halichoerus grypus",
    "fact": "Gray seals rest on beaches and rocky shores.",
    "photoSearch": "gray seal coast",
    "source": "https://www.fisheries.noaa.gov/species/gray-seal"
  },
  "porpoise": {
    "animal": "Harbour porpoise",
    "scientificName": "Phocoena phocoena",
    "fact": "Harbour porpoises have a small triangular dorsal fin.",
    "photoSearch": "harbour porpoise sea",
    "source": "https://animaldiversity.org/accounts/Phocoena_phocoena/"
  },
  "ibex": {
    "animal": "Siberian ibex",
    "scientificName": "Capra sibirica",
    "fact": "Siberian ibex use steep rocky ground as shelter.",
    "photoSearch": "Siberian ibex mountain",
    "source": "https://animaldiversity.org/accounts/Capra_sibirica/"
  },
  "gibbon": {
    "animal": "Lar gibbon",
    "scientificName": "Hylobates lar",
    "fact": "Gibbons swing through trees using their long arms.",
    "photoSearch": "lar gibbon canopy",
    "source": "https://animaldiversity.org/accounts/Hylobates_lar/"
  },
  "sambar": {
    "animal": "Sambar deer",
    "scientificName": "Rusa unicolor",
    "fact": "Sambar deer often feed in the evening or at night.",
    "photoSearch": "sambar deer forest",
    "source": "https://animaldiversity.org/accounts/Rusa_unicolor/"
  },
  "leopard": {
    "animal": "Leopard",
    "scientificName": "Panthera pardus",
    "fact": "Leopards can carry food into trees.",
    "photoSearch": "wild leopard tree",
    "source": "https://animaldiversity.org/accounts/Panthera_pardus/"
  },
  "bezoar": {
    "animal": "Wild goat",
    "scientificName": "Capra aegagrus",
    "fact": "Wild goats are agile on steep rocky slopes.",
    "photoSearch": "wild bezoar goat",
    "source": "https://doi.org/10.2305/IUCN.UK.2020-2.RLTS.T3786A22145942.en"
  },
  "eurasianlynx": {
    "animal": "Eurasian lynx",
    "scientificName": "Lynx lynx",
    "fact": "Eurasian lynx have short tails with black tips.",
    "photoSearch": "Eurasian lynx forest",
    "source": "https://animaldiversity.org/accounts/Lynx_lynx/"
  },
  "oryx": {
    "animal": "Arabian oryx",
    "scientificName": "Oryx leucoryx",
    "fact": "Arabian oryx can travel far to find fresh grazing.",
    "photoSearch": "Arabian oryx desert",
    "source": "https://animaldiversity.org/accounts/Oryx_leucoryx/"
  },
  "mountaingoat": {
    "animal": "Mountain goat",
    "scientificName": "Oreamnos americanus",
    "fact": "Mountain goats have gripping hooves for rocky cliffs.",
    "photoSearch": "mountain goat cliff",
    "source": "https://animaldiversity.org/accounts/Oreamnos_americanus/"
  },
  "asiaticbear": {
    "animal": "Asiatic black bear",
    "scientificName": "Ursus thibetanus",
    "fact": "Most Asiatic black bears have a pale chest marking.",
    "photoSearch": "Asiatic black bear",
    "source": "https://animaldiversity.org/accounts/Ursus_thibetanus/"
  },
  "rhesus": {
    "animal": "Rhesus macaque",
    "scientificName": "Macaca mulatta",
    "fact": "Rhesus macaques live in social groups.",
    "photoSearch": "rhesus macaque group",
    "source": "https://animaldiversity.org/accounts/Macaca_mulatta/"
  },
  "gharial": {
    "animal": "Gharial",
    "scientificName": "Gavialis gangeticus",
    "fact": "A gharial's long narrow snout is suited to catching fish.",
    "photoSearch": "gharial river snout",
    "source": "https://animaldiversity.org/accounts/Gavialis_gangeticus/"
  },
  "ganges": {
    "animal": "Ganges river dolphin",
    "scientificName": "Platanista gangetica",
    "fact": "Ganges river dolphins use echoes to navigate muddy rivers.",
    "photoSearch": "Ganges river dolphin",
    "source": "https://animaldiversity.org/accounts/Platanista_gangetica/"
  },
  "iguana": {
    "animal": "Green iguana",
    "scientificName": "Iguana iguana",
    "fact": "Green iguanas mainly eat leaves, flowers and fruit.",
    "photoSearch": "green iguana tree",
    "source": "https://animaldiversity.org/accounts/Iguana_iguana/"
  },
  "hutia": {
    "animal": "Desmarest's hutia",
    "scientificName": "Capromys pilorides",
    "fact": "This Cuban rodent can climb trees to reach food.",
    "photoSearch": "Desmarest hutia Cuba",
    "source": "https://animaldiversity.org/accounts/Capromys_pilorides/"
  },
  "eurobeaver": {
    "animal": "Eurasian beaver",
    "scientificName": "Castor fiber",
    "fact": "Eurasian beavers have orange-coloured front teeth.",
    "photoSearch": "Eurasian beaver river",
    "source": "https://animaldiversity.org/accounts/Castor_fiber/"
  },
  "bison": {
    "animal": "European bison",
    "scientificName": "Bison bonasus",
    "fact": "European bison eat grasses, leaves and bark.",
    "photoSearch": "European bison forest",
    "source": "https://animaldiversity.org/accounts/Bison_bonasus/"
  },
  "finless": {
    "animal": "Yangtze finless porpoise",
    "scientificName": "Neophocaena asiaeorientalis",
    "fact": "This small freshwater porpoise has no dorsal fin.",
    "photoSearch": "Yangtze finless porpoise",
    "source": "https://www.riverdolphins.org/river-dolphins-worldwide/yangtze-finless-porpoise/"
  },
  "alligatorchina": {
    "animal": "Chinese alligator",
    "scientificName": "Alligator sinensis",
    "fact": "Chinese alligators shelter in burrows during cold weather.",
    "photoSearch": "Chinese alligator wildlife",
    "source": "https://animaldiversity.org/accounts/Alligator_sinensis/"
  },
  "heron": {
    "animal": "Grey heron",
    "scientificName": "Ardea cinerea",
    "fact": "Grey herons stand still before striking at fish.",
    "photoSearch": "grey heron fishing",
    "source": "https://animaldiversity.org/accounts/Ardea_cinerea/"
  },
  "manedwolf": {
    "animal": "Maned wolf",
    "scientificName": "Chrysocyon brachyurus",
    "fact": "Maned wolves eat fruit as well as small animals.",
    "photoSearch": "maned wolf grassland",
    "source": "https://animaldiversity.org/accounts/Chrysocyon_brachyurus/"
  },
  "anteater": {
    "animal": "Giant anteater",
    "scientificName": "Myrmecophaga tridactyla",
    "fact": "Giant anteaters use a long sticky tongue to collect insects.",
    "photoSearch": "giant anteater wildlife",
    "source": "https://animaldiversity.org/accounts/Myrmecophaga_tridactyla/"
  },
  "guanaco": {
    "animal": "Guanaco",
    "scientificName": "Lama guanicoe",
    "fact": "Guanacos are wild relatives of llamas.",
    "photoSearch": "wild guanaco mountains",
    "source": "https://animaldiversity.org/accounts/Lama_guanicoe/"
  },
  "macaque": {
    "animal": "Japanese macaque",
    "scientificName": "Macaca fuscata",
    "fact": "Japanese macaques have thick winter coats.",
    "photoSearch": "Japanese macaque winter",
    "source": "https://animaldiversity.org/accounts/Macaca_fuscata/"
  },
  "sika": {
    "animal": "Sika deer",
    "scientificName": "Cervus nippon",
    "fact": "Sika deer use calls to communicate with each other.",
    "photoSearch": "sika deer woodland",
    "source": "https://animaldiversity.org/accounts/Cervus_nippon/"
  },
  "liontail": {
    "animal": "Lion-tailed macaque",
    "scientificName": "Macaca silenus",
    "fact": "These macaques have a silver mane around the face.",
    "photoSearch": "lion tailed macaque",
    "source": "https://animaldiversity.org/accounts/Macaca_silenus/"
  },
  "tahr": {
    "animal": "Nilgiri tahr",
    "scientificName": "Nilgiritragus hylocrius",
    "fact": "Nilgiri tahr live on steep grass-covered hillsides.",
    "photoSearch": "Nilgiri tahr grassland",
    "source": "https://animaldiversity.org/accounts/Hemitragus_hylocrius/"
  },
  "alligator": {
    "animal": "American alligator",
    "scientificName": "Alligator mississippiensis",
    "fact": "Alligators build nests from vegetation and mud.",
    "photoSearch": "American alligator wetland",
    "source": "https://animaldiversity.org/accounts/Alligator_mississippiensis/"
  },
  "tapir": {
    "animal": "Malayan tapir",
    "scientificName": "Tapirus indicus",
    "fact": "An adult Malayan tapir has a pale saddle across its body.",
    "photoSearch": "Malayan tapir forest",
    "source": "https://animaldiversity.org/accounts/Tapirus_indicus/"
  },
  "axolotl": {
    "animal": "Axolotl",
    "scientificName": "Ambystoma mexicanum",
    "fact": "Axolotls keep their feathery outer gills as adults.",
    "photoSearch": "axolotl external gills",
    "source": "https://animaldiversity.org/accounts/Ambystoma_mexicanum/"
  },
  "otter": {
    "animal": "Eurasian otter",
    "scientificName": "Lutra lutra",
    "fact": "Otters have webbed feet and dense fur for life in water.",
    "photoSearch": "Eurasian otter river",
    "source": "https://www.wildlifetrusts.org/wildlife-explorer/mammals/european-otter"
  },
  "alpineibex": {
    "animal": "Alpine ibex",
    "scientificName": "Capra ibex",
    "fact": "Alpine ibex climb steep slopes using flexible hooves.",
    "photoSearch": "Alpine ibex mountain",
    "source": "https://animaldiversity.org/accounts/Capra_ibex/"
  },
  "marmot": {
    "animal": "Alpine marmot",
    "scientificName": "Marmota marmota",
    "fact": "Alpine marmots hibernate in underground burrows.",
    "photoSearch": "Alpine marmot meadow",
    "source": "https://animaldiversity.org/accounts/Marmota_marmota/"
  },
  "muskox": {
    "animal": "Muskox",
    "scientificName": "Ovibos moschatus",
    "fact": "Muskoxen have a dense undercoat beneath their long outer hair.",
    "photoSearch": "muskox Arctic tundra",
    "source": "https://animaldiversity.org/accounts/Ovibos_moschatus/"
  },
  "arcticfox": {
    "animal": "Arctic fox",
    "scientificName": "Vulpes lagopus",
    "fact": "Arctic foxes have fur on the soles of their feet.",
    "photoSearch": "Arctic fox tundra",
    "source": "https://www.denali.org/natural-history/arctic-fox/"
  },
  "tarsier": {
    "animal": "Philippine tarsier",
    "scientificName": "Tarsius syrichta",
    "fact": "Tarsiers have large eyes suited to life at night.",
    "photoSearch": "Philippine tarsier forest",
    "source": "https://animaldiversity.org/accounts/Tarsius_syrichta/"
  },
  "deer": {
    "animal": "Philippine deer",
    "scientificName": "Rusa marianna",
    "fact": "Philippine deer eat grasses, leaves and fallen fruit.",
    "photoSearch": "Philippine deer forest",
    "source": "https://du.lv/wp-content/uploads/2023/03/DU_2022_Vol22_nr1_0512_05.pdf"
  },
  "polar": {
    "animal": "Polar bear",
    "scientificName": "Ursus maritimus",
    "fact": "Polar bears are strong swimmers and hunt mainly seals.",
    "photoSearch": "polar bear sea ice",
    "source": "https://animaldiversity.org/accounts/Ursus_maritimus/"
  },
  "ringed": {
    "animal": "Ringed seal",
    "scientificName": "Pusa hispida",
    "fact": "Ringed seals maintain breathing holes in sea ice.",
    "photoSearch": "ringed seal ice",
    "source": "https://animaldiversity.org/accounts/Pusa_hispida/"
  },
  "gelada": {
    "animal": "Gelada",
    "scientificName": "Theropithecus gelada",
    "fact": "Geladas spend much of their time feeding on grasses.",
    "photoSearch": "gelada Ethiopian grassland",
    "source": "https://animaldiversity.org/accounts/Theropithecus_gelada/"
  },
  "ethiowolf": {
    "animal": "Ethiopian wolf",
    "scientificName": "Canis simensis",
    "fact": "Ethiopian wolves mainly hunt small rodents.",
    "photoSearch": "Ethiopian wolf highlands",
    "source": "https://www.ethiopianwolf.org/the-wolves/ecology-behaviour"
  },
  "rabbit": {
    "animal": "European rabbit",
    "scientificName": "Oryctolagus cuniculus",
    "fact": "Wild rabbits dig connected burrows called warrens.",
    "photoSearch": "European rabbit wild",
    "source": "https://animaldiversity.org/accounts/Oryctolagus_cuniculus/"
  },
  "nilecroc": {
    "animal": "Nile crocodile",
    "scientificName": "Crocodylus niloticus",
    "fact": "A crocodile's eyes and nostrils sit high on its head.",
    "photoSearch": "Nile crocodile river",
    "source": "https://ielc.libguides.com/sdzg/factsheets/nile_crocodile/characteristics"
  },
  "hippo": {
    "animal": "Hippopotamus",
    "scientificName": "Hippopotamus amphibius",
    "fact": "Hippos usually leave the water to graze at night.",
    "photoSearch": "hippopotamus river wildlife",
    "source": "https://animaldiversity.org/accounts/Hippopotamus_amphibius/"
  },
  "squirrel": {
    "animal": "Eurasian red squirrel",
    "scientificName": "Sciurus vulgaris",
    "fact": "Red squirrels use tree nests called dreys.",
    "photoSearch": "Eurasian red squirrel",
    "source": "https://animaldiversity.org/accounts/Sciurus_vulgaris/"
  },
  "octopus": {
    "animal": "Giant Pacific octopus",
    "scientificName": "Enteroctopus dofleini",
    "fact": "An octopus can change its skin colour and texture.",
    "photoSearch": "giant Pacific octopus",
    "source": "https://animaldiversity.org/accounts/Enteroctopus_dofleini/"
  },
  "dalls": {
    "animal": "Dall's porpoise",
    "scientificName": "Phocoenoides dalli",
    "fact": "Dall's porpoises have bold black-and-white markings.",
    "photoSearch": "Dalls porpoise ocean",
    "source": "https://animaldiversity.org/accounts/Phocoenoides_dalli/"
  },
  "barbary": {
    "animal": "Barbary macaque",
    "scientificName": "Macaca sylvanus",
    "fact": "Male Barbary macaques help care for young monkeys.",
    "photoSearch": "Barbary macaque forest",
    "source": "https://animaldiversity.org/accounts/Macaca_sylvanus/"
  },
  "vicuna": {
    "animal": "Vicuña",
    "scientificName": "Vicugna vicugna",
    "fact": "Vicuñas graze on high Andean grasslands.",
    "photoSearch": "vicuna Andean grassland",
    "source": "https://animaldiversity.org/accounts/Vicugna_vicugna/"
  },
  "spectacled": {
    "animal": "Andean bear",
    "scientificName": "Tremarctos ornatus",
    "fact": "Many Andean bears have pale markings around their eyes.",
    "photoSearch": "Andean spectacled bear",
    "source": "https://animaldiversity.org/accounts/Tremarctos_ornatus/"
  },
  "koala": {
    "animal": "Koala",
    "scientificName": "Phascolarctos cinereus",
    "fact": "Koalas feed mainly on eucalyptus leaves.",
    "photoSearch": "koala eucalyptus tree",
    "source": "https://animaldiversity.org/accounts/Phascolarctos_cinereus/"
  },
  "waterdeer": {
    "animal": "Water deer",
    "scientificName": "Hydropotes inermis",
    "fact": "Male water deer have long canine teeth instead of antlers.",
    "photoSearch": "water deer wildlife",
    "source": "https://animaldiversity.org/accounts/Hydropotes_inermis/"
  },
  "raccoondog": {
    "animal": "Raccoon dog",
    "scientificName": "Nyctereutes procyonoides",
    "fact": "A raccoon dog belongs to the dog family.",
    "photoSearch": "raccoon dog wildlife",
    "source": "https://animaldiversity.org/accounts/Nyctereutes_procyonoides/"
  },
  "hyrax": {
    "animal": "Rock hyrax",
    "scientificName": "Procavia capensis",
    "fact": "Rock hyraxes live in groups among rocks.",
    "photoSearch": "rock hyrax colony",
    "source": "https://animaldiversity.org/accounts/Procavia_capensis/"
  },
  "chimp": {
    "animal": "Chimpanzee",
    "scientificName": "Pan troglodytes",
    "fact": "Chimpanzees use tools to help gather food.",
    "photoSearch": "wild chimpanzee tools",
    "source": "https://animaldiversity.org/accounts/Pan_troglodytes/"
  },
  "caspianseal": {
    "animal": "Caspian seal",
    "scientificName": "Pusa caspica",
    "fact": "Caspian seals live in a landlocked inland sea.",
    "photoSearch": "Caspian seal wildlife",
    "source": "https://animaldiversity.org/accounts/Pusa_caspica/"
  },
  "sturgeon": {
    "animal": "Beluga sturgeon",
    "scientificName": "Huso huso",
    "fact": "Beluga sturgeon move into rivers to spawn.",
    "photoSearch": "beluga sturgeon fish",
    "source": "https://animaldiversity.org/accounts/Huso_huso/"
  },
  "moose": {
    "animal": "Moose",
    "scientificName": "Alces alces",
    "fact": "Moose browse on leaves and twigs.",
    "photoSearch": "moose forest wildlife",
    "source": "https://animaldiversity.org/accounts/Alces_alces/"
  },
  "genet": {
    "animal": "Common genet",
    "scientificName": "Genetta genetta",
    "fact": "Genets use their long tails for balance when climbing.",
    "photoSearch": "common genet tree",
    "source": "https://animaldiversity.org/accounts/Genetta_genetta/"
  },
  "pinkdolphin": {
    "animal": "Amazon river dolphin",
    "scientificName": "Inia geoffrensis",
    "fact": "Amazon river dolphins move through flooded forest when water rises.",
    "photoSearch": "Amazon river dolphin",
    "source": "https://animaldiversity.org/accounts/Inia_geoffrensis/"
  },
  "porcupine": {
    "animal": "East Asian porcupine",
    "scientificName": "Hystrix brachyura",
    "fact": "East Asian porcupines are among the most widespread larger mammals in Hong Kong.",
    "photoSearch": "East Asian porcupine",
    "source": "https://www.afcd.gov.hk/english/conservation/hkbiodiversity/speciesgroup/speciesgroup_mammals.html"
  },
  "indobottlenose": {
    "animal": "Indo-Pacific bottlenose dolphin",
    "scientificName": "Tursiops aduncus",
    "fact": "Dubai coastal waters support bottlenose dolphins.",
    "photoSearch": "Indo Pacific bottlenose dolphin",
    "source": "https://www.dm.gov.ae/dubai-protected-areas/wildlife/"
  },
  "monkseal": {
    "animal": "Hawaiian monk seal",
    "scientificName": "Monachus schauinslandi",
    "fact": "Hawaiian monk seals rest on beaches between feeding trips.",
    "photoSearch": "Hawaiian monk seal",
    "source": "https://animaldiversity.org/accounts/Monachus_schauinslandi/"
  },
  "javanrhino": {
    "animal": "Javan rhinoceros",
    "scientificName": "Rhinoceros sondaicus",
    "fact": "Javan rhinos browse on leaves and young shoots.",
    "photoSearch": "Javan rhinoceros forest",
    "source": "https://animaldiversity.org/accounts/Rhinoceros_sondaicus/"
  },
  "silvergibbon": {
    "animal": "Silvery gibbon",
    "scientificName": "Hylobates moloch",
    "fact": "Silvery gibbons live in the forests of Java.",
    "photoSearch": "silvery gibbon Java",
    "source": "https://animaldiversity.org/accounts/Hylobates_moloch/"
  },
  "warthog": {
    "animal": "Common warthog",
    "scientificName": "Phacochoerus africanus",
    "fact": "Warthogs often kneel on their front legs to graze.",
    "photoSearch": "warthog grassland wildlife",
    "source": "https://animaldiversity.org/accounts/Phacochoerus_africanus/"
  },
  "goitered": {
    "animal": "Goitered gazelle",
    "scientificName": "Gazella subgutturosa",
    "fact": "Goitered gazelles live in dry open country.",
    "photoSearch": "goitered gazelle desert",
    "source": "https://animaldiversity.org/accounts/Gazella_subgutturosa/"
  },
  "warty": {
    "animal": "Philippine warty pig",
    "scientificName": "Sus philippensis",
    "fact": "Philippine warty pigs are native to Luzon and several other Philippine islands.",
    "photoSearch": "Philippine warty pig",
    "source": "https://www.iucn-wpsg.org/philippine-warty-pig-detailed"
  },
  "monitor": {
    "animal": "Asian water monitor",
    "scientificName": "Varanus salvator",
    "fact": "Water monitors use their strong tails when swimming.",
    "photoSearch": "Asian water monitor",
    "source": "https://animaldiversity.org/accounts/Varanus_salvator/"
  },
  "longtail": {
    "animal": "Long-tailed macaque",
    "scientificName": "Macaca fascicularis",
    "fact": "Long-tailed macaques live in groups near forests and waterways.",
    "photoSearch": "long tailed macaque",
    "source": "https://animaldiversity.org/accounts/Macaca_fascicularis/"
  },
  "nilgai": {
    "animal": "Nilgai",
    "scientificName": "Boselaphus tragocamelus",
    "fact": "Male nilgai are usually darker than females.",
    "photoSearch": "nilgai antelope wildlife",
    "source": "https://animaldiversity.org/accounts/Boselaphus_tragocamelus/"
  },
  "harborseal": {
    "animal": "Harbour seal",
    "scientificName": "Phoca vitulina",
    "fact": "Harbour seals rest on land between feeding trips.",
    "photoSearch": "harbour seal coast",
    "source": "https://animaldiversity.org/accounts/Phoca_vitulina/"
  },
  "marmoset": {
    "animal": "Common marmoset",
    "scientificName": "Callithrix jacchus",
    "fact": "Marmosets use their teeth to open tree bark for gum.",
    "photoSearch": "common marmoset tree",
    "source": "https://animaldiversity.org/accounts/Callithrix_jacchus/"
  },
  "manatee": {
    "animal": "West Indian manatee",
    "scientificName": "Trichechus manatus",
    "fact": "Manatees feed on aquatic plants.",
    "photoSearch": "West Indian manatee",
    "source": "https://animaldiversity.org/accounts/Trichechus_manatus/"
  },
  "ambison": {
    "animal": "American bison",
    "scientificName": "Bison bison",
    "fact": "Bison use their large heads to push snow away from grass.",
    "photoSearch": "American bison grassland",
    "source": "https://animaldiversity.org/accounts/Bison_bison/"
  },
  "prairiedog": {
    "animal": "Black-tailed prairie dog",
    "scientificName": "Cynomys ludovicianus",
    "fact": "Prairie dogs live in colonies of connected burrows.",
    "photoSearch": "black tailed prairie dog",
    "source": "https://animaldiversity.org/accounts/Cynomys_ludovicianus/"
  },
  "mugger": {
    "animal": "Mugger crocodile",
    "scientificName": "Crocodylus palustris",
    "fact": "Mugger crocodiles live in freshwater lakes and rivers.",
    "photoSearch": "mugger crocodile lake",
    "source": "https://animaldiversity.org/accounts/Crocodylus_palustris/"
  },
  "graysquirrel": {
    "animal": "Eastern grey squirrel",
    "scientificName": "Sciurus carolinensis",
    "fact": "Grey squirrels bury nuts and seeds for later.",
    "photoSearch": "eastern grey squirrel",
    "source": "https://animaldiversity.org/accounts/Sciurus_carolinensis/"
  },
  "sloth": {
    "animal": "Brown-throated three-toed sloth",
    "scientificName": "Bradypus variegatus",
    "fact": "Sloths spend most of their lives hanging in trees.",
    "photoSearch": "brown throated sloth",
    "source": "https://animaldiversity.org/accounts/Bradypus_variegatus/"
  },
  "howler": {
    "animal": "Mantled howler monkey",
    "scientificName": "Alouatta palliata",
    "fact": "Howler monkeys use loud calls to communicate between groups.",
    "photoSearch": "mantled howler monkey",
    "source": "https://animaldiversity.org/accounts/Alouatta_palliata/"
  }
} satisfies Record<string, RegionAnimal>;

export const REGION_ANIMALS: readonly RegionAnimals[] = [
  { name: "Asia", rank: 1, aliases: [], scope: "Examples from temperate forests and Asian tiger habitat, not every part of Asia.", sources: [], animals: [SPECIES.redfox, SPECIES.tiger] },
  { name: "Atlantic Ocean", rank: 2, aliases: ["the Atlantic Ocean"], scope: "Open-ocean populations; individuals travel and are not present everywhere at once.", sources: [], animals: [SPECIES.orca, SPECIES.sperm] },
  { name: "Pacific Ocean", rank: 3, aliases: ["the Pacific Ocean"], scope: "Open-ocean populations; individuals travel and are not present everywhere at once.", sources: [], animals: [SPECIES.orca, SPECIES.sperm] },
  { name: "Europe", rank: 4, aliases: [], scope: "Woodland and countryside populations across much of Europe.", sources: [], animals: [SPECIES.redfox, SPECIES.boar] },
  { name: "Russia", rank: 5, aliases: [], scope: "Forest populations, including Siberian taiga.", sources: [], animals: [SPECIES.brown, SPECIES.chipmunk] },
  { name: "China", rank: 6, aliases: [], scope: "Red pandas in southwestern mountain forests; tigers in surviving forest populations.", sources: [], animals: [SPECIES.redpanda, SPECIES.tiger] },
  { name: "North European Plain", rank: 7, aliases: ["the North European Plain"], scope: "Farmland and woodland across the northern European lowlands.", sources: [], animals: [SPECIES.redfox, SPECIES.hare] },
  { name: "United States of America", rank: 8, aliases: [], scope: "Freshwater and woodland habitats in the contiguous United States.", sources: [], animals: [SPECIES.beaver, SPECIES.raccoon] },
  { name: "Indian Ocean", rank: 9, aliases: ["the Indian Ocean"], scope: "Deep water for sperm whales; coastal waters for bottlenose dolphins.", sources: [], animals: [SPECIES.sperm, SPECIES.bottlenose] },
  { name: "Africa", rank: 10, aliases: [], scope: "Savanna populations in sub-Saharan Africa.", sources: [], animals: [SPECIES.afelephant, SPECIES.lion] },
  { name: "North America", rank: 11, aliases: [], scope: "Forest and freshwater habitats, not the whole continent.", sources: [], animals: [SPECIES.blackbear, SPECIES.beaver] },
  { name: "India", rank: 12, aliases: [], scope: "Protected forests and associated habitat in their remaining Indian ranges.", sources: [], animals: [SPECIES.tiger, SPECIES.elephant] },
  { name: "Canada", rank: 13, aliases: [], scope: "Freshwater and northern forest habitats.", sources: [], animals: [SPECIES.beaver, SPECIES.canadalynx] },
  { name: "Mediterranean Sea", rank: 14, aliases: ["the Mediterranean Sea"], scope: "Coastal dolphins and deep-water sperm-whale populations.", sources: [], animals: [SPECIES.bottlenose, SPECIES.sperm] },
  { name: "Brazil", rank: 15, aliases: [], scope: "Forests, wetlands and river margins within their ranges.", sources: [], animals: [SPECIES.jaguar, SPECIES.capybara] },
  { name: "Andes", rank: 16, aliases: ["the Andes"], scope: "Mountain and adjacent open-country habitats.", sources: [], animals: [SPECIES.condor, SPECIES.puma] },
  { name: "Sahara", rank: 17, aliases: ["the Sahara"], scope: "Sandy desert habitat, not a claim of animals on every dune.", sources: [], animals: [SPECIES.fennec, SPECIES.sandcat] },
  { name: "Siberian taiga", rank: 18, aliases: ["the Siberian taiga"], scope: "Boreal woodland and forest edges.", sources: [], animals: [SPECIES.brown, SPECIES.chipmunk] },
  { name: "Kazakhstan", rank: 19, aliases: [], scope: "Open steppe and semi-desert.", sources: [], animals: [SPECIES.saiga, SPECIES.corsac] },
  { name: "Germany", rank: 20, aliases: [], scope: "Woodland and countryside, including some urban edges.", sources: [], animals: [SPECIES.boar, SPECIES.redfox] },
  { name: "France", rank: 21, aliases: [], scope: "Woodland and countryside.", sources: [], animals: [SPECIES.badger, SPECIES.redfox] },
  { name: "British Isles", rank: 22, aliases: [], scope: "Resident populations in Britain and Ireland.", sources: [], animals: [SPECIES.badger, SPECIES.redfox] },
  { name: "Iberian Peninsula", rank: 23, aliases: ["the Iberian Peninsula"], scope: "Rocky Spanish mountains and Iberian rabbit-rich scrubland respectively.", sources: [], animals: [SPECIES.ibexspain, SPECIES.iberianlynx] },
  { name: "North China Plain", rank: 24, aliases: ["the North China Plain"], scope: "Farmland edges, reedbeds and remaining woodland; not built-up city centres.", sources: [], animals: [SPECIES.pheasant, SPECIES.boar] },
  { name: "Polynesia", rank: 25, aliases: [], scope: "Tropical reefs and coastal feeding areas, not every island.", sources: [], animals: [SPECIES.reefshark, SPECIES.greenturtle] },
  { name: "Mongolia", rank: 26, aliases: [], scope: "Open steppe and rocky country.", sources: [], animals: [SPECIES.corsac, SPECIES.pallas] },
  { name: "Indonesia", rank: 27, aliases: [], scope: "Sumatran forests; neither species is distributed across every Indonesian island.", sources: [], animals: [SPECIES.orangutan, SPECIES.siamang] },
  { name: "Central Lowlands", rank: 28, aliases: ["the Central Lowlands"], scope: "The North American Central Lowlands: woodland and freshwater habitats.", sources: [], animals: [SPECIES.raccoon, SPECIES.beaver] },
  { name: "Great Britain", rank: 29, aliases: [], scope: "Resident woodland and countryside populations.", sources: [], animals: [SPECIES.badger, SPECIES.redfox] },
  { name: "United Kingdom", rank: 30, aliases: [], scope: "Resident mainland populations, not every offshore island.", sources: [], animals: [SPECIES.badger, SPECIES.redfox] },
  { name: "Sahel", rank: 31, aliases: ["the Sahel"], scope: "Gazelles in the dry northern belt; patas monkeys in savanna farther south.", sources: [], animals: [SPECIES.dorcas, SPECIES.patas] },
  { name: "Spain", rank: 32, aliases: [], scope: "Rocky mountains and rabbit-rich scrubland in their remaining ranges.", sources: [], animals: [SPECIES.ibexspain, SPECIES.iberianlynx] },
  { name: "Australia", rank: 33, aliases: [], scope: "Red kangaroos in dry interior country; common wombats in the southeast.", sources: [], animals: [SPECIES.kangaroo, SPECIES.wombat] },
  { name: "South America", rank: 34, aliases: [], scope: "Tropical and subtropical forests, wetlands and rivers.", sources: [], animals: [SPECIES.jaguar, SPECIES.capybara] },
  { name: "Canadian Shield", rank: 35, aliases: ["the Canadian Shield"], scope: "Lakes, streams and boreal forests.", sources: [], animals: [SPECIES.beaver, SPECIES.canadalynx] },
  { name: "Gobi Desert", rank: 36, aliases: ["the Gobi Desert"], scope: "Wild camels in remaining protected Gobi range; cats in rocky steppe margins.", sources: [], animals: [SPECIES.camel, SPECIES.pallas] },
  { name: "Italy", rank: 37, aliases: [], scope: "Woodland and countryside.", sources: [], animals: [SPECIES.boar, SPECIES.badger] },
  { name: "Greater Sunda Islands", rank: 38, aliases: [], scope: "Sumatra, one of the Greater Sunda Islands; not every island.", sources: [], animals: [SPECIES.orangutan, SPECIES.siamang] },
  { name: "Pakistan", rank: 39, aliases: [], scope: "Northern mountain habitats.", sources: [], animals: [SPECIES.snowleopard, SPECIES.markhor] },
  { name: "Greenland ice sheet", rank: 40, aliases: ["the Greenland ice sheet"], scope: "Ice-surface melt holes, not large land animals on the interior ice. Active in the melt season; no claim of winter visibility.", sources: [], animals: [SPECIES.tardigrade, SPECIES.rotifer] },
  { name: "Pontic-Caspian steppe", rank: 41, aliases: ["the Pontic-Caspian steppe"], scope: "Eastern steppe populations, including the lower Volga region.", sources: [], animals: [SPECIES.saiga, SPECIES.corsac] },
  { name: "South China Sea", rank: 42, aliases: ["the South China Sea"], scope: "Remaining seagrass meadows and tropical coastal waters.", sources: [], animals: [SPECIES.dugong, SPECIES.greenturtle] },
  { name: "Tibetan Plateau", rank: 43, aliases: ["the Tibetan Plateau"], scope: "High open grasslands and cold plateau country.", sources: [], animals: [SPECIES.wildyak, SPECIES.antelope] },
  { name: "Caribbean Sea", rank: 44, aliases: ["the Caribbean Sea"], scope: "Coastal dolphin populations and turtle feeding areas.", sources: [], animals: [SPECIES.bottlenose, SPECIES.greenturtle] },
  { name: "Cordillera Oriental", rank: 45, aliases: ["the Cordillera Oriental"], scope: "Ambiguous bare label shared by several mountain ranges. No unqualified wildlife claim; requires geographic context.", sources: [], animals: [] },
  { name: "Appalachian Mountains", rank: 46, aliases: ["the Appalachian Mountains"], scope: "Forested slopes and valleys.", sources: [], animals: [SPECIES.blackbear, SPECIES.raccoon] },
  { name: "Mongolian Plateau", rank: 47, aliases: ["the Mongolian Plateau"], scope: "Steppe and rocky open habitats in Mongolia and northern China.", sources: [], animals: [SPECIES.pallas, SPECIES.corsac] },
  { name: "North Sea", rank: 48, aliases: ["the North Sea"], scope: "Coastal haul-outs and shelf waters.", sources: [], animals: [SPECIES.grayseal, SPECIES.porpoise] },
  { name: "Tian Shan", rank: 49, aliases: ["the Tian Shan"], scope: "High rocky mountain habitat.", sources: [], animals: [SPECIES.snowleopard, SPECIES.ibex] },
  { name: "Thailand", rank: 50, aliases: [], scope: "Remaining mainland forests and protected areas.", sources: [], animals: [SPECIES.elephant, SPECIES.gibbon] },
  { name: "Himalayas", rank: 51, aliases: ["the Himalayas"], scope: "Snow leopards in high rocky country; red pandas in eastern forest habitats.", sources: [], animals: [SPECIES.snowleopard, SPECIES.redpanda] },
  { name: "Vietnam", rank: 52, aliases: [], scope: "Remaining forest populations, not the whole country.", sources: [], animals: [SPECIES.elephant, SPECIES.sambar] },
  { name: "Iran", rank: 53, aliases: [], scope: "Mountain and rocky woodland habitats.", sources: [], animals: [SPECIES.leopard, SPECIES.bezoar] },
  { name: "Kazakh Steppe", rank: 54, aliases: ["the Kazakh Steppe"], scope: "Open steppe and semi-desert habitats.", sources: [], animals: [SPECIES.saiga, SPECIES.corsac] },
  { name: "Ural Mountains", rank: 55, aliases: ["the Ural Mountains"], scope: "Forested mountain habitats.", sources: [], animals: [SPECIES.brown, SPECIES.eurasianlynx] },
  { name: "Arabian Desert", rank: 56, aliases: ["the Arabian Desert"], scope: "Desert populations; Arabian oryx include conservation reintroductions.", sources: [], animals: [SPECIES.sandcat, SPECIES.oryx] },
  { name: "Arabian Sea", rank: 57, aliases: ["the Arabian Sea"], scope: "Coastal populations and feeding areas, including Omani waters.", sources: [], animals: [SPECIES.bottlenose, SPECIES.greenturtle] },
  { name: "Rocky Mountains", rank: 58, aliases: ["the Rocky Mountains"], scope: "Forests and high rocky slopes respectively.", sources: [], animals: [SPECIES.blackbear, SPECIES.mountaingoat] },
  { name: "Turkey", rank: 59, aliases: [], scope: "Woodlands and mountain forests within their Turkish ranges.", sources: [], animals: [SPECIES.boar, SPECIES.brown] },
  { name: "hills of southern China", rank: 60, aliases: ["the hills of southern China"], scope: "Forested hills and protected habitat within surviving ranges.", sources: [], animals: [SPECIES.asiaticbear, SPECIES.rhesus] },
  { name: "Indo-Gangetic Plain", rank: 61, aliases: ["the Indo-Gangetic Plain"], scope: "Surviving river populations in the Ganges basin and tributaries.", sources: [], animals: [SPECIES.gharial, SPECIES.ganges] },
  { name: "Bay of Bengal", rank: 62, aliases: ["the Bay of Bengal"], scope: "Coastal dolphins; dugongs in remaining Andaman and Nicobar seagrass habitat.", sources: [], animals: [SPECIES.dugong, SPECIES.bottlenose] },
  { name: "West Indies", rank: 63, aliases: [], scope: "Green iguanas on parts of the island chain; native hutias in Cuba.", sources: [], animals: [SPECIES.iguana, SPECIES.hutia] },
  { name: "Egypt", rank: 64, aliases: [], scope: "Desert habitats away from dense settlement.", sources: [], animals: [SPECIES.dorcas, SPECIES.fennec] },
  { name: "Myanmar", rank: 65, aliases: [], scope: "Remaining mainland forests.", sources: [], animals: [SPECIES.elephant, SPECIES.sambar] },
  { name: "Netherlands", rank: 66, aliases: [], scope: "Wetlands and river systems for beavers; countryside for foxes.", sources: [], animals: [SPECIES.eurobeaver, SPECIES.redfox] },
  { name: "Baltic Sea", rank: 67, aliases: ["the Baltic Sea"], scope: "Resident Baltic populations; porpoises are scarce and not throughout the sea.", sources: [], animals: [SPECIES.grayseal, SPECIES.porpoise] },
  { name: "Melanesia", rank: 68, aliases: [], scope: "Coastal seagrass and reef waters within their regional ranges.", sources: [], animals: [SPECIES.dugong, SPECIES.greenturtle] },
  { name: "Poland", rank: 69, aliases: [], scope: "Free-ranging bison in restored forest populations; boar more widely.", sources: [], animals: [SPECIES.bison, SPECIES.boar] },
  { name: "Sumatra", rank: 70, aliases: [], scope: "Remaining northern forests for orangutans; forest canopy for siamangs.", sources: [], animals: [SPECIES.orangutan, SPECIES.siamang] },
  { name: "Yangtze River", rank: 71, aliases: ["the Yangtze River"], scope: "Porpoises in surviving river and lake habitat; alligators in lower-basin wetlands, not the whole river.", sources: [], animals: [SPECIES.finless, SPECIES.alligatorchina] },
  { name: "Amsterdam", rank: 72, aliases: [], scope: "Canals, parks and greener outer neighbourhoods.", sources: [], animals: [SPECIES.heron, SPECIES.redfox] },
  { name: "Brazilian Highlands", rank: 73, aliases: ["the Brazilian Highlands"], scope: "Cerrado grassland and savanna habitats.", sources: [], animals: [SPECIES.manedwolf, SPECIES.anteater] },
  { name: "Afghanistan", rank: 74, aliases: [], scope: "High northern and northeastern mountain habitats.", sources: [], animals: [SPECIES.snowleopard, SPECIES.ibex] },
  { name: "Colombia", rank: 75, aliases: [], scope: "Forests and lowland river habitats.", sources: [], animals: [SPECIES.jaguar, SPECIES.capybara] },
  { name: "Libyan Desert", rank: 76, aliases: ["the Libyan Desert"], scope: "Sandy desert habitat in their regional ranges.", sources: [], animals: [SPECIES.fennec, SPECIES.sandcat] },
  { name: "Argentina", rank: 77, aliases: [], scope: "Open country, including Patagonia.", sources: [], animals: [SPECIES.puma, SPECIES.guanaco] },
  { name: "Japan", rank: 78, aliases: [], scope: "Woodland populations within their Japanese ranges.", sources: [], animals: [SPECIES.macaque, SPECIES.sika] },
  { name: "Berlin", rank: 79, aliases: [], scope: "Urban forests, parks and green edges.", sources: [], animals: [SPECIES.boar, SPECIES.redfox] },
  { name: "Great Wall of China", rank: 80, aliases: ["the Great Wall of China"], scope: "Forested mountain sections around Beijing, not animals living on every stretch of wall.", sources: [], animals: [SPECIES.boar, SPECIES.redfox] },
  { name: "Western Ghats", rank: 81, aliases: ["the Western Ghats"], scope: "Rainforest canopy for macaques; high grassland cliffs for tahr.", sources: [], animals: [SPECIES.liontail, SPECIES.tahr] },
  { name: "Atlantic coastal plain", rank: 82, aliases: ["the Atlantic coastal plain"], scope: "The North American plain: raccoons widely; alligators in southeastern wetlands.", sources: [], animals: [SPECIES.raccoon, SPECIES.alligator] },
  { name: "Malaysia", rank: 83, aliases: [], scope: "Peninsular Malaysian forests, not all of Borneo.", sources: [], animals: [SPECIES.tapir, SPECIES.gibbon] },
  { name: "Mexico", rank: 84, aliases: [], scope: "Jaguars in remaining forest habitats; wild axolotls in Xochimilco waterways.", sources: [], animals: [SPECIES.jaguar, SPECIES.axolotl] },
  { name: "Paris", rank: 85, aliases: [], scope: "Parks, river edges and greener outer districts.", sources: [], animals: [SPECIES.redfox, SPECIES.heron] },
  { name: "Portugal", rank: 86, aliases: [], scope: "Reintroduced wild lynx in southern scrubland; otters in waterways.", sources: ["https://areasprotegidas.icnf.pt/lince/index.php/lince-iberico/reintroducao"], animals: [SPECIES.iberianlynx, SPECIES.otter] },
  { name: "Alps", rank: 87, aliases: ["the Alps"], scope: "Rocky alpine slopes and high meadows.", sources: [], animals: [SPECIES.alpineibex, SPECIES.marmot] },
  { name: "Canadian Arctic Archipelago", rank: 88, aliases: [], scope: "Ice-free tundra on islands within their ranges.", sources: [], animals: [SPECIES.muskox, SPECIES.arcticfox] },
  { name: "Philippines", rank: 89, aliases: ["the Philippines"], scope: "Tarsiers on southern islands including Bohol; deer in remaining forest habitats.", sources: [], animals: [SPECIES.tarsier, SPECIES.deer] },
  { name: "Arctic Ocean", rank: 90, aliases: ["the Arctic Ocean"], scope: "Sea-ice habitats; seasonal ice movement changes local availability.", sources: [], animals: [SPECIES.polar, SPECIES.ringed] },
  { name: "Canadian boreal forest", rank: 91, aliases: ["the Canadian boreal forest"], scope: "Forest wetlands and snowshoe-hare habitat.", sources: [], animals: [SPECIES.beaver, SPECIES.canadalynx] },
  { name: "Ethiopia", rank: 92, aliases: [], scope: "Ethiopian highland grasslands in their restricted ranges.", sources: [], animals: [SPECIES.gelada, SPECIES.ethiowolf] },
  { name: "London", rank: 93, aliases: [], scope: "Parks, gardens, ponds and waterways.", sources: [], animals: [SPECIES.redfox, SPECIES.heron] },
  { name: "Madrid", rank: 94, aliases: [], scope: "Wooded outskirts and open green country, not the central streets.", sources: [], animals: [SPECIES.boar, SPECIES.rabbit] },
  { name: "Nile", rank: 95, aliases: ["the Nile"], scope: "Upper Nile and associated wetland populations, not the Cairo riverfront or the whole river.", sources: [], animals: [SPECIES.nilecroc, SPECIES.hippo] },
  { name: "Ethiopian Highlands", rank: 96, aliases: ["the Ethiopian Highlands"], scope: "Cliffs and high grasslands, including protected highland areas.", sources: [], animals: [SPECIES.gelada, SPECIES.ethiowolf] },
  { name: "Malay Archipelago", rank: 97, aliases: [], scope: "Sumatran forest examples within this broad archipelago.", sources: [], animals: [SPECIES.orangutan, SPECIES.siamang] },
  { name: "Ireland", rank: 98, aliases: [], scope: "Woodland, countryside and waterways.", sources: [], animals: [SPECIES.badger, SPECIES.otter] },
  { name: "Iranian Plateau", rank: 99, aliases: ["the Iranian Plateau"], scope: "Rocky mountain and open-country habitats in their regional ranges.", sources: [], animals: [SPECIES.pallas, SPECIES.bezoar] },
  { name: "Moscow", rank: 100, aliases: [], scope: "City parks and wooded outer districts.", sources: [], animals: [SPECIES.squirrel, SPECIES.redfox] },
  { name: "Rome", rank: 101, aliases: [], scope: "Green outer districts and wooded urban parks.", sources: [], animals: [SPECIES.boar, SPECIES.redfox] },
  { name: "Sea of Japan", rank: 102, aliases: ["the Sea of Japan"], scope: "Cool northern waters in the species' ranges.", sources: [], animals: [SPECIES.octopus, SPECIES.dalls] },
  { name: "Algeria", rank: 103, aliases: [], scope: "Northern mountain forests for macaques; sandy desert for foxes.", sources: [], animals: [SPECIES.barbary, SPECIES.fennec] },
  { name: "Cordillera Blanca", rank: 104, aliases: ["the Cordillera Blanca"], scope: "High grasslands for vicuñas; forested eastern slopes for bears in Huascarán National Park.", sources: ["https://www.gob.pe/institucion/sernanp/informes-publicaciones/1949215-parque-nacional-huascaran"], animals: [SPECIES.vicuna, SPECIES.spectacled] },
  { name: "Great Dividing Range", rank: 105, aliases: ["the Great Dividing Range"], scope: "Eastern Australian eucalyptus forests within their local ranges.", sources: [], animals: [SPECIES.koala, SPECIES.wombat] },
  { name: "South Korea", rank: 106, aliases: [], scope: "Wetland edges, woodland and countryside.", sources: [], animals: [SPECIES.waterdeer, SPECIES.raccoondog] },
  { name: "Ulaanbaatar", rank: 107, aliases: [], scope: "Surrounding steppe and rocky hills, not the dense city centre.", sources: ["https://ouci.dntb.gov.ua/en/works/lRrbrMga/"], animals: [SPECIES.redfox, SPECIES.pallas] },
  { name: "Great Rift Valley", rank: 108, aliases: ["the Great Rift Valley"], scope: "Lakes and rivers for hippos; rocky valley sides for hyraxes.", sources: [], animals: [SPECIES.hippo, SPECIES.hyrax] },
  { name: "Java Sea", rank: 109, aliases: ["the Java Sea"], scope: "Remaining coastal seagrass and turtle feeding habitat.", sources: [], animals: [SPECIES.dugong, SPECIES.greenturtle] },
  { name: "Nigeria", rank: 110, aliases: [], scope: "Forests for chimpanzees; northern savanna for patas monkeys.", sources: [], animals: [SPECIES.chimp, SPECIES.patas] },
  { name: "Ukraine", rank: 111, aliases: [], scope: "Woodlands and countryside; no claim of current local abundance.", sources: [], animals: [SPECIES.boar, SPECIES.redfox] },
  { name: "Caspian Sea", rank: 112, aliases: ["the Caspian Sea"], scope: "Sea populations; sturgeon move into rivers to spawn.", sources: [], animals: [SPECIES.caspianseal, SPECIES.sturgeon] },
  { name: "forests of Scandinavia", rank: 113, aliases: ["the forests of Scandinavia"], scope: "Boreal woodland within their Scandinavian ranges.", sources: [], animals: [SPECIES.moose, SPECIES.eurasianlynx] },
  { name: "Khentii Mountains", rank: 114, aliases: ["the Khentii Mountains"], scope: "Mongolian forest habitats.", sources: [], animals: [SPECIES.brown, SPECIES.chipmunk] },
  { name: "Lisbon", rank: 115, aliases: [], scope: "Monsanto Forest Park and other woodland around Lisbon.", sources: ["https://www.lisboa.pt/en/themes/environment/biodiversity/fauna"], animals: [SPECIES.genet, SPECIES.redfox] },
  { name: "Peru", rank: 116, aliases: [], scope: "Andean cloud forest for bears; high open grasslands for vicuñas.", sources: [], animals: [SPECIES.spectacled, SPECIES.vicuna] },
  { name: "Amazon basin", rank: 117, aliases: ["the Amazon basin"], scope: "Forests and rivers; dolphins use freshwater and flooded forest.", sources: [], animals: [SPECIES.jaguar, SPECIES.pinkdolphin] },
  { name: "Central Siberian Plateau", rank: 118, aliases: ["the Central Siberian Plateau"], scope: "Boreal woodland, not the entire plateau surface.", sources: [], animals: [SPECIES.brown, SPECIES.chipmunk] },
  { name: "Chile", rank: 119, aliases: [], scope: "Open and mountain habitats within their Chilean ranges.", sources: [], animals: [SPECIES.guanaco, SPECIES.puma] },
  { name: "Dublin", rank: 120, aliases: [], scope: "Parks, greener suburbs and river habitats.", sources: [], animals: [SPECIES.redfox, SPECIES.otter] },
  { name: "Hong Kong", rank: 121, aliases: [], scope: "Country parks and wooded hills; macaques include established introduced populations.", sources: ["https://www.afcd.gov.hk/english/conservation/hkbiodiversity/speciesgroup/speciesgroup_mammals.html"], animals: [SPECIES.rhesus, SPECIES.porcupine] },
  { name: "Sweden", rank: 122, aliases: [], scope: "Forests and associated open habitats.", sources: [], animals: [SPECIES.moose, SPECIES.eurasianlynx] },
  { name: "Appennino Ligure", rank: 123, aliases: ["the Appennino Ligure"], scope: "Ligurian Apennine woodland and countryside.", sources: [], animals: [SPECIES.boar, SPECIES.badger] },
  { name: "Palm Islands of Dubai", rank: 124, aliases: ["the Palm Islands of Dubai"], scope: "Dubai coastal habitat near the islands, not animals living on the artificial land. Individuals travel; no promise of a sighting at Palm Jumeirah.", sources: ["https://www.dm.gov.ae/dubai-protected-areas/wildlife/","https://link.springer.com/chapter/10.1007/978-3-031-37397-8_18","https://pmc.ncbi.nlm.nih.gov/articles/PMC5584959/"], animals: [SPECIES.indobottlenose, SPECIES.greenturtle] },
  { name: "Shanghai", rank: 125, aliases: [], scope: "Suburban green space and restored outer wetland habitats; deer include reintroduced populations.", sources: ["https://www.shanghai.gov.cn/nw48081/20231101/6f15c21f452a460f9b5f683c1ad3ed32.html","https://english.shanghai.gov.cn/en-GreenShanghai/20250728/cbf1296486274eb6a3b959ffb30ad0d3.html"], animals: [SPECIES.raccoondog, SPECIES.waterdeer] },
  { name: "Coast Mountains", rank: 126, aliases: ["the Coast Mountains"], scope: "Rocky slopes and coastal forests.", sources: [], animals: [SPECIES.mountaingoat, SPECIES.blackbear] },
  { name: "Hawaiian Islands", rank: 127, aliases: [], scope: "Coastal resting and feeding habitat; Hawaiian green turtles include resident foragers.", sources: [], animals: [SPECIES.monkseal, SPECIES.greenturtle] },
  { name: "Istanbul", rank: 128, aliases: [], scope: "Forested outskirts, including the northern wooded belt.", sources: [], animals: [SPECIES.boar, SPECIES.redfox] },
  { name: "Java", rank: 129, aliases: [], scope: "Rhinos in Ujung Kulon; gibbons in remaining western and central forests.", sources: [], animals: [SPECIES.javanrhino, SPECIES.silvergibbon] },
  { name: "Senegal", rank: 130, aliases: [], scope: "Savanna and open woodland.", sources: [], animals: [SPECIES.patas, SPECIES.warthog] },
  { name: "United Arab Emirates", rank: 131, aliases: [], scope: "Desert habitat; oryx include free-ranging conservation reintroductions.", sources: [], animals: [SPECIES.oryx, SPECIES.sandcat] },
  { name: "Uzbekistan", rank: 132, aliases: [], scope: "Open steppe and semi-desert in surviving ranges.", sources: [], animals: [SPECIES.corsac, SPECIES.goitered] },
  { name: "Almaty", rank: 133, aliases: [], scope: "Nearby Ile Alatau mountain habitat, not the city streets.", sources: [], animals: [SPECIES.snowleopard, SPECIES.ibex] },
  { name: "Beijing", rank: 134, aliases: [], scope: "Forested mountain districts around the urban area.", sources: [], animals: [SPECIES.boar, SPECIES.redfox] },
  { name: "Dubai", rank: 135, aliases: [], scope: "Desert conservation habitat outside the built-up city.", sources: [], animals: [SPECIES.oryx, SPECIES.sandcat] },
  { name: "Honshu", rank: 136, aliases: [], scope: "Woodland and mountain habitats.", sources: [], animals: [SPECIES.macaque, SPECIES.sika] },
  { name: "Luzon", rank: 137, aliases: [], scope: "Remaining forest populations.", sources: ["https://doi.org/10.2305/IUCN.UK.2015-2.RLTS.T4274A22168586.en"], animals: [SPECIES.deer, SPECIES.warty] },
  { name: "Seoul", rank: 138, aliases: [], scope: "Wooded hills, streams and green edges of the metropolitan area.", sources: [], animals: [SPECIES.waterdeer, SPECIES.raccoondog] },
  { name: "Bangkok", rank: 139, aliases: [], scope: "Waterways and parks for monitors; macaques on greener metropolitan fringes.", sources: ["https://www.wildlife-biodiversity.com/index.php/jwb/article/view/622","https://www.researchgate.net/publication/256783440_A_Previously_Unreported_Long-Tailed_Macaque_Macaca_fascicularis_Population_in_Bangkok_Thailand"], animals: [SPECIES.monitor, SPECIES.longtail] },
  { name: "Delhi", rank: 140, aliases: [], scope: "Urban green space and wooded ridge habitats.", sources: [], animals: [SPECIES.rhesus, SPECIES.nilgai] },
  { name: "Iceland", rank: 141, aliases: [], scope: "Foxes on land and resident seals on coasts.", sources: [], animals: [SPECIES.arcticfox, SPECIES.harborseal] },
  { name: "Recife", rank: 142, aliases: [], scope: "River margins, parks and Atlantic Forest fragments in greater Recife.", sources: [], animals: [SPECIES.capybara, SPECIES.marmoset] },
  { name: "Sea of Okhotsk", rank: 143, aliases: ["the Sea of Okhotsk"], scope: "Sea-ice and marine feeding habitat; local animal movements vary.", sources: [], animals: [SPECIES.ringed, SPECIES.orca] },
  { name: "Everglades", rank: 144, aliases: ["the Everglades"], scope: "Freshwater wetlands and coastal waterways respectively.", sources: [], animals: [SPECIES.alligator, SPECIES.manatee] },
  { name: "Great Plains", rank: 145, aliases: ["the Great Plains"], scope: "Remaining and restored prairie habitats, not the whole agricultural plain.", sources: [], animals: [SPECIES.ambison, SPECIES.prairiedog] },
  { name: "Kenya", rank: 146, aliases: [], scope: "Savanna and protected habitats within their ranges.", sources: [], animals: [SPECIES.afelephant, SPECIES.lion] },
  { name: "Mumbai", rank: 147, aliases: [], scope: "Sanjay Gandhi National Park forests and reservoir habitats in the metropolitan area.", sources: ["https://forestsclearance.nic.in/PartIIReport_A.aspx?pid=FP%2FMH%2FROAD%2F37039%2F2018"], animals: [SPECIES.leopard, SPECIES.mugger] },
  { name: "New York", rank: 148, aliases: [], scope: "Parks, woodlands and urban green space.", sources: ["https://www.nyc.gov/site/wildlifenyc/animals/raccoons.page","https://www.nyc.gov/site/wildlifenyc/animals/eastern-gray-squirrels.page"], animals: [SPECIES.raccoon, SPECIES.graysquirrel] },
  { name: "Panama", rank: 149, aliases: [], scope: "Tropical forest habitats.", sources: [], animals: [SPECIES.sloth, SPECIES.howler] },
  { name: "Sudan", rank: 150, aliases: [], scope: "Dry open country for gazelles; Nile-system water habitats for crocodiles.", sources: [], animals: [SPECIES.dorcas, SPECIES.nilecroc] }
];
