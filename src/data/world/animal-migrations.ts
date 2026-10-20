/** Checked seasonal teaching areas, not telemetry or guaranteed sightings.
 * Coordinates are hand-drawn coarse envelopes in [longitude, latitude], WGS84.
 * Each polygon is a closed outer ring without holes. Nearby means nearby habitat.
 * Months are inclusive UTC calendar windows; start > end wraps through January.
 * Sea includes beach-breeding marine mammals; freshwater/shorebirds use land.
 * Sources checked 20 October 2026. See the completion report for omissions.
 */
export type AnimalPoint = readonly [number, number];
export type AnimalPolygon = readonly AnimalPoint[];
export type MonthRange = { readonly start: number; readonly end: number };
export type AnimalMigration = {
  readonly id: string;
  readonly animal: string;
  readonly areaDescription: string;
  readonly polygons: readonly AnimalPolygon[];
  readonly months: readonly MonthRange[];
  readonly habitat: 'land' | 'sea';
  readonly below: string;
  readonly facts: readonly [string, string, string];
  readonly photoSearch: string;
  readonly source: string;
  readonly sources: readonly string[];
  readonly seasonNote: string;
};

export const ANIMAL_MIGRATIONS: readonly AnimalMigration[] = [
  {
    "id": "wildebeest-south",
    "animal": "Blue wildebeest",
    "areaDescription": "Southern Serengeti and Ndutu plains, Tanzania",
    "polygons": [
      [
        [
          34.5,
          -3.3
        ],
        [
          35.3,
          -3.3
        ],
        [
          35.3,
          -2.6
        ],
        [
          34.5,
          -2.6
        ],
        [
          34.5,
          -3.3
        ]
      ]
    ],
    "months": [
      {
        "start": 12,
        "end": 3
      }
    ],
    "habitat": "land",
    "below": "Below us are the southern Serengeti plains, a usual wet-season home for migrating wildebeest.",
    "facts": [
      "Herds follow rain and fresh grass.",
      "Many calves are born on the southern plains.",
      "Zebras also take part in this moving community."
    ],
    "photoSearch": "Serengeti wildebeest calves",
    "source": "https://www.serengeti.com/great-migration-africa.php",
    "seasonNote": "Typical seasonal area, not a live herd position; rainfall changes the timing and route.",
    "sources": [
      "https://www.serengeti.com/great-migration-africa.php"
    ]
  },
  {
    "id": "wildebeest-west",
    "animal": "Blue wildebeest",
    "areaDescription": "Western Serengeti corridor towards the Grumeti River, Tanzania",
    "polygons": [
      [
        [
          33.8,
          -2.5
        ],
        [
          34.7,
          -2.5
        ],
        [
          34.7,
          -1.8
        ],
        [
          33.8,
          -1.8
        ],
        [
          33.8,
          -2.5
        ]
      ]
    ],
    "months": [
      {
        "start": 5,
        "end": 7
      }
    ],
    "habitat": "land",
    "below": "Below us is the western Serengeti corridor, used by moving wildebeest herds.",
    "facts": [
      "The route passes the Grumeti River.",
      "Grass and water influence the herd movements.",
      "The annual journey connects different parts of the Serengeti ecosystem."
    ],
    "photoSearch": "Grumeti wildebeest migration",
    "source": "https://www.serengeti.com/great-migration-africa.php",
    "seasonNote": "Typical seasonal area, not a live herd position; rainfall changes the timing and route.",
    "sources": [
      "https://www.serengeti.com/great-migration-africa.php"
    ]
  },
  {
    "id": "wildebeest-north",
    "animal": "Blue wildebeest",
    "areaDescription": "Northern Serengeti and adjoining Maasai Mara, Tanzania and Kenya",
    "polygons": [
      [
        [
          34.6,
          -1.8
        ],
        [
          35.4,
          -1.8
        ],
        [
          35.4,
          -1.1
        ],
        [
          34.6,
          -1.1
        ],
        [
          34.6,
          -1.8
        ]
      ]
    ],
    "months": [
      {
        "start": 7,
        "end": 10
      }
    ],
    "habitat": "land",
    "below": "Below us is the Serengeti–Mara area, where wildebeest herds often gather in the dry season.",
    "facts": [
      "Some herds cross the Mara River.",
      "Not every animal crosses into Kenya.",
      "The herds return south as fresh grass grows there."
    ],
    "photoSearch": "Mara wildebeest herds",
    "source": "https://www.serengeti.com/great-migration-africa.php",
    "seasonNote": "Typical seasonal area, not a live herd position; rainfall changes the timing and route.",
    "sources": [
      "https://www.serengeti.com/great-migration-africa.php"
    ]
  },
  {
    "id": "humpback-nsw",
    "animal": "Humpback whale",
    "areaDescription": "Narrow coastal corridor off New South Wales, Australia",
    "polygons": [
      [
        [
          149.8,
          -37.6
        ],
        [
          150.4,
          -37.6
        ],
        [
          152.1,
          -34
        ],
        [
          153.9,
          -28.1
        ],
        [
          153.4,
          -28.1
        ],
        [
          151.2,
          -34
        ],
        [
          149.8,
          -37.6
        ]
      ]
    ],
    "months": [
      {
        "start": 5,
        "end": 7
      },
      {
        "start": 9,
        "end": 11
      }
    ],
    "habitat": "sea",
    "below": "Below us is part of the east Australian humpback migration corridor.",
    "facts": [
      "Whales head north along this coast in winter.",
      "They return south towards Antarctic feeding waters.",
      "Humpbacks can leap partly out of the water."
    ],
    "photoSearch": "humpback whale Australia",
    "source": "https://www.nationalparks.nsw.gov.au/plants-and-animals/humpback-whale",
    "seasonNote": "Northbound May–July; southbound September–November. Individual passage dates vary.",
    "sources": [
      "https://www.nationalparks.nsw.gov.au/plants-and-animals/humpback-whale",
      "https://www.dcceew.gov.au/environment/marine/marine-species/cetaceans/humpback-whales-eastern-australia"
    ]
  },
  {
    "id": "gray-california",
    "animal": "Gray whale",
    "areaDescription": "Coastal waters off Point Reyes, northern California",
    "polygons": [
      [
        [
          -123.3,
          37.7
        ],
        [
          -122.75,
          37.7
        ],
        [
          -122.75,
          38.3
        ],
        [
          -123.3,
          38.3
        ],
        [
          -123.3,
          37.7
        ]
      ]
    ],
    "months": [
      {
        "start": 1,
        "end": 5
      }
    ],
    "habitat": "sea",
    "below": "Below us is a California coastal migration route used by gray whales.",
    "facts": [
      "Gray whales travel between feeding and breeding areas.",
      "Mothers and calves pass close to shore on the northbound journey.",
      "April is a useful month for watching that northbound passage."
    ],
    "photoSearch": "gray whale California",
    "source": "https://www.nps.gov/pore/planyourvisit/wildlife_viewing.htm",
    "seasonNote": "January–early May seasonal window; April is especially useful for mothers and calves.",
    "sources": [
      "https://www.nps.gov/pore/planyourvisit/wildlife_viewing.htm"
    ]
  },
  {
    "id": "monarch-mexico",
    "animal": "Monarch butterfly",
    "areaDescription": "Oyamel forest wintering area on the Michoacán–State of Mexico border",
    "polygons": [
      [
        [
          -100.4,
          19.35
        ],
        [
          -100.1,
          19.35
        ],
        [
          -100.1,
          19.8
        ],
        [
          -100.4,
          19.8
        ],
        [
          -100.4,
          19.35
        ]
      ]
    ],
    "months": [
      {
        "start": 11,
        "end": 3
      }
    ],
    "habitat": "land",
    "below": "Below us are central Mexican mountain forests where migrating monarchs spend the winter.",
    "facts": [
      "Eastern monarchs gather in oyamel fir forests.",
      "Their northward journey starts around March.",
      "Several generations take part in the annual migration cycle."
    ],
    "photoSearch": "monarch butterflies oyamel",
    "source": "https://www.nps.gov/subjects/pollinators/migratingmonarchs.htm",
    "seasonNote": "Wintering stage November–March, not a claim that butterflies are moving every day.",
    "sources": [
      "https://www.nps.gov/subjects/pollinators/migratingmonarchs.htm",
      "https://www.nps.gov/articles/dias-de-los-monarchs.htm"
    ]
  },
  {
    "id": "red-crab",
    "animal": "Christmas Island red crab",
    "areaDescription": "Christmas Island forest-to-coast routes, Indian Ocean",
    "polygons": [
      [
        [
          105.53,
          -10.57
        ],
        [
          105.72,
          -10.57
        ],
        [
          105.76,
          -10.43
        ],
        [
          105.68,
          -10.38
        ],
        [
          105.55,
          -10.43
        ],
        [
          105.53,
          -10.57
        ]
      ]
    ],
    "months": [
      {
        "start": 10,
        "end": 1
      }
    ],
    "habitat": "land",
    "below": "Below us is Christmas Island, where wet-season rain can start the red crab migration.",
    "facts": [
      "Red crabs normally live in forest burrows.",
      "They move to the coast to breed.",
      "Spawning timing is linked to the moon and tides."
    ],
    "photoSearch": "Christmas Island red crabs",
    "source": "https://christmasislandnationalpark.gov.au/discover/highlights/red-crab-migration/",
    "seasonNote": "Usually starts October or November, sometimes December or January; rain-triggered, not guaranteed by month.",
    "sources": [
      "https://christmasislandnationalpark.gov.au/discover/highlights/red-crab-migration/"
    ]
  },
  {
    "id": "sandhill-platte",
    "animal": "Sandhill crane",
    "areaDescription": "Central Platte River valley near Kearney, Nebraska",
    "polygons": [
      [
        [
          -99.5,
          40.6
        ],
        [
          -98.3,
          40.6
        ],
        [
          -98.3,
          40.85
        ],
        [
          -99.5,
          40.85
        ],
        [
          -99.5,
          40.6
        ]
      ]
    ],
    "months": [
      {
        "start": 3,
        "end": 4
      }
    ],
    "habitat": "land",
    "below": "Below us is the central Platte valley, a spring stop for migrating sandhill cranes.",
    "facts": [
      "The cranes stop here on their journey north.",
      "They roost in shallow river water.",
      "Nearby fields supply food before the next part of the journey."
    ],
    "photoSearch": "Platte sandhill cranes",
    "source": "https://outdoornebraska.gov/learn/nebraska-wildlife/nebraska-animals/birds/sandhill-cranes/",
    "seasonNote": "Main spring staging period, not a daily count.",
    "sources": [
      "https://outdoornebraska.gov/learn/nebraska-wildlife/nebraska-animals/birds/sandhill-cranes/"
    ]
  },
  {
    "id": "caribou-arctic",
    "animal": "Caribou",
    "areaDescription": "Arctic Refuge coastal plain, northeastern Alaska",
    "polygons": [
      [
        [
          -146,
          69.3
        ],
        [
          -141,
          69.3
        ],
        [
          -141,
          70.1
        ],
        [
          -146,
          70.1
        ],
        [
          -146,
          69.3
        ]
      ]
    ],
    "months": [
      {
        "start": 6,
        "end": 7
      }
    ],
    "habitat": "land",
    "below": "Below us is Arctic coastal tundra used by caribou during the calving season.",
    "facts": [
      "Caribou travel to the coastal plain to raise their young.",
      "The Arctic Refuge includes Porcupine and Central Arctic herd habitat.",
      "These herds move between seasonal feeding areas."
    ],
    "photoSearch": "Arctic caribou tundra",
    "source": "https://www.fws.gov/refuge/arctic/species",
    "seasonNote": "Coastal-plain calving and early rearing window, not a whole-herd location forecast.",
    "sources": [
      "https://www.fws.gov/refuge/arctic/species",
      "https://www.fws.gov/refuge/arctic/visit-us/activities/wildlife-watching"
    ]
  },
  {
    "id": "sardine-run",
    "animal": "South African sardine",
    "areaDescription": "Coastal shelf from the Eastern Cape towards southern KwaZulu-Natal",
    "polygons": [
      [
        [
          28.4,
          -33.1
        ],
        [
          28.9,
          -33.1
        ],
        [
          31.2,
          -30.2
        ],
        [
          30.7,
          -30.2
        ],
        [
          28.4,
          -33.1
        ]
      ]
    ],
    "months": [
      {
        "start": 5,
        "end": 7
      }
    ],
    "habitat": "sea",
    "below": "Below us is the coast where cool water can bring the seasonal sardine run.",
    "facts": [
      "Sardines move east from the Agulhas Bank.",
      "Their arrival is linked to cool coastal water.",
      "The fish travel together in shoals."
    ],
    "photoSearch": "South Africa sardine shoal",
    "source": "https://www.sanbi.org/animal-of-the-week/south-african-sardine/",
    "seasonNote": "Late May into winter; the run varies greatly and can be weak or absent.",
    "sources": [
      "https://www.sanbi.org/animal-of-the-week/south-african-sardine/"
    ]
  },
  {
    "id": "bar-headed-geese",
    "animal": "Bar-headed goose",
    "areaDescription": "Tracked eastern Himalayan crossing corridor between Nepal, Tibet and northeastern India",
    "polygons": [
      [
        [
          86,
          27
        ],
        [
          91,
          27
        ],
        [
          91,
          29.5
        ],
        [
          86,
          29.5
        ],
        [
          86,
          27
        ]
      ]
    ],
    "months": [
      {
        "start": 3,
        "end": 5
      },
      {
        "start": 11,
        "end": 12
      }
    ],
    "habitat": "land",
    "below": "Below us is part of a Himalayan crossing corridor used by bar-headed geese.",
    "facts": [
      "Tracked birds crossed the mountains under their own power.",
      "Some northward crossings were completed within a day.",
      "The birds connect Indian wintering areas with breeding areas farther north."
    ],
    "photoSearch": "bar headed geese Himalayas",
    "source": "https://pmc.ncbi.nlm.nih.gov/articles/PMC3111297/",
    "seasonNote": "Windows from tracked birds: March–May northbound and November–December southbound. This is a corridor, not all Himalayan airspace.",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3111297/"
    ]
  },
  {
    "id": "arctic-tern-britain",
    "animal": "Arctic tern",
    "areaDescription": "Coastal breeding islands off Northumberland, Britain",
    "polygons": [
      [
        [
          -1.75,
          55.5
        ],
        [
          -1.55,
          55.5
        ],
        [
          -1.55,
          55.75
        ],
        [
          -1.75,
          55.75
        ],
        [
          -1.75,
          55.5
        ]
      ]
    ],
    "months": [
      {
        "start": 5,
        "end": 7
      }
    ],
    "habitat": "sea",
    "below": "Below us are coastal islands used by Arctic terns during their northern breeding season.",
    "facts": [
      "Arctic terns breed in northern summers.",
      "They travel towards Antarctic waters for the southern summer.",
      "They catch small fish near the water surface."
    ],
    "photoSearch": "Arctic tern Farne Islands",
    "source": "https://www.rspb.org.uk/birds-and-wildlife/arctic-tern",
    "seasonNote": "Conservative May–July local breeding stage; not a map of the entire ocean journey.",
    "sources": [
      "https://www.rspb.org.uk/birds-and-wildlife/arctic-tern",
      "https://www.nationaltrust.org.uk/visit/north-east/farne-islands/things-to-do-on-the-farne-islands"
    ]
  },
  {
    "id": "sockeye-brooks",
    "animal": "Sockeye salmon",
    "areaDescription": "Brooks River between Naknek Lake and Lake Brooks, Alaska",
    "polygons": [
      [
        [
          -155.79,
          58.54
        ],
        [
          -155.75,
          58.54
        ],
        [
          -155.75,
          58.57
        ],
        [
          -155.79,
          58.57
        ],
        [
          -155.79,
          58.54
        ]
      ]
    ],
    "months": [
      {
        "start": 6,
        "end": 7
      }
    ],
    "habitat": "land",
    "below": "Below us is Brooks River, where sockeye salmon usually make their summer run.",
    "facts": [
      "Sockeye return from the ocean to fresh water.",
      "Most pass through Brooks River by the end of July.",
      "They spawn later than the main upstream run."
    ],
    "photoSearch": "Brooks River sockeye salmon",
    "source": "https://home.nps.gov/katm/learn/photosmultimedia/sockeye-salmon-frequently-asked-questions.htm",
    "seasonNote": "Freshwater river classified as land for the land/sea split; main upstream run June–July.",
    "sources": [
      "https://home.nps.gov/katm/learn/photosmultimedia/sockeye-salmon-frequently-asked-questions.htm",
      "https://home.nps.gov/katm/blogs/the-dynamics-of-the-brooks-river-sockeye.htm"
    ]
  },
  {
    "id": "fur-seal-pribilof",
    "animal": "Northern fur seal",
    "areaDescription": "St Paul and St George breeding islands, Pribilofs, Bering Sea",
    "polygons": [
      [
        [
          -170.4,
          57
        ],
        [
          -170,
          57
        ],
        [
          -170,
          57.3
        ],
        [
          -170.4,
          57.3
        ],
        [
          -170.4,
          57
        ]
      ],
      [
        [
          -169.8,
          56.5
        ],
        [
          -169.4,
          56.5
        ],
        [
          -169.4,
          56.7
        ],
        [
          -169.8,
          56.7
        ],
        [
          -169.8,
          56.5
        ]
      ]
    ],
    "months": [
      {
        "start": 6,
        "end": 10
      }
    ],
    "habitat": "sea",
    "below": "Below us are Pribilof breeding islands used by northern fur seals in summer.",
    "facts": [
      "Northern fur seals breed on islands.",
      "Females feed at sea between visits to their pups.",
      "Pregnant females begin their winter migration in November."
    ],
    "photoSearch": "Pribilof northern fur seals",
    "source": "https://www.fisheries.noaa.gov/species/northern-fur-seal",
    "seasonNote": "Conservative core breeding-residency window; sexes and ages arrive at different times.",
    "sources": [
      "https://www.fisheries.noaa.gov/species/northern-fur-seal"
    ]
  },
  {
    "id": "elephant-seal-reyes",
    "animal": "Northern elephant seal",
    "areaDescription": "Point Reyes headland breeding beaches, California",
    "polygons": [
      [
        [
          -123.03,
          37.97
        ],
        [
          -122.91,
          37.97
        ],
        [
          -122.91,
          38.05
        ],
        [
          -123.03,
          38.05
        ],
        [
          -123.03,
          37.97
        ]
      ]
    ],
    "months": [
      {
        "start": 12,
        "end": 3
      }
    ],
    "habitat": "sea",
    "below": "Below us are Point Reyes beaches where elephant seals gather for winter breeding.",
    "facts": [
      "Males begin arriving in December.",
      "Females give birth to a single pup.",
      "The seals also return to land to replace their fur."
    ],
    "photoSearch": "Point Reyes elephant seals",
    "source": "https://home.nps.gov/pore/planyourvisit/wildlife_viewing_elephantseals.htm",
    "seasonNote": "Breeding return from ocean migrations; this entry excludes the separate molt return.",
    "sources": [
      "https://home.nps.gov/pore/planyourvisit/wildlife_viewing_elephantseals.htm"
    ]
  },
  {
    "id": "pronghorn-idaho",
    "animal": "Pronghorn",
    "areaDescription": "Pronghorn Pass and adjacent Craters of the Moon lava plain, Idaho",
    "polygons": [
      [
        [
          -113.7,
          43.2
        ],
        [
          -113.4,
          43.2
        ],
        [
          -113.4,
          43.55
        ],
        [
          -113.7,
          43.55
        ],
        [
          -113.7,
          43.2
        ]
      ]
    ],
    "months": [
      {
        "start": 3,
        "end": 4
      },
      {
        "start": 9,
        "end": 10
      }
    ],
    "habitat": "land",
    "below": "Below us is an Idaho migration passage used by pronghorn in spring and autumn.",
    "facts": [
      "Pronghorn move between summer and winter ranges.",
      "Snow and available food affect migration timing.",
      "Park cameras help researchers track the passage."
    ],
    "photoSearch": "Craters Moon pronghorn",
    "source": "https://www.nps.gov/articles/000/capturing-pronghorn-migration-at-craters-of-the-moon.htm",
    "seasonNote": "Spring passage mainly March–April; autumn starts September and peaks October.",
    "sources": [
      "https://www.nps.gov/articles/000/capturing-pronghorn-migration-at-craters-of-the-moon.htm"
    ]
  },
  {
    "id": "elk-jackson",
    "animal": "Elk",
    "areaDescription": "National Elk Refuge and adjoining Jackson Hole winter range, Wyoming",
    "polygons": [
      [
        [
          -110.76,
          43.48
        ],
        [
          -110.62,
          43.48
        ],
        [
          -110.62,
          43.65
        ],
        [
          -110.76,
          43.65
        ],
        [
          -110.76,
          43.48
        ]
      ]
    ],
    "months": [
      {
        "start": 10,
        "end": 4
      }
    ],
    "habitat": "land",
    "below": "Below us is Jackson Hole winter range used by elk after their autumn migration.",
    "facts": [
      "Deepening snow pushes elk down from higher summer ranges.",
      "The refuge protects winter grassland and wetlands.",
      "Elk are most often visible here from December into early April."
    ],
    "photoSearch": "Jackson Hole winter elk",
    "source": "https://www.fws.gov/locations/national-elk-refuge",
    "seasonNote": "October–December arrivals followed by winter residency; spring departure depends on snow.",
    "sources": [
      "https://www.fws.gov/locations/national-elk-refuge"
    ]
  },
  {
    "id": "free-tailed-carlsbad",
    "animal": "Brazilian free-tailed bat",
    "areaDescription": "Carlsbad Cavern summer roost and nearby feeding country, New Mexico",
    "polygons": [
      [
        [
          -104.49,
          32.13
        ],
        [
          -104.4,
          32.13
        ],
        [
          -104.4,
          32.2
        ],
        [
          -104.49,
          32.2
        ],
        [
          -104.49,
          32.13
        ]
      ]
    ],
    "months": [
      {
        "start": 4,
        "end": 10
      }
    ],
    "habitat": "land",
    "below": "Below us is Carlsbad Cavern, a summer roost for migrating free-tailed bats.",
    "facts": [
      "Most arrive at summer roosts in March or April.",
      "They leave for southern wintering areas by late October.",
      "They emerge from the cavern to find food at night."
    ],
    "photoSearch": "Carlsbad free tailed bats",
    "source": "https://www.nps.gov/cave/learn/nature/wintering_bats.htm",
    "seasonNote": "Summer-residency stage; nightly feeding flights are not the annual migration.",
    "sources": [
      "https://www.nps.gov/cave/learn/nature/wintering_bats.htm",
      "https://www.nps.gov/cave/planyourvisit/bat_flight_program.htm"
    ]
  },
  {
    "id": "fruit-bats-kasanka",
    "animal": "Straw-coloured fruit bat",
    "areaDescription": "Kasanka swamp-forest roost, northern Zambia",
    "polygons": [
      [
        [
          30.2,
          -12.6
        ],
        [
          30.35,
          -12.6
        ],
        [
          30.35,
          -12.45
        ],
        [
          30.2,
          -12.45
        ],
        [
          30.2,
          -12.6
        ]
      ]
    ],
    "months": [
      {
        "start": 10,
        "end": 12
      }
    ],
    "habitat": "land",
    "below": "Below us is Kasanka, where fruit bats gather during their seasonal visit.",
    "facts": [
      "The bats arrive from other parts of central Africa.",
      "They roost together in swamp forest.",
      "They leave the roost to feed on fruit."
    ],
    "photoSearch": "Kasanka straw coloured bats",
    "source": "https://kasanka.com/wp-content/uploads/Discover-Kasanka-National-Park.pdf",
    "seasonNote": "Arrival and departure vary within the October–December season; no population total asserted.",
    "sources": [
      "https://kasanka.com/wp-content/uploads/Discover-Kasanka-National-Park.pdf"
    ]
  },
  {
    "id": "right-whale-bight",
    "animal": "Southern right whale",
    "areaDescription": "Head of the Great Australian Bight coastal nursery",
    "polygons": [
      [
        [
          130.9,
          -31.7
        ],
        [
          131.5,
          -31.7
        ],
        [
          131.5,
          -31.45
        ],
        [
          130.9,
          -31.45
        ],
        [
          130.9,
          -31.7
        ]
      ]
    ],
    "months": [
      {
        "start": 5,
        "end": 10
      }
    ],
    "habitat": "sea",
    "below": "Below us is coastal nursery habitat used by southern right whales in winter.",
    "facts": [
      "Southern right whales migrate to shallow coastal areas.",
      "Females give birth and nurse calves there.",
      "The coastal calving season runs through the southern winter."
    ],
    "photoSearch": "southern right whale calf",
    "source": "https://www.dcceew.gov.au/environment/biodiversity/threatened/recovery-plans/southern-right-whale",
    "seasonNote": "May–October calving residency, not a guarantee of whales at every point.",
    "sources": [
      "https://www.dcceew.gov.au/environment/biodiversity/threatened/recovery-plans/southern-right-whale"
    ]
  },
  {
    "id": "whale-shark-ningaloo",
    "animal": "Whale shark",
    "areaDescription": "Ningaloo outer reef feeding corridor near Exmouth, Western Australia",
    "polygons": [
      [
        [
          113.55,
          -22.8
        ],
        [
          114.05,
          -22.8
        ],
        [
          114.05,
          -21.8
        ],
        [
          113.55,
          -21.8
        ],
        [
          113.55,
          -22.8
        ]
      ]
    ],
    "months": [
      {
        "start": 4,
        "end": 7
      }
    ],
    "habitat": "sea",
    "below": "Below us is Ningaloo reef country, where whale sharks make seasonal feeding visits.",
    "facts": [
      "Whale sharks are fish rather than whales.",
      "They filter tiny food from the water.",
      "Their seasonal gathering follows a period of coral spawning."
    ],
    "photoSearch": "Ningaloo whale shark",
    "source": "https://marinewaters.fish.wa.gov.au/resource/whale-shark/",
    "seasonNote": "Seasonal aggregation, included as a migration destination rather than a proven fixed migration route.",
    "sources": [
      "https://marinewaters.fish.wa.gov.au/resource/whale-shark/"
    ]
  },
  {
    "id": "swallow-britain",
    "animal": "Barn swallow",
    "areaDescription": "Southern Britain summer feeding and breeding country",
    "polygons": [
      [
        [
          -3,
          50.7
        ],
        [
          0.5,
          50.7
        ],
        [
          0.5,
          52
        ],
        [
          -3,
          52
        ],
        [
          -3,
          50.7
        ]
      ]
    ],
    "months": [
      {
        "start": 4,
        "end": 9
      }
    ],
    "habitat": "land",
    "below": "Below us is summer habitat used by swallows after their journey from Africa.",
    "facts": [
      "Swallows usually arrive in Britain from April.",
      "Many begin their return journey in September.",
      "They catch insects while flying."
    ],
    "photoSearch": "barn swallow flying",
    "source": "https://www.bto.org/learn/about-birds/birdfacts/swallow",
    "seasonNote": "Summer-residency stage, not all birds migrating on the same date.",
    "sources": [
      "https://www.bto.org/learn/about-birds/birdfacts/swallow"
    ]
  },
  {
    "id": "godwit-thames",
    "animal": "Bar-tailed godwit",
    "areaDescription": "Firth of Thames tidal flats, North Island, New Zealand",
    "polygons": [
      [
        [
          175.3,
          -37.23
        ],
        [
          175.6,
          -37.23
        ],
        [
          175.6,
          -37.05
        ],
        [
          175.3,
          -37.05
        ],
        [
          175.3,
          -37.23
        ]
      ]
    ],
    "months": [
      {
        "start": 9,
        "end": 3
      }
    ],
    "habitat": "land",
    "below": "Below us are New Zealand tidal flats where migrating godwits spend the southern summer.",
    "facts": [
      "These godwits breed in Alaska.",
      "They use estuaries to feed during their stay in New Zealand.",
      "Their northward journey includes Asian coastal stopovers."
    ],
    "photoSearch": "Firth Thames godwits",
    "source": "https://www.doc.govt.nz/nature/native-animals/birds/birds-a-z/eastern-bar-tailed-godwit/",
    "seasonNote": "September–March non-breeding stage; tidal mudflats classified as land.",
    "sources": [
      "https://www.doc.govt.nz/nature/native-animals/birds/birds-a-z/eastern-bar-tailed-godwit/",
      "https://doi.org/10.1038/s41467-021-25022-7"
    ]
  },
  {
    "id": "humpback-hawaii",
    "animal": "Humpback whale",
    "areaDescription": "Shallow waters between Maui, Lanai and Kahoolawe, Hawaii",
    "polygons": [
      [
        [
          -156.95,
          20.5
        ],
        [
          -156.4,
          20.5
        ],
        [
          -156.4,
          21
        ],
        [
          -156.95,
          21
        ],
        [
          -156.95,
          20.5
        ]
      ]
    ],
    "months": [
      {
        "start": 11,
        "end": 4
      }
    ],
    "habitat": "sea",
    "below": "Below us are Hawaiian waters used by humpback whales during the winter breeding season.",
    "facts": [
      "Hawaii is a winter breeding area for North Pacific humpbacks.",
      "Whales mate and raise calves in these waters.",
      "The main local season is November through April."
    ],
    "photoSearch": "Hawaii humpback whale calf",
    "source": "https://hawaiihumpbackwhale.noaa.gov/about/about.html",
    "seasonNote": "Core season; occasional animals occur outside these months.",
    "sources": [
      "https://hawaiihumpbackwhale.noaa.gov/about/about.html"
    ]
  },
  {
    "id": "snow-goose-bosque",
    "animal": "Snow goose",
    "areaDescription": "Bosque del Apache refuge wetlands, New Mexico",
    "polygons": [
      [
        [
          -106.93,
          33.72
        ],
        [
          -106.83,
          33.72
        ],
        [
          -106.83,
          33.87
        ],
        [
          -106.93,
          33.87
        ],
        [
          -106.93,
          33.72
        ]
      ]
    ],
    "months": [
      {
        "start": 11,
        "end": 1
      }
    ],
    "habitat": "land",
    "below": "Below us are refuge wetlands used by snow geese during their winter stay.",
    "facts": [
      "Snow geese gather at Bosque del Apache in winter.",
      "They spend the night on water for protection.",
      "The greatest bird numbers usually occur from November into January."
    ],
    "photoSearch": "Bosque snow geese",
    "source": "https://www.fws.gov/refuge/bosque-del-apache/species",
    "seasonNote": "Conservative peak winter-residency window, not the full possible visiting season.",
    "sources": [
      "https://www.fws.gov/refuge/bosque-del-apache/species"
    ]
  },
  {
    "id": "puffin-maine",
    "animal": "Atlantic puffin",
    "areaDescription": "Eastern Egg Rock breeding island and nearby waters, Maine",
    "polygons": [
      [
        [
          -69.4,
          43.82
        ],
        [
          -69.35,
          43.82
        ],
        [
          -69.35,
          43.88
        ],
        [
          -69.4,
          43.88
        ],
        [
          -69.4,
          43.82
        ]
      ]
    ],
    "months": [
      {
        "start": 5,
        "end": 8
      }
    ],
    "habitat": "sea",
    "below": "Below us is a Maine island used by Atlantic puffins during their breeding season.",
    "facts": [
      "Puffins spend the winter at sea.",
      "They nest in burrows or rocky crevices.",
      "Parents bring small fish to their chick."
    ],
    "photoSearch": "Maine Atlantic puffins",
    "source": "https://www.audubon.org/news/audubon-scientists-uncover-winter-home-maine-atlantic-puffins",
    "seasonNote": "May–August breeding stage; some return as early as April.",
    "sources": [
      "https://www.audubon.org/news/audubon-scientists-uncover-winter-home-maine-atlantic-puffins",
      "https://www.audubon.org/field-guide/bird/atlantic-puffin"
    ]
  },
  {
    "id": "osprey-scotland",
    "animal": "Osprey",
    "areaDescription": "Loch Garten and nearby Speyside lochs, Scotland",
    "polygons": [
      [
        [
          -3.8,
          57.15
        ],
        [
          -3.6,
          57.15
        ],
        [
          -3.6,
          57.3
        ],
        [
          -3.8,
          57.3
        ],
        [
          -3.8,
          57.15
        ]
      ]
    ],
    "months": [
      {
        "start": 4,
        "end": 8
      }
    ],
    "habitat": "land",
    "below": "Below us is Scottish loch country where ospreys spend the breeding season.",
    "facts": [
      "Ospreys return from Africa in spring.",
      "They catch fish in fresh water and at sea.",
      "They leave Scotland again in late summer or early autumn."
    ],
    "photoSearch": "Loch Garten osprey",
    "source": "https://forestryandland.gov.scot/living-and-working/learning-and-education/wildlife/osprey",
    "seasonNote": "Conservative April–August window within late-March arrival and August–September departure.",
    "sources": [
      "https://forestryandland.gov.scot/living-and-working/learning-and-education/wildlife/osprey"
    ]
  },
  {
    "id": "cuckoo-britain",
    "animal": "Common cuckoo",
    "areaDescription": "East Anglian breeding countryside, eastern England",
    "polygons": [
      [
        [
          0.5,
          52.2
        ],
        [
          1.7,
          52.2
        ],
        [
          1.7,
          52.8
        ],
        [
          0.5,
          52.8
        ],
        [
          0.5,
          52.2
        ]
      ]
    ],
    "months": [
      {
        "start": 5,
        "end": 6
      }
    ],
    "habitat": "land",
    "below": "Below us is British breeding country visited by cuckoos on their journey from Africa.",
    "facts": [
      "Tracked males arrive around late April or early May.",
      "Many males begin heading south again during June.",
      "Satellite tags have revealed wintering areas in central Africa."
    ],
    "photoSearch": "common cuckoo bird",
    "source": "https://www.bto.org/our-science/projects/cuckoo-tracking-project/what-we-have-learnt",
    "seasonNote": "Conservative male breeding-visit window; young birds and females may follow different schedules.",
    "sources": [
      "https://www.bto.org/our-science/projects/cuckoo-tracking-project/what-we-have-learnt"
    ]
  }
];
