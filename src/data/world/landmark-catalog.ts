/** Static teaching data, checked 20 October 2026. No renderer or network dependency.
 * Sources are review references, never fetched by the app. Facts are paraphrased.
 * Shared looks are artistic approximations, not measured geometry or live volcanic status.
 * Only drawings already implemented get bespoke shape ids; future drawings use shared fallbacks.
 */
export const LANDMARK_SHAPES = ['fuji', 'pyramids', 'everest', 'matterhorn', 'kilimanjaro', 'niagara',
  'volcano', 'peak', 'canyon', 'waterfall', 'rock', 'ruins', 'building', 'reef', 'flat'] as const;
export type LandmarkShape = typeof LANDMARK_SHAPES[number];
export const LANDMARK_COLOURS = ['dark-lava', 'red-rock', 'grey-rock', 'green', 'white', 'sand'] as const;
export interface LandmarkLook {
  /** 0 disables snow; otherwise the fraction of the visible height where snow starts. */
  snowLine?: number;
  /** A usual gas/steam plume, not a claim that an eruption is happening now. */
  steam?: boolean;
  crater?: boolean;
  steep?: number;
  colour?: typeof LANDMARK_COLOURS[number];
  /** Approximate visible footprint in km, not a route trigger radius. */
  width?: number;
}
type ThreeFacts = readonly [string, string, string];
export interface Landmark {
  id: string;
  name: string;
  /** Other exact route-source names for the same feature. */
  aliases?: readonly string[];
  country: string;
  lat: number;
  lng: number;
  /** Summit elevation above sea level, never canyon depth or a building's height. */
  heightM?: number;
  shape: LandmarkShape;
  look?: LandmarkLook;
  facts: { junior: ThreeFacts; core: ThreeFacts; advanced: ThreeFacts };
  question: string;
  sources: readonly string[];
  /** Representative location for large areas, measurement dates and deliberate omissions. */
  note?: string;
}
const wiki = (title: string) => `https://en.wikipedia.org/wiki/${title}`;

export const LANDMARK_CATALOG: readonly Landmark[] = [
  {
    id: 'everest', name: 'Mount Everest', country: 'Nepal / China', lat: 27.9881, lng: 86.925, heightM: 8848.86, shape: 'everest',
    facts: {
      junior: ['It is very high.', 'Snow covers the top.', 'It is in Asia.'],
      core: ['It is the highest mountain above sea level.', 'It stands on the border of Nepal and China.', 'Climbers need time to get used to thin air.'],
      advanced: ['Nepal and China jointly announced an elevation of 8,848.86 metres in 2020.', 'Tenzing Norgay and Edmund Hillary reached the summit in 1953.', 'It belongs to the Mahalangur Himal section of the Himalayas.'],
    }, question: 'What would be hardest about a journey up this mountain?', sources: [wiki('Mount_Everest')],
  },
  {
    id: 'mont-blanc', name: 'Mont Blanc', country: 'France / Italy', lat: 45.8328, lng: 6.865, heightM: 4805.59, shape: 'peak',
    look: { snowLine: 0.55, steep: 1.1, colour: 'grey-rock', width: 12 },
    facts: {
      junior: ['It is in the Alps.', 'Its top has snow.', 'People climb this mountain.'],
      core: ['Mont Blanc is the highest mountain in the Alps.', 'Its name means White Mountain in French.', 'A road tunnel passes through the mountain.'],
      advanced: ['The snow summit was measured at 4,805.59 metres in 2023.', 'Jacques Balmat and Michel-Gabriel Paccard made the first recorded ascent in 1786.', 'The Mont Blanc Tunnel links France and Italy.'],
    }, question: 'Would you rather travel through a mountain or over it? Why?', sources: [wiki('Mont_Blanc')],
    note: 'Snow summit varies. Height is the dated 2023 survey; the precise border across the summit is disputed.',
  },
  {
    id: 'fuji', name: 'Mount Fuji', country: 'Japan', lat: 35.3606, lng: 138.7274, heightM: 3776, shape: 'fuji',
    facts: {
      junior: ['It is in Japan.', 'It is a volcano.', 'Artists draw this mountain.'],
      core: ['Fuji is the highest mountain in Japan.', 'Its last eruption began in 1707.', 'It is a sacred place for many people.'],
      advanced: ['The summit reaches 3,776 metres above sea level.', 'The Hoei eruption spread ash towards Edo, now Tokyo.', 'Hokusai included Fuji in his Thirty-six Views of Mount Fuji series.'],
    }, question: 'What makes a place interesting to paint?', sources: [wiki('Mount_Fuji')],
  },
  {
    id: 'kilimanjaro', name: 'Mount Kilimanjaro', aliases: ['Kilimanjaro'], country: 'Tanzania', lat: -3.0674, lng: 37.3556, heightM: 5895, shape: 'kilimanjaro',
    facts: {
      junior: ['It is in Africa.', 'It is a volcano.', 'Ice lies near the top.'],
      core: ['It is the highest mountain in Africa.', 'It stands in Tanzania, near Kenya.', 'Forests grow on its lower slopes.'],
      advanced: ['Uhuru Peak on Kibo reaches 5,895 metres.', 'The mountain has three volcanic cones: Kibo, Mawenzi and Shira.', 'Its summit glaciers have shrunk greatly since the early twentieth century.'],
    }, question: 'How might the plants change as you climb higher?', sources: [wiki('Mount_Kilimanjaro')],
  },
  {
    id: 'denali', name: 'Denali', country: 'United States', lat: 63.0692, lng: -151.007, heightM: 6190, shape: 'peak',
    look: { snowLine: 0.3, steep: 1.15, colour: 'white', width: 18 },
    facts: {
      junior: ['It is in Alaska.', 'It has two summits.', 'Snow covers its slopes.'],
      core: ['Denali is the highest mountain in North America.', 'Large glaciers flow down its sides.', 'Its higher summit is the South Summit.'],
      advanced: ['A 2015 survey established an elevation of 6,190 metres.', 'The Koyukon name Denali means the high one.', 'Hudson Stuck, Harry Karstens, Walter Harper and Robert Tatum reached the South Summit in 1913.'],
    }, question: 'What would you pack for a journey through this snowy place?', sources: [wiki('Denali')],
  },
  {
    id: 'aconcagua', name: 'Mount Aconcagua', country: 'Argentina', lat: -32.6531, lng: -70.0117, heightM: 6967, shape: 'peak',
    look: { snowLine: 0.7, steep: 1.1, colour: 'grey-rock', width: 15 },
    facts: {
      junior: ['It is in Argentina.', 'It is very high.', 'Glaciers cover some slopes.'],
      core: ['Aconcagua is part of the Andes.', 'It is the highest mountain outside Asia.', 'It stands near the border with Chile.'],
      advanced: ['Its summit is about 6,967 metres above sea level.', 'Matthias Zurbriggen made the first recorded ascent in 1897.', 'It lies in Mendoza Province in Aconcagua Provincial Park.'],
    }, question: 'How would you prepare before walking at a great height?', sources: [wiki('Aconcagua')],
  },
  {
    id: 'etna', name: 'Mount Etna', country: 'Italy', lat: 37.751, lng: 14.993, shape: 'volcano',
    look: { snowLine: 0.8, steam: true, crater: true, steep: 0.8, colour: 'dark-lava', width: 40 },
    facts: {
      junior: ['It is in Italy.', 'It is a volcano.', 'Lava changes its slopes.'],
      core: ['Etna stands on the island of Sicily.', 'It has several summit craters.', 'Its eruptions can change its height.'],
      advanced: ['Mount Etna became a UNESCO World Heritage Site in 2013.', 'Its eruptions have been recorded for over 2,000 years.', 'The volcano rises near the city of Catania.'],
    }, question: 'How might living near a volcano affect everyday life?', sources: [wiki('Mount_Etna'), 'https://whc.unesco.org/en/list/1427/'],
    note: 'Summit crater location. Height omitted because recent eruptions change the highest point.',
  },
  {
    id: 'vesuvius', name: 'Mount Vesuvius', country: 'Italy', lat: 40.8214, lng: 14.4265, heightM: 1281, shape: 'volcano',
    look: { snowLine: 0, steam: false, crater: true, steep: 1, colour: 'grey-rock', width: 10 },
    facts: {
      junior: ['It is in Italy.', 'It is a volcano.', 'It stands near Naples.'],
      core: ['Its eruption buried the Roman city of Pompeii.', 'The summit has a large crater.', 'The volcano last erupted in 1944.'],
      advanced: ['The eruption of AD 79 buried Pompeii and Herculaneum.', 'Vesuvius rises inside the remains of the older Mount Somma.', 'Its summit reaches about 1,281 metres above sea level.'],
    }, question: 'What could an old city teach us about daily life?', sources: [wiki('Mount_Vesuvius')],
  },
  {
    id: 'elbrus', name: 'Mount Elbrus', country: 'Russia', lat: 43.355, lng: 42.4392, heightM: 5642, shape: 'volcano',
    look: { snowLine: 0.4, steam: false, crater: false, steep: 0.8, colour: 'white', width: 20 },
    facts: {
      junior: ['It has two summits.', 'It is a volcano.', 'Ice covers its slopes.'],
      core: ['Elbrus stands in the Caucasus Mountains.', 'The western summit is higher than the eastern one.', 'It is the highest mountain in Russia.'],
      advanced: ['The western summit reaches 5,642 metres.', 'Elbrus is a dormant volcano in the Greater Caucasus.', 'Under the usual Caucasus boundary convention, it is the highest mountain in Europe.'],
    }, question: 'What might change when people draw a continent boundary differently?', sources: [wiki('Mount_Elbrus')],
  },
  {
    id: 'ararat', name: 'Mount Ararat', country: 'Turkey', lat: 39.702, lng: 44.298, heightM: 5137, shape: 'volcano',
    look: { snowLine: 0.8, steam: false, crater: false, steep: 0.9, colour: 'grey-rock', width: 35 },
    facts: {
      junior: ['It is in Turkey.', 'It is a volcano.', 'Its highest top has ice.'],
      core: ['Ararat has two main peaks.', 'Greater Ararat is the highest mountain in Turkey.', 'The mountain is important in Armenian culture.'],
      advanced: ['Greater Ararat is commonly listed at 5,137 metres.', 'Little Ararat stands southeast of the higher summit.', 'Its summit ice cap has retreated in recent decades.'],
    }, question: 'Why might a mountain become a symbol for people?', sources: [wiki('Mount_Ararat')],
    note: 'Published summit elevations differ; 5,137 m is a conventional value, not a new survey.',
  },
  {
    id: 'matterhorn', name: 'the Matterhorn', country: 'Switzerland / Italy', lat: 45.9764, lng: 7.6586, heightM: 4478, shape: 'matterhorn',
    facts: {
      junior: ['It has a pointed top.', 'It is in the Alps.', 'Snow lies on its sides.'],
      core: ['The Matterhorn stands on the Swiss-Italian border.', 'Its main faces point in four different directions.', 'The Swiss town of Zermatt lies nearby.'],
      advanced: ['The summit reaches 4,478 metres above sea level.', 'An expedition led by Edward Whymper first reached the summit in 1865.', 'Its Italian name is Cervino and its French name is Cervin.'],
    }, question: 'How would you describe this mountain without saying its name?', sources: [wiki('Matterhorn')],
  },
  {
    id: 'mount-kenya', name: 'Mount Kenya', country: 'Kenya', lat: -0.1508, lng: 37.3075, heightM: 5199, shape: 'peak',
    look: { snowLine: 0.9, steep: 1.4, colour: 'grey-rock', width: 20 },
    facts: {
      junior: ['It is in Kenya.', 'It has rocky peaks.', 'Forests grow below the peaks.'],
      core: ['It is the second-highest mountain in Africa.', 'The mountain is an old, eroded volcano.', 'It stands close to the equator.'],
      advanced: ['Batian, the highest peak, reaches 5,199 metres.', 'Nelion and Point Lenana are two other well-known peaks.', 'Mount Kenya National Park became a World Heritage Site in 1997.'],
    }, question: 'What surprises you about finding ice near the equator?', sources: [wiki('Mount_Kenya')],
  },
  {
    id: 'mauna-kea', name: 'Mauna Kea', country: 'United States', lat: 19.8207, lng: -155.4681, heightM: 4207, shape: 'volcano',
    look: { snowLine: 0, steam: false, crater: false, steep: 0.5, colour: 'red-rock', width: 45 },
    facts: {
      junior: ['It is in Hawaii.', 'It is a volcano.', 'Snow sometimes covers the top.'],
      core: ['Mauna Kea is the highest mountain in Hawaii.', 'Much of the mountain lies below the sea.', 'Telescopes stand near its summit.'],
      advanced: ['The summit is about 4,207 metres above sea level.', 'It rises more than 10,000 metres from its submarine base.', 'Mauna Kea is sacred in Native Hawaiian traditions.'],
    }, question: 'How should people care for a place that is sacred and useful for science?', sources: [wiki('Mauna_Kea')],
  },
  {
    id: 'st-helens', name: 'Mount St. Helens', country: 'United States', lat: 46.1912, lng: -122.1944, heightM: 2549, shape: 'volcano',
    look: { snowLine: 0.7, steam: false, crater: true, steep: 1, colour: 'grey-rock', width: 12 },
    facts: {
      junior: ['It is a volcano.', 'Its top has changed.', 'Trees grow around it.'],
      core: ['It stands in Washington State.', 'A large eruption removed much of its summit.', 'Plants and animals returned to damaged areas.'],
      advanced: ['The major eruption occurred on 18 May 1980.', 'A huge landslide opened the volcano towards the north.', 'The present summit reaches about 2,549 metres.'],
    }, question: 'How might a forest recover after a big eruption?', sources: [wiki('Mount_St._Helens')],
  },
  {
    id: 'rainier', name: 'Mount Rainier', country: 'United States', lat: 46.8517, lng: -121.7603, heightM: 4391, shape: 'volcano',
    look: { snowLine: 0.45, steam: false, crater: true, steep: 1, colour: 'white', width: 20 },
    facts: {
      junior: ['It is a volcano.', 'Ice covers its slopes.', 'It is near Seattle.'],
      core: ['Rainier is the highest mountain in Washington State.', 'Its glaciers feed rivers below.', 'It is an active volcano, even when quiet.'],
      advanced: ['The summit elevation was reported as 4,391 metres in a 2025 survey.', 'Mount Rainier National Park was established in 1899.', 'Volcanic mudflows called lahars can travel far along river valleys.'],
    }, question: 'Why might a city need to understand a nearby mountain?', sources: [wiki('Mount_Rainier'), 'https://arxiv.org/abs/2512.06567'], note: '2025 summit survey; snow and ice can change summit elevation.',
  },
  {
    id: 'grand-canyon', name: 'the Grand Canyon', aliases: ['Grand Canyon'], country: 'United States', lat: 36.0616, lng: -112.1079, shape: 'canyon',
    look: { steep: 1.2, colour: 'red-rock', width: 20 },
    facts: {
      junior: ['It is very deep.', 'A river flows below.', 'Its rocks have many colours.'],
      core: ['The Colorado River flows through the canyon.', 'Layers of rock show a long history.', 'It is in Arizona in the United States.'],
      advanced: ['The canyon is about 446 kilometres long.', 'Grand Canyon National Park was established in 1919.', 'Some exposed basement rocks are nearly two billion years old.'],
    }, question: 'What would you notice first if you could look down into this canyon?', sources: [wiki('Grand_Canyon'), wiki('Mather_Point')],
    note: 'Mather Point area; a representative South Rim view, not the centre of the entire canyon.',
  },
  {
    id: 'niagara', name: 'Niagara Falls', country: 'Canada / United States', lat: 43.0799, lng: -79.0747, shape: 'niagara',
    facts: {
      junior: ['Water falls over a cliff.', 'The water makes mist.', 'Boats visit below the falls.'],
      core: ['Niagara is a group of three waterfalls.', 'The falls lie on the Canada-US border.', 'The river carries water from Lake Erie towards Lake Ontario.'],
      advanced: ['Horseshoe Falls is about 57 metres high.', 'American Falls and Bridal Veil Falls lie on the United States side.', 'The Niagara River is part of the Great Lakes drainage system.'],
    }, question: 'What sounds and feelings would you describe near these falls?', sources: [wiki('Niagara_Falls')],
  },
  {
    id: 'angkor-wat', name: 'Angkor Wat', country: 'Cambodia', lat: 13.4125, lng: 103.867, shape: 'building', look: { colour: 'grey-rock', width: 1.5 },
    facts: {
      junior: ['It is in Cambodia.', 'It has tall towers.', 'Water surrounds the temple.'],
      core: ['Angkor Wat is a large temple complex.', 'It was first built as a Hindu temple.', 'It later became a Buddhist temple.'],
      advanced: ['Suryavarman II commissioned Angkor Wat in the twelfth century.', 'The original temple was dedicated to Vishnu.', 'Its towers symbolise Mount Meru in Hindu cosmology.'],
    }, question: 'What details would you look for when exploring an old temple?', sources: [wiki('Angkor_Wat')],
  },
  {
    id: 'great-wall', name: 'the Great Wall of China', country: 'China', lat: 40.3542, lng: 116.0069, shape: 'building', look: { colour: 'grey-rock', width: 5 },
    facts: {
      junior: ['It is in China.', 'It follows the hills.', 'It has many towers.'],
      core: ['The Great Wall is a network of walls.', 'Different rulers built sections at different times.', 'Watchtowers helped guards send warnings.'],
      advanced: ['Many surviving sections were built during the Ming dynasty, from 1368 to 1644.', 'Badaling is a restored section near Beijing.', 'The wall became a UNESCO World Heritage Site in 1987.'],
    }, question: 'How would you send a message across these hills without a phone?', sources: [wiki('Great_Wall_of_China')],
    note: 'Badaling section, rather than a rounded point between distant wall sections.',
  },
  {
    id: 'victoria-falls', name: 'Victoria Falls', country: 'Zambia / Zimbabwe', lat: -17.9243, lng: 25.8572, shape: 'waterfall', look: { colour: 'grey-rock', width: 1.7 },
    facts: {
      junior: ['A wide river falls here.', 'The water makes mist.', 'The falls are in Africa.'],
      core: ['The Zambezi River flows over Victoria Falls.', 'The falls stand between Zambia and Zimbabwe.', 'The amount of water changes with the seasons.'],
      advanced: ['The falls are about 1,708 metres wide.', 'Mosi-oa-Tunya is a local name meaning the smoke that thunders.', 'The river drops into a narrow basalt gorge.'],
    }, question: 'What name would you give a waterfall, and why?', sources: [wiki('Victoria_Falls')],
  },
  {
    id: 'uluru', name: 'Uluru', country: 'Australia', lat: -25.3444, lng: 131.0369, shape: 'rock', look: { colour: 'red-rock', width: 3.6 },
    facts: {
      junior: ['It is a big rock.', 'It is in Australia.', 'It looks red and orange.'],
      core: ['Uluru is made of sandstone.', 'It is sacred to the Anangu people.', 'Its colours seem to change with the light.'],
      advanced: ['Uluru rises about 348 metres above the surrounding plain.', 'It lies within Uluru-Kata Tjuta National Park.', 'The climb was permanently closed to visitors in 2019.'],
    }, question: 'How can visitors show respect for a place that matters to others?', sources: [wiki('Uluru')],
  },
  {
    id: 'yellowstone', name: 'Yellowstone', country: 'United States', lat: 44.4605, lng: -110.8281, shape: 'flat', look: { colour: 'green', width: 8 },
    facts: {
      junior: ['Hot water rises here.', 'Bison live in the park.', 'There are many forests.'],
      core: ['Yellowstone has geysers and hot springs.', 'Most of the park is in Wyoming.', 'Heat below the ground warms its water.'],
      advanced: ['Yellowstone National Park was established in 1872.', 'Old Faithful is a geyser in the Upper Geyser Basin.', 'The park also extends into Montana and Idaho.'],
    }, question: 'What would you like to learn by visiting a national park?', sources: [wiki('Yellowstone_National_Park')],
    note: 'Old Faithful anchors the park sight. The volcanic caldera has its own distinct entry.',
  },
  {
    id: 'death-valley', name: 'Death Valley', country: 'United States', lat: 36.2301, lng: -116.7679, shape: 'flat', look: { colour: 'sand', width: 20 },
    facts: {
      junior: ['It is very dry.', 'Salt covers some ground.', 'Mountains rise beside the valley.'],
      core: ['Death Valley lies in California.', 'Badwater Basin is below sea level.', 'Some plants and animals survive the desert heat.'],
      advanced: ['Badwater Basin lies about 86 metres below sea level.', 'Death Valley is part of the Mojave Desert.', 'The valley lies between the Panamint and Amargosa ranges.'],
    }, question: 'How would you plan a safe trip to a very hot place?', sources: [wiki('Death_Valley')], note: 'Badwater Basin salt flats.',
  },
  {
    id: 'salar-de-uyuni', name: 'the Salar de Uyuni', country: 'Bolivia', lat: -20.1338, lng: -67.4891, shape: 'flat', look: { colour: 'white', width: 100 },
    facts: {
      junior: ['The ground is white.', 'It is covered in salt.', 'It is in Bolivia.'],
      core: ['This is the largest salt flat in the world.', 'Ancient lakes left the salt behind.', 'A thin layer of water can reflect the sky.'],
      advanced: ['The salt flat covers roughly 10,000 square kilometres.', 'It lies on the Altiplano, high in the Andes.', 'Brines beneath its crust contain lithium.'],
    }, question: 'How would a reflection change a photo of this place?', sources: [wiki('Salar_de_Uyuni')], note: 'Representative point on the salt flat.',
  },
  {
    id: 'iguazu-falls', name: 'Iguazu Falls', country: 'Argentina / Brazil', lat: -25.6953, lng: -54.4367, shape: 'waterfall', look: { colour: 'green', width: 2.7 },
    facts: {
      junior: ['There are many waterfalls.', 'Forests grow around them.', 'Water makes clouds of mist.'],
      core: ['The falls lie between Argentina and Brazil.', 'The Iguazu River flows over a wide edge.', 'National parks protect both sides of the falls.'],
      advanced: ['The waterfall system stretches about 2.7 kilometres.', 'The Devil\'s Throat is a deep, horseshoe-shaped section.', 'The surrounding forest belongs to the Atlantic Forest region.'],
    }, question: 'Would you rather see these falls from above or below? Why?', sources: [wiki('Iguazu_Falls')],
  },
  {
    id: 'machu-picchu', name: 'Machu Picchu', country: 'Peru', lat: -13.1631, lng: -72.545, shape: 'ruins', look: { colour: 'grey-rock', width: 0.6 },
    facts: {
      junior: ['It is in Peru.', 'Stone buildings stand on hills.', 'People built steps for farming.'],
      core: ['The Inca built Machu Picchu in the Andes.', 'Stone terraces cover the steep slopes.', 'The Urubamba River curves far below.'],
      advanced: ['The site dates mainly from the fifteenth century.', 'It stands about 2,430 metres above sea level.', 'Many walls use carefully fitted stones without mortar.'],
    }, question: 'How would building a town on a mountain change its design?', sources: [wiki('Machu_Picchu')],
  },
  {
    id: 'great-barrier-reef', name: 'the Great Barrier Reef', country: 'Australia', lat: -18.2871, lng: 147.6992, shape: 'reef', look: { colour: 'green', width: 30 },
    facts: {
      junior: ['It is in the sea.', 'Many fish live here.', 'Tiny animals build the coral.'],
      core: ['The reef lies off northeastern Australia.', 'It is a large system of separate reefs.', 'Warm seas can make corals lose their colour.'],
      advanced: ['The reef system extends for about 2,300 kilometres along Queensland.', 'Corals live with microscopic algae that help provide their food.', 'It became a UNESCO World Heritage Site in 1981.'],
    }, question: 'How could people help protect a place under the sea?', sources: [wiki('Great_Barrier_Reef')],
    note: 'Representative central reef location; width describes a visible patch, not the whole system.',
  },
  {
    id: 'pyramids', name: 'the Pyramids of Giza', country: 'Egypt', lat: 29.9792, lng: 31.1342, shape: 'pyramids',
    facts: {
      junior: ['They are in Egypt.', 'They are made of stone.', 'They were built long ago.'],
      core: ['The pyramids were tombs for ancient Egyptian kings.', 'The Great Pyramid is the largest at Giza.', 'The Great Sphinx stands nearby.'],
      advanced: ['The three main pyramids belong to Khufu, Khafre and Menkaure.', 'They were built during Egypt\'s Fourth Dynasty.', 'Khufu\'s pyramid originally stood about 146.6 metres tall.'],
    }, question: 'How might people move very heavy stones without modern machines?', sources: [wiki('Giza_pyramid_complex')],
  },
  {
    id: 'petra', name: 'Petra', country: 'Jordan', lat: 30.3286, lng: 35.4444, shape: 'ruins', look: { colour: 'red-rock', width: 2 },
    facts: {
      junior: ['It is in Jordan.', 'Buildings are cut into rock.', 'The rocks look pink.'],
      core: ['Petra was an important Nabataean city.', 'A narrow passage leads into the city.', 'Its people collected and stored water in a dry place.'],
      advanced: ['The narrow entrance gorge is called the Siq.', 'Al-Khazneh is the famous facade known as the Treasury.', 'Nabataean trade routes connected Arabia with the Mediterranean world.'],
    }, question: 'How would you save water in a city with little rain?', sources: [wiki('Petra')], note: 'Al-Khazneh facade.',
  },
  {
    id: 'taj-mahal', name: 'the Taj Mahal', country: 'India', lat: 27.1751, lng: 78.0421, shape: 'building', look: { colour: 'white', width: 0.3 },
    facts: {
      junior: ['It is in India.', 'It has a white dome.', 'Gardens stand in front.'],
      core: ['The Taj Mahal stands in Agra.', 'It was built as a tomb for Mumtaz Mahal.', 'White marble covers the main building.'],
      advanced: ['The Mughal emperor Shah Jahan commissioned the complex in 1632.', 'It stands beside the Yamuna River.', 'Its decoration includes calligraphy and inlaid coloured stones.'],
    }, question: 'What could a building show about the person who designed it?', sources: [wiki('Taj_Mahal')],
  },
  {
    id: 'stonehenge', name: 'Stonehenge', country: 'United Kingdom', lat: 51.1789, lng: -1.8262, shape: 'ruins', look: { colour: 'grey-rock', width: 0.1 },
    facts: {
      junior: ['Big stones stand in circles.', 'It is in England.', 'People built it long ago.'],
      core: ['Stonehenge stands on Salisbury Plain.', 'It was built in several stages.', 'Some stones line up with the midsummer sunrise.'],
      advanced: ['The main stone setting dates to about 2500 BC.', 'Its stones include large sarsens and smaller bluestones.', 'The monument is aligned with the solstice sun.'],
    }, question: 'What clues could help us understand a place with no written story?', sources: [wiki('Stonehenge')],
  },
  {
    id: 'giants-causeway', name: 'the Giant’s Causeway', country: 'United Kingdom', lat: 55.2408, lng: -6.5116, shape: 'rock', look: { colour: 'dark-lava', width: 0.6 },
    facts: {
      junior: ['The rocks look like steps.', 'They stand beside the sea.', 'Many have six sides.'],
      core: ['The Giant\'s Causeway is in Northern Ireland.', 'Its columns formed as lava cooled.', 'Legends tell stories about a giant here.'],
      advanced: ['The site contains about 40,000 basalt columns.', 'The basalt formed during volcanic activity around 60 million years ago.', 'Irish stories connect the causeway with Fionn mac Cumhaill.'],
    }, question: 'What story would you invent to explain these unusual shapes?', sources: [wiki('Giant%27s_Causeway')],
  },
  {
    id: 'norwegian-fjords', name: 'the Norwegian fjords', country: 'Norway', lat: 61.0014, lng: 6.5061, shape: 'canyon', look: { steep: 1.3, colour: 'green', width: 5 },
    facts: {
      junior: ['Sea water fills deep valleys.', 'Mountains rise beside the water.', 'They are in Norway.'],
      core: ['Glaciers carved these deep valleys.', 'Sea water entered after the ice melted.', 'Boats travel far inland along some fjords.'],
      advanced: ['Sognefjord is Norway\'s longest fjord.', 'Its main channel extends over 200 kilometres inland.', 'A fjord is a glacial valley flooded by the sea.'],
    }, question: 'How would travelling by boat here differ from travelling by road?', sources: [wiki('Sognefjord')],
    note: 'Representative point in Sognefjord, not a claim that all Norwegian fjords share one location.',
  },
  {
    id: 'dolomites', name: 'the Dolomites', country: 'Italy', lat: 46.434, lng: 11.8506, heightM: 3343, shape: 'peak', look: { snowLine: 0.85, steep: 1.4, colour: 'grey-rock', width: 12 },
    facts: {
      junior: ['These mountains are in Italy.', 'They have steep rocky sides.', 'Snow falls here in winter.'],
      core: ['The Dolomites are part of the Alps.', 'Their pale rocks can glow pink at sunset.', 'Marmolada is their highest mountain.'],
      advanced: ['Marmolada reaches 3,343 metres at Punta Penia.', 'The range is named after the mineral dolomite.', 'The Dolomites became a UNESCO World Heritage Site in 2009.'],
    }, question: 'How can changing light make a mountain look different?', sources: [wiki('Dolomites')], note: 'Punta Penia on Marmolada anchors this mountain range; height is that summit.',
  },
  {
    id: 'ha-long-bay', name: 'Ha Long Bay', country: 'Vietnam', lat: 20.9, lng: 107.1, shape: 'rock', look: { colour: 'green', width: 15 },
    facts: {
      junior: ['Rock islands rise from water.', 'It is in Vietnam.', 'Boats travel between the islands.'],
      core: ['Ha Long Bay has many limestone islands.', 'Rain and water slowly shaped the limestone.', 'Some islands contain caves.'],
      advanced: ['The bay lies in the Gulf of Tonkin.', 'Its landscape is an example of flooded limestone karst.', 'Ha Long Bay entered the World Heritage List in 1994.'],
    }, question: 'What would you like to explore on a boat trip here?', sources: [wiki('H%E1%BA%A1_Long_Bay')], note: 'Representative point among the limestone islands.',
  },
  {
    id: 'maasai-mara', name: 'the Maasai Mara', country: 'Kenya', lat: -1.5, lng: 35.1, shape: 'flat', look: { colour: 'green', width: 40 },
    facts: {
      junior: ['Many wild animals live here.', 'Grass covers wide plains.', 'It is in Kenya.'],
      core: ['The reserve is named after the Maasai people.', 'Wildebeest move between here and the Serengeti.', 'Lions and other large animals live on the plains.'],
      advanced: ['The Mara River crosses this savanna landscape.', 'The annual migration links ecosystems in Kenya and Tanzania.', 'The Maasai Mara National Reserve borders the Serengeti ecosystem.'],
    }, question: 'What might animals need along a long migration route?', sources: [wiki('Maasai_Mara')], note: 'Representative point inside the reserve.',
  },
  {
    id: 'serengeti', name: 'the Serengeti', country: 'Tanzania / Kenya', lat: -2.35, lng: 34.8, shape: 'flat', look: { colour: 'green', width: 60 },
    facts: {
      junior: ['Grass covers wide plains.', 'Many wildebeest live here.', 'Lions hunt on the plains.'],
      core: ['The Serengeti is an East African ecosystem.', 'Large herds move to find fresh grass.', 'Rain helps decide where the herds travel.'],
      advanced: ['The ecosystem stretches across northern Tanzania into southwestern Kenya.', 'Its migration includes wildebeest, zebras and gazelles.', 'Granite outcrops called kopjes rise above parts of the plains.'],
    }, question: 'How might a change in rainfall affect the animals here?', sources: [wiki('Serengeti')], note: 'Representative point in the Tanzanian plains.',
  },
  {
    id: 'okavango-delta', name: 'the Okavango Delta', country: 'Botswana', lat: -19.3, lng: 22.9, shape: 'flat', look: { colour: 'green', width: 70 },
    facts: {
      junior: ['Water spreads across dry land.', 'Many animals live here.', 'It is in Botswana.'],
      core: ['The Okavango River forms an inland delta.', 'Its water does not flow into the sea.', 'Floodwater arrives from rains far away in Angola.'],
      advanced: ['Seasonal floods spread across the Kalahari Basin.', 'Much of the water leaves through evaporation and plant transpiration.', 'The delta became a UNESCO World Heritage Site in 2014.'],
    }, question: 'How could water arriving from far away change life here?', sources: [wiki('Okavango_Delta')], note: 'Representative central delta location.',
  },
  {
    id: 'table-mountain', name: 'Table Mountain', country: 'South Africa', lat: -33.9573, lng: 18.4256, heightM: 1086, shape: 'rock', look: { colour: 'grey-rock', width: 3 },
    facts: {
      junior: ['Its top looks flat.', 'It stands beside Cape Town.', 'Clouds sometimes cover the top.'],
      core: ['Table Mountain is in South Africa.', 'A cable car carries visitors up the mountain.', 'Its flat top gave the mountain its name.'],
      advanced: ['Maclear\'s Beacon is the highest point, at 1,086 metres.', 'The mountain supports distinctive fynbos vegetation.', 'Its cloud cover is often called the tablecloth.'],
    }, question: 'What shape would you use to name a mountain?', sources: [wiki('Table_Mountain')], note: 'Maclear\'s Beacon summit.',
  },
  {
    id: 'palm-islands', name: 'the Palm Islands of Dubai', country: 'United Arab Emirates', lat: 25.1124, lng: 55.139, shape: 'flat', look: { colour: 'sand', width: 5.5 },
    facts: {
      junior: ['People made these islands.', 'They are beside Dubai.', 'One looks like a palm.'],
      core: ['Palm Jumeirah was built from sand and rock.', 'Its branches hold roads and buildings.', 'A curved breakwater helps protect the island.'],
      advanced: ['Construction of Palm Jumeirah began in 2001.', 'It was created by land reclamation in the Persian Gulf.', 'Palm Jumeirah and Palm Jebel Ali are separate island projects.'],
    }, question: 'What might be the benefits and problems of making a new island?', sources: [wiki('Palm_Jumeirah')], note: 'Palm Jumeirah anchors the plural route label.',
  },
  {
    id: 'cappadocia', name: 'Cappadocia', country: 'Turkey', lat: 38.6386, lng: 34.8451, shape: 'rock', look: { colour: 'sand', width: 8 },
    facts: {
      junior: ['Tall rocks have unusual shapes.', 'People cut rooms into rocks.', 'It is in Turkey.'],
      core: ['Cappadocia has rock towers called fairy chimneys.', 'Wind and water shaped soft volcanic rock.', 'People made homes and churches in the rock.'],
      advanced: ['The landscape contains layers of volcanic tuff.', 'Goreme is known for its rock-cut churches.', 'Underground settlements include Derinkuyu and Kaymakli.'],
    }, question: 'What would be different about living in a home inside rock?', sources: [wiki('Cappadocia'), 'https://web.itu.edu.tr/~akkurtb/jotcsabc/jotcsa_web/9%282%29_LG.pdf'], note: 'Goreme Open Air Museum area anchors the wider region.',
  },
  {
    id: 'loire-valley', name: 'the Loire Valley', country: 'France', lat: 47.3248, lng: 1.0703, shape: 'flat', look: { colour: 'green', width: 20 },
    facts: {
      junior: ['A river flows here.', 'There are many castles.', 'It is in France.'],
      core: ['The Loire Valley follows the Loire River.', 'Its towns and castles show a long history.', 'Farms and vineyards cover parts of the valley.'],
      advanced: ['The World Heritage section runs between Sully-sur-Loire and Chalonnes.', 'The valley contains Renaissance chateaux such as Chambord.', 'The Loire is the longest river entirely within France.'],
    }, question: 'Why might people choose to build castles near a river?', sources: [wiki('Loire_Valley')], note: 'Chaumont-sur-Loire anchors the broad valley label.',
  },
  {
    id: 'mount-rushmore', name: 'Mount Rushmore', country: 'United States', lat: 43.8791, lng: -103.4591, shape: 'rock', look: { colour: 'grey-rock', width: 0.5 },
    facts: {
      junior: ['Faces are carved in rock.', 'There are four large faces.', 'The rock is a mountain.'],
      core: ['The carving shows four United States presidents.', 'It stands in the Black Hills of South Dakota.', 'Workers carved the faces into granite.'],
      advanced: ['The faces depict Washington, Jefferson, Theodore Roosevelt and Lincoln.', 'Work on the sculpture ran from 1927 to 1941.', 'The monument stands in the Black Hills, a sacred landscape for the Lakota.'],
    }, question: 'What should people consider before changing a natural landmark?', sources: [wiki('Mount_Rushmore')], note: 'Sculpture location; no summit elevation is attached to the carving.',
  },
  {
    id: 'everglades', name: 'the Everglades', country: 'United States', lat: 25.4419, lng: -80.765, shape: 'flat', look: { colour: 'green', width: 50 },
    facts: {
      junior: ['Water moves through the grass.', 'Alligators live here.', 'It is in Florida.'],
      core: ['The Everglades are a large wetland.', 'Fresh water moves slowly towards the coast.', 'Mangroves grow where fresh and salt water meet.'],
      advanced: ['Marjory Stoneman Douglas called the Everglades a river of grass.', 'The wetland includes sawgrass marshes and tree islands.', 'American crocodiles and American alligators both live in the region.'],
    }, question: 'Why might a place with shallow water be important to wildlife?', sources: [wiki('Everglades'), 'https://www.nps.gov/ever/faqs.htm'], note: 'Representative sawgrass wetland near the national park\'s Shark River Slough.',
  },
  {
    id: 'banff', name: 'Banff', country: 'Canada', lat: 51.1784, lng: -115.5708, shape: 'peak', look: { snowLine: 0.75, steep: 1.2, colour: 'grey-rock', width: 10 },
    facts: {
      junior: ['It is in Canada.', 'Mountains surround the town.', 'Forests grow in the valleys.'],
      core: ['Banff lies in the Canadian Rocky Mountains.', 'The Bow River flows through the town.', 'The national park has lakes, glaciers and hot springs.'],
      advanced: ['Banff National Park was established in 1885.', 'It is part of the Canadian Rocky Mountain Parks World Heritage Site.', 'The town lies in Alberta, inside the national park.'],
    }, question: 'How could visitors enjoy a mountain park while protecting it?', sources: [wiki('Banff_National_Park')], note: 'Banff town anchors the route sight; no single summit height describes the surrounding park.',
  },
  {
    id: 'kilauea', name: 'Kilauea', country: 'United States', lat: 19.4211, lng: -155.2868, heightM: 1247, shape: 'volcano',
    look: { snowLine: 0, steam: true, crater: true, steep: 0.5, colour: 'dark-lava', width: 20 },
    facts: {
      junior: ['It is in Hawaii.', 'It is a volcano.', 'Lava has reached the sea.'],
      core: ['Kilauea is a broad shield volcano.', 'Its lava flows help build the island of Hawaii.', 'Its summit has a large volcanic basin.'],
      advanced: ['The summit region reaches about 1,247 metres.', 'Halemaumau is a crater within the summit caldera.', 'A major eruption and summit collapse occurred in 2018.'],
    }, question: 'How could new land change after lava cools?', sources: [wiki('K%C4%ABlauea'), 'https://www.usgs.gov/volcanoes/kilauea'],
  },
  {
    id: 'mauna-loa', name: 'Mauna Loa', country: 'United States', lat: 19.4756, lng: -155.6081, heightM: 4169, shape: 'volcano',
    look: { snowLine: 0, steam: false, crater: true, steep: 0.5, colour: 'dark-lava', width: 80 },
    facts: {
      junior: ['It is in Hawaii.', 'It is very wide.', 'It is a volcano.'],
      core: ['Mauna Loa is a broad shield volcano.', 'Many lava flows built its gentle slopes.', 'It makes up a large part of Hawaii Island.'],
      advanced: ['Its summit reaches about 4,169 metres above sea level.', 'Its summit caldera is called Mokuaweoweo.', 'Mauna Loa erupted in 2022 after a long pause following 1984.'],
    }, question: 'Why might a wide mountain look lower than a narrow one?', sources: [wiki('Mauna_Loa')],
  },
  {
    id: 'haleakala', name: 'Haleakala', country: 'United States', lat: 20.7097, lng: -156.2533, heightM: 3055, shape: 'volcano',
    look: { snowLine: 0, steam: false, crater: true, steep: 0.6, colour: 'red-rock', width: 30 },
    facts: {
      junior: ['It is on Maui.', 'It is a volcano.', 'Clouds often lie below it.'],
      core: ['Haleakala forms most of eastern Maui.', 'Its name means House of the Sun.', 'Its summit has a large basin with smaller volcanic cones.'],
      advanced: ['Puu Ulaula, the highest point, reaches 3,055 metres.', 'Erosion helped shape the large summit depression.', 'The volcano is protected in Haleakala National Park.'],
    }, question: 'What might it feel like to watch sunrise above the clouds?', sources: [wiki('Haleakal%C4%81')],
  },
  {
    id: 'mount-hood', name: 'Mount Hood', country: 'United States', lat: 45.3736, lng: -121.6959, heightM: 3429, shape: 'volcano',
    look: { snowLine: 0.55, steam: false, crater: false, steep: 1.2, colour: 'grey-rock', width: 15 },
    facts: {
      junior: ['It is in Oregon.', 'It is a volcano.', 'Snow covers the high slopes.'],
      core: ['Mount Hood is Oregon\'s highest mountain.', 'It is part of the Cascade Range.', 'Glaciers cover parts of the mountain.'],
      advanced: ['The NAVD 88 elevation is about 3,429 metres.', 'Crater Rock is a lava dome near the summit.', 'Hot gases still escape from vents near Crater Rock.'],
    }, question: 'What signs could show that a quiet volcano still has heat inside?', sources: [wiki('Mount_Hood')], note: 'Published elevations use different survey datums; NAVD 88 used here.',
  },
  {
    id: 'mount-shasta', name: 'Mount Shasta', country: 'United States', lat: 41.4092, lng: -122.1949, heightM: 4322, shape: 'volcano',
    look: { snowLine: 0.55, steam: false, crater: false, steep: 1, colour: 'grey-rock', width: 20 },
    facts: {
      junior: ['It is in California.', 'It is a volcano.', 'Its high slopes have ice.'],
      core: ['Mount Shasta is part of the Cascade Range.', 'A smaller cone called Shastina stands beside it.', 'Several glaciers lie on the mountain.'],
      advanced: ['Its summit reaches about 4,322 metres.', 'It is the second-highest peak in the Cascade Range.', 'Several overlapping volcanic cones built the mountain.'],
    }, question: 'How might a mountain affect the view from a nearby town?', sources: [wiki('Mount_Shasta')],
  },
  {
    id: 'lassen-peak', name: 'Lassen Peak', country: 'United States', lat: 40.4881, lng: -121.505, heightM: 3187, shape: 'volcano',
    look: { snowLine: 0.7, steam: false, crater: true, steep: 1.1, colour: 'grey-rock', width: 8 },
    facts: {
      junior: ['It is in California.', 'It is a volcano.', 'Snow lies on high slopes.'],
      core: ['Lassen Peak is a large lava dome.', 'Thick lava formed its steep shape.', 'It erupted in the early twentieth century.'],
      advanced: ['The summit reaches about 3,187 metres under NAVD 88.', 'An explosive eruption occurred on 22 May 1915.', 'It lies in Lassen Volcanic National Park at the southern end of the Cascades.'],
    }, question: 'How might thick lava make a different shape from runny lava?', sources: [wiki('Lassen_Peak')],
  },
  {
    id: 'crater-lake', name: 'Crater Lake / Mount Mazama', country: 'United States', lat: 42.9446, lng: -122.109, shape: 'volcano',
    look: { snowLine: 0, steam: false, crater: true, steep: 0.5, colour: 'grey-rock', width: 10 },
    facts: {
      junior: ['A lake fills the basin.', 'It is in Oregon.', 'An island rises from water.'],
      core: ['Crater Lake fills a collapsed volcano.', 'Rain and snow supply its water.', 'Wizard Island is a smaller volcanic cone inside the lake.'],
      advanced: ['Mount Mazama collapsed after an eruption about 7,700 years ago.', 'Crater Lake is the deepest lake in the United States.', 'The lake lies within a caldera, rather than an intact summit crater.'],
    }, question: 'What clues might show that this lake was once a mountain?', sources: [wiki('Mount_Mazama'), 'https://www.nps.gov/crla/learn/nature/'],
    note: 'Lake/caldera centre. No height: Mazama\'s pre-collapse summit no longer exists. Shared volcano is a caldera fallback, not an intact cone.',
  },
  {
    id: 'yellowstone-caldera', name: 'Yellowstone Caldera', country: 'United States', lat: 44.43, lng: -110.67, shape: 'flat', look: { colour: 'green', width: 60 },
    facts: {
      junior: ['It is a wide basin.', 'Hot springs are nearby.', 'It is in Yellowstone.'],
      core: ['A huge eruption left this volcanic basin.', 'It is much wider than a normal crater.', 'Heat below the ground helps power Yellowstone\'s hot springs.'],
      advanced: ['The caldera formed during the Lava Creek eruption about 631,000 years ago.', 'It measures roughly 30 by 45 miles.', 'A caldera forms when ground collapses above a partly emptied magma reservoir.'],
    }, question: 'How could scientists study a volcano hidden beneath a landscape?', sources: [wiki('Yellowstone_Caldera'), 'https://www.usgs.gov/volcanoes/yellowstone'],
    note: 'Representative point in the caldera. No single summit; flat fallback avoids inventing a volcanic cone. Distinct from the park sight.',
  },
  {
    id: 'novarupta', name: 'Novarupta', country: 'United States', lat: 58.2667, lng: -155.1567, heightM: 841, shape: 'volcano',
    look: { snowLine: 0, steam: false, crater: false, steep: 0.6, colour: 'grey-rock', width: 2 },
    facts: {
      junior: ['It is in Alaska.', 'It is a volcano.', 'A low rock dome remains.'],
      core: ['Novarupta erupted in 1912.', 'Hot ash filled a nearby valley.', 'Thick lava later formed a small dome.'],
      advanced: ['The 1912 eruption was the largest of the twentieth century by erupted volume.', 'Its deposits formed the Valley of Ten Thousand Smokes.', 'The eruption drained magma linked to nearby Mount Katmai.'],
    }, question: 'How could one eruption change a whole valley?', sources: [wiki('Novarupta')],
  },
  {
    id: 'redoubt', name: 'Mount Redoubt', country: 'United States', lat: 60.4853, lng: -152.7431, heightM: 3108, shape: 'volcano',
    look: { snowLine: 0.35, steam: false, crater: true, steep: 1.1, colour: 'white', width: 12 },
    facts: {
      junior: ['It is in Alaska.', 'It is a volcano.', 'Glaciers cover its slopes.'],
      core: ['Redoubt stands west of Cook Inlet.', 'Its eruptions can send ash high into the air.', 'Ice and volcanic heat can create muddy floods.'],
      advanced: ['Its summit reaches about 3,108 metres.', 'Redoubt erupted in 1989 and again in 2009.', 'It belongs to the volcanic arc above the subducting Pacific Plate.'],
    }, question: 'Why might a volcanic ash cloud matter to an aeroplane?', sources: [wiki('Mount_Redoubt')],
  },
  {
    id: 'spurr', name: 'Mount Spurr', country: 'United States', lat: 61.2997, lng: -152.2514, heightM: 3370, shape: 'volcano',
    look: { snowLine: 0.35, steam: false, crater: true, steep: 1, colour: 'white', width: 15 },
    facts: {
      junior: ['It is in Alaska.', 'It is a volcano.', 'Ice covers the mountain.'],
      core: ['Spurr stands west of Anchorage.', 'Its summit is a lava dome.', 'A separate vent lies south of the summit.'],
      advanced: ['The mountain reaches about 3,370 metres.', 'The southern vent is called Crater Peak.', 'Crater Peak erupted in 1953 and 1992.'],
    }, question: 'How could a town prepare for ash falling from far away?', sources: [wiki('Mount_Spurr')],
  },
  {
    id: 'cleveland', name: 'Mount Cleveland', country: 'United States', lat: 52.8222, lng: -169.945, heightM: 1730, shape: 'volcano',
    look: { snowLine: 0.75, steam: false, crater: true, steep: 1.2, colour: 'dark-lava', width: 8 },
    facts: {
      junior: ['It is on an island.', 'It is a volcano.', 'The sea surrounds the island.'],
      core: ['Cleveland is in Alaska\'s Aleutian Islands.', 'It forms the western part of Chuginadak Island.', 'Its cone rises steeply above the sea.'],
      advanced: ['The summit reaches about 1,730 metres.', 'It is one of the active volcanoes of the Aleutian arc.', 'Satellite observations help monitor this remote volcano.'],
    }, question: 'How could scientists watch a mountain that is hard to reach?', sources: [wiki('Mount_Cleveland_(Alaska)')],
  },
  {
    id: 'erebus', name: 'Mount Erebus', country: 'Antarctica', lat: -77.5297, lng: 167.1533, heightM: 3792, shape: 'volcano',
    look: { snowLine: 0.15, steam: true, crater: true, steep: 0.8, colour: 'white', width: 25 },
    facts: {
      junior: ['It is in Antarctica.', 'It is a volcano.', 'Ice covers much of it.'],
      core: ['Erebus stands on Ross Island.', 'A lava lake has persisted in its summit crater.', 'Hot gases escape in a very cold landscape.'],
      advanced: ['Its summit reaches about 3,792 metres.', 'It is the southernmost active volcano on Earth.', 'It was named after HMS Erebus, a ship in James Clark Ross\'s expedition.'],
    }, question: 'What would be difficult about studying hot lava in a freezing place?', sources: [wiki('Mount_Erebus')], note: 'Antarctica is a continent, not a sovereign country.',
  },
  {
    id: 'tongariro', name: 'Tongariro', country: 'New Zealand', lat: -39.1297, lng: 175.6358, heightM: 1978, shape: 'volcano',
    look: { snowLine: 0, steam: true, crater: true, steep: 0.7, colour: 'red-rock', width: 12 },
    facts: {
      junior: ['It is a volcano.', 'It has several craters.', 'It is in New Zealand.'],
      core: ['Tongariro is a group of volcanic vents.', 'Its landscape includes coloured crater lakes.', 'The mountains are sacred to local Maori people.'],
      advanced: ['The summit reaches about 1,978 metres.', 'Te Maari vents erupted in 2012.', 'Tongariro National Park has both cultural and natural World Heritage status.'],
    }, question: 'How can visitors learn about a place before walking through it?', sources: [wiki('Mount_Tongariro'), 'https://beta.geonet.org.nz/volcano/how'],
  },
  {
    id: 'ruapehu', name: 'Ruapehu', country: 'New Zealand', lat: -39.2812, lng: 175.5647, heightM: 2797, shape: 'volcano',
    look: { snowLine: 0.55, steam: false, crater: true, steep: 0.9, colour: 'grey-rock', width: 15 },
    facts: {
      junior: ['It is a volcano.', 'A lake fills its crater.', 'Snow covers the high slopes.'],
      core: ['Ruapehu is New Zealand\'s highest North Island mountain.', 'Its crater lake is heated from below.', 'Glaciers and ski areas lie on its slopes.'],
      advanced: ['Tahurangi, the highest peak, reaches 2,797 metres.', 'The crater lake is also called Te Wai a-moe.', 'Crater-lake outbursts can produce volcanic mudflows called lahars.'],
    }, question: 'How might a warm lake and snow exist on the same mountain?', sources: [wiki('Mount_Ruapehu')], note: 'Tahurangi summit, rather than the rounded centre of the whole massif.',
  },
  {
    id: 'ngauruhoe', name: 'Ngauruhoe', country: 'New Zealand', lat: -39.1568, lng: 175.6322, heightM: 2291, shape: 'volcano',
    look: { snowLine: 0, steam: false, crater: true, steep: 1.3, colour: 'dark-lava', width: 5 },
    facts: {
      junior: ['It has a steep cone.', 'It is a volcano.', 'It is in New Zealand.'],
      core: ['Ngauruhoe belongs to the Tongariro volcanic complex.', 'Its summit has a crater.', 'Lava and loose volcanic rock built its cone.'],
      advanced: ['The summit reaches about 2,291 metres.', 'Its most recent eruption was in 1975.', 'Although often treated as a separate mountain, it is a vent of Tongariro.'],
    }, question: 'What different materials might you find on a volcanic slope?', sources: [wiki('Mount_Ngauruhoe')],
  },
  {
    id: 'teide', name: 'Teide', country: 'Spain', lat: 28.2731, lng: -16.6394, heightM: 3715, shape: 'volcano',
    look: { snowLine: 0, steam: false, crater: true, steep: 0.9, colour: 'dark-lava', width: 20 },
    facts: {
      junior: ['It is on Tenerife.', 'It is a volcano.', 'Snow sometimes covers the top.'],
      core: ['Teide is the highest mountain in Spain.', 'It stands in the Canary Islands.', 'Its cone rises inside a much larger volcanic basin.'],
      advanced: ['Its summit is listed at 3,715 metres above sea level.', 'The surrounding basin is called Las Canadas.', 'Teide National Park became a World Heritage Site in 2007.'],
    }, question: 'How would an island volcano look different from the sea and from the air?', sources: [wiki('Teide')],
  },
  {
    id: 'pico', name: 'Pico', country: 'Portugal', lat: 38.4689, lng: -28.3989, heightM: 2351, shape: 'volcano',
    look: { snowLine: 0, steam: false, crater: true, steep: 1.1, colour: 'dark-lava', width: 12 },
    facts: {
      junior: ['It is on an island.', 'It is a volcano.', 'It is in the Atlantic.'],
      core: ['Pico is the highest mountain in Portugal.', 'It stands on Pico Island in the Azores.', 'A small cone rises inside its summit crater.'],
      advanced: ['The summit reaches 2,351 metres.', 'The small summit cone is called Piquinho.', 'The mountain has been a nature reserve since 1972.'],
    }, question: 'How might a high mountain help people recognise an island from far away?', sources: [wiki('Mount_Pico')],
  },
  {
    id: 'piton-de-la-fournaise', name: 'Piton de la Fournaise', country: 'France (Reunion)', lat: -21.2425, lng: 55.7089, shape: 'volcano',
    look: { snowLine: 0, steam: false, crater: true, steep: 0.6, colour: 'dark-lava', width: 15 },
    facts: {
      junior: ['It is on an island.', 'It is a volcano.', 'Its lava makes dark rock.'],
      core: ['It stands on Reunion in the Indian Ocean.', 'It is a broad shield volcano.', 'Many eruptions occur inside a large volcanic basin.'],
      advanced: ['The basin is called Enclos Fouque.', 'Dolomieu is one of the summit craters.', 'A major collapse deepened Dolomieu crater in 2007.'],
    }, question: 'How might repeated lava flows change an island over time?', sources: [wiki('Piton_de_la_Fournaise')],
    note: 'Height omitted: published summit figures differ after crater changes; no unqualified current value chosen.',
  },
  {
    id: 'bromo', name: 'Mount Bromo', country: 'Indonesia', lat: -7.9417, lng: 112.95, heightM: 2329, shape: 'volcano',
    look: { snowLine: 0, steam: true, crater: true, steep: 0.9, colour: 'grey-rock', width: 3 },
    facts: {
      junior: ['It is in Indonesia.', 'It is a volcano.', 'Gas rises from its crater.'],
      core: ['Bromo stands on the island of Java.', 'Its cone rises from a wide sandy basin.', 'The Tengger people hold ceremonies at the volcano.'],
      advanced: ['The summit reaches about 2,329 metres.', 'Bromo is one of several cones in the Tengger caldera.', 'The Yadnya Kasada ceremony includes offerings at the crater.'],
    }, question: 'How might people describe a landscape of sand, smoke and mountains?', sources: [wiki('Mount_Bromo')],
  },
  {
    id: 'krakatau', name: 'Krakatau', country: 'Indonesia', lat: -6.102, lng: 105.423, shape: 'volcano',
    look: { snowLine: 0, steam: false, crater: true, steep: 0.8, colour: 'dark-lava', width: 3 },
    facts: {
      junior: ['It is in Indonesia.', 'It is a volcano.', 'Sea water surrounds the islands.'],
      core: ['Krakatau lies between Java and Sumatra.', 'A huge eruption destroyed much of the old island.', 'A younger volcano grew inside the old volcanic basin.'],
      advanced: ['The major Krakatau eruption occurred in 1883.', 'Anak Krakatau means Child of Krakatau.', 'A collapse of Anak Krakatau triggered a tsunami in 2018.'],
    }, question: 'How might an island look different in photographs taken many years apart?', sources: [wiki('Krakatoa')],
    note: 'Anak Krakatau anchors the island group. Height omitted: the growing cone changed dramatically in 2018; do not use pre-collapse height.',
  },
  {
    id: 'mayon', name: 'Mount Mayon', country: 'Philippines', lat: 13.257, lng: 123.685, heightM: 2463, shape: 'volcano',
    look: { snowLine: 0, steam: true, crater: true, steep: 1.25, colour: 'green', width: 15 },
    facts: {
      junior: ['It is a volcano.', 'Its cone looks very even.', 'It is in the Philippines.'],
      core: ['Mayon stands on the island of Luzon.', 'Lava and ash built its steep cone.', 'It is one of the Philippines\' active volcanoes.'],
      advanced: ['The summit reaches about 2,463 metres.', 'Mayon stands in Albay Province in the Bicol region.', 'The ruined Cagsawa church is associated with the eruption of 1814.'],
    }, question: 'What makes a mountain shape easy to recognise?', sources: [wiki('Mayon')],
  },
  {
    id: 'pinatubo', name: 'Mount Pinatubo', country: 'Philippines', lat: 15.1417, lng: 120.35, heightM: 1486, shape: 'volcano',
    look: { snowLine: 0, steam: false, crater: true, steep: 0.7, colour: 'grey-rock', width: 5 },
    facts: {
      junior: ['It is a volcano.', 'A lake fills its crater.', 'Its top changed in an eruption.'],
      core: ['Pinatubo stands on Luzon in the Philippines.', 'Its 1991 eruption lowered the summit.', 'Ash from the eruption spread a long way.'],
      advanced: ['The climactic eruption occurred on 15 June 1991.', 'The present summit reaches about 1,486 metres.', 'Sulfur aerosols from the eruption temporarily cooled the global climate.'],
    }, question: 'How could something happening in one place affect weather far away?', sources: [wiki('Mount_Pinatubo'), 'https://pubs.usgs.gov/fs/1997/fs113-97/'],
  },
  {
    id: 'black-canyon', name: 'Black Canyon of the Gunnison', country: 'United States', lat: 38.58, lng: -107.7275, shape: 'canyon', look: { steep: 1.5, colour: 'grey-rock', width: 1 },
    facts: {
      junior: ['A river flows far below.', 'The rock walls are steep.', 'Some walls stay in shadow.'],
      core: ['The Gunnison River cut this canyon in Colorado.', 'Its narrow walls keep some places dark.', 'Pale streaks cross some of the dark rock.'],
      advanced: ['Its walls expose ancient gneiss and schist.', 'The Painted Wall contains light-coloured pegmatite veins.', 'Black Canyon of the Gunnison became a national park in 1999.'],
    }, question: 'How would sunlight change inside a deep, narrow valley?', sources: [wiki('Black_Canyon_of_the_Gunnison_National_Park')], note: 'Central national park canyon section.',
  },
  {
    id: 'zion-canyon', name: 'Zion Canyon', country: 'United States', lat: 37.267, lng: -112.947, shape: 'canyon', look: { steep: 1.4, colour: 'red-rock', width: 2 },
    facts: {
      junior: ['A river flows between cliffs.', 'The rocks look red.', 'Trees grow near the water.'],
      core: ['The Virgin River carved Zion Canyon.', 'The canyon lies in Utah.', 'Its walls include tall layers of sandstone.'],
      advanced: ['Navajo Sandstone forms many of Zion\'s high cliffs.', 'The Narrows is a confined section of the North Fork of the Virgin River.', 'Zion became a national park in 1919.'],
    }, question: 'Where would you expect plants to grow in a dry canyon?', sources: [wiki('Zion_Canyon'), 'https://www.nps.gov/zion/'], note: 'Central main canyon near Big Bend, not a rounded point on the plateau.',
  },
  {
    id: 'canyon-de-chelly', name: 'Canyon de Chelly', country: 'United States', lat: 36.1083, lng: -109.3507, shape: 'canyon', look: { steep: 1.2, colour: 'red-rock', width: 2 },
    facts: {
      junior: ['It has tall red cliffs.', 'People live in this canyon.', 'Trees grow on the floor.'],
      core: ['The canyon lies within the Navajo Nation.', 'Navajo families still farm and live here.', 'Old cliff dwellings stand beneath rock overhangs.'],
      advanced: ['The national monument was established in 1931.', 'Spider Rock is a sandstone spire in the canyon system.', 'The National Park Service and Navajo Nation work together to manage the monument.'],
    }, question: 'How should visitors behave in a landscape that is also someone\'s home?', sources: [wiki('Canyon_de_Chelly_National_Monument'), 'https://fr.wikipedia.org/wiki/Spider_Rock', 'https://www.nps.gov/cach/'], note: 'Spider Rock area in the main canyon.',
  },
  {
    id: 'yellowstone-canyon', name: 'Grand Canyon of the Yellowstone', country: 'United States', lat: 44.7206, lng: -110.4797, shape: 'canyon', look: { steep: 1.2, colour: 'sand', width: 1.2 },
    facts: {
      junior: ['A river runs through it.', 'Waterfalls drop into the canyon.', 'Its walls have many colours.'],
      core: ['The Yellowstone River flows through this canyon.', 'Hot water helped change the colours of its rocks.', 'It is different from the Grand Canyon in Arizona.'],
      advanced: ['The canyon is cut mainly into rhyolite.', 'Lower Falls drops about 94 metres.', 'Hydrothermal alteration weakened and coloured parts of the canyon walls.'],
    }, question: 'How would you describe the colours and movement in this scene?', sources: [wiki('Grand_Canyon_of_the_Yellowstone'), 'https://www.nps.gov/yell/learn/nature/grand-canyon.htm'], note: 'Artist Point view towards the river canyon.',
  },
  {
    id: 'new-river-gorge', name: 'New River Gorge', country: 'United States', lat: 38.0697, lng: -81.081, shape: 'canyon', look: { steep: 1, colour: 'green', width: 2 },
    facts: {
      junior: ['A river flows through hills.', 'Forests cover the slopes.', 'A high bridge crosses it.'],
      core: ['The gorge lies in West Virginia.', 'The New River flows north through the mountains.', 'Coal mining once supported many towns here.'],
      advanced: ['The New River Gorge Bridge opened in 1977.', 'The river cuts through the Appalachian Plateau.', 'The protected area became a national park and preserve in 2020.'],
    }, question: 'How might a bridge change life for people on opposite sides of a gorge?', sources: [wiki('New_River_Gorge_National_Park_and_Preserve')], note: 'River below the New River Gorge Bridge.',
  },
  {
    id: 'santa-elena-canyon', name: 'Santa Elena Canyon', country: 'United States / Mexico', lat: 29.1653, lng: -103.61, shape: 'canyon', look: { steep: 1.5, colour: 'sand', width: 1 },
    facts: {
      junior: ['A river flows between cliffs.', 'The walls are very high.', 'Two countries meet here.'],
      core: ['The Rio Grande flows through this canyon.', 'It separates Texas from the Mexican state of Chihuahua.', 'The river cut through limestone rock.'],
      advanced: ['The United States side lies in Big Bend National Park.', 'Mexico protects the opposite landscape in Canon de Santa Elena.', 'The river is called Rio Bravo del Norte in Mexico.'],
    }, question: 'What could a river mean to people living on its two banks?', sources: [wiki('Santa_Elena_Canyon'), 'https://www.nps.gov/bibe/planyourvisit/sec_trail.htm'], note: 'Canyon mouth on the Rio Grande.',
  },
  {
    id: 'canyonlands', name: 'Canyonlands', country: 'United States', lat: 38.1893, lng: -109.8843, shape: 'canyon', look: { steep: 1.2, colour: 'red-rock', width: 20 },
    facts: {
      junior: ['Rivers cut through red rocks.', 'There are many deep canyons.', 'It is in Utah.'],
      core: ['The Green and Colorado rivers meet here.', 'Erosion shaped mesas, canyons and rock towers.', 'Different areas of the park have different landforms.'],
      advanced: ['Canyonlands National Park was established in 1964.', 'Its districts include Island in the Sky, the Needles and the Maze.', 'The river confluence lies below the Island in the Sky plateau.'],
    }, question: 'How would you choose a route through a landscape with many canyons?', sources: [wiki('Canyonlands_National_Park'), 'https://www.nps.gov/cany/'], note: 'Green-Colorado river confluence anchors this broad canyon landscape.',
  },
  {
    id: 'bighorn-canyon', name: 'Bighorn Canyon', country: 'United States', lat: 45.0217, lng: -108.2508, shape: 'canyon', look: { steep: 1.3, colour: 'sand', width: 1.5 },
    facts: {
      junior: ['Water lies between tall cliffs.', 'The walls show rock layers.', 'Boats travel through the canyon.'],
      core: ['The canyon crosses Montana and Wyoming.', 'The Bighorn River carved its route.', 'A dam holds water in part of the canyon.'],
      advanced: ['Yellowtail Dam created Bighorn Lake.', 'The dam is named for Crow leader Robert Yellowtail.', 'Bighorn Canyon National Recreation Area was established in 1966.'],
    }, question: 'How might building a dam change a canyon for people and animals?', sources: [wiki('Bighorn_Canyon_National_Recreation_Area'), 'https://www.nps.gov/bica/planyourvisit/gps-coordinates.htm'], note: 'Devil Canyon Overlook section. Replaces the old coarse route point outside the central canyon.',
  },
  {
    id: 'walnut-canyon', name: 'Walnut Canyon', country: 'United States', lat: 35.1689, lng: -111.5025, shape: 'canyon', look: { steep: 1.1, colour: 'sand', width: 1 },
    facts: {
      junior: ['Homes sit below rock ledges.', 'A canyon winds through hills.', 'Trees grow beside the cliffs.'],
      core: ['Walnut Canyon lies near Flagstaff in Arizona.', 'People built stone rooms beneath cliff overhangs.', 'The homes used natural shelter in the rock.'],
      advanced: ['The cliff dwellings are associated with the Sinagua archaeological culture.', 'Many dwellings date from roughly AD 1125 to 1250.', 'Walnut Canyon became a national monument in 1915.'],
    }, question: 'What would make a cliff ledge a useful place for a home?', sources: [wiki('Walnut_Canyon_National_Monument'), 'https://www.nps.gov/waca/'], note: 'Island Trail cliff dwelling area.',
  },
];
