import type { SourceMaterial } from '@/types/source-material';
import type { DestinationFocus, DestinationImage, DestinationPack } from '@/lib/world-flight/types';
import {
  assessWorldFlightReadingQuality,
  buildWorldFlightBriefingOptions,
  countWords,
  type WorldFlightReadingLevels,
} from '@/lib/world-flight/readings';
import { buildDestinationReadingPack } from './reading-packs';
import { VANCOUVER_READINGS } from './reading-content';
import { MILESTONE_50_READINGS } from './milestone-50-reading-content';

function unsplashPhoto(photoId: string, city: string, caption: string): DestinationImage {
  return {
    url: `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1200&q=80`,
    alt: `${city} destination photo`,
    caption,
    sourceName: 'Unsplash',
    sourceUrl: 'https://unsplash.com/',
  };
}

function wikimediaPhoto(url: string, city: string, caption: string, sourceUrl: string): DestinationImage {
  return {
    url,
    alt: `${city} destination photo`,
    caption,
    sourceName: 'Wikimedia Commons',
    sourceUrl,
  };
}

function wikimediaFile(fileName: string, city: string, caption: string, sourceUrl: string): DestinationImage {
  return wikimediaPhoto(
    `https://commons.wikimedia.org/wiki/Special:Redirect/file/${fileName}?width=1200`,
    city,
    caption,
    sourceUrl,
  );
}

type WorldFlightReadingContent = string | WorldFlightReadingLevels;

function textSource(id: string, title: string, summary: string, content: WorldFlightReadingContent): SourceMaterial {
  const isLeveled = typeof content !== 'string';
  const canonicalText = isLeveled ? content.advanced : content;
  const briefingText = isLeveled ? content.standard : content;
  return {
    sourceType: 'text',
    sourceKey: id,
    title,
    summary,
    rawText: canonicalText,
    briefingText,
    sourceText: canonicalText,
    originalText: canonicalText,
    briefingMode: isLeveled ? 'adapted' : 'generated',
    ...(isLeveled ? { briefingOptions: buildWorldFlightBriefingOptions(content) } : {}),
    wordCount: countWords(briefingText),
  };
}

function focus(
  cityId: string,
  id: string,
  title: string,
  subtitle: string,
  difficulty: DestinationFocus['difficulty'],
  lessonGoal: string,
  skills: string[],
  image: DestinationImage,
  reading: WorldFlightReadingContent,
): DestinationFocus {
  return {
    id,
    kind: 'reading',
    title,
    subtitle,
    difficulty,
    lessonGoal,
    skills,
    image,
    publisher: 'LessonCaptain',
    review: { status: 'draft' },
    sourceMaterial: textSource(
      `${cityId}-${id}`,
      title,
      subtitle,
      reading,
    ),
  };
}

function researchedReadingFocus(
  cityId: string,
  id: string,
  title: string,
  subtitle: string,
  difficulty: DestinationFocus['difficulty'],
  lessonGoal: string,
  skills: string[],
  image: DestinationImage,
  reading: WorldFlightReadingContent,
  citations: NonNullable<DestinationFocus['citations']>,
): DestinationFocus {
  const pack =
    typeof reading === 'string'
      ? buildDestinationReadingPack({
          cityId,
          focusId: id,
          city: title.split(' - ')[0],
          title,
          skills,
          sourceText: reading,
          citations,
        })
      : {
          levels: reading,
          citations,
          reviewedAt: '2026-06-11',
        };
  const candidate = focus(cityId, id, title, subtitle, difficulty, lessonGoal, skills, image, pack.levels);
  const publishable = assessWorldFlightReadingQuality(candidate.sourceMaterial).publishable;
  return {
    ...candidate,
    citations: pack.citations,
    sourceMaterial: {
      ...candidate.sourceMaterial,
      citations: pack.citations,
    },
    review: publishable
      ? { status: 'researched', reviewedAt: pack.reviewedAt }
      : { status: 'draft' },
  };
}

function videoFocus(
  id: string,
  title: string,
  subtitle: string,
  difficulty: DestinationFocus['difficulty'],
  lessonGoal: string,
  skills: string[],
  youtubeId: string,
  publisher: string,
  duration: number,
  summary: string,
  reviewedAt = '2026-06-08',
): DestinationFocus {
  const sourceUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
  return {
    id,
    kind: 'video',
    title,
    subtitle,
    difficulty,
    lessonGoal,
    skills,
    image: {
      url: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
      alt: `${title} video thumbnail`,
      caption: `${title} by ${publisher}.`,
      sourceName: publisher,
      sourceUrl,
    },
    publisher,
    sourceUrl,
    review: {
      status: 'transcript-verified',
      reviewedAt,
      transcriptLanguage: 'en',
    },
    sourceMaterial: {
      sourceType: 'youtube',
      sourceKey: youtubeId,
      title,
      summary,
      duration,
    },
  };
}

const IMAGES = {
  bangkok: unsplashPhoto('photo-1508009603885-50cf7c579365', 'Bangkok', 'Bangkok city lights and river life.'),
  tokyo: unsplashPhoto('photo-1503899036084-c55cdd92da26', 'Tokyo', 'Tokyo streets and dense city movement.'),
  seoul: unsplashPhoto('photo-1532649097480-b67d52743b69', 'Seoul', 'Seoul skyline and night streets.'),
  singapore: unsplashPhoto('photo-1525625293386-3f8f99389edd', 'Singapore', 'Singapore skyline and waterfront.'),
  paris: unsplashPhoto('photo-1502602898657-3e91760cbb34', 'Paris', 'Paris landmarks and historic streets.'),
  london: unsplashPhoto('photo-1513635269975-59663e0ac1ad', 'London', 'London river, skyline, and bridges.'),
  newYork: unsplashPhoto('photo-1499092346589-b9b6be3e94b2', 'New York', 'New York streets and high-rise skyline.'),
  cairo: unsplashPhoto('photo-1774425329088-36801b6f09be', 'Cairo', 'Cairo and the pyramids at the edge of the desert.'),
  dubai: unsplashPhoto('photo-1512453979798-5ea266f8880c', 'Dubai', 'Dubai towers and desert city design.'),
  sydney: unsplashPhoto('photo-1506973035872-a4ec16b8e8d9', 'Sydney', 'Sydney harbour and coastal city life.'),
  beijing: wikimediaFile('Skyline_of_Beijing_CBD_with_B-5906_approaching_(20211016171955)_(1).jpg', 'Beijing', 'Beijing skyline and layered capital city life.', 'https://en.wikipedia.org/wiki/Beijing'),
  berlin: wikimediaFile('Museumsinsel_Berlin_Juli_2021_1_(cropped)_b.jpg', 'Berlin', 'Berlin museum island, river, and historic city fabric.', 'https://en.wikipedia.org/wiki/Berlin'),
  moscow: wikimediaFile('Saint_Basil%27s_Cathedral_and_the_Red_Square.jpg', 'Moscow', 'Moscow landmarks around Red Square.', 'https://en.wikipedia.org/wiki/Moscow'),
  istanbul: wikimediaFile('Historical_peninsula_and_modern_skyline_of_Istanbul.jpg', 'Istanbul', 'Istanbul historic peninsula and modern skyline.', 'https://en.wikipedia.org/wiki/Istanbul'),
  vancouver: wikimediaFile('Skyline_of_Vancouver,_Canada.jpg', 'Vancouver', 'Vancouver skyline between water and mountains.', 'https://en.wikipedia.org/wiki/Vancouver'),
  toronto: wikimediaFile('Toronto_Skyline_from_Snake_Island,_February_28_2026_(08).jpg', 'Toronto', 'Toronto skyline across the lake.', 'https://en.wikipedia.org/wiki/Toronto'),
  mumbai: wikimediaFile('Mumbai_Bandra-Worli_Sea_Link.jpg', 'Mumbai', 'Mumbai sea link and coastal city movement.', 'https://en.wikipedia.org/wiki/Mumbai'),
  capeTown: wikimediaFile('Camps_bay_(53460319478)_(cropped).jpg', 'Cape Town', 'Cape Town coastline below mountain slopes.', 'https://en.wikipedia.org/wiki/Cape_Town'),
  rome: wikimediaFile('Trevi_Fountain,_Rome,_Italy_2_-_May_2007.jpg', 'Rome', 'Rome stone, water, and historic public space.', 'https://en.wikipedia.org/wiki/Rome'),
  rio: wikimediaFile('Cidade_Maravilhosa.jpg', 'Rio de Janeiro', 'Rio de Janeiro coast, mountains, and dense neighborhoods.', 'https://en.wikipedia.org/wiki/Rio_de_Janeiro'),
  mexicoCity: wikimediaFile('Sobrevuelos_CDMX_HJ2A4913_(25514321687)_(cropped).jpg', 'Mexico City', 'Mexico City from above in the high valley.', 'https://en.wikipedia.org/wiki/Mexico_City'),
  buenosAires: wikimediaFile('Puerto_Madero_-_Puente_de_la_mujer_(44673627614).jpg', 'Buenos Aires', 'Buenos Aires waterfront and urban landmarks.', 'https://en.wikipedia.org/wiki/Buenos_Aires'),
  losAngeles: wikimediaFile('Hollywood_Sign_(Zuschnitt).jpg', 'Los Angeles', 'Los Angeles hills and the Hollywood sign.', 'https://en.wikipedia.org/wiki/Los_Angeles'),
  jakarta: wikimediaFile('Bundaran_Hotel_Indonesia_(2025).jpg', 'Jakarta', 'Jakarta high-rises and public roundabout.', 'https://en.wikipedia.org/wiki/Jakarta'),
  lagos: wikimediaFile('Tafa_Balewa_Square_(Onikan)_in_Lagos._Nigeria.jpg', 'Lagos', 'Lagos public square and dense city movement.', 'https://en.wikipedia.org/wiki/Lagos'),
  hongKong: wikimediaFile('Hong_Kong_Skyline_viewed_from_Victoria_Peak.jpg', 'Hong Kong', 'Hong Kong skyline viewed from Victoria Peak.', 'https://en.wikipedia.org/wiki/Victoria_Harbour'),
  amsterdam: wikimediaFile('Imagen_de_los_canales_conc%C3%A9ntricos_en_%C3%81msterdam.png', 'Amsterdam', 'Amsterdam canals and historic urban pattern.', 'https://en.wikipedia.org/wiki/Amsterdam'),
  honolulu: wikimediaFile('Aerial_view_of_Waikiki_Beach_and_Honolulu%2C_Hawaii%2C_Highsmith.jpg', 'Honolulu', 'Waikiki Beach and Honolulu between the Pacific and volcanic ridges.', 'https://commons.wikimedia.org/wiki/File:Aerial_view_of_Waikiki_Beach_and_Honolulu,_Hawaii,_Highsmith.jpg'),
  miami: wikimediaFile('Miami%2C_Florida_skyline.jpg', 'Miami', 'Miami skyline and waterfront.', 'https://commons.wikimedia.org/wiki/File:Miami,_Florida_skyline.jpg'),
  bogota: wikimediaFile('Bogota_city_skyline_at_night_seen_from_the_Monseratte_sanctuary.png', 'Bogota', 'Bogota skyline seen from the eastern mountains.', 'https://commons.wikimedia.org/wiki/File:Bogota_city_skyline_at_night_seen_from_the_Monseratte_sanctuary.png'),
  reykjavik: wikimediaFile('HDR_Reykjavik_skyline_%2810139777493%29.jpg', 'Reykjavik', 'Reykjavik skyline beside the North Atlantic.', 'https://commons.wikimedia.org/wiki/File:HDR_Reykjavik_skyline_(10139777493).jpg'),
  nairobi: wikimediaFile('Nairobi_Skyline_Savannah_Kenya_May19_R1600687.jpg', 'Nairobi', 'Nairobi skyline beyond the savannah.', 'https://commons.wikimedia.org/wiki/File:Nairobi_Skyline_Savannah_Kenya_May19_R1600687.jpg'),
  lima: wikimediaFile('Lima%2C_Peru_Skyline_7269904486.jpg', 'Lima', "Lima skyline on Peru's Pacific coast.", 'https://commons.wikimedia.org/wiki/File:Lima,_Peru_Skyline_7269904486.jpg'),
  perth: wikimediaFile('Skyline_of_Perth_seen_from_Kings_Park%2C_October_2023_01.jpg', 'Perth', 'Perth skyline seen from Kings Park.', 'https://commons.wikimedia.org/wiki/File:Skyline_of_Perth_seen_from_Kings_Park,_October_2023_01.jpg'),
  auckland: wikimediaFile('Auckland_CBD_skyline_from_Waitemata_Harbour_entrance.jpg', 'Auckland', 'Auckland skyline and Waitemata Harbour.', 'https://commons.wikimedia.org/wiki/File:Auckland_CBD_skyline_from_Waitemata_Harbour_entrance.jpg'),
  suva: wikimediaFile('Suva_City_2_February_2015.jpg', 'Suva', 'Suva on the coast of Viti Levu.', 'https://commons.wikimedia.org/wiki/File:Suva_City_2_February_2015.jpg'),
  ulaanbaatar: wikimediaFile('Ulaanbaatar_skyline.jpg', 'Ulaanbaatar', 'Ulaanbaatar skyline below the surrounding mountains.', 'https://commons.wikimedia.org/wiki/File:Ulaanbaatar_skyline.jpg'),
  almaty: wikimediaFile('Sunset_over_the_Almaty_seen_from_Kok_Tobe_mountain%2C_pic_2.jpg', 'Almaty', 'Almaty seen from Kok Tobe mountain.', 'https://commons.wikimedia.org/wiki/File:Sunset_over_the_Almaty_seen_from_Kok_Tobe_mountain,_pic_2.jpg'),
  madrid: wikimediaFile('Madrid_-_Madrid_skyline_-_140314_195825.jpg', 'Madrid', 'Madrid skyline and historic center.', 'https://commons.wikimedia.org/wiki/File:Madrid_-_Madrid_skyline_-_140314_195825.jpg'),
  lisbon: wikimediaFile('Lisbon_BW_2018-10-03_10-09-02.jpg', 'Lisbon', 'Lisbon streets above the Tagus.', 'https://commons.wikimedia.org/wiki/File:Lisbon_BW_2018-10-03_10-09-02.jpg'),
  dublin: wikimediaFile('Dublin_Stephen%27s_Green-44_edit.jpg', 'Dublin', 'Dublin city and public green space.', 'https://commons.wikimedia.org/wiki/File:Dublin_Stephen%27s_Green-44_edit.jpg'),
  mecca: wikimediaFile('Mecca_at_night.jpg', 'Mecca', 'Mecca and the Grand Mosque district at night.', 'https://commons.wikimedia.org/wiki/File:Mecca_at_night.jpg'),
  dakar: wikimediaFile('Gor%C3%A9e_2024_-_coucher_de_soleil_sur_Dakar_-_25.jpg', 'Dakar', 'Dakar seen across the Atlantic coast.', 'https://commons.wikimedia.org/wiki/File:Gor%C3%A9e_2024_-_coucher_de_soleil_sur_Dakar_-_25.jpg'),
  recife: wikimediaFile('Recife_-_Vista_a%C3%A9rea_a_partir_do_bairro_do_Recife.jpg', 'Recife', 'Recife waterfront, historic center, and modern skyline.', 'https://commons.wikimedia.org/wiki/File:Recife_-_Vista_a%C3%A9rea_a_partir_do_bairro_do_Recife.jpg'),
  panamaCity: wikimediaFile('Panama_City_Skyline_2015.jpg', 'Panama City', 'Panama City skyline beside the Pacific.', 'https://commons.wikimedia.org/wiki/File:Panama_City_Skyline_2015.jpg'),
  santiago: wikimediaFile('Gran_Santiago_Tower%2C_Views_from_San_Crit%C3%B3bal_Hill_-_Santiago_-_Chile_08.jpg', 'Santiago', 'Santiago skyline below the Andes.', 'https://commons.wikimedia.org/wiki/File:Gran_Santiago_Tower,_Views_from_San_Crit%C3%B3bal_Hill_-_Santiago_-_Chile_08.jpg'),
  addisAbaba: wikimediaFile('Addis_Ababa_City_in_Ethiopia.jpg', 'Addis Ababa', 'Addis Ababa across the Ethiopian highlands.', 'https://commons.wikimedia.org/wiki/File:Addis_Ababa_City_in_Ethiopia.jpg'),
  delhi: wikimediaFile('Old_Delhi_city_skyline_from_Jama_Masjid%2C_Delhi%2C_India.jpg', 'Delhi', 'Old Delhi skyline seen from Jama Masjid.', 'https://commons.wikimedia.org/wiki/File:Old_Delhi_city_skyline_from_Jama_Masjid,_Delhi,_India.jpg'),
  manila: wikimediaFile('Manila_Skyline_March_2020.jpg', 'Manila', 'Manila waterfront skyline.', 'https://commons.wikimedia.org/wiki/File:Manila_Skyline_March_2020.jpg'),
  hoChiMinhCity: wikimediaFile('Ho_Chi_Minh_City_Skyline_%28night%29.jpg', 'Ho Chi Minh City', 'Ho Chi Minh City skyline at night.', 'https://commons.wikimedia.org/wiki/File:Ho_Chi_Minh_City_Skyline_(night).jpg'),
};

export const STARTER_PLANE_RANGE_KM = 5200;
export const WORLD_FLIGHT_MAX_VIDEO_DURATION_SECS = 7 * 60;

export const WORLD_DESTINATIONS: DestinationPack[] = [
  {
    id: 'bangkok',
    city: 'Bangkok',
    country: 'Thailand',
    region: 'Southeast Asia',
    lat: 13.7563,
    lng: 100.5018,
    primaryAirport: 'BKK',
    airports: ['BKK', 'DMK'],
    scene: { terrain: 'flatland', vegetation: 'palms', skyline: 'dense', landmarkSilhouette: 'temple-roof', palette: 'tropical' },
    heroImage: IMAGES.bangkok,
    focusOptions: [
      videoFocus(
        'creative-renaissance-video',
        'Bangkok - Creative Districts and Old Buildings',
        'See how artists and businesses reuse old spaces instead of flattening local character.',
        'Intermediate',
        'Explain how creative reuse can protect identity while changing a neighborhood.',
        ['listening', 'urban culture', 'discussion'],
        'W94cSsABAVI',
        'VICE Asia',
        322,
        `This VICE Asia short follows Bangkok creatives who work with older buildings, local streets, and neighborhood memory. The video gives students a concrete way to discuss whether development should always mean new construction. Students can identify the speakers' reasons for preserving local character, compare creative districts with shopping malls, and decide what makes a neighborhood feel alive.`,
      ),
      videoFocus(
        'food-identity-video',
        "Bangkok - The City's Changing Food Identity",
        'Use street food to discuss pride, regulation, tourism, and daily convenience.',
        'Intermediate',
        'Discuss how food culture changes when a city becomes more global and regulated.',
        ['listening', 'culture', 'opinion'],
        'ogR2yJgOQX0',
        'Curious Thing Films',
        241,
        `This short documentary asks how Bangkok's food identity is changing as street food becomes both a local habit and an international image. It raises questions about regulation, embarrassment, pride, convenience, and tourism. Students can compare local food scenes, decide what should be protected, and practice explaining why a dish or eating place matters beyond taste.`,
      ),
      videoFocus(
        'river-boats-video',
        'Bangkok - River Boats and City Movement',
        'Learn how Sathorn Pier connects boats, trains, shuttles, landmarks, and commuters.',
        'Easy',
        'Describe a transport hub and give practical route advice.',
        ['listening', 'travel English', 'directions'],
        'xySazPTPriM',
        'GoingToBangkok',
        196,
        `This practical guide uses Sathorn Pier to show how Bangkok's river transport connects with BTS trains, tourist routes, hotel shuttles, and major riverside landmarks. Students can practice giving directions, comparing transport choices, and explaining why water transport is useful in a crowded city.`,
      ),
      researchedReadingFocus(
        'bangkok',
        'songkran-city-ritual',
        'Bangkok - Songkran as Ritual and Street Festival',
        'Look past water fights to the family, temple, tourism, and safety layers of Thai New Year.',
        'Easy',
        'Explain how a festival can be both sacred tradition and public entertainment.',
        ['reading', 'culture', 'comparison'],
        IMAGES.bangkok,
        `In Bangkok, Songkran can look like a huge street water party, but that is only one layer of the Thai New Year. The festival also includes temple visits, merit-making, cleaning Buddha images, and showing respect to elders. The water that tourists often experience as play connects to older ideas of blessing, renewal, and cooling during the hottest part of the year.

The modern city adds another layer. Bangkok must plan transport, crowd control, tourist safety, waste, alcohol rules, and public messaging. A festival becomes a shared civic event, not just a private family holiday. The same tradition can feel different in a temple courtyard, a family home, a shopping district, or a tourist street.

For students, Songkran is useful because it challenges simple descriptions. Calling it a water fight is not wrong, but it is incomplete. A better explanation asks who is participating, where they are, and what meaning they attach to the same action.`,
        [
          { title: 'Thailand to host Maha Songkran World Water Festival 2026', publisher: 'TAT Newsroom', url: 'https://www.tatnews.org/2026/04/thailand-to-host-maha-songkran-world-water-festival-2026-with-saneh-art-by-songkran-festival/' },
          { title: 'Songkran in Thailand, traditional Thai New Year festival', publisher: 'UNESCO Intangible Cultural Heritage', url: 'https://ich.unesco.org/en/RL/songkran-in-thailand-traditional-thai-new-year-festival-01719' },
        ],
      ),
      researchedReadingFocus(
        'bangkok',
        'green-escape',
        'Bangkok - Why Dense Cities Need Green Escapes',
        'Use parks and green links to discuss heat, health, water, and everyday public space.',
        'Intermediate',
        'Evaluate why parks matter in a hot, crowded city.',
        ['reading', 'urban design', 'problem solving'],
        IMAGES.bangkok,
        `Bangkok's parks are not just decoration. In a hot, dense city, public green space gives people shade, exercise space, cleaner air, and somewhere to be without spending money. Parks also help students think about who a city is built for. A mall is comfortable, but it usually expects people to buy something. A park can be shared by office workers, families, older residents, runners, children, and visitors.

Benjakitti Park is especially useful for discussion because it shows how former industrial land can become public space. Green areas, lakes, wetlands, walkways, and bike paths change how people move through the city. They can also support water management and make heat feel less intense.

The tradeoff is that green space requires land, maintenance, and political priority. In a city where land is valuable, choosing a park means choosing long-term public benefit over short-term profit.`,
        [
          { title: 'Park', publisher: 'Invest Bangkok', url: 'https://invest.bangkok.go.th/park/' },
          { title: 'Urban Park in the Heart of Bangkok', publisher: 'One Bangkok', url: 'https://www.onebangkok.com/en/green-and-open-spaces/urban-park/' },
        ],
      ),
      researchedReadingFocus(
        'bangkok',
        'city-of-design',
        'Bangkok - Design as a City Skill',
        'Explore why UNESCO recognizes Bangkok as a creative city of design.',
        'Advanced',
        'Discuss design as problem solving, identity, and economic strategy.',
        ['reading', 'creative economy', 'discussion'],
        IMAGES.bangkok,
        `Bangkok's design culture is not limited to posters, furniture, or fashion. It also appears in how people adapt shop houses, food stalls, festivals, public spaces, and small businesses to crowded urban life. UNESCO recognizes Bangkok as a Creative City of Design, which frames design as a practical city skill rather than only a luxury industry.

This matters because design can connect local identity with future problems. A city may need better signs, safer streets, more usable public spaces, climate-sensitive buildings, and products that support small businesses. Good design asks how people actually live, move, buy, rest, and meet.

Students can use Bangkok to debate whether creativity should be treated as entertainment, business, heritage, or public service. The strongest answer may be all four. A creative city is not just a place with artists. It is a place where people keep finding better ways to use space, tell stories, and solve daily problems.`,
        [
          { title: 'Bangkok - Creative Cities Network', publisher: 'UNESCO', url: 'https://www.unesco.org/en/creative-cities/bangkok' },
          { title: 'Bangkok City of Design', publisher: 'Creative City Development by CEA', url: 'https://creativecity.cea.or.th/en/city-projects/bangkok-city-of-design' },
        ],
      ),
    ],
  },
  {
    id: 'tokyo',
    city: 'Tokyo',
    country: 'Japan',
    region: 'East Asia',
    lat: 35.6762,
    lng: 139.6503,
    primaryAirport: 'HND',
    airports: ['HND', 'NRT'],
    scene: { terrain: 'urban', vegetation: 'broadleaf', skyline: 'highrise', landmarkSilhouette: 'fuji', palette: 'night' },
    heroImage: IMAGES.tokyo,
    focusOptions: [
      videoFocus(
        'metro-economics-video',
        "Why Tokyo's Metro Is Profitable",
        'Compare Tokyo and New York to see how connections, land use, and operations shape a railway.',
        'Intermediate',
        'Compare transport systems and explain why one business model performs differently.',
        ['listening', 'systems thinking', 'comparison'],
        'HdJwAUdvlik',
        'The Wall Street Journal',
        377,
        `This Wall Street Journal comparison asks why Tokyo's metro can operate profitably while New York's subway requires significant public support. It examines Tokyo's interconnected commuter and subway lines, high ridership, convenient payment cards, frequent service, and the relationship between railway companies and development around stations. Students can identify cause-and-effect claims, compare two transport systems, and debate whether public transit should be judged mainly as a business or as an essential public service.`,
      ),
      videoFocus(
        'vending-machines-video',
        "Japan's Ever-Evolving Vending Machines",
        'See why millions of machines fit Japan’s labor market, public spaces, and daily routines.',
        'Intermediate',
        'Explain why a technology succeeds in one society and evaluate its tradeoffs.',
        ['listening', 'business', 'daily life'],
        'CFMnZHOvMN4',
        'CNN Business',
        322,
        `CNN Business explores why vending machines are so common in Japan and how manufacturers keep changing them. The report connects machines with round-the-clock convenience, limited staffing needs, reliable public spaces, and the ability to sell hot and cold products in compact locations. It also looks at factory production and new machine designs. Students can explain why a technology fits a particular society, evaluate convenience against labor and waste concerns, and propose a vending-machine service for their own city.`,
      ),
      videoFocus(
        'urban-history-video',
        "Tokyo Time Scape: How the City Rebuilt Itself",
        'Trace Tokyo from Edo’s waterways through railways, reconstruction, and modern urban planning.',
        'Intermediate',
        'Summarize how repeated rebuilding shaped a modern city.',
        ['listening', 'urban history', 'cause and effect'],
        'bg8wsxHYaf0',
        'Tokyo Metropolitan Government',
        324,
        `This official Tokyo Metropolitan Government short traces the city's development from Edo to the modern metropolis. It explains the importance of roads and waterways, reconstruction after fires and disasters, the arrival of railways and Western technologies, postwar growth, Olympic-era infrastructure, and later urban-renewal plans. Students can build a timeline, identify how problems led to planning changes, and discuss whether a city's identity survives repeated rebuilding.`,
      ),
      researchedReadingFocus(
        'tokyo',
        'earthquake-readiness',
        'Tokyo - Preparing for the Next Major Earthquake',
        'Explore how buildings, neighborhoods, and ordinary households prepare for disruption.',
        'Advanced',
        'Evaluate how a city shares responsibility for disaster readiness.',
        ['reading', 'problem solving', 'discussion'],
        IMAGES.tokyo,
        `For Tokyo, earthquake preparation is not a single emergency plan stored in an office. It is a continuing effort that connects building design, transport routes, utilities, neighborhood training, and household habits. The Tokyo Metropolitan Government says a magnitude-seven-class earthquake has a 70 percent probability of striking the southern Kanto area within the next 30 years. That risk shapes how the city prepares.

At the city level, officials promote earthquake-resistant buildings and work to strengthen structures along emergency transport roads. Those roads must remain usable so firefighters, rescue teams, and relief supplies can move after a disaster. Tokyo also plans for problems that appear in a dense city: damaged lifelines, fires in areas with closely packed wooden houses, apartment residents who cannot easily leave, and large numbers of commuters stranded far from home.

Preparation also happens in ordinary rooms. Residents are encouraged to secure furniture, store water and food, learn evacuation routes, and decide how family members will communicate if mobile networks are overloaded. Neighborhood drills turn written advice into practiced behavior.

This creates an important question: who is responsible for resilience? Stronger buildings and public systems matter, but they cannot solve every problem immediately. Personal preparation helps, but not everyone has the same money, mobility, health, or access to information. A resilient city therefore needs both strong infrastructure and plans that include people with different needs.`,
        [
          { title: 'TOKYO Resilience Project', publisher: 'Tokyo Metropolitan Government', url: 'https://tokyo-resilience.metro.tokyo.lg.jp/en/' },
          { title: 'Tokyo Metropolitan Government Disaster Prevention Guide Book', publisher: 'Tokyo Metropolitan Government', url: 'https://www.bousai.metro.tokyo.lg.jp/content/e_book_2025/2025-12_GDP_GuideBook_en/pageindices/index2.html' },
          { title: 'Preparedness', publisher: 'TOKYO Resilience Project', url: 'https://tokyo-resilience.metro.tokyo.lg.jp/en/prevention/' },
        ],
      ),
      researchedReadingFocus(
        'tokyo',
        'harajuku-fashion',
        'Tokyo - Harajuku as an Open-Air Fashion Studio',
        'Follow how young people turned a neighborhood into a global symbol of self-expression.',
        'Easy',
        'Discuss fashion as identity, creativity, and cultural influence.',
        ['reading', 'culture', 'discussion'],
        IMAGES.tokyo,
        `Harajuku is often described as if it has one recognizable style. In reality, its importance came from allowing many styles to appear together. Young people used clothing to build complete visual identities, combining handmade pieces, secondhand finds, designer fashion, traditional Japanese items, bright accessories, and influences from music or fantasy. The street became a place where people could display an idea before it appeared in a major shop or magazine.

Photographer Shoichi Aoki began documenting this energy in the 1990s and launched FRUiTS magazine in 1997. His portraits helped street fashion travel beyond Tokyo before social media made global sharing immediate. The photographs did more than show clothes. They recorded how individuals introduced themselves, named their favorite brands, and explained the logic behind surprising combinations.

Harajuku has changed. Tourism, global brands, online communities, and fast fashion now influence the neighborhood. At the same time, people from outside Japan do not only observe Harajuku styles; some participate in them and carry them into new places. This makes Harajuku useful for discussing cultural exchange. When a local style becomes global, does it lose its meaning, gain new meaning, or both?

The neighborhood's strongest lesson may be that fashion is a language. An outfit can communicate belonging, rebellion, humor, care, or imagination before the wearer says a word.`,
        [
          { title: 'Street Style in Tokyo: Harajuku Is Like a Fashion Gallery', publisher: 'Vogue', url: 'https://www.vogue.com/article/street-style-harajuku-tokyo' },
          { title: 'About FRUiTS', publisher: 'Tokyo Fruits', url: 'https://tokyofruits.com/pages/about' },
          { title: 'Fruits Tokyo Street Style', publisher: 'The Dowse Art Museum', url: 'https://dowse.org.nz/exhibitions-and-events/exhibitions/2004/fruits-tokyo-design' },
        ],
      ),
      researchedReadingFocus(
        'tokyo',
        'sento-neighborhoods',
        'Tokyo - The Neighborhood Life of Sento',
        'Discover how public bathhouses changed from a necessity into a shared urban ritual.',
        'Easy',
        'Compare community spaces and explain unfamiliar social rules.',
        ['reading', 'culture', 'comparison'],
        IMAGES.tokyo,
        `A sento is a neighborhood public bathhouse. For many Tokyo residents today, bathing usually happens at home. Earlier generations often depended on shared baths, and sento became part of everyday urban life.

The history of public bathing in Japan reaches back centuries. Baths were connected with Buddhist temples before private businesses began operating them. During the Edo period, when Tokyo was still called Edo, private baths were restricted partly because of fire risk. Public bathhouses became common places where people could wash and meet neighbors. They remained important well into the twentieth century.

As more homes gained private bathrooms after the 1960s, the number of sento declined. Their purpose also changed. A sento could no longer survive only by providing something unavailable at home. Many are now valued as inexpensive leisure spaces, pieces of neighborhood history, or places where generations can share the same routine.

That routine has rules. Visitors remove their shoes and clothes, wash themselves before entering the shared bath, and keep towels out of the bathwater. These customs may feel unfamiliar, but they protect a shared space and help strangers use it comfortably.

Sento raise a wider city question: what happens when a practical public service is no longer necessary but still has cultural and social value?`,
        [
          { title: 'Sento History', publisher: 'Tokyo Sento Association', url: 'https://www.1010.or.jp/english/sento-history/' },
          { title: 'About Sento', publisher: 'Tokyo Sento Association', url: 'https://www.1010.or.jp/english/' },
          { title: 'How to Enjoy Sento', publisher: 'Tokyo Sento Association', url: 'https://www.1010.or.jp/english/how-to-enjoy-sento/' },
        ],
      ),
    ],
  },
  {
    id: 'seoul',
    city: 'Seoul',
    country: 'South Korea',
    region: 'East Asia',
    lat: 37.5665,
    lng: 126.9780,
    primaryAirport: 'ICN',
    airports: ['ICN', 'GMP'],
    scene: { terrain: 'mountain', vegetation: 'broadleaf', skyline: 'dense', landmarkSilhouette: 'palace-gate', palette: 'golden' },
    heroImage: IMAGES.seoul,
    focusOptions: [
      videoFocus(
        'subway-system-video',
        'Seoul - How the Subway Carries the City',
        'Use an official transit film to discuss reliability, scale, and public-service language.',
        'Intermediate',
        'Describe how a transport network supports everyday city life.',
        ['listening', 'transport', 'systems thinking'],
        '6d0vj1FNjqQ',
        'Seoul Metropolitan Rapid Transit Corp.',
        299,
        `This official corporate film introduces Seoul subway lines, stations, service goals, and the idea of transport as a public promise. Students can compare the language of public-service branding with the practical needs of commuters, then explain what makes a subway system feel reliable, safe, and easy to use.`,
      ),
      videoFocus(
        'gyeongbokgung-video',
        'Seoul - Gyeongbokgung Palace in a Modern Capital',
        'Visit a palace site and notice color, ceremony, architecture, and public memory.',
        'Easy',
        'Describe a heritage site and explain why cities keep historic spaces visible.',
        ['listening', 'heritage', 'description'],
        'Jnkfr2fCteM',
        'Viator',
        82,
        `This short palace visit gives students a quick visual and listening entry point into Gyeongbokgung. The clip works well for lower-level classes because the language is simple and concrete. Students can describe what they see, compare palace behavior with shopping-street behavior, and discuss why historic places remain important in a fast modern city.`,
      ),
      videoFocus(
        'korea-history-video',
        'Seoul - Korea in Five Minutes',
        'Build a timeline from early kingdoms to division, rebuilding, and modern South Korea.',
        'Advanced',
        'Summarize a compressed history and identify turning points.',
        ['listening', 'history', 'timeline'],
        '6llQB4p9NT4',
        'History on Maps',
        413,
        `This fast history overview gives context for Seoul as a capital shaped by kingdoms, invasion, colonization, war, division, industrialization, and global influence. Students can practice timeline language, separate major events from details, and discuss how a capital city carries national memory.`,
      ),
      researchedReadingFocus(
        'seoul',
        'hallyu-wave',
        'Seoul - Hallyu and the Business of Attention',
        'Look at how Korean music, drama, beauty, food, and language learning became connected.',
        'Intermediate',
        'Explain how local media can become global soft power.',
        ['reading', 'media literacy', 'culture'],
        IMAGES.seoul,
        `Hallyu, or the Korean Wave, shows how entertainment can become more than entertainment. A song, drama, film, or beauty trend can introduce people to a language, food, fashion, tourism, and even national image. Seoul is central to this story because many production companies, performers, studios, and media businesses are based there.

The Korean Wave is not only about popularity. It is also about systems: training, online distribution, translation, fan communities, visual branding, and government interest in cultural industries. Fans may first discover Korea through a song, then begin watching dramas, visiting restaurants, learning phrases, or planning trips.

This makes Hallyu useful for class discussion. When culture travels, who benefits? Do global fans understand the local context, or do they create their own meaning? Students can compare Hallyu with other global culture waves and decide what makes media easy to share across borders.`,
        [
          { title: 'Korea Information - Culture and the Arts', publisher: 'Korean Cultural Center New York', url: 'https://www.koreanculture.org/korea-information-culture-and-the-arts' },
          { title: 'Hallyu', publisher: 'Britannica', url: 'https://www.britannica.com/topic/hallyu' },
        ],
      ),
      researchedReadingFocus(
        'seoul',
        'cheonggyecheon-restoration',
        'Seoul - Bringing a Stream Back to the City',
        'Use Cheonggyecheon to discuss restoration, memory, traffic, and public space.',
        'Intermediate',
        'Evaluate a city project that replaced road space with shared public space.',
        ['reading', 'urban design', 'cause and effect'],
        IMAGES.seoul,
        `Cheonggyecheon is a restored stream running through central Seoul. Its story is useful because the stream was not simply preserved from the past. It was covered during earlier development, and the city later chose to remove road infrastructure and bring water and pedestrian space back into the center.

That decision created benefits and tradeoffs. The restored stream gives residents and visitors a place to walk, rest, meet, and remember older layers of the city. It also shows how urban projects can change heat, traffic patterns, business areas, and public identity. At the same time, removing infrastructure can affect drivers, nearby shops, and public budgets.

Students can debate whether a city should undo an older development decision when values change. A road may solve one era's problem, while a stream and walkway solve another era's need for public space, climate comfort, and civic memory.`,
        [
          { title: 'Cheonggyecheon', publisher: 'Seoul Metropolitan Government', url: 'https://english.seoul.go.kr/service/amusement/stream/1-cheonggyecheon/' },
          { title: 'A Complete Walking Guide to Cheonggyecheon Stream', publisher: 'Visit Cheonggyecheon', url: 'https://cheonggyecheon.or.kr/a-complete-walking-guide-to-cheonggyecheon-stream/' },
        ],
      ),
      researchedReadingFocus(
        'seoul',
        'bukchon-hanok',
        'Seoul - When a Historic Neighborhood Is Also Someone Home',
        'Use Bukchon Hanok Village to discuss heritage tourism and resident privacy.',
        'Easy',
        'Balance visitor curiosity with the needs of people who live in a heritage area.',
        ['reading', 'ethics', 'discussion'],
        IMAGES.seoul,
        `Bukchon Hanok Village is often photographed as a beautiful traditional neighborhood, but it is not only a stage for visitors. It is also a residential area where people live with narrow streets, daily routines, noise, privacy concerns, and pressure from tourism.

A hanok is a traditional Korean house, and Bukchon helps students see how architecture can carry memory. Rooflines, courtyards, materials, alleys, and views toward the city all create a strong sense of place. The challenge is that the same qualities that attract visitors can make life harder for residents.

This creates a practical discussion: how should a city protect heritage without turning a neighborhood into a theme park? Visiting hours, signs, guided routes, and respectful behavior are not minor details. They are tools for sharing culture without exhausting the people who maintain it.`,
        [
          { title: 'Bukchon Hanok Village', publisher: 'Visit Seoul', url: 'https://english.visitseoul.net/attractions/bukchon-hanok-village_/263' },
          { title: 'Seoul implements visiting hours for tourists at Bukchon Hanok Village', publisher: 'Seoul Metropolitan Government', url: 'https://english.seoul.go.kr/seoul-implements-the-visiting-hours-for-tourists-at-the-bukchon-hanok-village/' },
        ],
      ),
    ],
  },
  {
    id: 'singapore',
    city: 'Singapore',
    country: 'Singapore',
    region: 'Southeast Asia',
    lat: 1.3521,
    lng: 103.8198,
    primaryAirport: 'SIN',
    airports: ['SIN'],
    scene: { terrain: 'island', vegetation: 'palms', skyline: 'highrise', landmarkSilhouette: 'supertree', palette: 'tropical' },
    heroImage: IMAGES.singapore,
    focusOptions: [
      videoFocus(
        'urban-design-video',
        'Singapore - Why the City Feels So Designed',
        'Connect public housing, transit, land scarcity, and planning into one city system.',
        'Intermediate',
        'Explain how planning choices shape everyday life in a dense city.',
        ['listening', 'urban design', 'systems thinking'],
        'kAuJDFnMKYo',
        'Kleos',
        317,
        `This explainer focuses on Singapore's design logic: limited land, public housing, transport, green space, and government planning. Students can identify linked causes and effects, compare planned and less-planned cities, and debate whether strong planning creates comfort, control, or both.`,
      ),
      videoFocus(
        'hawker-culture-video',
        'Singapore - Why Hawker Culture Matters',
        'Hear Singaporeans explain why hawker centres are food, memory, and community.',
        'Easy',
        'Discuss food spaces as shared culture, not only places to buy lunch.',
        ['listening', 'food culture', 'discussion'],
        'BSX92fXCzE4',
        'The Straits Times',
        145,
        `This Straits Times short uses hawker dishes and public voices to explain why hawker culture matters in Singapore. Students can practice food vocabulary, identify reasons people value shared eating places, and compare hawker centres with food courts, markets, cafeterias, or street-food areas in other cities.`,
      ),
      videoFocus(
        'changi-jewel-video',
        "Singapore - Changi Airport's Lifestyle Hub",
        'Look at Jewel Changi and ask why an airport would become a public destination.',
        'Intermediate',
        'Evaluate airport design as travel service, shopping space, and civic brand.',
        ['listening', 'design', 'travel English'],
        'G6-tFi2mXf4',
        'Business Insider',
        219,
        `This Business Insider video explains Jewel Changi as a lifestyle hub with gardens, retail, an indoor waterfall, and airport connectivity. Students can discuss how design changes the stress of travel, whether airports should become destinations, and what services tired passengers actually need.`,
      ),
      researchedReadingFocus(
        'singapore',
        'water-security',
        'Singapore - The City That Plans for Water',
        'Explore how limited land pushed Singapore to build a careful water system.',
        'Advanced',
        'Explain why water security is a planning problem, not only a natural-resource problem.',
        ['reading', 'geography', 'problem solving'],
        IMAGES.singapore,
        `Singapore is a small island city-state, so water security cannot be treated casually. The country describes its water system through four "National Taps": local catchment water, imported water, NEWater, and desalinated water. This mix helps reduce dependence on any single source.

NEWater is especially useful for class discussion because it turns used water into high-grade reclaimed water through treatment and purification. Desalination adds another option, but it requires energy and infrastructure. Local catchments also depend on careful land use because water collected in a dense city must be protected.

Students can use Singapore to think about resilience. A city may appear rich and modern, but it still has basic vulnerabilities. Water planning asks long-term questions: What happens during drought? How much should people pay? How can a city persuade residents to trust recycled water?`,
        [
          { title: 'Singapore Water Story', publisher: 'PUB Singapore', url: 'https://www.pub.gov.sg/Public/WaterLoop/OurWaterStory' },
          { title: 'NEWater', publisher: 'PUB Singapore', url: 'https://www.pub.gov.sg/Public/WaterLoop/OurWaterStory/NEWater' },
        ],
      ),
      researchedReadingFocus(
        'singapore',
        'language-policy',
        'Singapore - One City, Many Classroom Languages',
        'Use bilingual education to discuss identity, work, family, and national policy.',
        'Intermediate',
        'Compare how language policy can support unity and preserve difference.',
        ['reading', 'language', 'comparison'],
        IMAGES.singapore,
        `Singapore's language system is shaped by diversity. English is widely used for government, school, business, and connection across communities, while mother tongue languages help preserve cultural identity and family links. This makes language a practical city issue, not only a school subject.

Bilingual education asks students to think about tradeoffs. A shared working language can make public life easier in a multicultural country. At the same time, Chinese, Malay, Tamil, and other home languages carry memory, values, religion, humor, and relationships. Losing a language can mean losing a way of seeing the world.

The topic works well for classes because students can compare Singapore with their own language environment. Which language do people use with family, school, online media, work, or strangers? Is multilingualism a burden, an advantage, or both?`,
        [
          { title: 'Learning a Mother Tongue Language in school', publisher: 'Ministry of Education Singapore', url: 'https://www.moe.gov.sg/primary/curriculum/mother-tongue-languages/learning-in-school' },
          { title: 'Bilingualism', publisher: 'National Library Board Singapore', url: 'https://www.nlb.gov.sg/main/article-detail?cmsuuid=5d3db362-ae4a-46f6-bd2d-963ed81b5f99' },
        ],
      ),
      researchedReadingFocus(
        'singapore',
        'gardens-by-the-bay',
        'Singapore - Gardens Built for Heat, Visitors, and Wonder',
        'Use Gardens by the Bay to discuss nature, technology, tourism, and climate comfort.',
        'Easy',
        'Describe a designed garden and explain why cities make nature visible.',
        ['reading', 'nature', 'design'],
        IMAGES.singapore,
        `Gardens by the Bay is not a wild forest. It is a designed public landscape where plants, architecture, cooling, tourism, and education are combined. The Supertrees, conservatories, waterfront paths, and plant collections make nature feel dramatic and easy to notice.

That design raises a useful question: can built nature still teach people to care about the natural world? A garden with lights, ticketed areas, and tourist photos may seem artificial. But it can also introduce visitors to plant diversity, climate zones, and the need for green space in a dense city.

For Singapore, the gardens also support a city brand. They show that a compact urban place can still make room for greenery and public experience. Students can design their own city garden and decide what should matter most: shade, beauty, biodiversity, education, local culture, or visitor income.`,
        [
          { title: 'About Gardens by the Bay', publisher: 'Gardens by the Bay', url: 'https://www.gardensbythebay.com.sg/en/about-us.html' },
          { title: 'Plant Diversity and Sustainability', publisher: 'Gardens by the Bay', url: 'https://www.gardensbythebay.com.sg/en/learn-with-us/for-schools/school-engagement/secrets-of-the-gardens-plant-diversity-and-sustainability.html' },
        ],
      ),
    ],
  },
  {
    id: 'paris',
    city: 'Paris',
    country: 'France',
    region: 'Europe',
    lat: 48.8566,
    lng: 2.3522,
    primaryAirport: 'CDG',
    airports: ['CDG', 'ORY'],
    scene: { terrain: 'flatland', vegetation: 'broadleaf', skyline: 'historic', landmarkSilhouette: 'eiffel', palette: 'golden' },
    heroImage: IMAGES.paris,
    focusOptions: [
      videoFocus(
        'city-history-video',
        'Paris - The Real Story in Five Minutes',
        'Build a compressed history from early settlement to a global capital.',
        'Intermediate',
        'Summarize historical turning points and connect them to city identity.',
        ['listening', 'history', 'timeline'],
        '0LwrN1iw0Gk',
        'States of Time',
        284,
        `This short history asks students to move beyond postcard Paris. It compresses settlement, power, conflict, planning, and modern identity into a manageable listening task. Students can build a timeline, identify turning points, and discuss how a city becomes a symbol for people who have never visited it.`,
      ),
      videoFocus(
        'cafe-culture-video',
        'Paris - Cafe Culture and Public Life',
        'Use a short travel bite to discuss conversation, time, and people-watching.',
        'Easy',
        'Describe a social setting and compare cafe habits across cultures.',
        ['listening', 'daily life', 'comparison'],
        '5jQ5sdfT_10',
        "Rick Steves' Europe",
        97,
        `This quick cafe segment gives students a simple, concrete entry into Paris public life. It works well for speaking practice because students can describe atmosphere, compare cafe routines, and decide whether a cafe is mainly a business, a social space, a workplace, or a place to slow down.`,
      ),
      videoFocus(
        'louvre-history-video',
        'Paris - The Louvre in 800 Years',
        'Trace the Louvre from medieval fortress to royal palace to public museum.',
        'Intermediate',
        'Explain how one building can change meaning over centuries.',
        ['listening', 'art history', 'cause and effect'],
        'JkPcA8dngB4',
        'Musee du Louvre',
        165,
        `This official Louvre video shows how the building changed from fortress to palace to museum. Students can track how architecture reflects political power, public access, and cultural memory. The short length also makes it useful before a discussion on who museums are for.`,
      ),
      researchedReadingFocus(
        'paris',
        'seine-world-heritage',
        'Paris - The Seine as a City Spine',
        'Explore why the riverbanks of Paris are treated as world heritage.',
        'Easy',
        'Explain how a river can organize memory, movement, and public space.',
        ['reading', 'geography', 'heritage'],
        IMAGES.paris,
        `The Seine is not only a river running through Paris. It is a line that connects bridges, islands, monuments, booksellers, museums, government buildings, neighborhoods, and walking routes. The river helps people read the city. It also gives Paris a public stage where daily life and famous views overlap.

UNESCO recognizes the Banks of the Seine as a World Heritage site because the river corridor shows layers of urban development and architectural history. A bridge or embankment may look ordinary to a passerby, but together they form a record of how the city grew and represented itself.

Students can discuss what makes a landscape worth protecting. Is heritage only an old building, or can it be a whole route, view, or public habit? They can also compare the Seine with rivers in other cities and decide whether rivers are mainly practical, symbolic, or social.`,
        [
          { title: 'Paris, Banks of the Seine', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/600/' },
          { title: 'The Seine', publisher: 'Paris je t aime', url: 'https://parisjetaime.com/eng/article/the-seine-a006' },
        ],
      ),
      researchedReadingFocus(
        'paris',
        'cycling-city',
        'Paris - Rebalancing Streets for Bikes and People',
        'Use cycling policy to debate who city streets should serve first.',
        'Intermediate',
        'Evaluate how changing street space affects drivers, cyclists, pedestrians, and businesses.',
        ['reading', 'urban design', 'debate'],
        IMAGES.paris,
        `Paris has been changing how street space is used. More bike lanes, traffic calming, school-street projects, and pedestrian areas show a city trying to reduce car dominance and make short trips easier without driving.

This is not only a transport story. Street design affects noise, air quality, safety, business access, delivery work, tourism, and how children move through neighborhoods. A bike lane can feel like freedom to one person and inconvenience to another. A quieter street can help residents but frustrate drivers who are used to fast routes.

Students can use Paris to debate fairness in public space. Streets are shared, but they are not neutral. The way lanes, parking, sidewalks, trees, and crossings are arranged tells people whose movement matters most. A good discussion asks what balance would make a city healthier without ignoring practical needs.`,
        [
          { title: 'A new cycling plan for a 100% bikeable city', publisher: 'City of Paris', url: 'https://www.paris.fr/en/pages/a-new-cycling-plan-for-a-100-bikeable-city-28350' },
          { title: 'Cycling in Paris', publisher: 'Paris je t aime', url: 'https://parisjetaime.com/eng/article/cycling-in-paris-a980' },
        ],
      ),
      researchedReadingFocus(
        'paris',
        'tourism-pressure',
        'Paris - When the World Wants the Same City',
        'Discuss crowds, expectations, local routines, and responsible visiting.',
        'Advanced',
        'Debate how famous cities can welcome visitors without losing everyday life.',
        ['reading', 'tourism', 'critical thinking'],
        IMAGES.paris,
        `Paris is one of the world's best-known destinations, which creates both opportunity and strain. Tourism supports jobs, restaurants, museums, hotels, transport, and cultural institutions. It also brings crowds, queues, short-term rental pressure, souvenir districts, and frustration when visitors treat a living city like a backdrop.

The challenge is partly about expectations. Many travelers arrive with an image of Paris shaped by films, social media, fashion, romance, and famous landmarks. Real Paris includes that beauty, but also commuters, school runs, ordinary apartments, protests, repairs, rules, and neighborhoods where people are not performing for visitors.

Students can discuss responsible tourism without blaming travelers. What should visitors learn before arriving? What should cities manage through tickets, routes, signs, housing rules, or public transport? A famous city needs guests, but it also needs residents who can still live normally.`,
        [
          { title: 'Sustainable Tourism', publisher: 'Paris je t aime', url: 'https://parisjetaime.com/eng/article/sustainable-tourism-a934' },
          { title: 'Tourism in Paris - Key Figures', publisher: 'Paris je t aime', url: 'https://press.parisinfo.com/key-figures' },
        ],
      ),
    ],
  },
  {
    id: 'london',
    city: 'London',
    country: 'United Kingdom',
    region: 'Europe',
    lat: 51.5072,
    lng: -0.1276,
    primaryAirport: 'LHR',
    airports: ['LHR', 'LGW', 'STN', 'LTN', 'LCY'],
    scene: { terrain: 'flatland', vegetation: 'broadleaf', skyline: 'historic', landmarkSilhouette: 'big-ben', palette: 'winter' },
    heroImage: IMAGES.london,
    focusOptions: [
      videoFocus(
        'sightseeing-english-video',
        'London - Sightseeing in Simple English',
        'Use an A1-A2 city tour to practice landmarks, numbers, and short descriptions.',
        'Easy',
        'Describe famous places clearly and build confidence with city-tour language.',
        ['listening', 'functional English', 'description'],
        'WFRR0zC70-0',
        'Loescher Editore video',
        174,
        `This simple London sightseeing video is useful for lower-level classes because the language is clear, short, and landmark-based. Students can practice describing what they see, asking basic travel questions, and building a simple route through the city.`,
      ),
      videoFocus(
        'tube-engineering-video',
        'London - How the Underground Works',
        'Look inside the Tube as an engineering system, not only a famous map.',
        'Intermediate',
        'Explain how infrastructure supports movement under a crowded city.',
        ['listening', 'transport', 'systems thinking'],
        'XrenBOD0eX0',
        'National Geographic',
        189,
        `This National Geographic short turns the London Underground into a systems topic. Students can listen for engineering details, compare underground and surface transport, and discuss why old infrastructure needs constant adaptation in a modern city.`,
      ),
      videoFocus(
        'chinatown-restaurant-video',
        'London - A Restaurant Story in Chinatown',
        'Meet a long-time restaurant owner and discuss work, migration, and local memory.',
        'Intermediate',
        'Use one personal story to discuss multicultural city life.',
        ['listening', 'migration', 'food culture'],
        '7I_kWJ44UXU',
        'Dexter Storey',
        297,
        `This short documentary centers on a restaurant owner and the routines behind a neighborhood food business. It gives students a human story for discussing migration, family work, local memory, and how food businesses become part of a city's identity.`,
      ),
      researchedReadingFocus(
        'london',
        'thames-barrier',
        'London - Holding Back the Thames',
        'Use the Thames Barrier to discuss flooding, engineering, and climate risk.',
        'Advanced',
        'Explain how a city prepares for rare but serious water threats.',
        ['reading', 'engineering', 'problem solving'],
        IMAGES.london,
        `London grew around the River Thames, but the river also creates risk. Storm tides from the North Sea can push water up the Thames toward central London. The Thames Barrier is one of the city's most important defenses because it can close to help protect London from tidal flooding.

The barrier is useful for class discussion because it is normally invisible to everyday routines. People may ride trains, visit museums, or work in offices without thinking about flood engineering. Yet a city depends on systems that only become obvious when something goes wrong.

Climate change makes this topic more important. Sea-level rise and extreme weather can change old assumptions about what is safe. Students can debate whether cities should spend large amounts of money on protection before disasters happen, and who should pay for infrastructure that most people rarely notice.`,
        [
          { title: 'The Thames Barrier', publisher: 'UK Government', url: 'https://www.gov.uk/guidance/the-thames-barrier' },
          { title: 'Thames Estuary 2100', publisher: 'Environment Agency', url: 'https://www.gov.uk/government/collections/thames-estuary-2100-te2100' },
        ],
      ),
      researchedReadingFocus(
        'london',
        'west-end-theatre',
        'London - Why Theatre Needs a Whole District',
        'Explore the West End as performance, work, tourism, and night-time economy.',
        'Intermediate',
        'Explain how culture depends on workers, places, audiences, and transport.',
        ['reading', 'culture', 'discussion'],
        IMAGES.london,
        `The West End is often introduced through famous shows and bright theatre signs. But a theatre district is more than performances. It includes actors, stage crews, box-office staff, cleaners, designers, restaurants, transport workers, tourists, and local audiences.

A theatre night also changes how the surrounding city works. People eat before a show, travel late, meet friends, buy tickets, and move through crowded streets at similar times. Culture becomes connected to public transport, safety, hospitality, and the night-time economy.

Students can compare theatre with cinema, concerts, streaming, or school performances. Live theatre asks audiences to share time and space with performers. That can make it expensive and fragile, but also memorable. The key question is whether a city should protect live performance as a public cultural asset, not only as entertainment for people who can afford tickets.`,
        [
          { title: 'Official London Theatre', publisher: 'Society of London Theatre', url: 'https://officiallondontheatre.com/' },
          { title: 'West End history', publisher: 'London Theatre', url: 'https://www.londontheatre.co.uk/theatre-news/news/history-of-the-west-end' },
        ],
      ),
      researchedReadingFocus(
        'london',
        'borough-market',
        'London - Borough Market and the Taste of a City',
        'Use a food market to discuss trade, local identity, and changing public spaces.',
        'Easy',
        'Describe market experiences and compare how cities organize food.',
        ['reading', 'food culture', 'comparison'],
        IMAGES.london,
        `Borough Market shows how a food place can be old, local, global, everyday, and tourist-focused at the same time. Markets began as practical trade spaces where people bought and sold food. Today, a famous market can also be a place for photography, lunch breaks, specialty products, and city branding.

This creates a useful classroom contrast. A supermarket is efficient, predictable, and often cheaper. A public market may be noisier, more expensive, and more crowded, but it can also feel more social. People talk to sellers, notice ingredients, compare smells, and learn about food origins.

Students can discuss what makes a market authentic. Is it the age of the place, the sellers, the customers, the food, or the atmosphere? They can also design a market that serves both local residents and visitors without becoming only a tourist attraction.`,
        [
          { title: 'Our Story', publisher: 'Borough Market', url: 'https://boroughmarket.org.uk/our-story/' },
          { title: 'Visiting Borough Market', publisher: 'Borough Market', url: 'https://boroughmarket.org.uk/visit-us/' },
        ],
      ),
    ],
  },
  {
    id: 'new-york',
    city: 'New York',
    country: 'United States',
    region: 'North America',
    lat: 40.7128,
    lng: -74.0060,
    primaryAirport: 'JFK',
    airports: ['JFK', 'LGA', 'EWR'],
    scene: { terrain: 'coastal', vegetation: 'broadleaf', skyline: 'highrise', landmarkSilhouette: 'statue-liberty', palette: 'night' },
    heroImage: IMAGES.newYork,
    focusOptions: [
      videoFocus(
        'ellis-island-video',
        'New York - Immigrants at Ellis Island',
        'Learn why Ellis Island became a symbol of arrival, hope, inspection, and anxiety.',
        'Intermediate',
        'Explain a migration gateway and discuss what arrival means to different people.',
        ['listening', 'history', 'migration'],
        'bDNKHWzQiz8',
        'HISTORY',
        268,
        `This HISTORY short explains Ellis Island as a major immigration gateway in New York Harbor. Students can listen for numbers, procedures, emotions, and symbols, then discuss why a place of inspection could also become a place of hope and family memory.`,
      ),
      videoFocus(
        'subway-building-video',
        'New York - Building the Subway',
        'Use early subway construction to discuss speed, electricity, and city growth.',
        'Intermediate',
        'Describe why underground transport changed how New York could expand.',
        ['listening', 'transport', 'urban history'],
        'jOMamig65qc',
        'Stuart Math',
        216,
        `This short history of New York subway construction introduces students to promises of speed, electric transport, tunnels, and the relationship between infrastructure and city growth. Students can compare early subway ambitions with modern complaints about transit reliability.`,
      ),
      videoFocus(
        'street-vendors-video',
        'New York - The Street Vendors of the City',
        'Hear vendors explain work, flavor, permits, and belonging on city sidewalks.',
        'Intermediate',
        'Discuss street vending as labor, culture, regulation, and neighborhood life.',
        ['listening', 'work', 'discussion'],
        'kUrZ1VG5JfQ',
        'Street Vendor Project',
        411,
        `This short documentary presents New York street vendors as workers and community members, not just background city scenery. Students can identify arguments about permits, opportunity, food, and fairness, then compare street vending with markets or food stalls in other cities.`,
      ),
      researchedReadingFocus(
        'new-york',
        'high-line-park',
        'New York - The High Line and Reused Infrastructure',
        'Use an old rail line to discuss parks, design, tourism, and neighborhood change.',
        'Easy',
        'Evaluate when reuse makes a city better and who benefits from it.',
        ['reading', 'urban design', 'debate'],
        IMAGES.newYork,
        `The High Line is a park built on a former elevated freight rail line. Its story is often presented as a success: abandoned infrastructure became a public walkway with plants, views, art, and a new kind of urban experience.

But reuse can also change a neighborhood. A popular park may attract visitors, investment, hotels, restaurants, and rising property values. That can create jobs and public space, but it can also make nearby areas more expensive for long-time residents and small businesses.

Students can use the High Line to discuss whether a city project is successful only because it looks good. A better evaluation asks who uses it, who pays for it, who profits from it, and whether similar investment reaches less-famous neighborhoods. Reuse is powerful, but it is never neutral.`,
        [
          { title: 'The High Line Story', publisher: 'The High Line', url: 'https://www.thehighline.org/history/' },
          { title: 'The High Line', publisher: 'NYC Parks', url: 'https://www.nycgovparks.org/parks/the-high-line' },
        ],
      ),
      researchedReadingFocus(
        'new-york',
        'skyscraper-zoning',
        'New York - Why the Skyline Has Rules',
        'Explore how zoning shaped towers, sunlight, sidewalks, and public space.',
        'Advanced',
        'Explain why building height is a public-policy issue, not only an engineering issue.',
        ['reading', 'architecture', 'critical thinking'],
        IMAGES.newYork,
        `New York's skyline may look like pure ambition, but it is also shaped by rules. Zoning controls how land can be used, how tall buildings can be, how much floor area can be built, and sometimes how buildings meet the street.

These rules matter because skyscrapers affect more than their owners. Tall buildings can block light, change wind, crowd sidewalks, raise land values, and shape how neighborhoods feel. They can also provide housing, offices, tax revenue, and a dramatic identity for the city.

Students can discuss whether a skyline should be planned or allowed to grow freely. A tower can be a private business decision, but its shadow, traffic, and public image are shared. That makes architecture a civic question.`,
        [
          { title: 'Zoning Resolution', publisher: 'NYC Department of City Planning', url: 'https://zr.planning.nyc.gov/' },
          { title: 'New York City Zoning Handbook 2025', publisher: 'NYC Department of City Planning', url: 'https://www.nyc.gov/assets/planning/downloads/pdf/about-us/publications/nyc-zoning-handbook-2025.pdf' },
        ],
      ),
      researchedReadingFocus(
        'new-york',
        'public-library',
        'New York - The Public Library as a City Promise',
        'Discuss why a global city still needs quiet, free, public learning spaces.',
        'Easy',
        'Explain how libraries support students, workers, visitors, and communities.',
        ['reading', 'community', 'discussion'],
        IMAGES.newYork,
        `The New York Public Library is more than a famous building with stone lions. A public library gives people access to books, internet, classes, study space, archives, children's programs, and help with information. In a city where many things are expensive, a free public learning space matters.

Libraries also create a different rhythm from the street outside. New York can feel fast, crowded, and commercial. A library offers quiet, patience, and shared rules. People do not need to buy coffee or a ticket to sit, read, or ask for help.

Students can compare libraries with schools, cafes, coworking spaces, and the internet. If information is online, why do cities still need libraries? The answer may be that access is not only about information. It is also about trust, guidance, safety, and belonging.`,
        [
          { title: 'About The New York Public Library', publisher: 'New York Public Library', url: 'https://www.nypl.org/about' },
          { title: 'Stephen A. Schwarzman Building', publisher: 'New York Public Library', url: 'https://www.nypl.org/locations/schwarzman' },
        ],
      ),
    ],
  },
  {
    id: 'cairo',
    city: 'Cairo',
    country: 'Egypt',
    region: 'Africa',
    lat: 30.0444,
    lng: 31.2357,
    primaryAirport: 'CAI',
    airports: ['CAI'],
    scene: { terrain: 'desert', vegetation: 'palms', skyline: 'low', landmarkSilhouette: 'pyramids', palette: 'golden' },
    heroImage: IMAGES.cairo,
    focusOptions: [
      videoFocus(
        'ancient-egypt-video',
        'Cairo - Ancient Egypt in Six Minutes',
        'Use a NatGeo overview to connect pyramids, pharaohs, religion, writing, and empire.',
        'Intermediate',
        'Summarize ancient Egyptian civilization and connect it to Cairo tourism today.',
        ['listening', 'history', 'summary'],
        'hO1tzmi1V5g',
        'National Geographic',
        374,
        `This National Geographic overview gives students a compact introduction to ancient Egyptian civilization. It covers long timelines, powerful rulers, monuments, writing, religion, and cultural legacy. Students can separate ancient history from modern Cairo and discuss why ancient symbols still shape how many visitors imagine Egypt.`,
      ),
      videoFocus(
        'nile-explainer-video',
        'Cairo - The Nile Explained',
        'Understand why measuring and depending on a river is more complicated than it sounds.',
        'Advanced',
        'Explain how a river can be a geographic fact, a resource, and a source of debate.',
        ['listening', 'geography', 'critical thinking'],
        'iJhqKwM9JIs',
        'FactSpark',
        180,
        `This short Nile explainer introduces students to river length, geography, and why the Nile matters beyond a map label. It works well as a springboard for discussing water, farming, settlement, transport, and why many people can depend on the same river in different ways.`,
      ),
      videoFocus(
        'food-tour-video',
        'Cairo - Food Beyond the Pyramids',
        'Follow a BBC Travel Show food segment and discuss how food changes a travel story.',
        'Intermediate',
        'Use food to describe modern city life beyond ancient monuments.',
        ['listening', 'food culture', 'discussion'],
        'degzu-2vgvE',
        'BBC Travel Show',
        238,
        `This BBC Travel Show segment moves attention from ancient-history tourism toward food and daily city experience. Students can compare what visitors expect from Egypt with what local food tours reveal about neighborhoods, taste, hospitality, and modern urban life.`,
      ),
      researchedReadingFocus(
        'cairo',
        'historic-cairo',
        'Cairo - Historic Cairo as a Living Heritage Site',
        'Explore mosques, gates, streets, crafts, residents, and preservation pressure.',
        'Advanced',
        'Discuss how heritage protection works when people still live and work in the area.',
        ['reading', 'heritage', 'critical thinking'],
        IMAGES.cairo,
        `Historic Cairo is not a single monument. It is an urban area with mosques, schools, gates, markets, houses, streets, workshops, and layers of Islamic history. UNESCO recognizes it as a World Heritage site, but that does not mean it is frozen in time.

A living heritage area creates difficult choices. Restoration can protect buildings, attract visitors, and support pride. It can also change rents, business patterns, and daily routines. Residents may need better services, not only beautiful facades. Craftspeople may need customers, apprentices, and affordable space.

Students can debate what preservation should protect: stones, streets, stories, jobs, religious use, or community life. Cairo is useful because the answer cannot be only one thing. A historic city survives when its physical places and living practices both matter.`,
        [
          { title: 'Historic Cairo', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/89/' },
          { title: 'Urban Regeneration for Historic Cairo', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/historic-cairo-project' },
        ],
      ),
      researchedReadingFocus(
        'cairo',
        'grand-egyptian-museum',
        'Cairo - Building a Museum for Ancient Memory',
        'Use the Grand Egyptian Museum to discuss artifacts, national pride, and public access.',
        'Easy',
        'Explain why museum design can change how people meet ancient history.',
        ['reading', 'museum studies', 'discussion'],
        IMAGES.cairo,
        `The Grand Egyptian Museum was designed to place ancient Egyptian collections close to the Giza pyramids while giving visitors a modern museum experience. That combination matters. The objects are ancient, but the way people encounter them depends on lighting, labels, routes, conservation, crowd control, and educational design.

Museums also raise questions about ownership and pride. Ancient Egyptian artifacts are not only beautiful objects. They are connected to national identity, research, tourism, and debates about where cultural objects belong. A museum can protect fragile materials while also telling a story about who gets to interpret the past.

Students can compare a museum with an archaeological site. A site gives location and scale. A museum gives explanation, protection, and careful arrangement. Both can help people understand history, but they do different jobs.`,
        [
          { title: 'Grand Egyptian Museum', publisher: 'Grand Egyptian Museum', url: 'https://grandmuseum-egypt.com/en/' },
          { title: 'The Egyptian Museum in Cairo', publisher: 'Ministry of Tourism and Antiquities', url: 'https://egymonuments.gov.eg/museums/egyptian-museum' },
        ],
      ),
      researchedReadingFocus(
        'cairo',
        'khan-el-khalili',
        'Cairo - Khan el-Khalili and the Language of Markets',
        'Discuss bargaining, hospitality, pressure, and respect in a historic bazaar.',
        'Easy',
        'Practice market language and compare fixed prices with negotiation.',
        ['reading', 'functional English', 'role-play'],
        IMAGES.cairo,
        `Khan el-Khalili is one of Cairo's most famous market areas. For visitors, it can feel exciting and overwhelming at the same time: narrow lanes, lights, souvenirs, spices, metalwork, cafes, invitations, and bargaining. For sellers, it is also work, skill, and competition.

Bargaining is a useful classroom topic because it is both language and culture. A buyer may need to ask prices, show interest, refuse politely, make a counteroffer, or walk away without anger. A seller may use humor, pressure, compliments, or stories to keep the conversation going.

Students can discuss when bargaining feels friendly and when it feels stressful. They can also compare markets with supermarkets or online shopping. Fixed prices save time, but negotiation can create a personal encounter. The challenge is to protect respect on both sides.`,
        [
          { title: 'Guide to Khan el-Khalili Bazaar in Cairo', publisher: 'Accor', url: 'https://all.accor.com/a/en/limitless/thematics/shopping/khan-el-khalili-cairo.html' },
          { title: 'Khan El Khalili', publisher: 'Experience Egypt', url: 'https://www.experienceegypt.eg/attractions/khan-el-khalili' },
        ],
      ),
    ],
  },
  {
    id: 'dubai',
    city: 'Dubai',
    country: 'United Arab Emirates',
    region: 'Middle East',
    lat: 25.2048,
    lng: 55.2708,
    primaryAirport: 'DXB',
    airports: ['DXB', 'DWC'],
    scene: { terrain: 'desert', vegetation: 'palms', skyline: 'highrise', landmarkSilhouette: 'burj', palette: 'golden' },
    heroImage: IMAGES.dubai,
    focusOptions: [
      videoFocus(
        'airport-history-video',
        'Dubai - The Airport Ambition Story',
        'Use Dubai Airports history to discuss hubs, ambition, and global movement.',
        'Intermediate',
        'Explain how an airport can become central to a city economy.',
        ['listening', 'travel English', 'business'],
        'v8GgvZcvxQU',
        'Dubai Airports',
        140,
        `This Dubai Airports short frames airport growth as a story of ambition, connectivity, and global movement. Students can listen for institutional storytelling, practice airport vocabulary, and discuss why some cities become major transfer hubs between regions.`,
      ),
      videoFocus(
        'metro-route-2020-video',
        'Dubai - Building Metro Connections',
        'Follow the Route 2020 story and discuss public transport in a car-oriented region.',
        'Intermediate',
        'Explain why a fast-growing city invests in rail connections.',
        ['listening', 'transport', 'urban planning'],
        'YIdL7Oj3thU',
        'Roads and Transport Authority',
        326,
        `This Roads and Transport Authority video connects the Dubai Metro to ambition, Expo-era planning, and the belief that rail can shape a future city. Students can compare metro investment with highways, taxis, and airport links, then discuss what public transport must do in extreme heat.`,
      ),
      videoFocus(
        'dubai-history-video',
        'Dubai - From Creek Town to Global City',
        'Trace how trade, oil, ports, airlines, tourism, and finance reshaped Dubai.',
        'Advanced',
        'Summarize the causes of rapid city transformation.',
        ['listening', 'history', 'cause and effect'],
        'gOJoOL-5tuI',
        'Around the world in under 10 minutes',
        350,
        `This short history overview gives students a compressed explanation of Dubai's growth from a trading settlement to a global city. It supports discussion about ports, oil revenue, aviation, tourism, finance, real estate, and city branding.`,
      ),
      researchedReadingFocus(
        'dubai',
        'clean-energy',
        'Dubai - Can a Desert City Sell a Clean-Energy Future?',
        'Use energy targets to discuss ambition, branding, and practical constraints.',
        'Advanced',
        'Evaluate how sustainability plans work in a hot, high-consumption city.',
        ['reading', 'sustainability', 'debate'],
        IMAGES.dubai,
        `Dubai is famous for visible ambition: towers, airports, hotels, and large developments. Its clean-energy plans add another kind of ambition. The Dubai Clean Energy Strategy and related projects aim to increase the share of clean energy and reduce carbon intensity over time.

This topic is useful because sustainability in a desert city is not simple. Cooling buildings, desalinating water, moving visitors, and running large indoor spaces all require energy. Solar power is a natural opportunity, but energy systems also depend on storage, grids, investment, regulation, and behavior.

Students can debate whether a city known for luxury and growth can credibly become more sustainable. The best answer should avoid simple praise or simple criticism. A serious discussion asks what is measured, what changes first, who pays, and whether public goals lead to real reductions.`,
        [
          { title: 'Dubai Clean Energy Strategy 2050', publisher: 'DEWA', url: 'https://www.dewa.gov.ae/en/about-us/strategic-initiatives/dubai-clean-energy-strategy' },
          { title: 'Mohammed bin Rashid Al Maktoum Solar Park', publisher: 'DEWA', url: 'https://www.dewa.gov.ae/en/about-us/strategic-initiatives/mbr-solar-park' },
        ],
      ),
      researchedReadingFocus(
        'dubai',
        'museum-of-future',
        'Dubai - A Museum About What Has Not Happened Yet',
        'Explore how the Museum of the Future turns uncertainty into an attraction.',
        'Easy',
        'Discuss how cities use museums to imagine identity and future problems.',
        ['reading', 'future thinking', 'design'],
        IMAGES.dubai,
        `Most museums focus on the past. Dubai's Museum of the Future is different because it uses exhibitions, architecture, and storytelling to invite visitors to imagine what might come next. That makes it a city-branding tool as well as a cultural space.

A future museum raises interesting questions. If the future is uncertain, what can a museum responsibly show? It can present technologies, scenarios, questions, and hopes, but it also risks turning complicated problems into spectacle. Visitors may leave inspired, but inspiration is not the same as a plan.

Students can design a future exhibit for their own city. They should choose one problem, such as heat, transport, education, jobs, housing, or health, then decide what visitors should feel and what action they should understand.`,
        [
          { title: 'Museum of the Future', publisher: 'Museum of the Future', url: 'https://museumofthefuture.ae/en' },
          { title: 'About the Museum', publisher: 'Museum of the Future', url: 'https://museumofthefuture.ae/en/about' },
        ],
      ),
      researchedReadingFocus(
        'dubai',
        'desert-heat-design',
        'Dubai - Designing for Heat',
        'Discuss shade, cooling, walking, water, and comfort in a desert metropolis.',
        'Easy',
        'Explain why climate should shape urban design choices.',
        ['reading', 'climate', 'problem solving'],
        IMAGES.dubai,
        `In Dubai, heat is not a background detail. It shapes how people move, when they go outside, how buildings are cooled, and what public spaces need in order to feel usable. A city can be visually impressive and still be difficult for pedestrians if shade, distance, air-conditioning, and transport connections are not carefully planned.

Designing for heat means thinking beyond temperature. Materials store heat, glass towers need cooling, wide roads can make walking uncomfortable, and outdoor workers face health risks. Shade, trees, covered walkways, reliable transit, and building standards can change whether people experience the city as accessible or exhausting.

Students can redesign a desert street. They should decide where people walk, where they wait, how they find shade, how water is used responsibly, and what happens at the hottest time of day.`,
        [
          { title: 'Dubai 2040 Urban Master Plan', publisher: 'Dubai Public Debt Management Office', url: 'https://dmo.dof.gov.ae/en/dubai-overview' },
          { title: 'Dubai Municipality', publisher: 'Government of Dubai', url: 'https://www.dm.gov.ae/' },
        ],
      ),
    ],
  },
  {
    id: 'sydney',
    city: 'Sydney',
    country: 'Australia',
    region: 'Oceania',
    lat: -33.8688,
    lng: 151.2093,
    primaryAirport: 'SYD',
    airports: ['SYD'],
    scene: { terrain: 'coastal', vegetation: 'broadleaf', skyline: 'dense', landmarkSilhouette: 'opera-house', palette: 'dawn' },
    heroImage: IMAGES.sydney,
    focusOptions: [
      videoFocus(
        'harbour-ecology-video',
        'Sydney - What Lies Beneath the Harbour',
        'Use an ABC News short to discuss hidden marine life below a famous view.',
        'Intermediate',
        'Explain why a harbour is an ecosystem, not only a postcard scene.',
        ['listening', 'nature', 'science'],
        'eGli7ScFtOA',
        'ABC News Australia',
        214,
        `This ABC News segment asks what people really know about life beneath Sydney Harbour. Students can contrast famous surface views with hidden ecosystems, discuss how cities affect water environments, and practice describing nature inside an urban setting.`,
      ),
      videoFocus(
        'opera-house-history-video',
        'Sydney - The Tumultuous Opera House Story',
        'Learn why a famous building can be controversial before it becomes beloved.',
        'Intermediate',
        'Explain how cost, politics, design, and public opinion shape a landmark.',
        ['listening', 'architecture', 'discussion'],
        'iH_bNwQ-R2A',
        'BBC Global',
        265,
        `This BBC Global short explains the difficult history behind the Sydney Opera House. Students can discuss why ambitious architecture can create conflict, how public opinion changes over time, and what makes a building become a symbol of a city.`,
      ),
      videoFocus(
        'city-growth-video',
        "Sydney - How It Became Australia's Biggest City",
        'Trace geography, harbour access, migration, and growth in a compact city story.',
        'Intermediate',
        'Summarize why location and history helped Sydney grow.',
        ['listening', 'urban history', 'cause and effect'],
        '_M4TXYMFT00',
        'Australia Reality TV',
        250,
        `This short overview focuses on Sydney's rise as Australia's largest city. Students can identify the role of the harbour, migration, economy, and global image, then compare Sydney with capitals or port cities in other countries.`,
      ),
      researchedReadingFocus(
        'sydney',
        'gadigal-eora',
        'Sydney - Learning the City Before the City',
        'Use Gadigal and Eora history to discuss place names, memory, and respect.',
        'Advanced',
        'Explain why modern cities need to recognize older stories of place.',
        ['reading', 'identity', 'discussion'],
        IMAGES.sydney,
        `Before Sydney became a colonial port city, the area was home to Aboriginal peoples including the Gadigal of the Eora Nation. Recognizing that history changes how students read the city. A harbour, headland, path, or meeting place is not only scenery. It may carry names, stories, uses, and relationships older than the modern street map.

Acknowledgment is important, but it can also become empty if it is only a sentence at the start of an event. A stronger approach asks what people learn, whose knowledge is included, and how public places, museums, schools, and signs help residents understand where they are.

Students can discuss how cities remember. Do they remember through monuments, place names, ceremonies, museums, language, or everyday behavior? Sydney shows that the past is not just behind the city. It is underneath and around it.`,
        [
          { title: 'Aboriginal histories', publisher: 'City of Sydney', url: 'https://www.cityofsydney.nsw.gov.au/history/aboriginal-histories' },
          { title: 'Experience Aboriginal culture in Sydney', publisher: 'Tourism Australia', url: 'https://www.australia.com/en/places/sydney-and-surrounds/experience-aboriginal-culture.html' },
        ],
      ),
      researchedReadingFocus(
        'sydney',
        'beach-safety',
        'Sydney - Beach Life and the Rules That Keep It Possible',
        'Use surf safety to discuss freedom, risk, signs, volunteers, and responsibility.',
        'Easy',
        'Explain safety advice for visitors using clear practical language.',
        ['reading', 'functional English', 'safety'],
        IMAGES.sydney,
        `Sydney's beaches are part of the city's identity, but beach life depends on rules and shared responsibility. Visitors may see sand, water, sun, and sport. Lifesavers see changing surf conditions, rip currents, heat, crowds, and people who overestimate their swimming ability.

Simple advice can save lives: swim between the red and yellow flags, read signs, ask lifesavers, avoid swimming alone, and respect conditions that are stronger than they look. This makes beach safety a useful topic for English learners because the language is practical and urgent.

Students can role-play giving advice to a visitor who wants a relaxed beach day but does not understand local risks. They can also compare safety culture in different places. Good public spaces are not only beautiful. They help people enjoy themselves without ignoring danger.`,
        [
          { title: 'Beach safety', publisher: 'Surf Life Saving NSW', url: 'https://www.surflifesaving.com.au/beach-safety/' },
          { title: 'NSW beaches and waterways', publisher: 'NSW Government', url: 'https://www.nsw.gov.au/visiting-and-exploring-nsw/beaches-and-waterways' },
        ],
      ),
      researchedReadingFocus(
        'sydney',
        'ferry-commute',
        'Sydney - Ferries as Commute and View',
        'Explore how harbour transport can be practical, beautiful, and weather-dependent.',
        'Easy',
        'Compare ferry travel with trains, buses, cars, and walking routes.',
        ['reading', 'transport', 'comparison'],
        IMAGES.sydney,
        `In Sydney, ferries are both everyday transport and one of the city's most memorable experiences. A commuter may use a ferry to reach work. A visitor may take the same route for the harbour view. This dual role makes ferry travel different from many buses or trains.

Harbour transport has advantages: views, direct water routes, fresh air, and a strong sense of place. It also has limits. Weather, wharf access, schedules, capacity, and connections to other transport all affect how useful a ferry is.

Students can compare transport modes by more than speed. A route can be practical, comfortable, scenic, expensive, crowded, reliable, or confusing. Sydney ferries help students see that transport is also an experience of the city, not just a way to move from point A to point B.`,
        [
          { title: 'Sydney ferries', publisher: 'Transport for NSW', url: 'https://transportnsw.info/travel-info/ways-to-get-around/ferry' },
          { title: 'Ferries', publisher: 'Transport for NSW', url: 'https://transportnsw.info/routes/ferries' },
        ],
      ),
    ],
  },
  {
    id: 'beijing',
    city: 'Beijing',
    country: 'China',
    region: 'East Asia',
    lat: 39.9042,
    lng: 116.4074,
    primaryAirport: 'PEK',
    airports: ['PEK', 'PKX'],
    scene: { terrain: 'urban', vegetation: 'broadleaf', skyline: 'historic', landmarkSilhouette: 'forbidden-city', palette: 'golden' },
    heroImage: IMAGES.beijing,
    focusOptions: [
      videoFocus('city-history-video', 'Beijing - A Capital in Two Minutes', 'Trace how Beijing grew into a political and cultural capital.', 'Intermediate', 'Summarize how a capital city can preserve older layers while changing quickly.', ['listening', 'history', 'summary'], 'LoEiMrKjels', 'The Millenium Studios', 99, `This short city history gives students a compact timeline for Beijing. They can identify dynasties, capital-city functions, and modern growth, then compare Beijing with other political capitals on the route.`),
      videoFocus('hutong-culture-video', 'Beijing - Life Inside the Hutongs', 'Use hutong neighborhoods to discuss memory, housing, tourism, and change.', 'Intermediate', 'Explain why older neighborhoods can be both heritage sites and living communities.', ['listening', 'culture', 'urban change'], '_CgFX9v5f-U', 'NeuLingo Chinese Learning', 348, `This culture video introduces Beijing hutongs as more than narrow lanes. Students can discuss family life, public space, preservation, and what is lost or gained when historic neighborhoods become tourist destinations.`),
      videoFocus('subway-system-video', 'Beijing - A Five-Star Subway Ride', 'Look at how a huge city uses rail to make daily movement possible.', 'Intermediate', 'Describe transport features that make a large metro system usable.', ['listening', 'transport', 'systems'], 'stQl2GVzjUU', 'CGTN', 138, `This CGTN segment follows a foreign visitor exploring Beijing's subway. Students can notice ticketing, signs, scale, cleanliness, and passenger flow, then compare it with transit systems in other cities.`),
      researchedReadingFocus('beijing', 'temple-of-heaven-symbols', 'Beijing - Reading Symbols at the Temple of Heaven', 'Use architecture to discuss ritual, design, color, and meaning.', 'Easy', 'Explain how a building can communicate ideas without words.', ['reading', 'architecture', 'interpretation'], IMAGES.beijing, `The Temple of Heaven is useful for class discussion because students can read it like a text. Its round and square forms, colors, platforms, and open spaces were designed for imperial rituals connected to heaven, harvests, and order. The site shows that architecture can carry political and spiritual meaning, not only shelter people from weather.\n\nStudents can choose one design feature and explain what it might communicate. Then they can compare it with a school, temple, stadium, or government building they know. What does the design ask visitors to feel: respect, quiet, pride, power, or belonging?`, [
        { title: 'Temple of Heaven', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/881' },
        { title: 'Temple of Heaven', publisher: 'Britannica', url: 'https://www.britannica.com/topic/Temple-of-Heaven' },
      ]),
      researchedReadingFocus('beijing', 'forbidden-city-scale', 'Beijing - Why the Forbidden City Feels So Large', 'Discuss scale, hierarchy, movement, and who gets access to power.', 'Easy', 'Explain how space can organize people and authority.', ['reading', 'history', 'critical thinking'], IMAGES.beijing, `The Forbidden City is not only famous because it is old. Its size and layout make power visible. Gates, courtyards, halls, walls, and long central paths guide movement and separate people by status. A visitor feels distance before reaching important rooms, and that distance is part of the message.\n\nStudents can map a route through a powerful place: a palace, court, school office, airport, or stadium. Who can enter each area? Who waits? Who watches? Beijing helps students see that buildings can organize behavior before anyone speaks.`, [
        { title: 'Imperial Palaces of the Ming and Qing Dynasties', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/439' },
          { title: 'Forbidden City', publisher: 'Britannica', url: 'https://www.britannica.com/topic/Forbidden-City' },
      ]),
      researchedReadingFocus('beijing', 'olympic-legacy', 'Beijing - What an Olympic City Keeps After the Games', 'Use the 2008 Olympics to discuss image, infrastructure, pride, and cost.', 'Advanced', 'Evaluate what a city gains and risks when hosting a global event.', ['reading', 'sports', 'urban planning'], IMAGES.beijing, `When Beijing hosted the 2008 Summer Olympics, the city presented itself to a global audience. Stadiums, ceremonies, transport upgrades, and media attention helped shape how outsiders saw China. But Olympic legacy is not only the opening ceremony. It includes what happens to venues, neighborhoods, public spending, and city identity after visitors leave.\n\nStudents can design a legacy checklist for any host city. Which changes should still help residents ten years later? Which changes are mostly for television? This turns a sports event into a city-planning question.`, [
        { title: 'Beijing 2008', publisher: 'International Olympic Committee', url: 'https://olympics.com/en/olympic-games/beijing-2008' },
          { title: 'Beijing National Stadium', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Beijing_National_Stadium' },
      ]),
    ],
  },
  {
    id: 'berlin',
    city: 'Berlin',
    country: 'Germany',
    region: 'Europe',
    lat: 52.52,
    lng: 13.405,
    primaryAirport: 'BER',
    airports: ['BER'],
    scene: { terrain: 'flatland', vegetation: 'broadleaf', skyline: 'historic', landmarkSilhouette: 'brandenburg-gate', palette: 'winter' },
    heroImage: IMAGES.berlin,
    focusOptions: [
      videoFocus('berlin-wall-video', 'Berlin - The Wall Explained', 'Understand why a wall divided a city and why its fall still matters.', 'Intermediate', 'Explain the Berlin Wall using cause, effect, and human impact.', ['listening', 'history', 'cause and effect'], 'rMeAHKx2I58', 'explainitychannel', 241, `This explainer introduces the Berlin Wall as a political border inside everyday city life. Students can discuss division, movement, family separation, and why physical barriers can become powerful symbols.`),
      videoFocus('public-transport-video', 'Berlin - How to Use the Transport Network', 'Use Berlin transit to practice routes, tickets, transfers, and city movement.', 'Easy', 'Give practical transport advice using clear sequence language.', ['listening', 'functional English', 'transport'], 'k48xguTVd8s', 'Berlin', 209, `This visitBerlin video explains public transport basics. Students can practice giving directions, comparing tickets, and describing why reliable transit changes how residents and visitors experience a city.`),
      videoFocus('berlin-blockade-video', 'Berlin - The Blockade in Sixty Seconds', 'Use a short history clip to discuss supply, pressure, and resilience.', 'Intermediate', 'Summarize a historical crisis and identify the problem being solved.', ['listening', 'history', 'summary'], '_Yo0FVlwBgc', 'Drawn in 60 Seconds', 69, `This compact animation introduces the Berlin Blockade. Students can identify the problem, the actors, and the response, then discuss why air routes mattered when roads and rail were blocked.`),
      researchedReadingFocus('berlin', 'museum-island', 'Berlin - Museum Island as a Memory Cluster', 'Discuss why one city puts several major museums in one place.', 'Intermediate', 'Explain how museums shape what a city remembers and displays.', ['reading', 'museums', 'culture'], IMAGES.berlin, `Museum Island turns a small part of Berlin into a concentrated memory space. Visitors move between buildings that collect art, archaeology, architecture, and national stories. That makes the island useful for asking who gets to preserve objects and how museums explain objects taken from different times and places.\n\nStudents can design a five-room museum for their own city. What should be protected? What should be questioned? What story would visitors understand after walking through the rooms?`, [
        { title: 'Museumsinsel Berlin', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/896' },
        { title: 'Museum Island Berlin', publisher: 'Staatliche Museen zu Berlin', url: 'https://www.smb.museum/en/museums-institutions/museumsinsel-berlin/home/' },
      ]),
      researchedReadingFocus('berlin', 'tempelhofer-feld', 'Berlin - Turning an Airport Into a Public Field', 'Use Tempelhofer Feld to discuss parks, housing pressure, and public choice.', 'Easy', 'Evaluate competing uses for large urban land.', ['reading', 'urban planning', 'debate'], IMAGES.berlin, `Tempelhofer Feld was once an airport. Today it is a huge open public space where people cycle, skate, garden, fly kites, and meet friends. Its openness is unusual in a dense city, which is why it creates debate. Some people see it as a rare shared field. Others see land that could help with housing needs.\n\nStudents can hold a city council debate. Should a large empty space become homes, sports fields, gardens, shops, or stay open? Berlin makes the tradeoff concrete.`, [
        { title: 'Tempelhofer Feld', publisher: 'Tempelhof Projekt', url: 'https://www.thf-berlin.de/en/' },
        { title: 'Tempelhofer Feld', publisher: 'Grün Berlin', url: 'https://gruen-berlin.de/en/projects/parks/tempelhofer-feld' },
      ]),
      researchedReadingFocus('berlin', 'memory-language', 'Berlin - The Language of Memorials', 'Discuss how public places remember harm without simplifying it.', 'Advanced', 'Analyze how a memorial asks visitors to behave and think.', ['reading', 'ethics', 'history'], IMAGES.berlin, `Berlin has many memorials because the city does not treat history as one simple story. Memorials can be quiet, abstract, factual, uncomfortable, or direct. They shape how visitors walk, pause, read, and speak. A good memorial does not only say that something happened. It asks people to consider responsibility, loss, and memory.\n\nStudents can compare memorial designs. Should a memorial explain everything with text, or leave space for feeling? Should it be central and visible, or part of everyday streets?`, [
        { title: 'Memorial to the Murdered Jews of Europe', publisher: 'Foundation Memorial', url: 'https://www.stiftung-denkmal.de/en/memorials/memorial-to-the-murdered-jews-of-europe/' },
        { title: 'Berlin Wall Memorial', publisher: 'Berlin Wall Foundation', url: 'https://www.berliner-mauer-gedenkstaette.de/en/' },
      ]),
    ],
  },
  {
    id: 'moscow',
    city: 'Moscow',
    country: 'Russia',
    region: 'Europe',
    lat: 55.7558,
    lng: 37.6173,
    primaryAirport: 'SVO',
    airports: ['SVO', 'DME', 'VKO'],
    scene: { terrain: 'flatland', vegetation: 'broadleaf', skyline: 'historic', landmarkSilhouette: 'saint-basils', palette: 'winter' },
    heroImage: IMAGES.moscow,
    focusOptions: [
      videoFocus('city-history-video', 'Moscow - A Concise City History', 'Trace Moscow from settlement to capital and global city.', 'Intermediate', 'Summarize how geography, power, and rebuilding shaped Moscow.', ['listening', 'history', 'summary'], '4oidJmHsaws', 'k.c.', 206, `This concise history clip gives students a city-specific timeline for Moscow. They can identify growth, political power, and rebuilding, then compare Moscow with other capitals in Europe and Asia.`),
      videoFocus('metro-video', 'Moscow - The Metro as a Public Palace', 'Explore why a subway can be transport, art, and state image at once.', 'Intermediate', 'Explain how design changes the feeling of public transport.', ['listening', 'transport', 'design'], 'iDYjhqb5HXw', 'BBC', 128, `This BBC segment introduces the Moscow Metro as one of the world's busiest and most ornate systems. Students can discuss why stations might be decorated like palaces and how public transport can communicate pride.`),
      videoFocus('kremlin-red-square-video', 'Moscow - Kremlin and Red Square', 'Use a UNESCO clip to examine landmarks, symbolism, and public space.', 'Intermediate', 'Describe why one square can carry religious, political, and cultural meaning.', ['listening', 'heritage', 'place'], 'bpS5OU2bTvo', 'UNESCO', 152, `This UNESCO/NHK clip presents the Kremlin and Red Square as a World Heritage site. Students can practice describing landmarks while also asking why some places become symbols of national power.`),
      researchedReadingFocus('moscow', 'river-capital', 'Moscow - Reading the City Along the River', 'Use the Moscow River to discuss settlement, trade, defense, and identity.', 'Easy', 'Explain why rivers often shape capital cities.', ['reading', 'geography', 'history'], IMAGES.moscow, `The Moscow River helps explain why the city grew where it did. Rivers can support transport, trade, defense, water supply, and symbolic views. Even when roads, railways, and airports become more important, the river still shapes bridges, embankments, parks, and the mental map of the city.\n\nStudents can trace a river city they know. Where are the bridges? Where are the old centers? Which neighborhoods face the water, and which turn away from it? Moscow shows that geography remains visible even in a modern capital.`, [
        { title: 'Moscow', publisher: 'Britannica', url: 'https://www.britannica.com/place/Moscow' },
        { title: 'Moskva River', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Moskva_(river)' },
      ]),
      researchedReadingFocus('moscow', 'winter-public-life', 'Moscow - Designing Public Life for Winter', 'Discuss how cold weather changes parks, streets, clothing, and schedules.', 'Easy', 'Describe how climate affects public-space design and daily routines.', ['reading', 'climate', 'urban design'], IMAGES.moscow, `Winter changes how people use Moscow. A public place that works in July may need different lighting, surfaces, shelter, maintenance, and activities in January. Ice, snow, darkness, and cold can limit movement, but they can also create skating, festivals, warm indoor gathering places, and seasonal routines.\n\nStudents can redesign a park for two seasons. What must change when it is hot, cold, wet, or dark? Moscow helps the class see climate as a design problem, not just a weather report.`, [
        { title: 'Gorky Park', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Gorky_Park_(Moscow)' },
        { title: 'Zaryadye Park', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Zaryadye_Park' },
      ]),
      researchedReadingFocus('moscow', 'literary-city', 'Moscow - A Capital of Books and Public Knowledge', 'Use libraries and literary memory to discuss how cities teach outside school.', 'Advanced', 'Explain how public institutions can shape learning and identity.', ['reading', 'literature', 'institutions'], IMAGES.moscow, `A city teaches through more than classrooms. Libraries, theatres, museums, statues, bookshops, and street names can all turn public space into a learning environment. Moscow's literary reputation gives students a way to discuss how a city remembers writers and how access to books supports public knowledge.\n\nStudents can map learning places in their own city. Which ones are free? Which ones feel welcoming? Which ones preserve older language and stories? The goal is to see culture as infrastructure.`, [
        { title: 'Russian State Library', publisher: 'Russian State Library', url: 'https://www.rsl.ru/en/' },
        { title: 'Moscow', publisher: 'UNESCO Creative Cities Network', url: 'https://www.unesco.org/en/creative-cities/moscow' },
      ]),
    ],
  },
  {
    id: 'istanbul',
    city: 'Istanbul',
    country: 'Turkey',
    region: 'Europe / Asia',
    lat: 41.0082,
    lng: 28.9784,
    primaryAirport: 'IST',
    airports: ['IST', 'SAW'],
    scene: { terrain: 'coastal', vegetation: 'broadleaf', skyline: 'historic', landmarkSilhouette: 'mosque', palette: 'golden' },
    heroImage: IMAGES.istanbul,
    focusOptions: [
      videoFocus('constantinople-istanbul-video', 'Istanbul - When Constantinople Became Istanbul', 'Use a short history video to discuss names, empire, and memory.', 'Intermediate', 'Explain why city names can carry political and cultural history.', ['listening', 'history', 'identity'], 'Lq8o2QjnqwM', 'History Matters', 170, `This History Matters video explains the shift from Constantinople to Istanbul. Students can discuss how names carry memory, conquest, language, and identity, then compare cities with changed names in other countries.`),
      videoFocus('mosques-architecture-video', 'Istanbul - Hagia Sophia to Suleymaniye', 'Compare religious buildings, architecture, and changing city identity.', 'Intermediate', 'Describe how buildings can change meaning across centuries.', ['listening', 'architecture', 'religion'], 'G2rePZHydl8', 'BBC', 260, `This BBC clip links Hagia Sophia and Suleymaniye Mosque to Istanbul's layered history. Students can compare form, function, and symbolism while practicing respectful language around religious heritage.`),
      videoFocus('two-continents-video', 'Istanbul - A City of Two Continents', 'Use geography to explain movement, trade, ferries, and identity.', 'Easy', 'Describe how Istanbul connects Europe, Asia, land, and water.', ['listening', 'geography', 'comparison'], 'F2YOWKq-VQQ', 'Watch in 5ive', 302, `This city overview focuses on Istanbul as a place between continents. Students can discuss bridges, boats, neighborhoods, and the Bosphorus as both a route and a symbol.`),
      researchedReadingFocus('istanbul', 'grand-bazaar-language', 'Istanbul - Bargaining and Storytelling in the Grand Bazaar', 'Use market language to practice persuasion, politeness, and cultural exchange.', 'Intermediate', 'Explain how markets depend on trust, repetition, and social language.', ['reading', 'functional English', 'commerce'], IMAGES.istanbul, `The Grand Bazaar is not only a place to buy objects. It is a language-rich environment where greetings, questions, compliments, prices, stories, and negotiation all matter. A buyer and seller may talk about quality, origin, family, patience, and humor before any deal is made.\n\nStudents can role-play a market conversation without turning it into a stereotype. The goal is to notice how commerce uses social skills. What phrases make a conversation respectful? When does bargaining become pressure?`, [
        { title: 'Grand Bazaar', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Grand_Bazaar,_Istanbul' },
        { title: 'Historic Areas of Istanbul', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/356' },
      ]),
      researchedReadingFocus('istanbul', 'ferry-city', 'Istanbul - Ferries Across the Bosphorus', 'Discuss commuting, views, tea, weather, and crossing between continents.', 'Easy', 'Compare ferry travel with bridges, buses, trains, and walking.', ['reading', 'transport', 'comparison'], IMAGES.istanbul, `For many visitors, crossing the Bosphorus feels dramatic because it means moving between Europe and Asia. For many residents, it can also be an ordinary commute. Ferries make Istanbul's geography visible: water, hills, skylines, birds, wind, and neighborhoods appear together.\n\nStudents can compare a ferry route with a bus route. Which is faster? Which is more comfortable? Which gives the best sense of the city? Istanbul shows that transport can also become a shared daily ritual.`, [
        { title: 'Bosphorus', publisher: 'Britannica', url: 'https://www.britannica.com/place/Bosporus' },
        { title: 'City Lines', publisher: 'Şehir Hatları', url: 'https://www.sehirhatlari.istanbul/en' },
      ]),
      researchedReadingFocus('istanbul', 'earthquake-readiness', 'Istanbul - Preparing a Historic City for Earthquakes', 'Use risk planning to discuss buildings, families, schools, and public trust.', 'Advanced', 'Explain why disaster readiness is harder in dense historic cities.', ['reading', 'safety', 'problem solving'], IMAGES.istanbul, `Istanbul is beautiful partly because it is old, dense, and layered. Those same qualities make earthquake preparation difficult. A city must think about building strength, emergency routes, family plans, hospitals, schools, historic structures, and public communication.\n\nStudents can create a readiness checklist for a classroom or neighborhood. What should people know before an earthquake? What should a city inspect? Istanbul turns disaster planning into a practical language task about instructions, priorities, and trust.`, [
        { title: 'Historic Areas of Istanbul', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/356' },
        { title: 'Disaster and Emergency Management Authority', publisher: 'AFAD', url: 'https://www.afad.gov.tr/' },
      ]),
    ],
  },
  {
    id: 'vancouver',
    city: 'Vancouver',
    country: 'Canada',
    region: 'North America',
    lat: 49.2827,
    lng: -123.1207,
    primaryAirport: 'YVR',
    airports: ['YVR'],
    scene: { terrain: 'mountain', vegetation: 'pines', skyline: 'highrise', landmarkSilhouette: 'mountains', palette: 'dawn' },
    heroImage: IMAGES.vancouver,
    focusOptions: [
      videoFocus('underground-streams-video', "Vancouver - The Streams Hidden Under the City", 'Investigate what happened to Vancouver streams as roads and neighborhoods developed.', 'Intermediate', 'Explain how urban development can hide natural systems and why a city might restore them.', ['listening', 'urban ecology', 'cause and effect'], 'q_dDXLQTUcU', 'CBC British Columbia', 380, `This CBC short film investigates the streams that once crossed Vancouver and asks what happened when many were buried beneath the growing city. Students can connect maps, urban development, salmon habitat, flooding, and restoration while evaluating whether hidden waterways should be brought back.`, '2026-06-12'),
      videoFocus('skytrain-video', 'Vancouver - Riding the SkyTrain', 'Learn how an elevated rail system connects airport, suburbs, and downtown.', 'Easy', 'Give clear instructions for using an urban rail system.', ['listening', 'transport', 'functional English'], 'R2GIDIkD-Zc', 'Alexander College', 316, `This practical SkyTrain guide helps students practice transport language: stations, cards, transfers, routes, and arrival. It also opens discussion about why airport links matter for a global city.`),
      videoFocus('city-in-nature-video', 'Vancouver - A City in Nature', 'Look at how parks, trees, mountains, and water shape a city identity.', 'Easy', 'Describe how natural features change how a city feels and functions.', ['listening', 'nature', 'description'], 'CllNhkQl4qY', 'Destination Vancouver', 104, `This Destination Vancouver short frames the city through nature. Students can compare Vancouver with cities where nature is distant, hidden, or built into everyday streets and views.`),
      researchedReadingFocus('vancouver', 'host-nations', 'Vancouver - Learning Whose Land the City Is On', 'Discuss land acknowledgment, Indigenous nations, and respectful local history.', 'Advanced', 'Explain why place-based learning should include Indigenous knowledge and sovereignty.', ['reading', 'identity', 'ethics'], IMAGES.vancouver, VANCOUVER_READINGS.hostNations, [
        { title: 'Our Story', publisher: 'Musqueam Indian Band', url: 'https://www.musqueam.bc.ca/our-story/' },
        { title: 'Reconciliation', publisher: 'City of Vancouver', url: 'https://vancouver.ca/people-programs/reconciliation.aspx' },
      ]),
      researchedReadingFocus('vancouver', 'seawall-routine', 'Vancouver - The Seawall as a Daily Route', 'Use the seawall to discuss walking, cycling, views, and public access.', 'Easy', 'Describe a public route and explain why it matters to residents.', ['reading', 'public space', 'transport'], IMAGES.vancouver, VANCOUVER_READINGS.seawall, [
        { title: 'Seawall', publisher: 'City of Vancouver', url: 'https://vancouver.ca/parks-recreation-culture/seawall.aspx' },
        { title: 'Stanley Park', publisher: 'City of Vancouver', url: 'https://vancouver.ca/parks-recreation-culture/stanley-park.aspx' },
      ]),
      researchedReadingFocus('vancouver', 'housing-pressure', 'Vancouver - Beautiful Views and Hard Housing Questions', 'Discuss why attractive cities can become difficult places to afford.', 'Advanced', 'Explain housing affordability as a city tradeoff, not only a personal problem.', ['reading', 'economics', 'debate'], IMAGES.vancouver, VANCOUVER_READINGS.housing, [
        { title: 'Housing Vancouver Strategy', publisher: 'City of Vancouver', url: 'https://vancouver.ca/people-programs/housing-vancouver-strategy.aspx' },
        { title: 'Housing Data', publisher: 'Canada Mortgage and Housing Corporation', url: 'https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/housing-data' },
      ]),
    ],
  },
  {
    id: 'toronto',
    city: 'Toronto',
    country: 'Canada',
    region: 'North America',
    lat: 43.6532,
    lng: -79.3832,
    primaryAirport: 'YYZ',
    airports: ['YYZ', 'YTZ'],
    scene: { terrain: 'flatland', vegetation: 'broadleaf', skyline: 'highrise', landmarkSilhouette: 'cn-tower', palette: 'winter' },
    heroImage: IMAGES.toronto,
    focusOptions: [
      videoFocus('growth-video', "Toronto - Canada's Biggest City", 'Explain how Toronto became a major Canadian and global city.', 'Intermediate', 'Identify reasons a city grows into a national economic center.', ['listening', 'urban history', 'cause and effect'], 'eH-kzO09fnQ', 'Travis Ridgen 2.0', 397, `This explainer focuses on Toronto's growth into Canada's largest city. Students can identify immigration, finance, geography, and regional connections, then compare Toronto with other national hubs.`),
      videoFocus('public-transit-video', 'Toronto - Public Transit Basics', 'Use Toronto transit to discuss route planning, transfers, and urban scale.', 'Easy', 'Explain how a visitor could move through a large city without a car.', ['listening', 'transport', 'functional English'], 'HuKxgdwGV9g', 'theglobalcityproject', 141, `This short overview introduces public transit in Toronto. Students can practice giving route advice and discuss how transit shapes access to school, work, sports, and neighborhoods.`),
      videoFocus('multicultural-video', 'Toronto - World Cup Loyalties in a Multicultural City', 'Discuss identity, immigration, sport, and belonging through soccer fandom.', 'Intermediate', 'Explain how people can belong to more than one place at once.', ['listening', 'identity', 'discussion'], '4Eqa8Afl-n4', 'Al Jazeera English', 153, `This Al Jazeera segment uses World Cup loyalties to show Toronto's multicultural identity. Students can discuss family roots, national teams, flags, and how sport can reveal layered belonging.`),
      researchedReadingFocus('toronto', 'ravine-city', 'Toronto - The Ravines Under the City Map', 'Use Toronto ravines to discuss hidden nature, flooding, paths, and protection.', 'Easy', 'Explain why natural systems inside cities need active care.', ['reading', 'nature', 'urban planning'], IMAGES.toronto, `Toronto is often described through towers, streets, and neighborhoods, but ravines cut through the city like hidden green corridors. They support plants and animals, carry stormwater, shape walking routes, and give residents access to nature. They also need protection because erosion, invasive species, trash, and development can damage them.\n\nStudents can look for hidden nature in their own city. Is it a canal, empty lot, hill, stream, park, or roadside trees? Toronto shows that nature is not always outside the city.`, [
        { title: 'Ravine Strategy', publisher: 'City of Toronto', url: 'https://www.toronto.ca/city-government/planning-development/planning-studies-initiatives/ravine-strategy/' },
        { title: 'Toronto ravine system', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Toronto_ravine_system' },
      ]),
      researchedReadingFocus('toronto', 'neighborhood-arrival', 'Toronto - Neighborhoods as Arrival Stories', 'Discuss how migration shapes language, food, shops, and identity.', 'Intermediate', 'Describe how immigrant communities can change public life in a city.', ['reading', 'culture', 'identity'], IMAGES.toronto, `Toronto's multicultural identity is visible in neighborhoods, shops, festivals, schools, restaurants, and languages on the street. But multiculturalism is not only variety. It includes arrival, work, family ties, discrimination, adaptation, and pride.\n\nStudents can describe a neighborhood where many cultures meet. What can a visitor see, hear, smell, or buy? What would a resident understand that a visitor might miss? Toronto helps students move from a simple phrase like "many cultures" to a richer description of daily life.`, [
        { title: 'Toronto at a Glance', publisher: 'City of Toronto', url: 'https://www.toronto.ca/city-government/data-research-maps/toronto-at-a-glance/' },
        { title: 'Immigration and Ethnocultural Diversity', publisher: 'Statistics Canada', url: 'https://www12.statcan.gc.ca/census-recensement/2021/as-sa/98-200-x/2021009/98-200-x2021009-eng.cfm' },
      ]),
      researchedReadingFocus('toronto', 'waterfront-rebuild', 'Toronto - Rebuilding the Waterfront', 'Use waterfront change to discuss public access, housing, climate, and design.', 'Advanced', 'Evaluate what makes waterfront redevelopment serve residents, not only investors.', ['reading', 'urban design', 'debate'], IMAGES.toronto, `Toronto's waterfront shows how a city can rethink industrial land. Redevelopment can create parks, housing, transit, flood protection, cultural spaces, and new jobs. It can also create conflict if public access is weak or if new neighborhoods become too expensive.\n\nStudents can design rules for a fair waterfront. How much should be public? Where should housing go? How should the city prepare for storms? Toronto turns a skyline view into a planning problem.`, [
        { title: 'Waterfront Toronto', publisher: 'Waterfront Toronto', url: 'https://www.waterfrontoronto.ca/' },
        { title: 'Port Lands Flood Protection', publisher: 'Port Lands', url: 'https://portlandsto.ca/' },
      ]),
    ],
  },
  {
    id: 'mumbai',
    city: 'Mumbai',
    country: 'India',
    region: 'South Asia',
    lat: 19.076,
    lng: 72.8777,
    primaryAirport: 'BOM',
    airports: ['BOM'],
    scene: { terrain: 'coastal', vegetation: 'palms', skyline: 'highrise', landmarkSilhouette: 'sea-link', palette: 'tropical' },
    heroImage: IMAGES.mumbai,
    focusOptions: [
      videoFocus('city-history-video', 'Mumbai - From Bombay to Mumbai', 'Use a Britannica short to trace islands, empire, trade, and renaming.', 'Intermediate', 'Summarize how Mumbai grew from coastal settlements into a megacity.', ['listening', 'history', 'summary'], 'gOmiMIM9BEk', 'Encyclopaedia Britannica', 287, `This Britannica spotlight gives students a concise history of Mumbai. They can identify port geography, colonial layers, commerce, and the significance of name changes.`),
      videoFocus('dabbawalas-video', 'Mumbai - The Dabbawala Delivery System', 'Study a famous lunchbox network built on trust, timing, and codes.', 'Intermediate', 'Explain how a low-tech system can solve a complex logistics problem.', ['listening', 'systems thinking', 'work'], 'KDD32skx-zM', 'Global News', 197, `This Global News video explains how Mumbai's dabbawalas move lunches through a dense city. Students can discuss coding systems, reliability, teamwork, and why simple tools can be powerful.`),
      videoFocus('street-food-video', 'Mumbai - Four Street Food Finds', 'Use food to discuss city routines, vendors, taste, and public space.', 'Easy', 'Describe street food using sensory and opinion language.', ['listening', 'food culture', 'description'], 'JK_MfHIJxRA', 'Great Big Story', 294, `This Great Big Story segment samples Mumbai street foods. Students can practice food description while asking how vendors, commuters, price, and speed shape city eating.`),
      researchedReadingFocus('mumbai', 'monsoon-city', 'Mumbai - Living With the Monsoon', 'Discuss rain, drainage, work, school, trains, and preparation.', 'Easy', 'Explain how seasonal weather changes city routines and infrastructure.', ['reading', 'climate', 'problem solving'], IMAGES.mumbai, `Mumbai's monsoon is not just rainy weather. It affects train schedules, roads, school days, waste, drainage, housing, and public health. People plan clothes, travel time, work routines, and repairs around a season that can be both life-giving and disruptive.\n\nStudents can write a monsoon checklist for a resident, commuter, or school. What should people carry? What should the city maintain before rains begin? Mumbai shows how climate becomes part of everyday language and planning.`, [
        { title: 'Climate of Mumbai', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Climate_of_Mumbai' },
        { title: 'Mumbai', publisher: 'Britannica', url: 'https://www.britannica.com/place/Mumbai' },
      ]),
      researchedReadingFocus('mumbai', 'dharavi-enterprise', 'Mumbai - Dharavi Beyond One Story', 'Use Dharavi to discuss work, density, recycling, housing, and stereotypes.', 'Advanced', 'Describe a neighborhood without reducing it to a single image.', ['reading', 'urban life', 'media literacy'], IMAGES.mumbai, `Dharavi is often described only through poverty or density. That is too simple. It is also a place of work, small industries, recycling, food production, family life, migration, and local skill. A respectful discussion should ask what residents create and need, not only what outsiders notice.\n\nStudents can rewrite a headline about Dharavi. Does it focus only on shock, or does it include people, systems, and agency? Mumbai helps students practice more careful city language.`, [
        { title: 'Dharavi', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Dharavi' },
        { title: 'Dharavi, Mumbai, India', publisher: 'UCL Bartlett Development Planning Unit', url: 'https://www.ucl.ac.uk/bartlett/development/case-studies/2019/jan/dharavi-mumbai-india' },
      ]),
      researchedReadingFocus('mumbai', 'art-deco-gothic', 'Mumbai - A City of Gothic and Art Deco Buildings', 'Use architecture to compare colonial history, cinema culture, and preservation.', 'Intermediate', 'Explain how building styles can reveal different historical periods.', ['reading', 'architecture', 'comparison'], IMAGES.mumbai, `Mumbai has one of the world's notable collections of Victorian Gothic and Art Deco buildings. These styles sit near each other, making the city a useful outdoor classroom. Students can compare pointed arches, ornament, curves, cinema fronts, and modern materials.\n\nThe lesson question is simple: what can a building style tell us about time, money, technology, and taste? Mumbai shows that a city skyline can be read like a timeline.`, [
        { title: 'Victorian Gothic and Art Deco Ensembles of Mumbai', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/1480' },
        { title: 'Art Deco Mumbai', publisher: 'Art Deco Mumbai Trust', url: 'https://www.artdecomumbai.com/' },
      ]),
    ],
  },
  {
    id: 'cape-town',
    city: 'Cape Town',
    country: 'South Africa',
    region: 'Africa',
    lat: -33.9249,
    lng: 18.4241,
    primaryAirport: 'CPT',
    airports: ['CPT'],
    scene: { terrain: 'mountain', vegetation: 'broadleaf', skyline: 'dense', landmarkSilhouette: 'table-mountain', palette: 'dawn' },
    heroImage: IMAGES.capeTown,
    focusOptions: [
      videoFocus('founded-video', 'Cape Town - How the City Was Founded', 'Trace early colonial settlement and the city around Table Bay.', 'Intermediate', 'Explain how port geography and empire shaped Cape Town.', ['listening', 'history', 'geography'], '4wBhCKKZxYU', 'Bright Trip', 398, `This short history of Cape Town introduces settlement, maritime geography, and colonial growth. Students can discuss why ports attract trade, power, migration, and conflict.`),
      videoFocus('table-mountain-video', 'Cape Town - Riding Table Mountain', 'Use the cableway to discuss nature, tourism, weather, and risk.', 'Easy', 'Give visitor advice for a mountain landmark using clear practical language.', ['listening', 'nature', 'functional English'], 'Kgi1HDnJdUU', 'We Live in Cape Town', 367, `This guide to the Table Mountain cable car helps students practice visitor advice while noticing how weather, views, safety, and access shape a famous natural landmark.`),
      videoFocus('water-crisis-video', 'Cape Town - Surviving the Water Crisis', 'Examine how residents responded when Day Zero became a real possibility.', 'Intermediate', 'Explain conservation choices during an urban water shortage.', ['listening', 'climate', 'problem solving'], 'XxZAqswJfL4', 'National Geographic', 215, `This National Geographic segment explains Cape Town's water crisis. Students can discuss household limits, fairness, public communication, and how a city changes behavior under pressure.`),
      researchedReadingFocus('cape-town', 'district-six-memory', 'Cape Town - District Six and Forced Removal', 'Use one neighborhood to discuss apartheid, memory, maps, and return.', 'Advanced', 'Explain how forced removal changes both place and identity.', ['reading', 'history', 'ethics'], IMAGES.capeTown, `District Six was once a mixed, lively neighborhood. Under apartheid, people were forcibly removed and the area was largely emptied. The story is painful because it connects policy to homes, streets, schools, shops, music, and family memory.\n\nStudents can discuss what is lost when a neighborhood is destroyed. Is it only buildings, or also language, routine, friendship, and belonging? Cape Town helps students connect history with ordinary places.`, [
        { title: 'District Six Museum', publisher: 'District Six Museum', url: 'https://www.districtsix.co.za/' },
        { title: 'District Six', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/District_Six' },
      ]),
      researchedReadingFocus('cape-town', 'robben-island', 'Cape Town - Robben Island and the Work of Memory', 'Discuss imprisonment, resistance, guides, and how places become classrooms.', 'Intermediate', 'Explain how a site of harm can become a place of public learning.', ['reading', 'history', 'discussion'], IMAGES.capeTown, `Robben Island is strongly connected with Nelson Mandela and other political prisoners, but it is not only one person's story. It is a place where visitors confront imprisonment, apartheid, resistance, and the long work of democracy.\n\nStudents can discuss whether difficult places should become museums. What should guides explain? What should visitors do with what they learn? Cape Town shows that memory can be active, not only respectful silence.`, [
        { title: 'Robben Island', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/916' },
        { title: 'Robben Island Museum', publisher: 'Robben Island Museum', url: 'https://www.robben-island.org.za/' },
      ]),
      researchedReadingFocus('cape-town', 'fynbos-biodiversity', 'Cape Town - A City Inside a Biodiversity Hotspot', 'Use fynbos to discuss plants, fire, conservation, and urban edges.', 'Easy', 'Explain why city nature can be globally important.', ['reading', 'science', 'nature'], IMAGES.capeTown, `Cape Town sits near extraordinary plant diversity, including fynbos vegetation in the Cape Floristic Region. This makes city nature more than decoration. It raises questions about fire, invasive species, hiking, water, housing pressure, and conservation.\n\nStudents can compare two types of nature: a park planted for beauty and a habitat protected for biodiversity. What rules should visitors follow? Cape Town helps students see that a city can be part of a rare ecosystem.`, [
        { title: 'Cape Floral Region Protected Areas', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/1007' },
        { title: 'Table Mountain National Park', publisher: 'SANParks', url: 'https://www.sanparks.org/parks/table-mountain' },
      ]),
    ],
  },
  {
    id: 'rome',
    city: 'Rome',
    country: 'Italy',
    region: 'Europe',
    lat: 41.9028,
    lng: 12.4964,
    primaryAirport: 'FCO',
    airports: ['FCO', 'CIA'],
    scene: { terrain: 'urban', vegetation: 'broadleaf', skyline: 'historic', landmarkSilhouette: 'colosseum', palette: 'golden' },
    heroImage: IMAGES.rome,
    focusOptions: [
      videoFocus('ancient-rome-video', 'Rome - Ancient Rome 101', 'Use a National Geographic overview to build a fast ancient-city timeline.', 'Intermediate', 'Summarize major Roman ideas, institutions, and built forms.', ['listening', 'history', 'summary'], 'GXoEpNjgKzg', 'National Geographic', 338, `This National Geographic overview introduces Ancient Rome in a compact format. Students can identify republic, empire, engineering, law, and public spectacle as pieces of one city story.`),
      videoFocus('colosseum-video', 'Rome - Inside the Colosseum', 'Look at an iconic landmark as engineering, entertainment, and power.', 'Intermediate', 'Explain why one building can represent both achievement and violence.', ['listening', 'architecture', 'ethics'], 'C3GN8YRoTjc', 'Headout', 158, `This Colosseum video helps students describe a landmark while also asking critical questions about crowds, entertainment, labor, and power in ancient Rome.`),
      videoFocus('food-market-video', 'Rome - Food Markets and Everyday Taste', 'Use a market clip to discuss fresh food, vendors, and daily routines.', 'Easy', 'Describe food markets using sensory language and practical questions.', ['listening', 'food culture', 'description'], '0DxaVa-BvOE', 'The Roman Food Tour & Cooking Italy', 178, `This food-market video gives students a practical Rome topic beyond monuments. They can practice asking about ingredients, prices, habits, and what markets reveal about daily life.`),
      researchedReadingFocus('rome', 'aqueduct-thinking', 'Rome - Water as Ancient Infrastructure', 'Use aqueducts and fountains to discuss engineering, public health, and city pride.', 'Intermediate', 'Explain why water systems are central to urban life.', ['reading', 'engineering', 'history'], IMAGES.rome, `Rome is famous for ruins, but its water story is just as important. Aqueducts helped bring water into the ancient city, supporting baths, fountains, homes, and public life. Water infrastructure made urban density more possible and also displayed engineering skill.\n\nStudents can compare ancient and modern water systems. What must a city provide every day before people even notice it? Rome shows that infrastructure can be both practical and symbolic.`, [
        { title: 'Roman Aqueducts', publisher: 'Britannica', url: 'https://www.britannica.com/technology/aqueduct-engineering/Roman-aqueducts' },
        { title: 'Historic Centre of Rome', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/91' },
      ]),
      researchedReadingFocus('rome', 'piazza-life', 'Rome - The Piazza as an Outdoor Room', 'Discuss plazas as places for waiting, meeting, watching, and belonging.', 'Easy', 'Describe how public space supports social life.', ['reading', 'public space', 'description'], IMAGES.rome, `A Roman piazza can feel like an outdoor room. People cross it, wait there, take photos, talk, eat, protest, or simply watch others. The surrounding buildings, fountains, steps, and cafes help define how people behave.\n\nStudents can design a good plaza. It needs shade, edges, seats, landmarks, and reasons to stay. Rome helps students see that public space is not empty space. It is social infrastructure.`, [
        { title: 'Piazza Navona', publisher: 'Britannica', url: 'https://www.britannica.com/place/Piazza-Navona' },
        { title: 'Spanish Steps', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Spanish_Steps' },
      ]),
      researchedReadingFocus('rome', 'layers-underfoot', 'Rome - A City With Layers Underfoot', 'Use archaeology to discuss old streets, new streets, and building over time.', 'Advanced', 'Explain how cities preserve and disrupt their own past.', ['reading', 'archaeology', 'urban change'], IMAGES.rome, `In Rome, the past is not only in museums. It appears under streets, beside churches, inside basements, and around construction sites. This creates a challenge: how can a modern city build subway lines, homes, and utilities while protecting ancient layers?\n\nStudents can discuss whether preservation should slow development. When is delay worth it? When does a city need to move forward? Rome makes the tension between past and present visible.`, [
        { title: 'Colosseum', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Colosseum' },
        { title: 'Historic Centre of Rome', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/91' },
      ]),
    ],
  },
  {
    id: 'rio-de-janeiro',
    city: 'Rio de Janeiro',
    country: 'Brazil',
    region: 'South America',
    lat: -22.9068,
    lng: -43.1729,
    primaryAirport: 'GIG',
    airports: ['GIG', 'SDU'],
    scene: { terrain: 'mountain', vegetation: 'palms', skyline: 'dense', landmarkSilhouette: 'christ-the-redeemer', palette: 'tropical' },
    heroImage: IMAGES.rio,
    focusOptions: [
      videoFocus('city-history-video', "Rio - The City's History", 'Trace colonial port, capital city, and global image in one short overview.', 'Intermediate', 'Summarize why Rio became culturally and politically important.', ['listening', 'history', 'summary'], 'I5TaVt5FZoQ', 'CitiesX', 240, `This CitiesX video introduces Rio's history. Students can discuss ports, capitals, slavery, empire, republic, tourism, and how one city can carry many national images.`),
      videoFocus('favela-history-video', 'Rio - A History of the Favela', 'Use a city history topic to discuss housing, inequality, and community.', 'Advanced', 'Describe favelas with care and avoid one-dimensional stereotypes.', ['listening', 'urban life', 'media literacy'], 'S0GzaQNNmCI', 'CitiesX', 209, `This favela history video helps students move beyond simple images of poverty. They can discuss housing, migration, informal building, community, policing, and representation.`),
      videoFocus('carnival-video', 'Rio - Carnival Explained for Kids', 'Use Carnival to discuss performance, preparation, costumes, and shared celebration.', 'Easy', 'Explain a festival using sequence and description language.', ['listening', 'culture', 'description'], 'cJ8ADbsIkxo', 'Archie and Beans World Adventures', 142, `This accessible Carnival explainer introduces students to costumes, music, parades, and preparation. It supports simple descriptive language and discussion about why festivals matter.`),
      researchedReadingFocus('rio-de-janeiro', 'tijuca-forest', 'Rio - The Urban Forest Above the City', 'Use Tijuca Forest to discuss restoration, water, trails, and heat.', 'Intermediate', 'Explain how a forest can be part of city infrastructure.', ['reading', 'nature', 'climate'], IMAGES.rio, `Rio's mountains and forest are not only scenic. Tijuca Forest affects water, shade, biodiversity, tourism, and the way residents imagine the city. Parts of the forest were replanted after earlier damage, which makes it a useful example of restoration.\n\nStudents can compare a natural landmark with a road or water system. Both can serve the city. Rio shows that green space can be infrastructure, not just a background view.`, [
        { title: 'Rio de Janeiro: Carioca Landscapes', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/1100' },
        { title: 'Tijuca National Park', publisher: 'ICMBio', url: 'https://www.icmbio.gov.br/parnatijuca/' },
      ]),
      researchedReadingFocus('rio-de-janeiro', 'beach-public-life', 'Rio - Beach as Public Stage', 'Discuss how beaches support sport, fashion, vendors, class, and identity.', 'Easy', 'Describe a public place where many social worlds meet.', ['reading', 'public space', 'culture'], IMAGES.rio, `In Rio, the beach can be a place to swim, exercise, sell snacks, meet friends, play music, show style, or simply be seen. That makes it a public stage as well as a natural place. Beaches can bring people together, but they can also reveal differences in money, safety, access, and status.\n\nStudents can describe a public place in their own city where many groups mix. What rules are written? What rules are understood? Rio helps students read social life in open space.`, [
        { title: 'Rio de Janeiro', publisher: 'Britannica', url: 'https://www.britannica.com/place/Rio-de-Janeiro-Brazil' },
        { title: 'Rio de Janeiro: Carioca Landscapes', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/1100' },
      ]),
      researchedReadingFocus('rio-de-janeiro', 'samba-schools', 'Rio - Samba Schools as Community Work', 'Look behind Carnival performance to planning, labor, rehearsal, and pride.', 'Intermediate', 'Explain how a festival depends on months of shared work.', ['reading', 'culture', 'teamwork'], IMAGES.rio, `A samba school is not just a group that appears during Carnival. It can involve designers, musicians, dancers, welders, costume makers, organizers, families, and neighborhood supporters. The parade is the public result of long preparation.\n\nStudents can plan a class parade or performance. Who designs? Who rehearses? Who solves problems? Rio shows that celebration is also project management and community labor.`, [
        { title: 'Rio Carnival', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Rio_Carnival' },
        { title: 'Samba de Roda', publisher: 'UNESCO Intangible Cultural Heritage', url: 'https://ich.unesco.org/en/RL/samba-de-roda-of-the-reconcavo-of-bahia-00101' },
      ]),
    ],
  },
  {
    id: 'mexico-city',
    city: 'Mexico City',
    country: 'Mexico',
    region: 'North America',
    lat: 19.4326,
    lng: -99.1332,
    primaryAirport: 'MEX',
    airports: ['MEX', 'NLU'],
    scene: { terrain: 'mountain', vegetation: 'broadleaf', skyline: 'highrise', landmarkSilhouette: 'cathedral', palette: 'golden' },
    heroImage: IMAGES.mexicoCity,
    focusOptions: [
      videoFocus('complex-history-video', 'Mexico City - A Complex History', 'Use a local guide episode to discuss older cities beneath the modern city.', 'Intermediate', 'Explain how Mexico City layers Indigenous, colonial, and modern history.', ['listening', 'history', 'identity'], 'tb_TKtH5k0U', 'Google Local Guides', 265, `This local guide episode introduces Mexico City's complex history. Students can discuss Tenochtitlan, colonial rebuilding, public squares, and why one place can hold many city stories at once.`),
      videoFocus('metro-tips-video', 'Mexico City - Riding the Metro', 'Use practical transit advice to discuss scale, safety, and movement.', 'Easy', 'Give useful metro advice to a visitor using clear steps.', ['listening', 'transport', 'functional English'], 'laLgih0lN7o', 'Nomadic Backpacker', 224, `This Mexico City Metro guide supports practical language around ticketing, crowds, routes, and etiquette. Students can compare it with other large metro systems in the World Flight map.`),
      videoFocus('street-food-video', 'Mexico City - Five Street Foods to Try', 'Use street food to discuss taste, vendors, routine, and cultural pride.', 'Easy', 'Describe food choices and explain why street food matters in city life.', ['listening', 'food culture', 'description'], 'dvmmpnUKhG0', 'Pero Like', 188, `This street-food video gives students concrete food language and a way into daily urban culture. They can discuss price, speed, ingredients, and what vendors add to public life.`),
      researchedReadingFocus('mexico-city', 'xochimilco-chinampas', 'Mexico City - Chinampas and the Floating Garden System', 'Use Xochimilco to discuss farming, water, heritage, and survival.', 'Intermediate', 'Explain how older agricultural systems can still matter in a megacity.', ['reading', 'heritage', 'environment'], IMAGES.mexicoCity, `Xochimilco is often visited for colorful boats, but its chinampa farming system is the deeper story. Raised fields, canals, plants, and water management connect today's city to older ways of producing food in the Valley of Mexico.\n\nStudents can compare an old farming system with modern food delivery. Which is faster? Which is more resilient? Mexico City shows that heritage can be practical, not only decorative.`, [
        { title: 'Historic Centre of Mexico City and Xochimilco', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/412' },
        { title: 'Xochimilco', publisher: 'Britannica', url: 'https://www.britannica.com/place/Xochimilco' },
      ]),
      researchedReadingFocus('mexico-city', 'sinking-city', 'Mexico City - Why the Ground Is Sinking', 'Discuss water extraction, lakebed soil, buildings, and long-term planning.', 'Advanced', 'Explain a geologic city problem using cause and effect.', ['reading', 'science', 'urban planning'], IMAGES.mexicoCity, `Mexico City was built on a former lake system, and parts of the city are sinking as groundwater is removed and soft soils compact. This is not a quick problem. It affects buildings, pipes, streets, drainage, and long-term planning.\n\nStudents can draw a cause-and-effect chain: water demand, groundwater pumping, soil compression, sinking land, damaged infrastructure. The lesson turns a dramatic fact into a systems-thinking task.`, [
        { title: 'Mexico City is sinking', publisher: 'NASA Earth Observatory', url: 'https://earthobservatory.nasa.gov/images/148556/mexico-city-is-sinking' },
        { title: 'Mexico City', publisher: 'Britannica', url: 'https://www.britannica.com/place/Mexico-City' },
      ]),
      researchedReadingFocus('mexico-city', 'markets-and-memory', 'Mexico City - Markets as Everyday Memory', 'Use markets to discuss food, family routines, language, and public life.', 'Intermediate', 'Describe how markets preserve habits and relationships in a large city.', ['reading', 'food culture', 'daily life'], IMAGES.mexicoCity, `A market in Mexico City is not only a place to buy food. It can carry family routines, neighborhood relationships, regional ingredients, bargaining language, and memory. Shoppers may know vendors by name, and vendors may know what families usually need.\n\nStudents can compare a supermarket with a market. Which is faster? Which creates more conversation? Which teaches more about local culture? Mexico City makes everyday buying and selling a cultural topic.`, [
        { title: 'Markets in Mexico City', publisher: 'Mexico City Tourism', url: 'https://mexicocity.cdmx.gob.mx/venues/' },
        { title: 'Central de Abasto', publisher: 'Central de Abasto CDMX', url: 'https://ficeda.com.mx/' },
      ]),
    ],
  },
  {
    id: 'buenos-aires',
    city: 'Buenos Aires',
    country: 'Argentina',
    region: 'South America',
    lat: -34.6037,
    lng: -58.3816,
    primaryAirport: 'EZE',
    airports: ['EZE', 'AEP'],
    scene: { terrain: 'flatland', vegetation: 'broadleaf', skyline: 'dense', landmarkSilhouette: 'obelisk', palette: 'golden' },
    heroImage: IMAGES.buenosAires,
    focusOptions: [
      videoFocus('city-history-video', 'Buenos Aires - A Fascinating History', 'Trace port city growth, immigration, politics, and identity.', 'Intermediate', 'Summarize how Buenos Aires became Argentina’s dominant urban center.', ['listening', 'history', 'summary'], '24geEfuDkxA', 'Voyage Wisdom', 391, `This history overview helps students connect Buenos Aires with port geography, immigration, national politics, and cultural identity. It works well for timeline and cause-and-effect practice.`),
      videoFocus('tango-video', 'Buenos Aires - Argentine Tango Basics', 'Use tango to discuss music, movement, partnership, and social codes.', 'Easy', 'Describe a dance tradition using body and sequence language.', ['listening', 'culture', 'movement'], 'zr3geZ4B4bg', 'NicoAndStephie', 282, `This quick tango lesson gives students a physical and cultural entry point into Buenos Aires. They can describe steps, posture, partnership, and why dance can become a city symbol.`),
      videoFocus('landmarks-video', 'Buenos Aires - Five Must-See Landmarks', 'Use landmarks to discuss neighborhoods, routes, and public memory.', 'Easy', 'Describe a city route with landmarks and reasons to visit.', ['listening', 'travel English', 'description'], 'peNeRMt9LQw', 'Sightseer.TV - Buenos Aires', 187, `This landmarks video gives students concrete places to describe. They can design a short walking route and explain how each stop shows a different side of Buenos Aires.`),
      researchedReadingFocus('buenos-aires', 'notable-bars', 'Buenos Aires - Notable Bars and Conversation Culture', 'Use cafes and bars to discuss talk, reading, politics, and routine.', 'Intermediate', 'Explain how everyday places can become cultural institutions.', ['reading', 'culture', 'daily life'], IMAGES.buenosAires, `Buenos Aires is famous for cafes and notable bars where people read, talk, meet, argue, and spend time. These places matter because culture does not only happen in museums. It also happens at tables, in repeated conversations, and in routines.\n\nStudents can design a notable cafe for their city. What makes it worth preserving: age, architecture, food, writers, music, or community? Buenos Aires turns ordinary social time into heritage.`, [
        { title: 'Bar notable', publisher: 'Wikipedia', url: 'https://es.wikipedia.org/wiki/Bar_notable' },
        { title: 'Buenos Aires', publisher: 'Britannica', url: 'https://www.britannica.com/place/Buenos-Aires' },
      ]),
      researchedReadingFocus('buenos-aires', 'book-city', 'Buenos Aires - A City That Loves Bookshops', 'Discuss reading culture, bookstores, theater, and public imagination.', 'Intermediate', 'Describe how a city can support reading outside school.', ['reading', 'literature', 'culture'], IMAGES.buenosAires, `Buenos Aires has a strong reputation for bookshops, publishing, theater, and literary culture. A bookstore can be more than a shop. It can become a meeting place, a quiet public interior, and a sign that reading belongs in city life.\n\nStudents can compare a library, bookstore, and classroom. Which one feels most public? Which one invites browsing? Buenos Aires helps students see reading as a city habit, not only homework.`, [
        { title: 'Buenos Aires', publisher: 'UNESCO Creative Cities Network', url: 'https://www.unesco.org/en/creative-cities/buenos-aires' },
        { title: 'El Ateneo Grand Splendid', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/El_Ateneo_Grand_Splendid' },
      ]),
      researchedReadingFocus('buenos-aires', 'la-boca-color', 'Buenos Aires - La Boca, Color, and Visitor Attention', 'Use a famous neighborhood to discuss art, immigration, tourism, and performance.', 'Advanced', 'Explain how a neighborhood can become a symbol and still be lived in.', ['reading', 'neighborhoods', 'media literacy'], IMAGES.buenosAires, `La Boca is often shown through bright colors, tango images, football, and tourist streets. Those images are real but incomplete. The neighborhood also has migration history, working-class identity, port connections, and residents whose lives are not only performance for visitors.\n\nStudents can discuss how tourism changes a neighborhood's image. What gets photographed? What gets ignored? Buenos Aires helps students separate symbol from full story.`, [
        { title: 'La Boca', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/La_Boca' },
        { title: 'Tango', publisher: 'UNESCO Intangible Cultural Heritage', url: 'https://ich.unesco.org/en/RL/tango-00258' },
      ]),
    ],
  },
  {
    id: 'los-angeles',
    city: 'Los Angeles',
    country: 'United States',
    region: 'North America',
    lat: 34.0522,
    lng: -118.2437,
    primaryAirport: 'LAX',
    airports: ['LAX', 'BUR', 'LGB'],
    scene: { terrain: 'coastal', vegetation: 'palms', skyline: 'highrise', landmarkSilhouette: 'hollywood-sign', palette: 'golden' },
    heroImage: IMAGES.losAngeles,
    focusOptions: [
      videoFocus('hollywood-history-video', 'Los Angeles - Why Hollywood Became Hollywood', 'Trace geography, weather, film studios, and global image.', 'Intermediate', 'Explain why one industry concentrated in Los Angeles.', ['listening', 'media', 'history'], 'gBe4HpNY_Z8', 'History on Maps', 323, `This video explains Hollywood's rise in Los Angeles. Students can discuss weather, land, business, technology, and how a place name becomes shorthand for an industry.`),
      videoFocus('metro-rail-video', 'Los Angeles - How to Ride Metro Rail', 'Use an official transit video to practice route and station language.', 'Easy', 'Give clear instructions for using LA Metro rail.', ['listening', 'transport', 'functional English'], 'a8KnOqdRwDs', 'Metro Los Angeles', 159, `This Metro Los Angeles video gives students practical language for rail travel. It also supports discussion about how a car-associated city is expanding transit choices.`),
      videoFocus('smog-history-video', "Los Angeles - The Mystery of Smog", 'Use environmental history to discuss cars, air, science, and regulation.', 'Intermediate', 'Explain how a city identified and responded to an air pollution problem.', ['listening', 'environment', 'cause and effect'], 'yWYwwMU1Z-w', 'American Experience | PBS', 300, `This PBS segment introduces the history of LA smog. Students can connect cars, weather, industry, science, and public policy, then discuss how cities solve problems people breathe every day.`),
      researchedReadingFocus('los-angeles', 'water-imports', 'Los Angeles - Where the Water Comes From', 'Discuss aqueducts, conservation, lawns, drought, and city growth.', 'Advanced', 'Explain why water supply shapes urban possibility in dry regions.', ['reading', 'environment', 'systems'], IMAGES.losAngeles, `Los Angeles grew in a dry region, so water is part of the city's story. Imported water, local groundwater, conservation, recycling, drought, and landscaping choices all affect what the city can support. Water is not just a utility bill. It shapes growth, politics, and daily habits.\n\nStudents can design a water budget for a dry city. Who needs water first? What should be reused? What should change during drought? Los Angeles makes water supply visible.`, [
        { title: 'Water System', publisher: 'Los Angeles Department of Water and Power', url: 'https://www.ladwp.com/who-we-are/water-system' },
        { title: 'Los Angeles Aqueduct', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Los_Angeles_Aqueduct' },
      ]),
      researchedReadingFocus('los-angeles', 'freeway-language', 'Los Angeles - Freeways and the Shape of Daily Life', 'Use freeway culture to discuss speed, distance, access, and pollution.', 'Intermediate', 'Explain how roads change city habits and tradeoffs.', ['reading', 'transport', 'debate'], IMAGES.losAngeles, `Los Angeles is famous for freeways because they shaped how people imagine distance and movement. Freeways can connect neighborhoods and jobs, but they can also divide communities, increase pollution, and make car ownership feel necessary.\n\nStudents can compare a freeway city with a transit city. Which is easier for a visitor? Which is easier for a family without a car? Los Angeles turns transportation into a fairness question.`, [
        { title: 'Metro', publisher: 'LA Metro', url: 'https://www.metro.net/' },
        { title: 'Los Angeles County Transportation', publisher: 'Southern California Association of Governments', url: 'https://scag.ca.gov/transportation' },
      ]),
      researchedReadingFocus('los-angeles', 'murals-and-neighborhoods', 'Los Angeles - Murals as Neighborhood Voice', 'Discuss public art, identity, memory, and who controls walls.', 'Easy', 'Describe how public art communicates local stories.', ['reading', 'art', 'identity'], IMAGES.losAngeles, `Murals in Los Angeles can mark identity, protest, memory, celebration, and neighborhood pride. Unlike art hidden inside a museum, a mural speaks from a wall that people pass every day. That makes public art visible but also contested.\n\nStudents can design a mural for a route in their city. What story should be public? Who should approve it? Los Angeles helps students see walls as communication space.`, [
        { title: 'Murals', publisher: 'City of Los Angeles Department of Cultural Affairs', url: 'https://culturela.org/murals/' },
        { title: 'Mural Ordinance', publisher: 'City of Los Angeles Department of Cultural Affairs', url: 'https://culturela.org/murals/mural-ordinance/' },
      ]),
    ],
  },
  {
    id: 'jakarta',
    city: 'Jakarta',
    country: 'Indonesia',
    region: 'Southeast Asia',
    lat: -6.2088,
    lng: 106.8456,
    primaryAirport: 'CGK',
    airports: ['CGK', 'HLP'],
    scene: { terrain: 'coastal', vegetation: 'palms', skyline: 'highrise', landmarkSilhouette: 'monas', palette: 'tropical' },
    heroImage: IMAGES.jakarta,
    focusOptions: [
      videoFocus('historical-places-video', 'Jakarta - Five Historical Places', 'Use landmarks to trace colonial, national, and everyday city memory.', 'Intermediate', 'Describe how historical sites tell different parts of Jakarta’s story.', ['listening', 'history', 'landmarks'], 'pBSJxJmGpE0', 'City Explorers', 337, `This Jakarta landmarks video gives students a route through historical places. They can connect sites with trade, colonial history, independence, and modern public memory.`),
      videoFocus('flood-control-video', 'Jakarta - Ramping Up Flood Control', 'Examine how a coastal megacity responds to flooding and lawsuits.', 'Advanced', 'Explain flood risk using infrastructure, responsibility, and public trust.', ['listening', 'climate', 'problem solving'], 'Dq1YVEgZ2FE', 'CNA', 297, `This CNA segment focuses on flood control in Jakarta. Students can discuss canals, drainage, responsibility, rescue, and why residents may sue when city systems fail.`),
      videoFocus('transport-video', 'Jakarta - Fighting Traffic With Public Transport', 'Use transit expansion to discuss congestion, planning, and behavior change.', 'Intermediate', 'Explain why transport upgrades must compete with habits and city scale.', ['listening', 'transport', 'urban planning'], '5ODUp-7VzAk', 'Al Jazeera English', 153, `This Al Jazeera segment looks at Jakarta's public transport expansion. Students can discuss traffic, commuting time, and what it takes to persuade people to change travel habits.`),
      researchedReadingFocus('jakarta', 'old-batavia', 'Jakarta - Kota Tua and the Colonial Port', 'Use Old Batavia to discuss trade, buildings, names, and memory.', 'Easy', 'Explain how colonial port history remains visible in a modern capital.', ['reading', 'history', 'heritage'], IMAGES.jakarta, `Kota Tua, or Jakarta's old town, helps students see the city's port and colonial layers. Warehouses, squares, museums, and street names point to trade, power, and the movement of goods and people.\n\nStudents can compare an old port district with a new business district. What gets preserved? What becomes a museum? Jakarta shows how a city can keep older layers while still changing fast.`, [
        { title: 'Kota Tua Jakarta', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Kota_Tua_Jakarta' },
        { title: 'Jakarta', publisher: 'Britannica', url: 'https://www.britannica.com/place/Jakarta' },
      ]),
      researchedReadingFocus('jakarta', 'new-capital-question', 'Jakarta - Why Build a New Capital?', 'Discuss crowding, sinking, politics, identity, and national planning.', 'Advanced', 'Explain arguments for and against moving capital functions.', ['reading', 'government', 'debate'], IMAGES.jakarta, `Indonesia's plan for a new capital raises a large question: what happens when a capital city has too many pressures? Jakarta faces traffic, flooding, sinking land, air pollution, and huge demand for services. Moving some government functions may reduce pressure, but it also costs money and creates new environmental questions.\n\nStudents can debate whether a country should move a capital. What problems does it solve? What problems move somewhere else?`, [
        { title: 'Nusantara Capital City', publisher: 'Nusantara Capital Authority', url: 'https://www.ikn.go.id/en' },
        { title: 'Indonesia', publisher: 'World Bank', url: 'https://www.worldbank.org/en/country/indonesia' },
      ]),
      researchedReadingFocus('jakarta', 'warung-life', 'Jakarta - Warung, Street Food, and Everyday Access', 'Use small food stalls to discuss price, work, convenience, and neighborhood life.', 'Easy', 'Describe how small businesses support daily routines.', ['reading', 'food culture', 'daily life'], IMAGES.jakarta, `A warung or small food stall can make city life easier. It may offer affordable meals, quick snacks, phone credit, conversation, and a familiar face near home or work. These small businesses help people manage busy days in a large city.\n\nStudents can compare a small local stall with a chain restaurant. Which is faster? Which is more personal? Which supports neighborhood life? Jakarta makes everyday convenience a classroom topic.`, [
        { title: 'Warung', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Warung' },
        { title: 'Jakarta', publisher: 'Britannica', url: 'https://www.britannica.com/place/Jakarta' },
      ]),
    ],
  },
  {
    id: 'lagos',
    city: 'Lagos',
    country: 'Nigeria',
    region: 'Africa',
    lat: 6.5244,
    lng: 3.3792,
    primaryAirport: 'LOS',
    airports: ['LOS'],
    scene: { terrain: 'coastal', vegetation: 'palms', skyline: 'highrise', landmarkSilhouette: 'lagoon-bridge', palette: 'tropical' },
    heroImage: IMAGES.lagos,
    focusOptions: [
      videoFocus('local-city-video', 'Lagos - Discover the City With a Local', 'Use a local travel segment to discuss pace, creativity, and city identity.', 'Intermediate', 'Describe Lagos using specific details rather than one broad label.', ['listening', 'culture', 'description'], 'EHFEPnDtK4c', 'DW Travel', 342, `This DW Travel segment introduces Lagos through a local perspective. Students can notice markets, movement, creativity, and how a fast-growing city is described by residents.`),
      videoFocus('mass-transit-video', 'Lagos - Trying to Fix Megacity Transport', 'Examine transit efforts in a rapidly growing city.', 'Advanced', 'Explain why transport planning is difficult in a large, fast-growing city.', ['listening', 'transport', 'urban planning'], 'FjjGFiUJ5Zc', 'AFP News Agency', 207, `This AFP video looks at mass transit in Lagos. Students can discuss congestion, commuting, bus systems, water routes, and why infrastructure must grow with population.`),
      videoFocus('market-video', 'Lagos - Inside a Market', 'Use a market visit to discuss vendors, price, supply, and daily work.', 'Easy', 'Describe a market scene using observation and question language.', ['listening', 'commerce', 'description'], '-ZegVUMFeCc', 'VOA Africa', 157, `This VOA Africa market video gives students concrete language for stalls, goods, vendors, and customers. It supports comparison with markets in Bangkok, Mexico City, and Mumbai.`),
      researchedReadingFocus('lagos', 'lagoon-transport', 'Lagos - Moving Through a Lagoon City', 'Discuss buses, boats, bridges, congestion, and access.', 'Intermediate', 'Compare transport choices in a city shaped by water and traffic.', ['reading', 'transport', 'comparison'], IMAGES.lagos, `Lagos is shaped by roads, bridges, islands, mainland neighborhoods, and lagoon routes. Traffic can make movement slow, so buses, rail plans, ferries, and informal transport all matter. A transport system is not only vehicles. It is time, cost, reliability, safety, and access.\n\nStudents can plan a commute with two routes: one by road and one by water. Which risks are different? Lagos shows why transport planning must fit local geography.`, [
        { title: 'Lagos Metropolitan Area Transport Authority', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Lagos_Metropolitan_Area_Transport_Authority' },
        { title: 'Lagos State Waterways Authority', publisher: 'Lagos State Government', url: 'https://lagosstate.gov.ng/' },
      ]),
      researchedReadingFocus('lagos', 'nollywood-city', 'Lagos - Nollywood and the City of Production', 'Use film to discuss low-cost creativity, work, language, and audience.', 'Easy', 'Explain how a city can become a media-production hub.', ['reading', 'media', 'work'], IMAGES.lagos, `Lagos is central to Nollywood, Nigeria's film industry. The topic is useful because it connects creativity with speed, budgets, actors, language, distribution, and audience demand. A film industry is not only stars. It includes writers, editors, drivers, makeup artists, marketers, and viewers.\n\nStudents can plan a short film production in their city. What locations, workers, and languages would they need? Lagos makes media feel practical and local.`, [
        { title: 'Nollywood', publisher: 'Britannica', url: 'https://www.britannica.com/art/Nollywood' },
        { title: 'Nigeria Film Industry', publisher: 'UNESCO', url: 'https://en.unesco.org/creativity/policy-monitoring-platform/nigeria-film-industry' },
      ]),
      researchedReadingFocus('lagos', 'market-enterprise', 'Lagos - Markets and Entrepreneurial Language', 'Discuss buying, selling, negotiation, risk, and small business.', 'Intermediate', 'Use market examples to explain everyday entrepreneurship.', ['reading', 'commerce', 'functional English'], IMAGES.lagos, `Markets in Lagos can be intense, crowded, noisy, and highly organized by people who know their goods and customers. A market teaches language of price, quality, trust, hurry, repair, supply, and persuasion. It also shows how small businesses create livelihoods.\n\nStudents can write a vendor interview. What do you sell? Where do goods come from? What changes during rain, fuel shortages, or holidays? Lagos turns commerce into human stories.`, [
        { title: 'Lagos', publisher: 'Britannica', url: 'https://www.britannica.com/place/Lagos-Nigeria' },
        { title: 'Doing Business in Lagos', publisher: 'Lagos State Government', url: 'https://lagosstate.gov.ng/' },
      ]),
    ],
  },
  {
    id: 'hong-kong',
    city: 'Hong Kong',
    country: 'China',
    region: 'East Asia',
    lat: 22.3193,
    lng: 114.1694,
    primaryAirport: 'HKG',
    airports: ['HKG'],
    scene: { terrain: 'mountain', vegetation: 'broadleaf', skyline: 'highrise', landmarkSilhouette: 'harbour', palette: 'night' },
    heroImage: IMAGES.hongKong,
    focusOptions: [
      videoFocus('animated-history-video', 'Hong Kong - Animated History', 'Trace trading port, colony, handover, and global city identity.', 'Intermediate', 'Summarize Hong Kong history using timeline language.', ['listening', 'history', 'summary'], 'yoCsM3XBiFk', 'Suibhne', 346, `This animated history gives students a compact overview of Hong Kong. They can discuss trade, empire, migration, handover, and why city identity can be politically complex.`),
      videoFocus('transport-system-video', 'Hong Kong - What Other Cities Can Learn From Transport', 'Use transit to discuss density, payment, reliability, and city design.', 'Intermediate', 'Explain why Hong Kong transport is often studied by other cities.', ['listening', 'transport', 'systems'], 'jan-cC-meaw', 'Al Jazeera English', 143, `This Al Jazeera segment uses Hong Kong transport as a model. Students can discuss Octopus cards, density, rail connections, and why land use affects transit success.`),
      videoFocus('housing-video', 'Hong Kong - Tiny Flats and Housing Pressure', 'Discuss housing size, affordability, dignity, and policy.', 'Advanced', 'Explain why dense cities face difficult housing tradeoffs.', ['listening', 'housing', 'debate'], 'jYn7SCXO_nA', 'Al Jazeera English', 164, `This video examines Hong Kong's tiny-flat problem. Students can discuss dignity, rent, regulation, and the difference between density as design and density as pressure.`),
      researchedReadingFocus('hong-kong', 'country-parks', 'Hong Kong - Country Parks Beside a Dense City', 'Use parks to discuss contrast, hiking, conservation, and public access.', 'Easy', 'Describe how high density and protected nature can exist close together.', ['reading', 'nature', 'comparison'], IMAGES.hongKong, `Hong Kong is famous for towers and harbor views, but large areas are also protected as country parks. That contrast makes the city surprising. A person can move from dense streets to trails, reservoirs, beaches, and hills in a short time.\n\nStudents can compare two maps: one showing buildings and one showing green space. What story does each map tell? Hong Kong shows that density does not mean nature has disappeared.`, [
        { title: 'Country Parks', publisher: 'Agriculture, Fisheries and Conservation Department', url: 'https://www.afcd.gov.hk/english/country/cou_vis/cou_vis.html' },
        { title: 'Hong Kong UNESCO Global Geopark', publisher: 'Hong Kong Geopark', url: 'https://www.geopark.gov.hk/en/' },
      ]),
      researchedReadingFocus('hong-kong', 'harbour-reclamation', 'Hong Kong - Building Around the Harbour', 'Discuss reclamation, skyline views, public access, and land shortage.', 'Advanced', 'Explain why land scarcity creates difficult planning choices.', ['reading', 'urban planning', 'debate'], IMAGES.hongKong, `Victoria Harbour is central to Hong Kong's image, but the land around it has changed through reclamation and development. Creating more land can support roads, housing, offices, and public spaces. It can also reduce water area, change views, and create public debate.\n\nStudents can debate whether a city should make new land from water. Who benefits? What is lost? Hong Kong makes land scarcity visible.`, [
        { title: 'Victoria Harbour', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Victoria_Harbour' },
        { title: 'Central and Wan Chai Reclamation', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Central_and_Wan_Chai_Reclamation' },
      ]),
      researchedReadingFocus('hong-kong', 'cha-chaan-teng', 'Hong Kong - Cha Chaan Teng and Fast Everyday Food', 'Use cafes to discuss mixed food culture, speed, menus, and routine.', 'Easy', 'Describe a local eating place and explain why it fits city life.', ['reading', 'food culture', 'daily life'], IMAGES.hongKong, `A cha chaan teng is a Hong Kong-style cafe where menus can mix milk tea, noodles, toast, rice dishes, and quick service. It reflects a city shaped by Cantonese habits, colonial influence, work schedules, and dense neighborhoods.\n\nStudents can design a menu for a fast local cafe in their own city. What food is quick, affordable, and familiar? Hong Kong shows how everyday food can carry history without feeling formal.`, [
        { title: 'Hong Kong Dining', publisher: 'Hong Kong Tourism Board', url: 'https://www.discoverhongkong.com/eng/explore/dining.html' },
        { title: 'Hong Kong-style milk tea', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Hong_Kong-style_milk_tea' },
      ]),
    ],
  },
  {
    id: 'amsterdam',
    city: 'Amsterdam',
    country: 'Netherlands',
    region: 'Europe',
    lat: 52.3676,
    lng: 4.9041,
    primaryAirport: 'AMS',
    airports: ['AMS'],
    scene: { terrain: 'flatland', vegetation: 'broadleaf', skyline: 'historic', landmarkSilhouette: 'canal-houses', palette: 'golden' },
    heroImage: IMAGES.amsterdam,
    focusOptions: [
      videoFocus('city-history-video', 'Amsterdam - A Surprising History', 'Trace trade, canals, tolerance, and urban growth in a compact history.', 'Intermediate', 'Summarize how water, trade, and culture shaped Amsterdam.', ['listening', 'history', 'summary'], 'dJ4eNsaAxSQ', 'The Dutch History Channel', 189, `This history clip gives students a compact overview of Amsterdam. They can connect trade, canals, religious history, and city planning in one route discussion.`),
      videoFocus('cycling-video', 'Amsterdam - How It Became a Bicycle Paradise', 'Use cycling to discuss safety, design, habits, and policy.', 'Intermediate', 'Explain why bike culture depends on infrastructure, not only personal choice.', ['listening', 'transport', 'urban design'], 'DKbRL6Opifg', 'Bloomberg Originals', 238, `This Bloomberg Originals video explains Amsterdam cycling culture. Students can discuss bike lanes, safety, children, traffic, and how city design changes behavior.`),
      videoFocus('canals-video', 'Amsterdam - Fun Facts About the Canals', 'Use the canal system to discuss water, streets, homes, and tourism.', 'Easy', 'Describe canals as infrastructure and public identity.', ['listening', 'water', 'description'], 'pT7LtZT8hcE', 'Inspirich', 185, `This canal facts video gives students concrete details about Amsterdam's water system. It supports vocabulary for bridges, boats, houses, routes, and heritage.`),
      researchedReadingFocus('amsterdam', 'canal-ring-planning', 'Amsterdam - Planning the Canal Ring', 'Use canals to discuss engineering, trade, housing, and long-term planning.', 'Easy', 'Explain how a city plan can still shape daily life centuries later.', ['reading', 'urban planning', 'history'], IMAGES.amsterdam, `Amsterdam's canal ring was not accidental scenery. It was a planned system connected to trade, drainage, defense, housing, and movement. Centuries later, the same canals shape tourism, transport, architecture, and the city's image.\n\nStudents can draw a simple city plan with water routes and streets. What should be close together? Where should people live? Amsterdam shows how old planning decisions can remain active.`, [
        { title: 'Seventeenth-Century Canal Ring Area of Amsterdam', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/1349' },
        { title: 'Amsterdam Canal Ring', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Canals_of_Amsterdam' },
      ]),
      researchedReadingFocus('amsterdam', 'water-management', 'Amsterdam - Keeping Water in the Right Place', 'Discuss pumps, canals, polders, sea level, and everyday safety.', 'Intermediate', 'Explain why water management is ordinary infrastructure in the Netherlands.', ['reading', 'engineering', 'climate'], IMAGES.amsterdam, `In Amsterdam, water is beautiful but also serious. Canals, pumps, dikes, polders, and water boards help keep water where it should be. This kind of infrastructure can be invisible when it works, but it shapes whether people can live, travel, and build safely.\n\nStudents can list water risks in different cities: floods, drought, storms, pollution, or sinking land. Amsterdam helps students see water management as daily protection.`, [
        { title: 'Waternet', publisher: 'Waternet', url: 'https://www.waternet.nl/en/' },
        { title: 'Dutch Water Authorities', publisher: 'Dutch Water Authorities', url: 'https://dutchwaterauthorities.com/' },
      ]),
      researchedReadingFocus('amsterdam', 'museum-choices', 'Amsterdam - What Museums Choose to Show', 'Use museums to discuss art, empire, trade, and difficult context.', 'Advanced', 'Analyze how museums frame objects and national stories.', ['reading', 'museums', 'critical thinking'], IMAGES.amsterdam, `Amsterdam's museums are famous, but museum lessons should not only ask what is beautiful. They can also ask where objects came from, who paid for art, what trade made possible, and how stories are explained today.\n\nStudents can choose one museum object and write two labels: one simple label and one context label. Amsterdam helps students see museums as places where storytelling choices matter.`, [
        { title: 'Rijksmuseum', publisher: 'Rijksmuseum', url: 'https://www.rijksmuseum.nl/en' },
        { title: 'Amsterdam Museum', publisher: 'Amsterdam Museum', url: 'https://www.amsterdammuseum.nl/en' },
      ]),
    ],
  },
  {
    id: 'honolulu',
    city: 'Honolulu',
    country: 'United States',
    region: 'Pacific',
    lat: 21.3069,
    lng: -157.8583,
    primaryAirport: 'HNL',
    airports: ['HNL'],
    scene: { terrain: 'island', vegetation: 'palms', skyline: 'low', landmarkSilhouette: 'diamond-head', palette: 'tropical' },
    heroImage: IMAGES.honolulu,
    focusOptions: [
      videoFocus('hula-story-video', 'Honolulu - Hula as History and Responsibility', 'See how hula carries stories, language, and cultural responsibility.', 'Intermediate', 'Explain why a dance can preserve knowledge and identity.', ['listening', 'culture', 'storytelling'], 'BLjwluzYtM4', 'National Geographic', 207, `This National Geographic short presents hula as a way of carrying Hawaiian stories and responsibilities, not simply as entertainment. Students can listen for the relationship between movement, language, teaching, and cultural continuity.`, '2026-06-11'),
      videoFocus('spam-musubi-video', "Honolulu - The Story of Hawaiʻi's Spam Musubi", 'Use a familiar snack to explore migration, adaptation, convenience, and local identity.', 'Easy', 'Explain how a food becomes part of everyday city culture.', ['listening', 'food culture', 'identity'], 'q7txkqL96Dk', 'PBS Hawaiʻi', 332, `This PBS Hawaiʻi feature follows spam musubi through shops, family routines, and changing recipes. Students can describe ingredients and preparation while discussing how an adapted food becomes a widely shared local symbol.`, '2026-06-11'),
      videoFocus('city-history-video', 'Honolulu - A Brief City History', 'Trace Honolulu from a sheltered gathering place to a modern Pacific capital.', 'Intermediate', 'Summarize how geography, government, trade, and tourism shaped Honolulu.', ['listening', 'history', 'summary'], '6iQY0w37fTQ', 'Fascinating History', 262, `This compact history introduces the meaning of Honolulu's name and follows the city's growth as a harbor, royal capital, territorial center, and modern destination. It supports timeline language and discussion of how cities change roles over time.`, '2026-06-11'),
      researchedReadingFocus('honolulu', 'ahupuaa-land-and-water', 'Honolulu - Reading the Land Through Ahupuaa', 'Explore a Hawaiian system that connects mountain water, farms, settlements, and the sea.', 'Intermediate', 'Explain how land and water management can connect an entire watershed.', ['reading', 'indigenous knowledge', 'environment'], IMAGES.honolulu, `In traditional Hawaiian land management, an ahupuaa is a land division that often runs from the mountains toward the sea. Its shape connects forests, streams, farming areas, settlements, fishponds, reefs, and coastal waters. Water moving downhill links the health of each part. What happens in an upland forest can eventually affect a reef far below.

Ahupuaa were not identical, and they should not be reduced to a simple diagram. They were lived places governed through relationships, responsibilities, local knowledge, and the careful use of resources. Communities understood that water, food, and healthy ecosystems could not be managed as separate subjects.

Modern Honolulu is much larger and more urban, but the watershed connection remains. Roads, buildings, storm drains, streams, and coastal development still direct water from ridge to reef. The older framework offers a way to see the city as part of a connected island system rather than as land separated into unrelated properties.`, [
        { title: 'History and Principles', publisher: 'Hawaii State Aha Moku', url: 'https://dlnr.hawaii.gov/ahamoku/history/' },
        { title: 'Hawaiian Fishponds: Providing Physical and Cultural Sustenance', publisher: 'NOAA Fisheries', url: 'https://www.fisheries.noaa.gov/feature-story/hawaiian-fishponds-providing-physical-and-cultural-sustenance' },
      ]),
      researchedReadingFocus('honolulu', 'waikiki-changing-coast', 'Honolulu - Waikiki as a Changing Coast', 'Look beyond the postcard to examine water, tourism, sand, and coastal protection.', 'Easy', 'Explain how a famous beach depends on continual environmental and public decisions.', ['reading', 'tourism', 'environment'], IMAGES.honolulu, `Waikiki is often presented as a natural tropical beach, but its modern shoreline is also the result of major human changes. Wetlands and fishpond areas were altered, streams were redirected, hotels and roads were built, and sand has been added to sections of the beach. The coastline seen by visitors is both a natural place and maintained urban infrastructure.

Tourism makes Waikiki economically important, while the beach itself remains vulnerable to erosion, storms, high waves, and rising sea levels. Protecting buildings can reduce space for sand to move naturally. Replacing sand can preserve recreation for a time, but it requires money, suitable material, and repeated work.

The central challenge is that many groups depend on the same narrow coast. Residents, hotel workers, visitors, businesses, surfers, swimmers, wildlife, and cultural practitioners do not always need the same thing. Waikiki shows why a beautiful public image can depend on difficult choices that are less visible.`, [
        { title: 'Waikiki Beach Improvement and Maintenance Program', publisher: 'Hawaii Department of Land and Natural Resources', url: 'https://dlnr.hawaii.gov/occl/waikiki/' },
        { title: 'Waikiki Beach Maintenance Project Complete', publisher: 'Hawaii Department of Land and Natural Resources', url: 'https://dlnr.hawaii.gov/blog/2021/05/20/nr21-098/' },
      ]),
      researchedReadingFocus('honolulu', 'pearl-harbor-memory', 'Honolulu - Pearl Harbor as Place and Memory', 'Examine how one harbor can be a military base, memorial landscape, and historical classroom.', 'Advanced', 'Analyze how public sites explain conflict, loss, responsibility, and remembrance.', ['reading', 'history', 'memory'], IMAGES.honolulu, `Pearl Harbor is an active military harbor and a landscape of public memory. The attack on December 7, 1941, brought the United States directly into the Second World War. Today, memorial sites around the harbor preserve ships, documents, personal accounts, and places connected to those events.

The USS Arizona Memorial marks the resting place of many sailors killed during the attack. Other sites interpret submarines, aircraft, the battleship Missouri, and the wider Pacific War. Together they show that a historical place can contain several stories at once: sudden attack, military service, civilian experience, technological power, loss, and the eventual end of the war.

Memorials influence how visitors move and behave. Quiet spaces, names, preserved objects, and guided interpretation turn a working harbor into a place of reflection. The way those elements are arranged also shapes which parts of a complex conflict receive the most attention.`, [
        { title: 'Pearl Harbor National Memorial', publisher: 'National Park Service', url: 'https://www.nps.gov/perl/index.htm' },
        { title: 'About the Pearl Harbor National Memorial', publisher: 'National Park Service', url: 'https://www.nps.gov/valr/learn/about-the-park.htm' },
      ]),
    ],
  },
  {
    id: 'miami',
    city: 'Miami',
    country: 'United States',
    region: 'North America',
    lat: 25.7617,
    lng: -80.1918,
    primaryAirport: 'MIA',
    airports: ['MIA', 'FLL'],
    scene: { terrain: 'coastal', vegetation: 'palms', skyline: 'highrise', landmarkSilhouette: 'art-deco', palette: 'tropical' },
    heroImage: IMAGES.miami,
    focusOptions: [
      videoFocus('little-havana-video', 'Miami - A Walk Through Little Havana', 'Explore Cuban culture through music, coffee, food, cigars, and neighborhood life.', 'Intermediate', 'Describe how migration can shape the public identity of a neighborhood.', ['listening', 'culture', 'identity'], 'Z0-UWNOiC0s', 'Voice of America', 181, `This Voice of America report introduces Little Havana through residents and everyday cultural details. Students can listen for how music, food, language, and businesses keep connections to Cuba while developing a distinct Miami identity.`, '2026-06-11'),
      videoFocus('everglades-video', 'Miami - Understanding the Everglades', 'Connect South Florida wetlands with water, wildlife, restoration, and the nearby city.', 'Intermediate', 'Explain why a distant-looking ecosystem matters to an urban region.', ['listening', 'environment', 'systems thinking'], 'x5fI7LcGUpc', 'Miami Herald', 336, `This Miami Herald explainer describes the Everglades as a river of grass and examines its importance to South Florida. Students can connect water flow, wildlife, restoration, and urban growth without treating the wetland as separate from Miami.`, '2026-06-11'),
      videoFocus('rapid-transit-video', 'Miami - Launching a New Rapid Bus Route', 'Use a current transit project to discuss speed, access, comfort, and commuting.', 'Easy', 'Identify what makes a new public transport service useful to riders.', ['listening', 'transport', 'daily life'], 'Y6jT8LF_X_0', 'CBS Miami', 157, `This CBS Miami report follows the launch of a bus rapid transit route in South Miami-Dade. Students can identify promised improvements and discuss what riders need from a service beyond simply having a bus available.`, '2026-06-11'),
      researchedReadingFocus('miami', 'art-deco-preservation', 'Miami - How Art Deco Became a Neighborhood Identity', 'Use Miami Beach architecture to examine preservation, tourism, color, and reinvention.', 'Easy', 'Explain how preservation can protect buildings while changing how a district is used.', ['reading', 'architecture', 'history'], IMAGES.miami, `Miami Beach's Art Deco district is known for low-rise hotels, geometric decoration, curved corners, bright signs, and pastel colors. Many of its buildings were constructed during the 1920s, 1930s, and 1940s, when new materials and machine-age ideas influenced architecture. Over time, neglect and redevelopment threatened parts of the district.

Preservation advocates argued that the buildings formed a valuable collection rather than a group of outdated hotels. Protecting them helped create a recognizable neighborhood identity and supported tourism. Restoration also changed the area by attracting investment, visitors, restaurants, and nightlife.

Preservation is therefore not the same as keeping a place untouched. Buildings may receive new systems, new uses, and new audiences while their facades and important features remain. Miami's Art Deco district shows how a city can turn architecture from an obstacle to redevelopment into a central part of its public image.`, [
        { title: 'Color Palettes Saving Buildings from Demolition', publisher: 'National Park Service', url: 'https://www.nps.gov/articles/000/color-pallets-saving-buildings-from-demolition.htm' },
        { title: 'Art Deco Historic District', publisher: 'Miami Design Preservation League', url: 'https://mdpl.org/about-us/art-deco-historic-district/' },
      ]),
      researchedReadingFocus('miami', 'rising-water', 'Miami - Living With Rising Water', 'Explore how porous rock, high tides, drainage, and sea-level rise affect a coastal city.', 'Advanced', 'Explain why flood protection in Miami requires more than a seawall.', ['reading', 'climate', 'environment'], IMAGES.miami, `Miami faces coastal flooding from several directions. High tides can push water into low streets, heavy rain can overwhelm drainage, storms can drive water inland, and sea-level rise increases the starting height of every flood. The region's porous limestone adds another difficulty because water can move through the ground instead of remaining only on the ocean side of a barrier.

Responses include higher roads, pumps, improved drains, restored natural areas, stronger building rules, and plans for neighborhoods with repeated flooding. Each measure solves only part of the problem. Pumps need power and maintenance. Raised streets can redirect water. Protective structures can affect public access and coastal ecosystems.

Flood risk is also a housing and fairness issue. Property owners, renters, workers, and neighborhoods do not have equal resources to prepare, repair, insure, or move. Miami's challenge is not only how to keep water out, but how to decide where protection is possible and who receives it.`, [
        { title: 'Sea Level Rise Strategy', publisher: 'Miami-Dade County', url: 'https://www.miamidade.gov/global/environment/resilience/sea-level-rise-strategy.page' },
        { title: 'Sea Level Rise and Flooding', publisher: 'Miami-Dade County', url: 'https://www.miamidade.gov/global/environment/resilience/sea-level-rise-flooding.page' },
      ]),
      researchedReadingFocus('miami', 'languages-of-arrival', 'Miami - Languages of Arrival', 'Examine how migration and bilingual life shape business, media, identity, and public services.', 'Intermediate', 'Describe how a multilingual city changes when new communities become established.', ['reading', 'language', 'identity'], IMAGES.miami, `Miami's identity has been shaped by migration from the Caribbean, Latin America, the United States, and many other regions. Spanish and English are both widely heard, while Haitian Creole and additional languages are important in particular communities. Language is visible in homes, businesses, radio, music, schools, government offices, and neighborhood signs.

Bilingual life is not simply a matter of translating every sentence. Speakers may choose a language according to family, work, audience, subject, or emotion. Businesses benefit from communicating with different customers, and public agencies need to make services understandable. At the same time, language ability can affect access to jobs and institutions.

Migration changes the city while communities also change after arrival. Food, music, political ideas, celebrations, and family networks develop new local forms. Miami demonstrates how a city can become strongly connected to several regions without having only one cultural center.`, [
        { title: 'QuickFacts: Miami city, Florida', publisher: 'United States Census Bureau', url: 'https://www.census.gov/quickfacts/fact/table/miamicityflorida/PST045225' },
        { title: 'History of Miami', publisher: 'HistoryMiami Museum', url: 'https://historymiami.org/' },
      ]),
    ],
  },
  {
    id: 'bogota',
    city: 'Bogota',
    country: 'Colombia',
    region: 'South America',
    lat: 4.711,
    lng: -74.0721,
    primaryAirport: 'BOG',
    airports: ['BOG'],
    scene: { terrain: 'mountain', vegetation: 'broadleaf', skyline: 'dense', landmarkSilhouette: 'monserrate', palette: 'dawn' },
    heroImage: IMAGES.bogota,
    focusOptions: [
      videoFocus('my-city-video', 'Bogota - Seeing the City With a Local', 'Follow a resident through weather, history, food, music, and changing public life.', 'Intermediate', 'Describe a city using specific local details instead of broad stereotypes.', ['listening', 'city identity', 'description'], 'Gm2LhZrd0yo', 'BBC News', 248, `This BBC My City segment presents Bogota through a resident's perspective. Students can notice how weather, history, neighborhoods, food, and music combine into a city identity that is more complex than one headline.`, '2026-06-11'),
      videoFocus('gold-museum-video', 'Bogota - Inside the Museum of Gold', 'Use ancient objects to explore craftsmanship, belief, archaeology, and preservation.', 'Easy', 'Explain why a museum object can carry both material and cultural value.', ['listening', 'museums', 'history'], '7Z_L8LV5K3g', 'CGTN America', 154, `This CGTN America report visits Bogota's Museum of Gold and its large collection of pre-Columbian objects. Students can practice describing artifacts while asking why gold held meanings beyond wealth and how museums preserve that evidence.`, '2026-06-11'),
      videoFocus('graffiti-projects-video', 'Bogota - When the City Supports Graffiti', 'Examine how street art moved from conflict toward tourism and public support.', 'Advanced', 'Explain how policy can change the meaning and place of street art.', ['listening', 'street art', 'public policy'], '7LOrrnjlER0', 'AFP News Agency', 124, `This AFP report examines publicly supported graffiti projects in Bogota. Students can discuss the line between vandalism and art, how policy changed opportunities for artists, and why murals became part of the city's public image.`, '2026-06-11'),
      researchedReadingFocus('bogota', 'ciclovia-open-streets', 'Bogota - When Streets Become the Ciclovia', 'Explore how regular street closures create space for movement, health, and public life.', 'Easy', 'Explain how changing a street schedule can change who uses the city.', ['reading', 'public space', 'transport'], IMAGES.bogota, `On Sundays and holidays, Bogota's Ciclovia opens a large network of streets to people walking, cycling, skating, and exercising while most motor traffic is kept out. The program is not a one-time festival. Its regular schedule makes a different kind of street use part of ordinary city life.

Removing cars changes sound, speed, safety, and the kinds of activity that can happen. Families can travel together, vendors can serve participants, and people from different neighborhoods can share long public routes. Organizing the event still requires road closures, signs, staff, medical support, and connections around streets that remain open to vehicles.

The Ciclovia demonstrates that a street is not permanently defined by its busiest weekday use. With planning and public trust, the same paved space can support transport at one time and recreation, health, and social contact at another.`, [
        { title: 'Ciclovia Bogota', publisher: 'Bogota District Institute of Recreation and Sport', url: 'https://www.idrd.gov.co/ciclovia' },
        { title: 'Ciclovia de Bogota: 50 Years of Sustainable Mobility and Recreation', publisher: 'Bogota District Institute of Recreation and Sport', url: 'https://www.idrd.gov.co/ciclovia/historia' },
      ]),
      researchedReadingFocus('bogota', 'transmilenio-network', 'Bogota - Building Rapid Transit With Buses', 'Use TransMilenio to examine capacity, dedicated lanes, access, and pressure on a growing network.', 'Intermediate', 'Explain how a bus system can operate more like rapid transit.', ['reading', 'transport', 'urban planning'], IMAGES.bogota, `TransMilenio is Bogota's bus rapid transit system. Large buses travel on dedicated lanes and serve stations where passengers pay before boarding. These features allow buses to avoid some traffic delays and load many people more quickly than ordinary street stops.

The system changed how bus rapid transit was discussed internationally because it showed that a city could create high-capacity corridors without building a subway first. Yet success brought pressure. Crowding, connections from outer neighborhoods, station access, reliability, and the quality of the full journey remain important concerns.

A rapid corridor is only one part of a transport network. Passengers must still reach a station, transfer, understand routes, travel safely, and arrive near their final destination. TransMilenio shows both the potential of dedicated bus infrastructure and the difficulty of keeping a heavily used system comfortable and trusted as a city grows.`, [
        { title: 'TransMilenio', publisher: 'TransMilenio', url: 'https://www.transmilenio.gov.co/' },
        { title: 'History', publisher: 'TransMilenio', url: 'https://www.transmilenio.gov.co/publicaciones/146851/history' },
      ]),
      researchedReadingFocus('bogota', 'paramo-water', 'Bogota - The High-Altitude Ecosystems Behind the Tap', 'Connect paramo ecosystems above the city with water supply, conservation, and urban demand.', 'Advanced', 'Explain why protecting distant ecosystems can be essential city infrastructure.', ['reading', 'water', 'environment'], IMAGES.bogota, `Much of Bogota's water is connected to high-altitude Andean ecosystems called paramos. These cool, wet landscapes contain specialized plants and soils that capture, store, and gradually release water. Although they may appear distant from city streets, their condition affects the reliability and quality of water reaching millions of residents.

Paramos are sensitive environments. Farming, roads, mining, fire, and climate change can alter vegetation and soil. Protection can support water security and biodiversity, but conservation rules also affect rural communities that live and work near these landscapes. Effective policy must consider both ecological limits and people's livelihoods.

The water system makes a hidden relationship visible. Turning on a tap in Bogota depends on rainfall, mountain ecosystems, reservoirs, pipes, treatment, maintenance, and public decisions. Protecting a watershed can therefore be as important to a city as maintaining a road, station, or power line.`, [
        { title: 'Chingaza National Natural Park', publisher: 'National Natural Parks of Colombia', url: 'https://old.parquesnacionales.gov.co/portal/wp-content/uploads/2015/06/Descripcion-PNN-Chingaza.pdf' },
        { title: 'Colombia: Turning the Tide on Water Security', publisher: 'World Bank', url: 'https://documents1.worldbank.org/curated/en/893581625214879262/pdf/Colombia-Turning-the-Tide-Water-Security-for-Recovery-and-Sustainable-Growth-Policy-Brief.pdf' },
      ]),
    ],
  },
  {
    id: 'reykjavik',
    city: 'Reykjavik',
    country: 'Iceland',
    region: 'North Atlantic',
    lat: 64.1466,
    lng: -21.9426,
    primaryAirport: 'KEF',
    airports: ['KEF', 'RKV'],
    scene: { terrain: 'coastal', vegetation: 'none', skyline: 'low', landmarkSilhouette: 'hallgrimskirkja', palette: 'winter' },
    heroImage: IMAGES.reykjavik,
    focusOptions: [
      videoFocus('city-landmarks-video', 'Reykjavik - Landmarks in a Small Capital', 'Explore architecture, public space, culture, and nature in a compact northern city.', 'Intermediate', 'Describe how landmarks and daily spaces express the identity of a city.', ['listening', 'architecture', 'city identity'], 'WgLwKPRG7gE', 'DW News', 309, `This DW city profile moves through Reykjavik's landmarks, arts, and public spaces. Students can listen for how a small capital presents itself through architecture while remaining closely connected to the surrounding landscape.`, '2026-06-11'),
      videoFocus('iceland-history-video', 'Reykjavik - A Super-Quick History of Iceland', 'Build a timeline from settlement and parliament to modern Iceland.', 'Intermediate', 'Summarize major events that shaped Iceland and its capital.', ['listening', 'history', 'summary'], 'mjP_AUqz2gY', 'Mr History', 246, `This animated history gives students a concise timeline of Icelandic settlement, government, outside rule, independence, and modern development. It provides national context for understanding Reykjavik's role as the capital.`, '2026-06-11'),
      videoFocus('culture-night-video', 'Reykjavik - The City Opens for Culture Night', 'See how small events, public spaces, and hospitality create a citywide festival.', 'Easy', 'Explain how a festival can invite residents to share culture and space.', ['listening', 'festival', 'public life'], 'pjX_H6IxMKk', 'Reykjavik Festivals', 82, `This short introduction to Reykjavik Culture Night shows how residents and organizations create events throughout the city. Students can discuss hospitality, public participation, and why many small contributions can matter more than one central performance.`, '2026-06-11'),
      researchedReadingFocus('reykjavik', 'geothermal-city', 'Reykjavik - A City Heated From Below', 'Explore how geothermal heat connects geology, homes, pools, and public infrastructure.', 'Easy', 'Explain how local geology can shape an energy system and daily routines.', ['reading', 'energy', 'environment'], IMAGES.reykjavik, `Reykjavik uses geothermal energy for much of its space heating and hot water. Wells reach underground reservoirs where heat from Iceland's active geology warms water. That hot water can then travel through a district system to serve many buildings rather than requiring each building to create all of its own heat.

The system affects daily life in visible and invisible ways. Homes can remain warm through long winters, hot water is widely available, and public swimming pools are important community spaces. Pipes, pumping stations, wells, monitoring, and maintenance support these familiar routines.

Geothermal energy is renewable on a human timescale when reservoirs are managed carefully, but it is not impact-free. Drilling, land use, mineral deposits, gases, and the rate of extraction require attention. Reykjavik shows how an energy system can grow from local natural conditions while still depending on engineering and long-term management.`, [
        { title: 'Geothermal', publisher: 'Government of Iceland', url: 'https://government.is/topics/business-and-industry/energy/geothermal/' },
        { title: 'Energy', publisher: 'Government of Iceland', url: 'https://government.is/topics/business-and-industry/energy/' },
      ]),
      researchedReadingFocus('reykjavik', 'ocean-and-fishing', 'Reykjavik - An Ocean Economy at the Edge of the Atlantic', 'Connect fishing, science, ports, processing, and sustainable limits.', 'Intermediate', 'Explain why an ocean resource requires both economic use and careful measurement.', ['reading', 'economy', 'environment'], IMAGES.reykjavik, `The North Atlantic has shaped Reykjavik and Iceland through fishing, ports, trade, food, and scientific research. Fish caught at sea become part of a much larger system that includes vessels, crews, safety, processing, transport, technology, markets, and rules about how much can be taken.

Fish populations change according to reproduction, ocean temperature, food webs, and fishing pressure. Scientists collect data and estimate the condition of stocks, while government decisions translate that evidence into quotas and management plans. Those choices affect both ecosystems and communities whose work depends on the sea.

Modern fishing can use advanced navigation, sensors, processing, and information systems, but technology does not remove natural limits. Reykjavik's ocean economy demonstrates why using a renewable resource responsibly requires measurement, restraint, enforcement, and the ability to change plans when conditions change.`, [
        { title: 'Marine and Freshwater Research Institute', publisher: 'Government of Iceland', url: 'https://www.hafogvatn.is/en' },
        { title: 'Fisheries in Iceland', publisher: 'Government of Iceland', url: 'https://government.is/topics/business-and-industry/fisheries-in-iceland/' },
      ]),
      researchedReadingFocus('reykjavik', 'language-and-names', 'Reykjavik - Language, Names, and a Small Speech Community', 'Examine how Icelandic remains active while residents participate in a global media world.', 'Advanced', 'Analyze how institutions and daily choices support a language over time.', ['reading', 'language', 'identity'], IMAGES.reykjavik, `Icelandic is spoken by a relatively small population, yet it remains the main language of public life in Iceland. It is used in schools, government, publishing, broadcasting, literature, and daily conversation. This strength does not happen automatically. It is supported by institutions, education, cultural pride, and the continued creation of words for new ideas and technologies.

Personal names also reflect distinctive language traditions. Many Icelanders use patronymic or matronymic forms connected to a parent's given name rather than a family surname shared across generations. Alphabetical systems and everyday forms must account for those patterns.

Global media, tourism, migration, and digital tools increase contact with English and other languages. That contact can expand opportunity while also creating pressure on a small language community. Reykjavik shows that keeping a language active requires more than preserving old texts; it requires making the language useful for new work, relationships, and forms of expression.`, [
        { title: 'Education and Culture', publisher: 'Government of Iceland', url: 'https://government.is/ministries/diplomatic-missions/washington-d-c-united-states-of-america/education-and-culture/' },
        { title: 'Personal Names Act', publisher: 'Government of Iceland', url: 'https://government.is/publications/legislation/act/2018-01-08-Personal-Names-Act-No.-45-of-17th-May-1996' },
      ]),
    ],
  },
  {
    id: 'nairobi',
    city: 'Nairobi',
    country: 'Kenya',
    region: 'East Africa',
    lat: -1.2921,
    lng: 36.8219,
    primaryAirport: 'NBO',
    airports: ['NBO', 'WIL'],
    scene: { terrain: 'flatland', vegetation: 'broadleaf', skyline: 'highrise', landmarkSilhouette: 'kicc', palette: 'golden' },
    heroImage: IMAGES.nairobi,
    focusOptions: [
      videoFocus('capital-history-video', 'Nairobi - The Accidental Metropolis', 'Trace how a railway camp became Kenya’s capital and a major regional city.', 'Intermediate', 'Explain why infrastructure and political decisions can cause a city to grow.', ['listening', 'history', 'cause and effect'], 'tS0lbLKLUhc', 'Kenya Explained', 240, `This Kenya Explained video traces Nairobi from a railway camp to a large capital. Students can identify the roles of geography, colonial planning, administration, migration, and infrastructure in rapid urban growth.`, '2026-06-11'),
      videoFocus('railway-city-video', 'Nairobi - Planning a New Railway City', 'Examine a major redevelopment proposal around Nairobi Central Station.', 'Advanced', 'Evaluate how a transport-centered project could reshape a city district.', ['listening', 'transport', 'urban planning'], '0O_MCUGS5og', 'Kenya Railways Corporation', 357, `This Kenya Railways presentation introduces the Nairobi Railway City plan. Students can identify goals involving transport, business, housing, and public space while considering who benefits from a large redevelopment project.`, '2026-06-11'),
      videoFocus('un-hub-video', 'Nairobi - An Expanding United Nations Hub', 'Explore why Nairobi is one of the world’s major United Nations duty stations.', 'Intermediate', 'Explain how international institutions can affect a host city.', ['listening', 'global institutions', 'city economy'], '4jlTOEQKpl8', 'NTV Kenya', 122, `This NTV Kenya report examines the expansion of the United Nations hub in Nairobi. Students can discuss employment, diplomacy, infrastructure, and why hosting international institutions changes a city's global role.`, '2026-06-11'),
      researchedReadingFocus('nairobi', 'national-park-edge', 'Nairobi - A National Park Beside a Capital City', 'Explore the difficult boundary between wildlife habitat and urban growth.', 'Easy', 'Explain how conservation changes when a protected area borders a growing city.', ['reading', 'nature', 'urban planning'], IMAGES.nairobi, `Nairobi National Park lies beside Kenya's capital. From parts of the park, wildlife can be seen with the city skyline in the distance. The protected area provides habitat for many species, but animals and ecological processes do not stop neatly at the park boundary.

Urban growth, roads, fences, nearby land use, and changing migration routes can affect how wildlife moves and survives. At the same time, the park provides conservation value, education, tourism, open land, and a powerful part of Nairobi's identity. Decisions near its edge can therefore create benefits and costs for residents, landowners, wildlife, and the wider region.

The park makes a common planning problem unusually visible. Cities need homes, transport, services, and economic opportunity, while ecosystems need connected space and long-term protection. Nairobi shows that conservation beside a metropolis depends on what happens both inside and outside the official boundary.`, [
        { title: 'Nairobi National Park', publisher: 'Kenya Wildlife Service', url: 'https://kws.go.ke/park/nairobi-national-park/' },
        { title: 'Cities Are at the Forefront of Climate Change Action', publisher: 'UN Environment Programme', url: 'https://www.unep.org/news-and-stories/opinion/cities-are-forefront-climate-change-action-world-must-follow' },
      ]),
      researchedReadingFocus('nairobi', 'matatu-visual-language', 'Nairobi - Matatus as Transport and Visual Culture', 'Look at how privately operated vehicles combine mobility, music, art, and competition.', 'Easy', 'Explain how a transport service can also become a cultural form.', ['reading', 'transport', 'culture'], IMAGES.nairobi, `Matatus are privately operated minibuses and buses that form an important part of transport in Nairobi and across Kenya. They connect routes and neighborhoods with a flexible service that many passengers depend on. Operators compete for customers, and vehicles can be recognized through names, painted graphics, music, lighting, and interior design.

This visual and musical identity turns transport into a public cultural form. A vehicle can communicate style, humor, local references, or global influences while still performing the practical work of moving passengers. Competition can encourage creativity, but the system also raises concerns about safety, fares, working conditions, regulation, and predictable service.

Matatus reveal the limits of describing transport only through maps and schedules. The passenger experience also includes trust, sound, identity, communication, and the relationship between formal rules and everyday practice.`, [
        { title: 'Using Public Transport to Create Awareness', publisher: 'UN-Habitat', url: 'https://unhabitat.org/using-public-transport-to-create-awareness-on-covid-19-%E2%80%93-a-kenyan-invention' },
        { title: 'Matatu Graffiti as an Avenue for Self-Expression', publisher: 'East African Journal of Arts and Social Sciences', url: 'https://journals.eanso.org/index.php/eajass/article/view/208' },
      ]),
      researchedReadingFocus('nairobi', 'silicon-savannah', 'Nairobi - Building the Silicon Savannah', 'Examine how mobile money, startups, infrastructure, and public needs shape innovation.', 'Advanced', 'Analyze why a technology hub depends on institutions and everyday problems, not only new apps.', ['reading', 'technology', 'economy'], IMAGES.nairobi, `Nairobi is often described as a center of East African technology and innovation. Mobile money, software companies, startup spaces, universities, investors, and international organizations have helped create the idea of a "Silicon Savannah." The label suggests global ambition, but many successful innovations are closely connected to local needs.

Mobile services can help people transfer money, pay businesses, receive wages, access information, or manage services where older systems are inconvenient or unavailable. Turning an idea into a reliable product still requires electricity, connectivity, skilled workers, customer trust, regulation, investment, and organizations able to grow.

Technology can widen access, but it can also create new gaps involving devices, data costs, digital skills, privacy, and market power. Nairobi's innovation economy is therefore not only a story of invention. It is a story about which problems receive attention, whose needs shape design, and who can benefit from the resulting systems.`, [
        { title: 'Kenya Digital Economy Blueprint', publisher: 'Government of Kenya', url: 'https://ict.go.ke/node/433' },
        { title: "What Kenya's Mobile Money Success Could Mean for the Arab World", publisher: 'World Bank', url: 'https://www.worldbank.org/en/news/feature/2018/10/03/what-kenya-s-mobile-money-success-could-mean-for-the-arab-world' },
      ]),
    ],
  },
  {
    id: 'lima',
    city: 'Lima',
    country: 'Peru',
    region: 'South America',
    lat: -12.0464,
    lng: -77.0428,
    primaryAirport: 'LIM',
    airports: ['LIM'],
    scene: { terrain: 'coastal', vegetation: 'none', skyline: 'dense', landmarkSilhouette: 'plaza-mayor', palette: 'dawn' },
    heroImage: IMAGES.lima,
    focusOptions: [
      videoFocus('city-history-video', 'Lima - A Short History of the Capital', 'Build a timeline through Indigenous history, colonial rule, independence, and modern growth.', 'Intermediate', 'Summarize how several historical periods shaped modern Lima.', ['listening', 'history', 'summary'], 'yZnYY0OaBLM', 'How? Why? Top!', 279, `This compact history follows Lima through several major periods and landmarks. Students can practice timeline language while recognizing that the city's story began before its colonial founding and continued through independence and urban growth.`, '2026-06-11'),
      videoFocus('ancient-ruins-video', 'Lima - Protecting Ancient Ruins With Local Communities', 'Use Pachacamac to examine archaeology, nearby communities, and shared stewardship.', 'Easy', 'Explain why protecting an ancient site depends on people living around it.', ['listening', 'archaeology', 'community'], 'uFrkcHlwXOg', 'National Geographic', 281, `This National Geographic short visits Pachacamac south of Lima and shows how archaeologists work with nearby communities. Students can discuss why ancient sites remain part of present-day life and how local stewardship supports preservation.`, '2026-06-11'),
      videoFocus('transport-strike-video', 'Lima - When a Transport Strike Stops the City', 'Use a current event to examine commuting, safety, organized crime, and public pressure.', 'Advanced', 'Explain how transport workers can make a citywide problem visible.', ['listening', 'transport', 'current events'], 'Xu-2l9L8pQU', 'Al Jazeera English', 108, `This Al Jazeera English report follows a public transport strike in Lima over threats and organized crime. Students can identify how worker safety, commuting, business, and government responsibility become connected during a citywide disruption.`, '2026-06-11'),
      researchedReadingFocus('lima', 'desert-water-and-fog', 'Lima - Water in a Coastal Desert', 'Explore how a huge city manages scarce rain, river water, groundwater, and seasonal fog.', 'Advanced', 'Explain why water security depends on geography far beyond the city center.', ['reading', 'water', 'environment'], IMAGES.lima, `Lima is a major coastal city located in a desert climate. Rainfall in the city is very limited, so water supply depends heavily on rivers flowing from the Andes, reservoirs, groundwater, treatment systems, and a large network of pipes. Population growth and unequal access place additional pressure on that system.

Seasonal coastal fog, known as garua, brings moisture even when measurable rain remains scarce. On hills called lomas, fog can support distinctive plant life. Some projects have also used mesh fog collectors to capture droplets, though this method cannot replace the large water system needed by millions of residents.

The contrast between visible fog and limited water supply shows why climate must be understood carefully. Water security involves where moisture falls, how it moves, how much can be stored, and who can reach reliable service. Lima depends on connections between coast, mountains, infrastructure, and public management.`, [
        { title: 'Preparing for Future Droughts in Lima, Peru', publisher: 'World Bank', url: 'https://openknowledge.worldbank.org/entities/publication/397c92b5-8967-5ce5-9b5f-e717daa6f125' },
        { title: 'The Importance of the Lomas of Lima', publisher: 'Municipality of Lima', url: 'https://smia.munlima.gob.pe/novedades/la-importancia-de-nuestras-lomas-de-lima' },
      ]),
      researchedReadingFocus('lima', 'historic-center-earthquakes', 'Lima - Preserving a Historic Center in Earthquake Country', 'Connect colonial architecture, public memory, building safety, and continual repair.', 'Intermediate', 'Explain why protecting historic buildings also requires adapting them to risk.', ['reading', 'heritage', 'earthquake'], IMAGES.lima, `The Historic Centre of Lima contains churches, convents, houses, balconies, streets, and public spaces connected to the city's colonial and republican history. Its architecture reflects political and religious power, local materials, craftsmanship, and the long development of a capital city.

Lima is also exposed to major earthquakes. Historic buildings may be especially vulnerable because of age, materials, earlier damage, changes in use, or repairs that were not designed for future shaking. Preservation therefore involves more than protecting appearance. Engineers, craftspeople, owners, public agencies, and communities must consider safety, structure, use, and cultural value together.

A historic center remains meaningful when it continues to function as part of city life rather than becoming only a display. Lima's challenge is to maintain that living role while reducing risk and deciding which places receive limited restoration resources first.`, [
        { title: 'Historic Centre of Lima', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/500' },
        { title: 'Disaster Risk and the Historic City Centre', publisher: 'United Nations Office for Disaster Risk Reduction', url: 'https://www.undrr.org/media/76540/download' },
      ]),
      researchedReadingFocus('lima', 'food-and-migration', 'Lima - A Food Culture Made Through Migration', 'Examine how Indigenous, African, European, Chinese, and Japanese histories meet in everyday dishes.', 'Easy', 'Explain how food can preserve memory while creating new local traditions.', ['reading', 'food culture', 'identity'], IMAGES.lima, `Lima's food culture developed through the meeting of many environments and communities. Ingredients from the Pacific coast, Andes, and Amazon reach the city, while Indigenous traditions and the histories of Spanish colonization, African communities, Chinese migration, Japanese migration, and later movement within Peru have all influenced how food is prepared and understood.

These influences are not simply separate layers placed beside one another. Cooks adapted techniques and ingredients to local markets, family needs, available equipment, and changing tastes. New dishes and styles became part of the city while still carrying evidence of the relationships that produced them.

International attention has made Lima an important culinary destination, creating jobs and pride. It can also focus attention on famous restaurants while overlooking markets, home cooking, farming, fishing, and lower-paid labor. The city's food story is strongest when it includes the whole network behind the plate.`, [
        { title: 'Background of Peruvian Gastronomy and Its Perspectives', publisher: 'Journal of Ethnic Foods', url: 'https://link.springer.com/article/10.1186/s42779-023-00212-4' },
        { title: 'A Taste of Lima', publisher: 'Harvard ReVista', url: 'https://revista.drclas.harvard.edu/a-taste-of-lima-revista/' },
      ]),
    ],
  },
  {
    id: 'perth',
    city: 'Perth',
    country: 'Australia',
    region: 'Oceania',
    lat: -31.9523,
    lng: 115.8613,
    primaryAirport: 'PER',
    airports: ['PER'],
    scene: { terrain: 'coastal', vegetation: 'broadleaf', skyline: 'highrise', landmarkSilhouette: 'kings-park-skyline', palette: 'golden' },
    heroImage: IMAGES.perth,
    focusOptions: [
      videoFocus('quokkas-video', 'Perth - Quokkas on Rottnest Island', 'Explore how an island habitat supports a famous animal near Perth.', 'Easy', 'Describe how habitat, predators, and human activity affect an animal population.', ['listening', 'wildlife', 'environment'], 'HHlKvVOjWwM', 'Australian Geographic', 168, `This Australian Geographic short introduces quokkas and the island habitat where they remain abundant. Students can describe animal adaptations while connecting habitat protection, introduced predators, tourism, and conservation.`, '2026-06-11'),
      videoFocus('transperth-video', 'Perth - Connecting a Fast-Growing City', 'Use Transperth to examine buses, trains, ferries, growth, and transport integration.', 'Intermediate', 'Explain why a growing city needs connected public transport modes.', ['listening', 'transport', 'systems thinking'], 'wubw5e-s3RI', 'UITP International Association of Public Transport', 100, `This UITP profile introduces Transperth and the challenge of serving a rapidly growing, spread-out city. Students can identify how buses, trains, ferries, information, and planning work together as one network.`, '2026-06-11'),
      videoFocus('fremantle-video', 'Perth - The People and Character of Fremantle', 'Explore how local businesses, heritage, creativity, and community shape a port district.', 'Intermediate', 'Describe what gives a neighborhood or nearby city a distinctive character.', ['listening', 'community', 'city identity'], 'dv7AkzY9PJs', 'Destination Perth', 254, `This Destination Perth feature presents Fremantle through the people who work and create there. Students can listen for how heritage buildings, local businesses, arts, and community relationships contribute to a strong sense of place.`, '2026-06-11'),
      researchedReadingFocus('perth', 'boorloo-and-derbarl-yerrigan', 'Perth - Boorloo and the Derbarl Yerrigan', 'Read the city through Whadjuk Noongar names, continuing culture, and the river landscape.', 'Advanced', 'Explain how Indigenous names and knowledge change the way a city is understood.', ['reading', 'indigenous knowledge', 'history'], IMAGES.perth, `Perth stands on Whadjuk Noongar Country. Boorloo is a Noongar name for Perth, and Derbarl Yerrigan is a Noongar name connected to the Swan River. These names make visible a much older and continuing relationship with the land and water than the modern city's English map suggests.

The river is not only a scenic line through the city. It carries ecological, cultural, historical, and social meaning. The Swan Canning Riverpark includes waterways, wetlands, public land, wildlife habitat, recreation areas, and sites of significance to Whadjuk people. Managing it requires attention to water quality, development, public access, and cultural responsibility.

Using Indigenous names can be an act of recognition, but names alone are not a complete response. Meaningful recognition also involves listening to Traditional Custodians, respecting living culture, and considering authority in decisions about place. Boorloo and Derbarl Yerrigan reveal Perth as a city within an older cultural landscape.`, [
        { title: 'Elders Advisory Group', publisher: 'City of Perth', url: 'https://perth.wa.gov.au/community/community-services-and-facilities/elders-advisory-group' },
        { title: 'Swan Canning Riverpark', publisher: 'Western Australia Department of Biodiversity, Conservation and Attractions', url: 'https://www.dbca.wa.gov.au/management/swan-canning-riverpark' },
      ]),
      researchedReadingFocus('perth', 'climate-resilient-water', 'Perth - Building a Climate-Resilient Water Supply', 'Examine how declining rainfall led the city toward desalination, groundwater, and recycling.', 'Intermediate', 'Explain why a city may need several different sources of drinking water.', ['reading', 'water', 'environment'], IMAGES.perth, `Perth has had to change where its drinking water comes from. A drying climate has reduced the amount of rainfall flowing into traditional surface-water dams. The city now depends on a mix that includes groundwater, seawater desalination, groundwater replenishment, and the water that still reaches dams.

Desalination plants remove salt from seawater and provide a supply that does not depend directly on rainfall. The process also requires large infrastructure, energy, careful treatment, and management of concentrated salty water. Groundwater and recycled water create different opportunities and limits.

Using several sources can make a water system more resilient because one poor season or problem does not affect every supply in the same way. It also makes the system more complex. Perth's water choices show how climate change can turn an invisible utility into a major long-term planning question involving cost, energy, public trust, and environmental care.`, [
        { title: "Perth's Water Supply", publisher: 'Water Corporation', url: 'https://www.watercorporation.com.au/our-water/perths-water-supply' },
        { title: 'How Water Desalination Works', publisher: 'Water Corporation', url: 'https://www.watercorporation.com.au/our-water/desalination' },
      ]),
      researchedReadingFocus('perth', 'kings-park-biodiversity', 'Perth - Kings Park as Urban Bushland and Science', 'Explore how a large city park combines recreation, cultural heritage, native plants, and conservation research.', 'Easy', 'Explain why an urban park can protect biodiversity as well as provide public space.', ['reading', 'nature', 'public space'], IMAGES.perth, `Kings Park rises beside central Perth and overlooks the river and city. It includes gardens, paths, gathering places, cultural heritage, and a large area of urban bushland. The Western Australian Botanic Garden displays thousands of plant species from across the state, many adapted to conditions found nowhere else.

The park is not only a collection of attractive plants. Scientists and horticulturists work on seed conservation, species recovery, restoration, and the management of urban bushland. Research conducted in the park can support conservation work in other landscapes.

Public use and ecological protection must operate together. Paths, events, fire management, invasive species control, visitor behavior, and changing climate all affect the park. Kings Park shows how a city can keep a major natural and cultural landscape close to its center while using it for research, education, recreation, and long-term care.`, [
        { title: 'Kings Park and Botanic Garden', publisher: 'Botanic Gardens and Parks Authority', url: 'https://www.bgpa.wa.gov.au/kings-park' },
        { title: 'Kings Park Science', publisher: 'Botanic Gardens and Parks Authority', url: 'https://www.bgpa.wa.gov.au/kings-park-science' },
      ]),
    ],
  },
  {
    id: 'auckland',
    city: 'Auckland',
    country: 'New Zealand',
    region: 'Oceania',
    lat: -36.8509,
    lng: 174.7645,
    primaryAirport: 'AKL',
    airports: ['AKL'],
    scene: { terrain: 'coastal', vegetation: 'broadleaf', skyline: 'highrise', landmarkSilhouette: 'harbour', palette: 'dawn' },
    heroImage: IMAGES.auckland,
    focusOptions: [
      videoFocus('volcanic-field-video', 'Auckland - A City Built Across a Volcanic Field', 'Use Auckland volcanoes to connect geology, landscape, and city growth.', 'Easy', 'Explain how volcanic landforms remain visible inside a modern city.', ['listening', 'geography', 'environment'], 'gFZuLUyEvts', 'Learnz Trips', 182, `This Learnz Trips short explains the Tamaki Makaurau Auckland volcanic field. It gives students a clear geological foundation for understanding why cones, craters, lava flows, and harbours shape the city's map and remain important places today.`, '2026-06-12'),
      videoFocus('electric-bus-video', 'Auckland - Building an Electric Bus Depot', 'Examine the infrastructure needed to move a bus fleet away from fossil fuels.', 'Intermediate', 'Explain why electric transport requires changes beyond replacing vehicles.', ['listening', 'transport', 'systems thinking'], 'jWMID1ikv7M', "Kinetic - Australasia's leading bus operator", 130, `This short visit to an Auckland electric bus depot shows the charging, planning, and operating systems behind lower-emission public transport. It supports discussion about how cities change large fleets while keeping daily service reliable.`, '2026-06-12'),
      videoFocus('new-zealand-history-video', 'Auckland - New Zealand History in Four Minutes', 'Build a rapid timeline from Maori settlement through colonization and modern nationhood.', 'Intermediate', 'Summarize major changes while recognizing what a short history leaves out.', ['listening', 'history', 'media literacy'], 'm6pVgnWaGsk', 'Mr History', 247, `This compact national history gives Auckland a wider context. Its fast pace makes it useful for identifying major periods, questioning simplification, and deciding which voices or events need further investigation.`, '2026-06-12'),
      researchedReadingFocus('auckland', 'tupuna-maunga', 'Auckland - The Ancestral Mountains Inside the City', 'Read Auckland volcanoes as living cultural landscapes rather than empty parkland.', 'Advanced', 'Explain how co-governance changes the meaning and management of public land.', ['reading', 'indigenous knowledge', 'governance'], IMAGES.auckland, `Across Tamaki Makaurau Auckland, volcanic cones rise above houses, roads, sports fields, and business districts. Geologists read these maunga as evidence of many eruptions that built the region over thousands of years. For mana whenua, the Maori tribes with ancestral authority in the area, the same places are also tupuna maunga: ancestral mountains connected to whakapapa, history, identity, settlement, cultivation, ceremony, and conflict. Their value cannot be reduced to geology or a scenic view.

Several maunga still show terraces and other traces of pa, the fortified settlements that once supported large communities. Rich volcanic soils helped people grow food, while high ground provided visibility and protection. Later development changed many cones through quarrying, roads, water reservoirs, grazing, and introduced trees. Treating the maunga only as ordinary city parks can hide both the damage and the depth of their continuing cultural meaning.

Today, the Tupuna Maunga Authority provides a co-governance model involving mana whenua and Auckland Council. Its work includes protecting archaeological features, restoring native ecology, improving visitor access, and explaining why activities that seem harmless may affect a sacred and fragile place. Decisions about paths, vehicles, vegetation, events, and maintenance must balance public use with the responsibility to care for taonga tuku iho, treasures passed down through generations.

The maunga reveal that one landscape can carry several kinds of knowledge at once. A crater can be a geological formation, an ecological habitat, an archaeological site, a neighborhood landmark, and an ancestor. Co-governance does not make every disagreement disappear, but it changes who has authority to define the problem and what counts as successful care. Auckland's skyline therefore tells a story not only of volcanoes inside a city, but also of a city learning to recognize the older relationships beneath its streets.`, [
        { title: 'The Ancestral Mountains of Auckland', publisher: 'Tupuna Maunga Authority', url: 'https://maunga.nz/the-ancestral-mountains-of-auckland' },
        { title: 'Tupuna Maunga Integrated Management Plan Strategies', publisher: 'Tupuna Maunga Authority', url: 'https://www.maunga.nz/assets/Uploads/Tupuna-Maunga-Integrated-Management-Plan-Strategies.pdf' },
      ]),
      researchedReadingFocus('auckland', 'pacific-city', 'Auckland - A Pacific City Made by Many Communities', 'Explore how migration, language, festivals, and family networks shape Auckland.', 'Easy', 'Explain why Pacific identity in Auckland is diverse rather than a single culture.', ['reading', 'migration', 'identity'], IMAGES.auckland, `Auckland is often described as one of the world's largest Pacific cities. That description refers not only to its location near the Pacific Ocean, but also to the many people whose families connect the city with Samoa, Tonga, the Cook Islands, Niue, Fiji, Tuvalu, Tokelau, Kiribati, and other island communities. The 2023 New Zealand Census showed that a large majority of the country's Pacific peoples live in the Auckland region. Many Pacific Aucklanders are young, and many identify with more than one ethnicity.

Migration to Auckland has happened for different reasons and at different times. People have moved for education, work, family, health care, political relationships, and the opportunities of a larger city. Those moves create networks that stretch across neighborhoods, islands, and generations. Money, food, news, music, church life, language, and family responsibilities can travel through those networks in both directions. Auckland is not simply a final destination; it is one part of a connected Pacific world.

The city's Pacific identity becomes visible in everyday places and major events. Community organizations, churches, schools, markets, sports clubs, artists, businesses, and media all create spaces where culture is practiced and changed. The Pasifika Festival uses separate cultural villages to represent distinct communities rather than presenting the Pacific as one uniform tradition. That choice matters because languages, histories, arts, and customs differ across the region even when communities share experiences.

Living in a diverse city can strengthen culture, but it can also create pressures. Families may work to keep heritage languages active across generations while using English in school and business. Rising housing costs and unequal access to opportunity can affect where communities live and gather. Auckland's Pacific character is therefore not only a colorful festival image. It is an ongoing story about migration, belonging, youth, language, work, and the ways a city changes when its residents maintain strong relationships across an ocean.`, [
        { title: 'Pacific Peoples in Auckland', publisher: 'Stats NZ', url: 'https://www.stats.govt.nz/infographics/pacific-people-in-auckland/' },
        { title: 'Pasifika Festival', publisher: 'AucklandNZ', url: 'https://www.aucklandnz.com/pasifika' },
      ]),
      researchedReadingFocus('auckland', 'working-waterfront', 'Auckland - Who Is the Waterfront For?', 'Examine the working port, public spaces, trade, and changing access to the harbour.', 'Advanced', 'Analyze competing uses of valuable land along a city waterfront.', ['reading', 'urban planning', 'trade'], IMAGES.auckland, `Auckland grew around the Waitemata and Manukau harbours. Long before modern container shipping, Tamaki Makaurau was a gathering place connected by waka, trade, food resources, and routes across the narrow land between two coasts. The modern Port of Auckland continued that relationship between water and exchange. Ships, cranes, storage areas, rail links, roads, and workers connect the city with goods arriving from and leaving for the rest of the world.

A working port needs secure land and efficient movement. Containers cannot be handled in the same way as visitors at a park, and freight routes must connect with the wider transport system. Yet central waterfront land is also extremely valuable for housing, businesses, recreation, tourism, and public access. When the public sees fences and industrial areas beside the harbour, a practical logistics system can look like a barrier between the city and the water.

Recent waterfront projects have changed parts of downtown Auckland. Quay Street was redesigned with wider footpaths, cycleways, public transport, stronger seawall infrastructure, and spaces that bring people closer to the harbour. Wynyard Quarter has also changed from primarily industrial land into a mixed area of public spaces, homes, offices, hospitality, and continuing marine activity. These projects show how a waterfront can be redesigned, but they do not remove the difficult question of where port work should happen.

Every option creates consequences. Moving port operations could open central land for other uses, but it would require major investment and could shift environmental and transport pressures elsewhere. Keeping the port in place protects established infrastructure but limits other waterfront possibilities. Auckland's harbour edge makes a basic planning conflict visible: land can be globally important for trade, locally important for public life, culturally significant, environmentally sensitive, and financially valuable at the same time.`, [
        { title: 'Our History', publisher: 'Port of Auckland', url: 'https://www.poal.co.nz/about-us/our-history' },
        { title: 'City Centre Transformation Gathers Pace', publisher: 'Auckland Council', url: 'https://ourauckland.aucklandcouncil.govt.nz/news/2024/03/city-centre-transformation-gathers-pace/' },
      ]),
    ],
  },
  {
    id: 'suva',
    city: 'Suva',
    country: 'Fiji',
    region: 'Pacific',
    lat: -18.1416,
    lng: 178.4419,
    primaryAirport: 'SUV',
    airports: ['SUV'],
    scene: { terrain: 'island', vegetation: 'palms', skyline: 'low', landmarkSilhouette: 'lagoon-bridge', palette: 'tropical' },
    heroImage: IMAGES.suva,
    focusOptions: [
      videoFocus('city-geography-video', 'Suva - Reading a Pacific Capital', 'Use a guided city georamble to connect landscape, buildings, and public life.', 'Intermediate', 'Describe how geography and human activity shape Suva.', ['listening', 'geography', 'observation'], 'VJRPnH948Hw', 'Dr Warwick Murray', 338, `This city georamble moves through Suva while explaining what the landscape and streets reveal. It supports close observation of a Pacific capital instead of treating Fiji only as a beach destination.`, '2026-06-12'),
      videoFocus('city-history-video', 'Suva - A Flashback to the 1960s', 'Compare archival Suva with the modern city and identify evidence of change.', 'Easy', 'Use visual evidence to explain what has changed and what has remained.', ['listening', 'history', 'comparison'], 'Id94uNdaMjg', 'ABC International Development', 265, `This archival feature presents Suva in the 1960s. It gives students a concrete basis for comparing transport, clothing, streets, buildings, and public life across time.`, '2026-06-12'),
      videoFocus('rugby-climate-video', 'Fiji - Rugby Culture Under Climate Pressure', 'Connect a national sport with communities facing climate change.', 'Intermediate', 'Explain how environmental change can affect culture as well as infrastructure.', ['listening', 'sports', 'climate'], 'q5U-3IMATas', 'Reuters', 190, `This Reuters report examines how climate change threatens communities where rugby is part of everyday life. It helps connect Suva with national conversations about relocation, identity, sport, and resilience.`, '2026-06-12'),
      researchedReadingFocus('suva', 'regional-capital', 'Suva - A Meeting Place for the Pacific', 'Explore how universities, diplomacy, and regional organizations connect island countries.', 'Advanced', 'Explain how a relatively small capital can have a large regional role.', ['reading', 'institutions', 'geography'], IMAGES.suva, `Suva is Fiji's capital, but many of its institutions work across a region much larger than Fiji itself. The Pacific Ocean covers an enormous area, and island countries face shared questions involving climate change, fisheries, migration, education, trade, health, and political cooperation. Suva has become one of the places where representatives, researchers, students, and organizations meet to work on those questions.

The University of the South Pacific is an important example. Established in Suva in 1968, it is a regional university owned by member countries and connected to campuses across the Pacific. Its students and staff bring different national experiences into one institution. A discussion about law, marine science, climate, language, or development can therefore include perspectives from communities separated by thousands of kilometers of ocean.

Suva also hosts diplomatic missions, international agencies, media, and regional organizations. Their presence creates jobs and brings conferences and public debates to the city. More importantly, it gives Pacific leaders and specialists a place to build relationships and negotiate shared positions. Cooperation is difficult because island countries differ in size, resources, languages, histories, and priorities. A regional capital cannot erase those differences, but it can provide repeated opportunities to work through them.

Suva's role challenges the idea that global importance depends only on population or skyscrapers. A city can matter because it concentrates networks, knowledge, and decision-making. Its meeting rooms may influence ocean policy, disaster response, education, or climate diplomacy far beyond its streets. At the same time, regional institutions must remain accountable to communities across the Pacific rather than becoming distant offices. Suva is most powerful as a regional capital when connections made there continue outward to many islands.`, [
        { title: 'Our Story', publisher: 'The University of the South Pacific', url: 'https://www.usp.ac.fj/why-usp/our-story/' },
        { title: 'Pacific Islands Forum Secretariat', publisher: 'Pacific Islands Forum', url: 'https://forumsec.org/' },
      ]),
      researchedReadingFocus('suva', 'municipal-market', 'Suva - The Market That Connects Farms and City Tables', 'Follow food, work, and knowledge through Suva Municipal Market.', 'Easy', 'Explain how a city market depends on networks beyond the city.', ['reading', 'food systems', 'economy'], IMAGES.suva, `Suva Municipal Market is a busy point of connection between the capital and producers across Fiji. Vendors sell root crops, fruits, vegetables, seafood, spices, prepared food, and other goods used in everyday meals. What appears on a market table has already traveled through a chain involving farms, fishing areas, families, transport, weather, storage, prices, and early-morning work.

Many market vendors are women, and their earnings can support households, education, and local economies. Selling successfully requires much more than placing goods on a table. Vendors judge quality, predict demand, manage small amounts of money, negotiate with suppliers and customers, and respond when storms or transport problems interrupt supply. Their detailed knowledge helps the city understand what is available and how conditions are changing.

The market is also public infrastructure. Clean water, toilets, lighting, safe storage, waste collection, secure spaces, and fair rules affect whether people can work safely and customers can buy with confidence. UN Women's Markets for Change program began at Suva Municipal Market and has worked across Pacific marketplaces to improve safety, inclusion, and economic opportunity. This approach treats vendors as participants in decisions rather than simply users of a building.

A market makes the city's dependence on rural and coastal areas visible. Suva residents may live far from the farms or fishing grounds behind their food, but daily supply links those places closely. Climate events, fuel prices, road conditions, and changing seasons can quickly affect what reaches the city and how much it costs. Suva Municipal Market is therefore both a place of commerce and a practical information system, showing how food, labor, and environmental conditions move through Fiji.`, [
        { title: 'Markets for Change to Seek Safety and Better Earnings for Women in the Pacific', publisher: 'UN Women', url: 'https://www.unwomen.org/en/news/stories/2014/5/press-release-markets-for-change-to-seek-safety-and-better-earnings-for-women-in-the-pacific' },
        { title: 'Markets for Change Fiji', publisher: 'UN Women Asia and the Pacific', url: 'https://asiapacific.unwomen.org/sites/default/files/Field%20Office%20ESEAsia/Docs/Publications/2014/8/m4c_narrative_aug25.pdf' },
      ]),
      researchedReadingFocus('suva', 'museum-and-memory', 'Suva - What the Fiji Museum Chooses to Preserve', 'Examine how objects connect archaeology, living culture, colonial history, and public memory.', 'Advanced', 'Analyze the responsibilities involved in caring for cultural collections.', ['reading', 'museum studies', 'history'], IMAGES.suva, `The Fiji Museum stands in Suva's Thurston Gardens and cares for a collection that reaches across thousands of years. Archaeological material provides evidence of early settlement and long histories of movement, adaptation, and exchange. Cultural objects also represent Indigenous iTaukei life and the communities that arrived in Fiji during later periods. Together, the collection shows that Fiji's history cannot be explained by one moment or one group.

A museum object is never only an object. A canoe, tool, textile, photograph, weapon, document, or ceremonial item may carry knowledge about materials, skills, relationships, belief, authority, or daily work. Museums protect such items from damage and make them available for research and learning. Yet removing an object from its original setting can also separate it from the people, language, and practices that give it meaning.

Colonial history makes museum responsibility more complex. Collections may have been formed during periods when power was unequal and communities did not control how their culture was described or displayed. Modern museums must investigate where objects came from, listen to communities, improve labels, support access, and consider when items or knowledge should return. Preservation is not neutral when institutions decide whose explanations visitors will read.

The Fiji Museum can therefore be understood as a place where the past is cared for and continually interpreted in the present. Its work includes archaeology and conservation, but also relationships with living communities whose culture is not finished or frozen. A strong museum does more than keep old things safe. It makes evidence available, admits uncertainty, explains difficult histories, and allows people connected to the collection to help decide how their stories are told.`, [
        { title: 'About the Fiji Museum', publisher: 'Fiji Museum', url: 'https://fijimuseum.org.fj/about/' },
        { title: 'Suva and Surrounds', publisher: 'Tourism Fiji', url: 'https://www.fiji.travel/places-to-go/suva-and-surrounds' },
      ]),
    ],
  },
  {
    id: 'ulaanbaatar',
    city: 'Ulaanbaatar',
    country: 'Mongolia',
    region: 'Central Asia',
    lat: 47.8864,
    lng: 106.9057,
    primaryAirport: 'UBN',
    airports: ['UBN'],
    scene: { terrain: 'mountain', vegetation: 'none', skyline: 'dense', landmarkSilhouette: 'mountains', palette: 'winter' },
    heroImage: IMAGES.ulaanbaatar,
    focusOptions: [
      videoFocus('changing-capital-video', 'Ulaanbaatar - A Capital Transformed in 100 Years', 'Trace how a monastery center became a rapidly changing modern capital.', 'Easy', 'Summarize major changes in Ulaanbaatar across one century.', ['listening', 'history', 'urban change'], 'ZRJhrsiq8IY', 'BBC Travel Show', 232, `This BBC Travel Show short examines Ulaanbaatar's transformation over a century. It provides a visual timeline for discussing political change, migration, architecture, and the pressures of rapid urban growth.`, '2026-06-12'),
      videoFocus('ger-area-transport-video', 'Ulaanbaatar - Designing Transport Around Ger Areas', 'Examine how transport planning can begin with residents and daily journeys.', 'Advanced', 'Explain why human-centered planning changes infrastructure decisions.', ['listening', 'transport', 'urban planning'], 'ttxLvPZZAeQ', 'Asian Development Bank', 268, `This Asian Development Bank video looks at human-centered transport planning in Ulaanbaatar's ger areas. It supports discussion of access, road safety, public participation, and the difference between moving vehicles and serving people.`, '2026-06-12'),
      videoFocus('sustainable-gers-video', 'Ulaanbaatar - Making Gers Warmer and Cleaner', 'Connect home design with winter air pollution and energy use.', 'Intermediate', 'Explain how changes to housing can improve both health and comfort.', ['listening', 'housing', 'environment'], 'JtlITtQmSgs', 'CNA', 144, `This CNA report presents efforts to make gers more energy efficient. It connects insulation, heating, household costs, and air quality in one practical response to Ulaanbaatar's severe winter conditions.`, '2026-06-12'),
      researchedReadingFocus('ulaanbaatar', 'winter-city-systems', 'Ulaanbaatar - Keeping a Capital Working Through Extreme Winter', 'Explore how heat, housing, energy, and public services become matters of survival.', 'Advanced', 'Explain why reliable winter systems require both engineering and fair access.', ['reading', 'climate', 'infrastructure'], IMAGES.ulaanbaatar, `Winter in Ulaanbaatar can bring temperatures below minus 30 degrees Celsius. At that level of cold, heating is not simply a matter of comfort. It affects whether homes, schools, hospitals, businesses, water systems, and transport can continue to function safely. The city must produce and distribute enormous amounts of heat while residents protect buildings, vehicles, pipes, and bodies from long periods of freezing weather.

Much of the central city is served by district heating. Combined heat and power plants produce electricity and hot water, which travels through networks of pipes to many buildings. A shared system can heat dense areas efficiently, but it depends on aging plants, pumps, transmission lines, maintenance, and enough capacity for a growing population. A failure during severe cold can quickly become an emergency.

Many residents live in ger areas around the urban core, where homes may not connect to district heating, piped water, or sewage networks. Families often use individual stoves and fuels to stay warm. These systems provide essential heat, but they can be expensive and contribute to dangerous winter air pollution when many households burn fuel at the same time. Improving insulation, cleaner heating, and local infrastructure can reduce emissions while making homes safer and less costly to heat.

Ulaanbaatar shows that climate risk is shaped by city design and inequality. The same outdoor temperature creates different experiences depending on housing quality, income, service connections, and access to transport or health care. Building a winter-resilient city therefore involves more than stronger machinery. It requires long-term investment, affordable choices, reliable institutions, and attention to people who face the greatest risk when a system fails.`, [
        { title: 'Paving the Way to Sustainable Heating in Mongolia', publisher: 'World Bank', url: 'https://blogs.worldbank.org/en/eastasiapacific/paving-way-sustainable-heating-mongolia' },
        { title: 'Ulaanbaatar Urban Services and Ger Areas Development Investment Program', publisher: 'Asian Development Bank', url: 'https://www.adb.org/projects/45007-004/main' },
      ]),
      researchedReadingFocus('ulaanbaatar', 'naadam-capital', 'Ulaanbaatar - Naadam in a Modern Capital', 'Examine how a national festival connects sport, heritage, identity, and city logistics.', 'Easy', 'Explain how a living tradition can remain meaningful while changing over time.', ['reading', 'sports', 'culture'], IMAGES.ulaanbaatar, `Naadam is Mongolia's best-known traditional festival. Its central competitions are wrestling, horse racing, and archery, often called the "three games of men," although participation and roles have changed over time. The festival also includes music, clothing, food, ceremony, family gatherings, and local celebrations. UNESCO recognizes Naadam as intangible cultural heritage because its meaning lives through skills, practices, knowledge, and participation rather than through one building or object.

In Ulaanbaatar, the national Naadam celebration brings large crowds, athletes, officials, visitors, and media into the capital. Wrestling and archery events take place in organized venues, while major horse races occur outside the dense city because they cover long distances across open land. Transport, safety, schedules, animal welfare, public space, and broadcasting all become part of presenting a traditional festival in a modern metropolitan region.

Naadam connects present-day Mongolia with histories of pastoral life, horsemanship, physical skill, community reputation, and national identity. At the same time, it is not unchanged. Rules, equipment, participation, commercial sponsorship, tourism, and public expectations continue to develop. Debates about fairness, safety, gender, and the treatment of young riders show that protecting a tradition can include questioning how it is practiced.

The festival demonstrates why living heritage cannot be preserved by freezing it in the past. It remains important because people continue to train, compete, gather, celebrate, and argue about what it should become. Ulaanbaatar gives Naadam a national stage, while local festivals across Mongolia keep it connected to many communities. The relationship between those settings helps the tradition remain both shared and diverse.`, [
        { title: 'Naadam, Mongolian Traditional Festival', publisher: 'UNESCO Intangible Cultural Heritage', url: 'https://ich.unesco.org/en/RL/naadam-mongolian-traditional-festival-00395' },
        { title: 'Mongolia Intangible Cultural Heritage', publisher: 'UNESCO Intangible Cultural Heritage', url: 'https://ich.unesco.org/en/state/mongolia-MN' },
      ]),
      researchedReadingFocus('ulaanbaatar', 'vertical-script', 'Ulaanbaatar - A Language Written in Different Directions', 'Explore Mongolian Cyrillic, the classical vertical script, and the work of keeping knowledge active.', 'Advanced', 'Analyze how writing systems connect language with identity, education, and public life.', ['reading', 'language', 'identity'], IMAGES.ulaanbaatar, `Modern Mongolian in Mongolia is commonly written with a Cyrillic alphabet, while the classical Mongolian script is written vertically. The vertical script forms words through connected strokes and is traditionally read from top to bottom in columns that move across the page. Seeing the two systems together makes writing visible as a cultural choice rather than a transparent tool.

Political history shaped which script people learned and used. Cyrillic became dominant in Mongolia during the twentieth century, affecting schools, publishing, administration, and everyday literacy. The classical script remained important to cultural memory and continued to be used in other Mongolian communities. Since Mongolia's democratic transition in the 1990s, interest in learning, teaching, and displaying the traditional script has grown.

UNESCO has recognized Mongolian calligraphy as intangible cultural heritage in need of safeguarding. Calligraphy involves more than recognizing letters. It depends on skilled mentors, years of practice, knowledge of materials and styles, and opportunities for new writers to use the art meaningfully. Digital fonts and signs can make the script more visible, but visibility alone does not replace people who can read, write, teach, and create with it.

Ulaanbaatar is a key place where these writing systems meet in education, government, art, design, publishing, and public signs. Using more than one script can expand access to history and strengthen identity, but it also requires time, teacher training, materials, and careful policy. The city's written landscape shows that language preservation is active work. A script survives when people can connect it to both inherited knowledge and present-day communication.`, [
        { title: 'Mongolian Calligraphy', publisher: 'UNESCO Multimedia Archives', url: 'https://www.unesco.org/archives/multimedia/document-3513' },
        { title: 'Mongolian Calligraphy and the Empaako Tradition Inscribed', publisher: 'UNESCO', url: 'https://www.unesco.org/en/articles/mongolian-calligraphy-and-empaako-tradition-uganda-inscribed-unescos-list-intangible-cultural' },
      ]),
    ],
  },
  {
    id: 'almaty',
    city: 'Almaty',
    country: 'Kazakhstan',
    region: 'Central Asia',
    lat: 43.222,
    lng: 76.8512,
    primaryAirport: 'ALA',
    airports: ['ALA'],
    scene: { terrain: 'mountain', vegetation: 'broadleaf', skyline: 'highrise', landmarkSilhouette: 'mountains', palette: 'golden' },
    heroImage: IMAGES.almaty,
    focusOptions: [
      videoFocus('garden-city-video', "Almaty - Kazakhstan's Garden City", 'Explore how trees, public spaces, culture, and mountain geography shape Almaty.', 'Easy', 'Describe the relationship between landscape and city identity.', ['listening', 'city identity', 'geography'], 'Rk-AvAekwq0', 'euronews', 294, `This euronews feature introduces Almaty as a green cultural center below the mountains. It offers a broad city portrait that supports observation of public space, landscape, food, and daily life.`, '2026-06-12'),
      videoFocus('apple-corridor-video', "Almaty - An Apple's Journey Across a Regional Corridor", 'Use the apple supply chain to examine trade between Almaty and Bishkek.', 'Intermediate', 'Explain how infrastructure and borders affect an everyday product.', ['listening', 'trade', 'systems thinking'], '-wc7JORo0uw', 'Asian Development Bank', 189, `This Asian Development Bank short follows apples through the Almaty-Bishkek economic corridor. It makes regional trade concrete by connecting growers, roads, borders, markets, and consumers.`, '2026-06-12'),
      videoFocus('metro-video', "Almaty - Inside Central Asia's Newest Metro", 'Examine how a small metro system combines transport, architecture, and civic identity.', 'Intermediate', 'Explain why transit stations can be both infrastructure and public design.', ['listening', 'transport', 'architecture'], 't_wSfWY-OGM', 'This is Farley', 403, `This guided visit explores Almaty's metro, including its stations, trains, and design. It supports comparison between transport efficiency and the cultural messages built into public infrastructure.`, '2026-06-12'),
      researchedReadingFocus('almaty', 'earthquake-ready-city', 'Almaty - Designing a Safer Mountain City', 'Connect seismic risk with buildings, public awareness, and regional cooperation.', 'Advanced', 'Explain why earthquake readiness must be built before a disaster occurs.', ['reading', 'safety', 'governance'], IMAGES.almaty, `Almaty stands near the Tian Shan mountains in a region exposed to significant earthquake risk. The city's history includes damaging earthquakes, and its present-day population, buildings, roads, utilities, schools, hospitals, and businesses create a much larger system that could be affected by future shaking. Earthquake danger cannot be removed, but the scale of a disaster depends greatly on decisions made before the ground moves.

Buildings are one major part of preparedness. Engineers need information about soil, expected shaking, construction materials, design, age, maintenance, and changes made after a building opened. New codes can improve future construction, while older buildings may require inspection or strengthening. Yet technical standards only protect people when they are followed, funded, and understood by owners, builders, and public authorities.

Preparedness also depends on people and institutions. Residents need practical knowledge about safer behavior, emergency supplies, family communication, and evacuation. Schools and workplaces need plans that can function under stress. Emergency services need communication, equipment, clear responsibilities, and routes that remain usable. Because major disasters can cross borders and overwhelm local capacity, Almaty also hosts regional cooperation on emergency response and risk reduction across Central Asia.

Earthquakes reveal why resilience is not a product purchased at the last moment. It is a continuing process of measuring risk, maintaining infrastructure, practicing plans, communicating honestly, and deciding which vulnerabilities receive attention first. Those decisions involve cost and fairness because not every household or organization has equal resources. Almaty's challenge is to make preparedness part of ordinary city management so that a rare event does not become a preventable catastrophe.`, [
        { title: 'Central Asia Earthquake Risk Reduction Forum', publisher: 'World Bank', url: 'https://www.worldbank.org/en/events/2015/09/23/central-asia-earthquake-risk-reduction-forum' },
        { title: 'UNDP and Japan Unite to Boost Earthquake Awareness in Central Asia', publisher: 'UNDP Kazakhstan', url: 'https://www.undp.org/kazakhstan/news/undp-and-japan-unite-boost-earthquake-awareness-central-asia' },
      ]),
      researchedReadingFocus('almaty', 'mountain-water', 'Almaty - The Mountain Water Above the City', 'Explore how glaciers, snow, rivers, climate, and monitoring connect the Tian Shan with urban life.', 'Advanced', 'Explain why distant ice and snow function as essential city infrastructure.', ['reading', 'water', 'climate'], IMAGES.almaty, `The mountains above Almaty are more than a dramatic background. Snow and glaciers store water at high elevations and release it into streams and rivers as conditions change through the year. That water supports ecosystems, communities, agriculture, and cities across Central Asia. The Tian Shan are sometimes described as a regional water tower because so many people and activities depend on water formed in the mountains.

Glaciers respond to temperature and precipitation over long periods. As the climate warms, ice loss can change the timing and amount of runoff. Melting may initially increase water flow, but continued shrinking reduces the stored ice available for future years. Glacier retreat can also contribute to hazards such as unstable lakes and sudden floods. These changes make careful measurement important even when the ice is far from most residents' daily view.

UNESCO and regional scientists have expanded monitoring of the Bogdanovich Glacier above Almaty. Researchers use observations and shared data to understand how the glacier is changing and what those changes may mean for water security and risk. Monitoring does not solve the problem by itself, but it gives planners and communities stronger evidence for decisions about water use, early warning, conservation, and adaptation.

Almaty's relationship with the mountains combines dependence and responsibility. Residents use the mountain landscape for recreation and identify it strongly with the city, while urban growth and water demand add pressure to a wider system. Protecting water security requires thinking across seasons, elevations, and borders. The most important part of the city's water infrastructure may not look like a pipe or reservoir; it may look like snow and ice high above the skyline.`, [
        { title: "UNESCO Strengthens Monitoring of Bogdanovich Glacier to Safeguard Central Asia's Water Future", publisher: 'UNESCO', url: 'https://www.unesco.org/en/articles/unesco-strengthens-monitoring-bogdanovich-glacier-safeguard-central-asias-water-future' },
        { title: 'Northern Tyan-Shan (Ile-Alatau State National Park)', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/tentativelists/1681/' },
      ]),
      researchedReadingFocus('almaty', 'former-capital-culture', 'Almaty - What Remains After a Capital Moves', 'Examine how institutions and identity continue after national government relocates.', 'Easy', 'Explain why political capital status is only one source of a citys importance.', ['reading', 'culture', 'history'], IMAGES.almaty, `Almaty served as Kazakhstan's capital until 1997, when the national capital moved to Astana. Losing capital status changed the location of major government functions, but it did not make Almaty unimportant. The city remains Kazakhstan's largest metropolis and a major center for finance, education, science, media, culture, business, and international connections.

Institutions help explain that continuity. Almaty contains museums, libraries, theaters, universities, research organizations, cultural venues, companies, and professional networks built over many decades. These institutions cannot be moved as easily as an official title. Their staff, collections, audiences, buildings, relationships, and traditions keep producing new activity and attract people who want to study, create, invest, or work.

The city's history also has many layers older than its period as a modern capital. Archaeological evidence connects the area with earlier peoples and routes, while the Russian imperial fortification of Verny and the Soviet period left further marks on streets, buildings, language, and institutions. Contemporary Almaty combines Kazakh culture with the experiences of a multilingual and diverse urban population. A city identity grows from these accumulated layers rather than from one government decision.

Almaty shows the difference between political power and urban influence. A capital concentrates national administration, but another city may remain central to culture, knowledge, finance, or public imagination. The move to Astana created a new relationship between the two cities instead of a simple replacement. Understanding Almaty after the capital moved makes it possible to see cities as networks of institutions and people whose importance can continue even when official geography changes.`, [
        { title: 'Almaty City', publisher: 'Government of Kazakhstan', url: 'https://www.gov.kz/memleket/entities/qazalem/activities/27965?lang=en' },
        { title: 'Information About the City', publisher: 'Invest in Almaty', url: 'https://almaty.invest.gov.kz/about/' },
      ]),
    ],
  },
  {
    id: 'madrid',
    city: 'Madrid',
    country: 'Spain',
    region: 'Europe',
    lat: 40.4168,
    lng: -3.7038,
    primaryAirport: 'MAD',
    airports: ['MAD'],
    scene: { terrain: 'flatland', vegetation: 'broadleaf', skyline: 'historic', landmarkSilhouette: 'palace-gate', palette: 'golden' },
    heroImage: IMAGES.madrid,
    focusOptions: [
      videoFocus('city-exploration-video', 'Madrid - Exploring the Capital', 'Visit major places through an upbeat introduction designed for younger viewers.', 'Easy', 'Describe Madrid using landmarks, food, and everyday observations.', ['listening', 'city introduction', 'younger learners'], 'ACfR0_VFhW0', "Clayton's Exploration Station", 252, `This lively introduction gives younger learners a welcoming first look at Madrid. It uses clear narration and concrete city details to build useful language for places, food, and cultural observation.`, '2026-06-12'),
      videoFocus('flamenco-video', 'Madrid - Learning Flamenco', 'Follow students as they experience the discipline and expression of flamenco.', 'Intermediate', 'Explain how movement, rhythm, and practice communicate culture.', ['listening', 'dance', 'culture'], 'qKeYkH0swUI', 'Museum Secrets by Kensington Communications', 125, `This short vlog follows students learning flamenco in Madrid. It supports discussion of rhythm, posture, emotion, practice, and the difference between watching a cultural form and trying to understand its technique.`, '2026-06-12'),
      videoFocus('prado-collections-video', 'Madrid - How the Prado Builds a Collection', 'Hear the Prado director explain how a major museum collection developed.', 'Advanced', 'Analyze how museums select, organize, and explain cultural heritage.', ['listening', 'art', 'museum studies'], 'NrO_dbmrDak', 'Museo Nacional del Prado', 215, `The Prado director introduces the museum through the development of its collections. The video supports deeper questions about royal collecting, public museums, artistic value, and how institutions frame national and European art history.`, '2026-06-12'),
      researchedReadingFocus('madrid', 'plaza-mayor-public-life', 'Madrid - Plaza Mayor as a Public Room', 'Trace how a royal square became a shared setting for commerce, tourism, and daily life.', 'Intermediate', 'Explain how the purpose of a public square changes over time.', ['reading', 'public space', 'history'], IMAGES.madrid, MILESTONE_50_READINGS.madrid.plazaMayor, [
        { title: 'Plaza Mayor Madrid', publisher: 'Madrid Tourism', url: 'https://www.esmadrid.com/en/tourist-information/plaza-mayor-madrid' },
        { title: 'Madrid', publisher: 'Britannica', url: 'https://www.britannica.com/place/Madrid' },
      ]),
      researchedReadingFocus('madrid', 'retiro-public-park', 'Madrid - Retiro Park as Urban Infrastructure', 'Look beyond scenery to examine ecology, culture, access, and maintenance.', 'Intermediate', 'Explain why a major park functions as essential city infrastructure.', ['reading', 'nature', 'public space'], IMAGES.madrid, MILESTONE_50_READINGS.madrid.retiroPark, [
        { title: 'Paseo del Prado and Buen Retiro', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/1618' },
        { title: 'El Retiro Park', publisher: 'Madrid Tourism', url: 'https://www.esmadrid.com/en/tourist-information/parque-del-retiro' },
      ]),
      researchedReadingFocus('madrid', 'tapas-social-life', 'Madrid - Tapas and the Social Life of Food', 'Follow small plates through markets, kitchens, bars, and shared routines.', 'Easy', 'Describe how food practices create social relationships and city identity.', ['reading', 'food culture', 'daily life'], IMAGES.madrid, MILESTONE_50_READINGS.madrid.tapasLife, [
        { title: 'Eating in Madrid', publisher: 'Madrid Tourism', url: 'https://www.esmadrid.com/en/eating-madrid' },
        { title: 'Spanish Cuisine', publisher: 'Spain.info', url: 'https://www.spain.info/en/gastronomy/' },
      ]),
    ],
  },
  {
    id: 'lisbon',
    city: 'Lisbon',
    country: 'Portugal',
    region: 'Europe',
    lat: 38.7223,
    lng: -9.1393,
    primaryAirport: 'LIS',
    airports: ['LIS'],
    scene: { terrain: 'coastal', vegetation: 'broadleaf', skyline: 'historic', landmarkSilhouette: 'harbour', palette: 'dawn' },
    heroImage: IMAGES.lisbon,
    focusOptions: [
      videoFocus('city-guide-video', 'Lisbon - A Short City Welcome', 'See Lisbon through hills, viewpoints, streets, food, and the river.', 'Easy', 'Describe a city using clear visual and location language.', ['listening', 'city introduction', 'younger learners'], 'flOjX4jq68E', 'The Travel Vlogger', 148, `This compact city guide gives younger learners an accessible visual introduction to Lisbon. It provides concrete details about streets, hills, landmarks, food, and the waterfront without overwhelming them with a long itinerary.`, '2026-06-12'),
      videoFocus('azulejos-video', 'Lisbon - Reading Stories in Ceramic Tiles', 'Explore how Portuguese azulejos combine decoration, history, and public art.', 'Intermediate', "Explain how a material can become part of a city's visual language.", ['listening', 'art', 'architecture'], 'WrhP4yEKBeU', 'AkiMahaviraJina', 143, `This short explanation introduces Portuguese ceramic tiles and the way they appear across public and private buildings. It supports close observation of pattern, color, storytelling, protection, and cultural identity.`, '2026-06-12'),
      videoFocus('fado-video', 'Lisbon - Understanding Fado', 'Use traditional music to examine longing, performance, and cultural identity.', 'Advanced', 'Analyze how a music tradition communicates place and emotion.', ['listening', 'music', 'interpretation'], 'sFjeMZomano', 'Viking', 154, `This introduction to fado explains a music tradition strongly associated with Lisbon. It supports nuanced discussion of voice, poetry, emotion, performance settings, and what happens when a local tradition becomes internationally recognized.`, '2026-06-12'),
      researchedReadingFocus('lisbon', 'earthquake-rebuilding', 'Lisbon - The Earthquake That Changed the City', 'Connect the 1755 disaster with reconstruction, risk planning, and new ideas.', 'Advanced', 'Explain how a disaster can reshape both a city and public knowledge.', ['reading', 'earthquake', 'history'], IMAGES.lisbon, MILESTONE_50_READINGS.lisbon.earthquake, [
        { title: 'Lisbon Earthquake of 1755', publisher: 'Britannica', url: 'https://www.britannica.com/event/Lisbon-earthquake-of-1755' },
        { title: 'Lisbon', publisher: 'Lisbon City Council', url: 'https://www.lisboa.pt/en' },
      ]),
      researchedReadingFocus('lisbon', 'tagus-and-empire', 'Lisbon - Reading the Tagus and the History of Empire', 'Examine maritime achievement alongside conquest, slavery, and unequal exchange.', 'Advanced', 'Analyze how a waterfront can carry several conflicting historical meanings.', ['reading', 'history', 'critical thinking'], IMAGES.lisbon, MILESTONE_50_READINGS.lisbon.riverAndEmpire, [
        { title: 'Monastery of the Hieronymites and Tower of Belem', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/263' },
        { title: 'Lisbon', publisher: 'Britannica', url: 'https://www.britannica.com/place/Lisbon' },
      ]),
      researchedReadingFocus('lisbon', 'hills-and-neighborhoods', 'Lisbon - Living on the Hills', 'Explore how slopes shape access, architecture, housing, and neighborhood identity.', 'Easy', 'Explain how physical geography affects everyday city life.', ['reading', 'geography', 'housing'], IMAGES.lisbon, MILESTONE_50_READINGS.lisbon.hillsAndNeighborhoods, [
        { title: 'Lisbon', publisher: 'Visit Portugal', url: 'https://www.visitportugal.com/en/destinos/lisboa-regiao' },
        { title: 'Lisbon', publisher: 'Britannica', url: 'https://www.britannica.com/place/Lisbon' },
      ]),
    ],
  },
  {
    id: 'dublin',
    city: 'Dublin',
    country: 'Ireland',
    region: 'Europe',
    lat: 53.3498,
    lng: -6.2603,
    primaryAirport: 'DUB',
    airports: ['DUB'],
    scene: { terrain: 'coastal', vegetation: 'broadleaf', skyline: 'historic', landmarkSilhouette: 'harbour', palette: 'golden' },
    heroImage: IMAGES.dublin,
    focusOptions: [
      videoFocus('irish-dance-video', 'Dublin - Learning Irish Dance', 'Learn basic Irish dance movements through a child-friendly cultural lesson.', 'Easy', 'Describe rhythm and movement while recognizing the practice behind performance.', ['listening', 'dance', 'younger learners'], 'dJtV7mAazt0', "Children's Museum of Discovery", 278, `This child-friendly lesson introduces Irish dance through clear demonstrations and cultural context. It gives younger learners an active way to notice rhythm, posture, steps, and the concentration involved in performance.`, '2026-06-12'),
      videoFocus('book-of-kells-video', 'Dublin - Inside the Book of Kells', 'Examine how writing, illustration, materials, and belief meet in one manuscript.', 'Intermediate', 'Explain why a handmade book can be an important cultural object.', ['listening', 'art', 'history'], 'F7zSvXd3D3s', 'Patristix', 389, `This introduction explains the Book of Kells and its visual detail. It supports discussion of manuscripts, materials, preservation, religious history, and how close observation reveals the work behind a famous object.`, '2026-06-12'),
      videoFocus('oscar-wilde-video', 'Dublin - Oscar Wilde, Image, and Reputation', "Use a Trinity College exhibition to examine a writer's public image and later memory.", 'Advanced', 'Analyze how exhibitions interpret a complex cultural figure.', ['listening', 'literature', 'museum studies'], 'tr-m0wb0OF4', 'Trinity College Dublin', 207, `This exhibition feature considers Oscar Wilde through objects, writing, reputation, and changing public interpretation. It supports a more advanced discussion of how institutions frame literary lives and difficult historical attitudes.`, '2026-06-12'),
      researchedReadingFocus('dublin', 'river-liffey', 'Dublin - The River Liffey Through a Changing City', 'Follow the river from port work to redevelopment and public identity.', 'Easy', 'Explain how a river remains important while its surrounding uses change.', ['reading', 'water', 'urban change'], IMAGES.dublin, MILESTONE_50_READINGS.dublin.riverLiffey, [
        { title: 'Dublin Port Heritage', publisher: 'Dublin Port Company', url: 'https://www.dublinport.ie/heritage/' },
        { title: 'Dublin', publisher: 'Britannica', url: 'https://www.britannica.com/place/Dublin' },
      ]),
      researchedReadingFocus('dublin', 'irish-language-city', 'Dublin - Keeping Irish Active in a Modern City', 'Explore how institutions and everyday choices support a language.', 'Advanced', 'Analyze what makes language revival practical and sustainable.', ['reading', 'language', 'identity'], IMAGES.dublin, MILESTONE_50_READINGS.dublin.irishLanguage, [
        { title: 'Irish Language', publisher: 'Government of Ireland', url: 'https://www.gov.ie/en/policy-information/2ea63-irish-language/' },
        { title: 'About Foras na Gaeilge', publisher: 'Foras na Gaeilge', url: 'https://www.forasnagaeilge.ie/about-foras-na-gaeilge/?lang=en' },
      ]),
      researchedReadingFocus('dublin', 'georgian-city', 'Dublin - Reading the Georgian City', 'Look behind orderly facades to examine power, labor, adaptation, and preservation.', 'Advanced', 'Explain why architectural beauty does not tell a complete social history.', ['reading', 'architecture', 'history'], IMAGES.dublin, MILESTONE_50_READINGS.dublin.georgianCity, [
        { title: 'Dublin City Heritage', publisher: 'Dublin City Council', url: 'https://www.dublincity.ie/residential/planning/heritage-and-conservation' },
        { title: 'Dublin', publisher: 'Buildings of Ireland', url: 'https://www.buildingsofireland.ie/' },
      ]),
    ],
  },
  {
    id: 'mecca',
    city: 'Mecca',
    country: 'Saudi Arabia',
    region: 'Middle East',
    lat: 21.3891,
    lng: 39.8579,
    primaryAirport: 'JED',
    airports: ['JED'],
    scene: { terrain: 'mountain', vegetation: 'none', skyline: 'highrise', landmarkSilhouette: 'mosque', palette: 'night' },
    heroImage: IMAGES.mecca,
    focusOptions: [
      videoFocus('zamzam-story-video', 'Mecca - The Story of Zamzam', 'Hear a child-friendly telling of a story connected with sacred water in Mecca.', 'Easy', 'Retell a cultural story respectfully using sequence and place language.', ['listening', 'storytelling', 'younger learners'], 'MlqbMKZlM2U', 'One4kids', 380, `This animated story introduces younger learners to the religious meaning associated with Zamzam water. It supports respectful listening, story sequence, and recognition that water can carry spiritual as well as practical importance.`, '2026-06-12'),
      videoFocus('hajj-for-kids-video', 'Mecca - What Is Hajj?', 'Use a clear child-friendly explanation to follow the purpose and major stages of Hajj.', 'Intermediate', 'Summarize the purpose and sequence of a major religious pilgrimage.', ['listening', 'religion', 'cultural understanding'], '6qCjyTEcWfA', 'Twinkl Educational Publishing', 242, `This clear explanation presents Hajj for younger audiences while retaining important vocabulary and sequence. It supports respectful cultural understanding and discussion of why millions of people make the journey to Mecca.`, '2026-06-12'),
      videoFocus('historical-hajj-video', 'Mecca - Reading Archival Hajj Footage', 'Examine early film of pilgrimage and ask what visual evidence can and cannot show.', 'Advanced', 'Analyze archival footage as evidence of continuity and change.', ['listening', 'history', 'media literacy'], 'vPHW1yKiwhY', 'Recollections of the Past', 168, `This archival footage provides a rare visual record of Hajj in 1928. It supports careful comparison of clothing, movement, buildings, technology, and crowd scale while recognizing the limits of a short historical film.`, '2026-06-12'),
      researchedReadingFocus('mecca', 'sacred-geography', 'Mecca - How Sacred Geography Organizes a Journey', 'Connect the Kaaba and surrounding sites through meaning, movement, and memory.', 'Advanced', 'Explain how religious meaning changes the way physical space is understood.', ['reading', 'religion', 'geography'], IMAGES.mecca, MILESTONE_50_READINGS.mecca.sacredGeography, [
        { title: 'Mecca', publisher: 'Britannica', url: 'https://www.britannica.com/place/Mecca' },
        { title: 'Hajj', publisher: 'Ministry of Hajj and Umrah', url: 'https://haj.gov.sa/' },
      ]),
      researchedReadingFocus('mecca', 'pilgrimage-city-systems', 'Mecca - Building a City for Pilgrimage', 'Examine the systems and workers supporting a huge temporary population.', 'Advanced', 'Explain why hospitality at very large scale requires coordinated city systems.', ['reading', 'infrastructure', 'public health'], IMAGES.mecca, MILESTONE_50_READINGS.mecca.pilgrimageCity, [
        { title: 'Pilgrim Experience Program', publisher: 'Saudi Vision 2030', url: 'https://www.vision2030.gov.sa/en/explore/programs/pilgrim-experience-program' },
        { title: 'Hajj', publisher: 'World Health Organization', url: 'https://www.who.int/health-topics/hajj' },
      ]),
      researchedReadingFocus('mecca', 'lunar-calendar', 'Mecca - A Pilgrimage That Moves Through the Seasons', 'Use the lunar calendar to connect time, climate, planning, and worship.', 'Easy', 'Explain how a calendar system changes practical city planning.', ['reading', 'time', 'climate'], IMAGES.mecca, MILESTONE_50_READINGS.mecca.lunarCalendar, [
        { title: 'Islamic Calendar', publisher: 'Britannica', url: 'https://www.britannica.com/topic/Islamic-calendar' },
        { title: 'Hajj', publisher: 'Ministry of Hajj and Umrah', url: 'https://haj.gov.sa/' },
      ]),
    ],
  },
  {
    id: 'dakar',
    city: 'Dakar',
    country: 'Senegal',
    region: 'West Africa',
    lat: 14.7167,
    lng: -17.4677,
    primaryAirport: 'DSS',
    airports: ['DSS'],
    scene: { terrain: 'coastal', vegetation: 'palms', skyline: 'dense', landmarkSilhouette: 'harbour', palette: 'tropical' },
    heroImage: IMAGES.dakar,
    focusOptions: [
      videoFocus('ladoum-sheep-video', 'Dakar - Inside a Ladoum Sheep Championship', 'Meet a celebrated Senegalese sheep breed through care, competition, and community pride.', 'Easy', 'Describe animal care and explain why a breed can carry cultural value.', ['listening', 'animals', 'younger learners'], 'l6O4xNYwq9o', 'Farm With Fred', 371, `This engaging feature introduces Ladoum sheep and the people who raise them. It gives younger learners a concrete cultural topic through animals while opening discussion of care, competition, beauty standards, and value.`, '2026-06-12'),
      videoFocus('biennale-video', 'Dakar - Art Across the City', 'See how the Dakar Biennale turns many spaces into places for contemporary art.', 'Intermediate', 'Explain how a citywide art event changes public attention and access.', ['listening', 'art', 'public space'], 'x7NUUpdTnNY', 'AP Archive', 405, `This report follows pop-up exhibitions during the Dakar Biennale. It supports discussion of contemporary African art, public access, temporary venues, and the role of a capital city in connecting artists and audiences.`, '2026-06-12'),
      videoFocus('goree-electricity-video', 'Dakar - Electrifying Goree Island', 'Examine how reliable energy changes life on a historic island near Dakar.', 'Advanced', 'Analyze how infrastructure projects affect heritage, livelihoods, and daily life.', ['listening', 'energy', 'development'], 'WKA4hsMKH6g', 'World Bank Group', 210, `This World Bank feature examines electricity access on Goree Island. It supports a systems-level discussion of energy, heritage, local businesses, public services, and how infrastructure changes daily possibilities.`, '2026-06-12'),
      researchedReadingFocus('dakar', 'fishing-city', 'Dakar - A City Connected to the Atlantic Catch', 'Follow fish through ocean knowledge, markets, livelihoods, and ecological limits.', 'Intermediate', 'Explain how environmental change moves through a city food system.', ['reading', 'food systems', 'environment'], IMAGES.dakar, MILESTONE_50_READINGS.dakar.fishingCity, [
        { title: 'Senegal Fisheries', publisher: 'Food and Agriculture Organization', url: 'https://www.fao.org/fishery/en/facp/sen' },
        { title: 'Senegal Country Overview', publisher: 'World Bank', url: 'https://www.worldbank.org/en/country/senegal/overview' },
      ]),
      researchedReadingFocus('dakar', 'wolof-language', 'Dakar - Moving Between Wolof, French, and Other Languages', 'Explore how multilingual life shapes media, markets, identity, and access.', 'Intermediate', 'Explain multilingualism as a practical city skill and social relationship.', ['reading', 'language', 'identity'], IMAGES.dakar, MILESTONE_50_READINGS.dakar.wolofLanguage, [
        { title: 'Senegal', publisher: 'Britannica', url: 'https://www.britannica.com/place/Senegal' },
        { title: 'Languages of Senegal', publisher: 'UNESCO Institute for Lifelong Learning', url: 'https://www.uil.unesco.org/en/litbase' },
      ]),
      researchedReadingFocus('dakar', 'teranga-hospitality', 'Dakar - Teranga and the Work of Welcome', 'Look beyond a slogan to examine hospitality, reciprocity, and social responsibility.', 'Easy', 'Explain how a cultural value becomes visible through everyday behavior.', ['reading', 'culture', 'daily life'], IMAGES.dakar, MILESTONE_50_READINGS.dakar.terangaAndHospitality, [
        { title: 'Destination Senegal', publisher: 'Senegal Tourism', url: 'https://www.visitezlesenegal.com/en/' },
        { title: 'Senegal', publisher: 'Britannica', url: 'https://www.britannica.com/place/Senegal' },
      ]),
    ],
  },
  {
    id: 'recife',
    city: 'Recife',
    country: 'Brazil',
    region: 'South America',
    lat: -8.0476,
    lng: -34.877,
    primaryAirport: 'REC',
    airports: ['REC'],
    scene: { terrain: 'coastal', vegetation: 'palms', skyline: 'highrise', landmarkSilhouette: 'lagoon-bridge', palette: 'tropical' },
    heroImage: IMAGES.recife,
    focusOptions: [
      videoFocus('brazil-for-kids-video', 'Recife - Brazil in Under Five Minutes', 'Build a child-friendly foundation for Brazil before focusing on the northeast.', 'Easy', 'Identify major cultural and geographic features before locating Recife within them.', ['listening', 'country introduction', 'younger learners'], 'obzWW5JgFKg', 'Archie and Beans World Adventures', 287, `This concise child-friendly guide introduces Brazil's culture, wildlife, geography, and traditions. It gives younger learners useful national context before examining what makes Recife and Pernambuco distinctive.`, '2026-06-12'),
      videoFocus('frevo-video', 'Recife - Frevo at the Center of Carnival', 'Discover a fast music and dance tradition created in Pernambuco.', 'Intermediate', 'Explain how music, movement, and public celebration reinforce one another.', ['listening', 'music', 'dance'], 'GZsP4_LjOqk', 'TeleSUR English', 161, `This report introduces frevo as a music and dance tradition central to carnival in Pernambuco. It supports discussion of rhythm, athletic movement, umbrellas, public celebration, and living cultural heritage.`, '2026-06-12'),
      videoFocus('silent-drums-video', 'Recife - Olinda and the Night of the Silent Drums', 'Examine a pre-carnival tradition connecting memory, religion, and Afro-Brazilian culture.', 'Advanced', 'Analyze how a public tradition carries historical memory and spiritual meaning.', ['listening', 'history', 'culture'], 'aH8sTy2spQg', 'TeleSUR English', 174, `This feature presents Olinda's Night of the Silent Drums near Recife. It supports a nuanced discussion of Afro-Brazilian memory, religious tradition, public ritual, and how carnival includes solemn reflection as well as celebration.`, '2026-06-12'),
      researchedReadingFocus('recife', 'water-city', 'Recife - A City of Rivers, Bridges, and Mangroves', 'Connect waterfront identity with habitat, flooding, and unequal risk.', 'Easy', 'Explain why waterways function as both environment and infrastructure.', ['reading', 'water', 'environment'], IMAGES.recife, MILESTONE_50_READINGS.recife.waterCity, [
        { title: 'Recife Urban Development and Flood Risk', publisher: 'World Bank', url: 'https://www.worldbank.org/en/country/brazil' },
        { title: 'Atlantic Forest Biosphere Reserve', publisher: 'UNESCO', url: 'https://en.unesco.org/biosphere/lac/mata-atlantica' },
      ]),
      researchedReadingFocus('recife', 'sugar-and-slavery', 'Recife - Sugar, Slavery, and the Port City', 'Read colonial wealth alongside forced labor, resistance, and cultural survival.', 'Advanced', 'Analyze how unequal historical systems remain visible in a modern city.', ['reading', 'history', 'ethics'], IMAGES.recife, MILESTONE_50_READINGS.recife.sugarAndSlavery, [
        { title: 'Historic Centre of the Town of Olinda', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/189' },
        { title: 'Brazil', publisher: 'Britannica', url: 'https://www.britannica.com/place/Brazil' },
      ]),
      researchedReadingFocus('recife', 'creative-city', 'Recife - Creativity From Manguebeat to Film and Technology', 'Explore how local identity and new media support a creative economy.', 'Advanced', 'Explain why creative cities depend on affordable spaces and cultural networks.', ['reading', 'creative economy', 'culture'], IMAGES.recife, MILESTONE_50_READINGS.recife.creativeCity, [
        { title: 'Recife Creative City of Music', publisher: 'UNESCO Creative Cities Network', url: 'https://www.unesco.org/en/creative-cities/recife' },
        { title: 'Frevo, Performing Arts of the Carnival of Recife', publisher: 'UNESCO Intangible Cultural Heritage', url: 'https://ich.unesco.org/en/RL/frevo-performing-arts-of-the-carnival-of-recife-00603' },
      ]),
    ],
  },
  {
    id: 'panama-city',
    city: 'Panama City',
    country: 'Panama',
    region: 'Central America',
    lat: 8.9824,
    lng: -79.5199,
    primaryAirport: 'PTY',
    airports: ['PTY'],
    scene: { terrain: 'coastal', vegetation: 'palms', skyline: 'highrise', landmarkSilhouette: 'harbour', palette: 'tropical' },
    heroImage: IMAGES.panamaCity,
    focusOptions: [
      videoFocus('mola-art-video', 'Panama City - Discovering Mola Art', 'Learn how Guna artists build colorful designs through layered fabric.', 'Easy', 'Describe patterns and explain how an art form carries cultural identity.', ['listening', 'art', 'younger learners'], '3q8xjGJJWOQ', "Children's Museum of Discovery", 229, `This child-friendly museum lesson introduces mola art through color, pattern, layers, and Guna culture. It gives younger learners a concrete creative entry point while emphasizing that the art belongs to a living community.`, '2026-06-12'),
      videoFocus('canal-for-kids-video', 'Panama City - How the Canal Works', 'Use a child-friendly explanation to follow ships through locks between oceans.', 'Intermediate', 'Explain the basic engineering and global purpose of the Panama Canal.', ['listening', 'engineering', 'global trade'], '1ftThRHoGZA', 'KidsMathTV', 269, `This clear educational video explains why the Panama Canal was built and how locks move ships. It supports systems language and provides essential context for understanding Panama City's global role.`, '2026-06-12'),
      videoFocus('amphibian-conservation-video', 'Panama - Protecting Amphibians', 'Use conservation science to examine why frogs are disappearing and how people respond.', 'Advanced', 'Analyze how research and conservation work address biodiversity loss.', ['listening', 'science', 'environment'], '7gj88Jnuo7o', 'McGill University', 178, `This McGill University feature presents amphibian conservation connected to Panama. It supports deeper discussion of disease, biodiversity, scientific evidence, and why protecting small species matters to whole ecosystems.`, '2026-06-12'),
      researchedReadingFocus('panama-city', 'casco-viejo', 'Panama City - Keeping Casco Viejo Alive', 'Examine how restoration can protect buildings while changing a neighborhood.', 'Easy', 'Explain why living heritage requires both preservation and community access.', ['reading', 'heritage', 'housing'], IMAGES.panamaCity, MILESTONE_50_READINGS.panamaCity.cascoViejo, [
        { title: 'Archaeological Site of Panama Viejo and Historic District of Panama', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/790' },
        { title: 'Panama City', publisher: 'Britannica', url: 'https://www.britannica.com/place/Panama-City' },
      ]),
      researchedReadingFocus('panama-city', 'afro-panamanian-culture', 'Panama City - Afro-Panamanian Communities at a Global Crossroads', 'Center the workers and communities often hidden behind canal history.', 'Advanced', "Explain how migration and labor shape a city's cultural identity.", ['reading', 'migration', 'history'], IMAGES.panamaCity, MILESTONE_50_READINGS.panamaCity.afroPanamanianCulture, [
        { title: 'The Panama Canal', publisher: 'Smithsonian Institution', url: 'https://www.si.edu/spotlight/panama-canal' },
        { title: 'Panama', publisher: 'Britannica', url: 'https://www.britannica.com/place/Panama' },
      ]),
      researchedReadingFocus('panama-city', 'canal-and-water', 'Panama City - The Water Behind Global Shipping', 'Connect canal operations with rainfall, forests, cities, and water security.', 'Advanced', 'Analyze the environmental system supporting a major trade route.', ['reading', 'water', 'global trade'], IMAGES.panamaCity, MILESTONE_50_READINGS.panamaCity.canalAndWater, [
        { title: 'Water Management', publisher: 'Panama Canal Authority', url: 'https://pancanal.com/en/water-management/' },
        { title: 'Smithsonian Tropical Research Institute', publisher: 'Smithsonian Institution', url: 'https://stri.si.edu/' },
      ]),
    ],
  },
  {
    id: 'santiago',
    city: 'Santiago',
    country: 'Chile',
    region: 'South America',
    lat: -33.4489,
    lng: -70.6693,
    primaryAirport: 'SCL',
    airports: ['SCL'],
    scene: { terrain: 'mountain', vegetation: 'broadleaf', skyline: 'highrise', landmarkSilhouette: 'mountains', palette: 'winter' },
    heroImage: IMAGES.santiago,
    focusOptions: [
      videoFocus('chile-for-kids-video', 'Santiago - A Child-Friendly Introduction to Chile', 'Build context through Chilean landscapes, traditions, landmarks, and daily life.', 'Easy', 'Identify major features of Chile before locating Santiago within them.', ['listening', 'country introduction', 'younger learners'], 'qzfCOBLhHmI', 'Club Baby EDU', 287, `This child-friendly overview introduces Chile through clear narration and colorful examples. It gives younger learners useful cultural and geographic context for understanding Santiago as the capital of a long and varied country.`, '2026-06-12'),
      videoFocus('marraqueta-video', 'Santiago - Making Chilean Marraqueta', 'Follow a common bread through ingredients, technique, and everyday food culture.', 'Intermediate', 'Explain how an ordinary food can carry history and identity.', ['listening', 'food culture', 'process'], 'sHsI3QPfYhY', 'Dining with the Drews', 312, `This bread-making episode introduces marraqueta through a practical recipe and cultural context. It supports sequence language while showing how an everyday food can become part of national and city identity.`, '2026-06-12'),
      videoFocus('moai-video', 'Santiago - Investigating the Mysteries of the Moai', 'Use a major Chilean heritage site to examine evidence, engineering, and cultural survival.', 'Advanced', 'Analyze how archaeology and living communities explain monumental heritage.', ['listening', 'archaeology', 'critical thinking'], 'KljZ28SXz0c', 'National Geographic', 154, `This National Geographic short examines the moai of Rapa Nui, part of Chile. It supports nuanced discussion of archaeological evidence, engineering, environmental change, and why monumental heritage must also be understood through the living community connected to it.`, '2026-06-12'),
      researchedReadingFocus('santiago', 'mountain-water', 'Santiago - The Mountain Water Above the Capital', 'Connect Andes snow and ice with drought, demand, and urban decisions.', 'Advanced', 'Explain why distant mountain conditions function as city infrastructure.', ['reading', 'water', 'climate'], IMAGES.santiago, MILESTONE_50_READINGS.santiago.mountainWater, [
        { title: 'Chile Country Climate and Development Report', publisher: 'World Bank', url: 'https://www.worldbank.org/en/country/chile/publication/chile-country-climate-and-development-report' },
        { title: 'Water and Climate Change', publisher: 'UNESCO', url: 'https://www.unesco.org/en/water/climate-change' },
      ]),
      researchedReadingFocus('santiago', 'markets-and-produce', 'Santiago - La Vega and the Food Networks of the Capital', 'Follow produce through seasons, migration, vendor knowledge, and city tables.', 'Easy', 'Explain how a market connects urban life with many regions and workers.', ['reading', 'food systems', 'migration'], IMAGES.santiago, MILESTONE_50_READINGS.santiago.marketsAndProduce, [
        { title: 'Santiago', publisher: 'Chile Travel', url: 'https://www.chile.travel/en/where-to-go/destination/santiago/' },
        { title: 'Chile', publisher: 'Food and Agriculture Organization', url: 'https://www.fao.org/chile/en/' },
      ]),
      researchedReadingFocus('santiago', 'memory-and-democracy', 'Santiago - Museums, Memory, and Democracy', 'Examine how public institutions preserve evidence of political violence.', 'Advanced', 'Analyze why historical memory matters to present-day democratic life.', ['reading', 'history', 'human rights'], IMAGES.santiago, MILESTONE_50_READINGS.santiago.memoryAndDemocracy, [
        { title: 'Museum of Memory and Human Rights', publisher: 'Museo de la Memoria y los Derechos Humanos', url: 'https://mmdh.cl/' },
        { title: 'Chile', publisher: 'United Nations Human Rights Office', url: 'https://www.ohchr.org/en/countries/chile' },
      ]),
    ],
  },
  {
    id: 'addis-ababa',
    city: 'Addis Ababa',
    country: 'Ethiopia',
    region: 'East Africa',
    lat: 8.9806,
    lng: 38.7578,
    primaryAirport: 'ADD',
    airports: ['ADD'],
    scene: { terrain: 'mountain', vegetation: 'broadleaf', skyline: 'dense', landmarkSilhouette: 'mountains', palette: 'dawn' },
    heroImage: IMAGES.addisAbaba,
    focusOptions: [
      videoFocus('ethiopia-culture-video', 'Addis Ababa - Ethiopian History, Art, and Culture', 'Use a museum lesson to explore objects, stories, and traditions from Ethiopia.', 'Easy', 'Identify cultural details and explain what objects can communicate.', ['listening', 'culture', 'younger learners'], '4nOtT2cNVdw', "Children's Museum of Discovery", 378, `This child-friendly museum program introduces Ethiopian history, art, and culture through clear examples. It gives younger learners a respectful foundation for understanding Addis Ababa as a capital connected to many communities and traditions.`, '2026-06-12'),
      videoFocus('coffee-traditions-video', 'Addis Ababa - Ethiopian Coffee Traditions', 'Follow coffee preparation as a practice of hospitality and shared time.', 'Intermediate', 'Explain how a familiar drink can carry cultural relationships and ritual.', ['listening', 'food culture', 'daily life'], 'c6Mgpp_fkDI', 'BRIC TV', 215, `This feature presents Ethiopian coffee traditions through a cafe and community setting. It supports discussion of preparation, aroma, time, hospitality, migration, and how a cultural practice changes while remaining meaningful.`, '2026-06-12'),
      videoFocus('lucy-fossil-video', 'Addis Ababa - Finding the Lucy Fossil', 'Use a major fossil discovery to examine evidence about human origins.', 'Advanced', 'Analyze how scientists interpret incomplete physical evidence.', ['listening', 'science', 'human origins'], 'Kqcpkx8tfKI', 'HHMI BioInteractive', 295, `This HHMI BioInteractive video explains the discovery of Lucy, whose remains are held in Addis Ababa. It supports deeper discussion of fossils, scientific inference, fieldwork, uncertainty, and Ethiopia's importance to research on human origins.`, '2026-06-12'),
      researchedReadingFocus('addis-ababa', 'african-union', 'Addis Ababa - A Capital for Continental Diplomacy', 'Explore how the African Union connects many countries through one city.', 'Advanced', 'Explain how institutions and relationships give a city regional influence.', ['reading', 'diplomacy', 'institutions'], IMAGES.addisAbaba, MILESTONE_50_READINGS.addisAbaba.africanUnion, [
        { title: 'African Union Headquarters', publisher: 'African Union', url: 'https://au.int/en/headquarters' },
        { title: 'African Union', publisher: 'African Union', url: 'https://au.int/en/overview' },
      ]),
      researchedReadingFocus('addis-ababa', 'highland-city', 'Addis Ababa - Growing Across the Highlands', 'Connect elevation and landscape with climate, services, and urban expansion.', 'Easy', 'Explain how geography shapes the choices of a growing capital.', ['reading', 'geography', 'urban planning'], IMAGES.addisAbaba, MILESTONE_50_READINGS.addisAbaba.highlandCity, [
        { title: 'Ethiopia Urbanization Review', publisher: 'World Bank', url: 'https://www.worldbank.org/en/country/ethiopia/publication/ethiopia-urbanization-review' },
        { title: 'Addis Ababa', publisher: 'Britannica', url: 'https://www.britannica.com/place/Addis-Ababa' },
      ]),
      researchedReadingFocus('addis-ababa', 'scripts-and-languages', 'Addis Ababa - A City of Scripts and Languages', 'Examine how multilingual public life connects history, identity, and access.', 'Advanced', 'Analyze how institutions and daily choices support several languages.', ['reading', 'language', 'identity'], IMAGES.addisAbaba, MILESTONE_50_READINGS.addisAbaba.scriptsAndLanguages, [
        { title: 'Ethiopia', publisher: 'Britannica', url: 'https://www.britannica.com/place/Ethiopia' },
        { title: 'World Atlas of Languages', publisher: 'UNESCO', url: 'https://en.wal.unesco.org/' },
      ]),
    ],
  },
  {
    id: 'delhi',
    city: 'Delhi',
    country: 'India',
    region: 'South Asia',
    lat: 28.6139,
    lng: 77.209,
    primaryAirport: 'DEL',
    airports: ['DEL'],
    scene: { terrain: 'flatland', vegetation: 'broadleaf', skyline: 'dense', landmarkSilhouette: 'palace-gate', palette: 'golden' },
    heroImage: IMAGES.delhi,
    focusOptions: [
      videoFocus('indian-food-video', 'Delhi - Discovering Indian Foods', 'Use a child-friendly food guide to build vocabulary and curiosity.', 'Easy', 'Describe foods respectfully using ingredients, appearance, and taste language.', ['listening', 'food culture', 'younger learners'], 'VwvHvyUN7OM', 'Rain n Shine Kids', 409, `This child-friendly guide introduces a range of Indian foods through clear names and visual examples. It gives younger learners an accessible entry point while creating opportunities to discuss regional variety rather than treating Indian food as one single cuisine.`, '2026-06-12'),
      videoFocus('red-fort-video', 'Delhi - Understanding the Red Fort', 'Use a compact monument guide to connect architecture with Mughal history.', 'Intermediate', 'Explain how a major building communicates political power and design.', ['listening', 'architecture', 'history'], 'SKcWx7B2PRc', 'Macmillan Education India', 152, `This concise educational feature introduces Delhi's Red Fort through its major architectural and historical features. It supports clear description while building context for Mughal rule and the fort's later national significance.`, '2026-06-12'),
      videoFocus('qutub-minar-video', 'Delhi - Who Built the Qutub Minar?', 'Examine layers of construction, evidence, and interpretation around a famous monument.', 'Advanced', 'Analyze how historians explain a structure developed across different reigns.', ['listening', 'history', 'interpretation'], 'twVezI3dsjk', 'Historia Maxima', 383, `This history feature examines the construction and purpose of the Qutub Minar. It supports deeper analysis of evidence, architectural change, political symbolism, and why famous monuments often have more complex histories than a single label suggests.`, '2026-06-12'),
      researchedReadingFocus('delhi', 'many-capitals', 'Delhi - A City Made From Many Capitals', 'Read forts, roads, ruins, and government districts as layers of political power.', 'Advanced', 'Explain how structures created by earlier governments remain active in a modern capital.', ['reading', 'history', 'urban change'], IMAGES.delhi, MILESTONE_50_READINGS.delhi.manyCapitals, [
        { title: 'Delhi', publisher: 'Britannica', url: 'https://www.britannica.com/place/Delhi' },
        { title: 'Archaeological Survey of India', publisher: 'Government of India', url: 'https://asi.nic.in/' },
      ]),
      researchedReadingFocus('delhi', 'stepwells-and-water', 'Delhi - Stepwells and the Visibility of Water', 'Use historic water structures to examine season, access, design, and restoration.', 'Intermediate', 'Explain how architecture can make changing water supply visible.', ['reading', 'water', 'engineering'], IMAGES.delhi, MILESTONE_50_READINGS.delhi.stepwellsAndWater, [
        { title: 'Agrasen ki Baoli', publisher: 'Archaeological Survey of India', url: 'https://asi.nic.in/' },
        { title: 'Water and Heritage', publisher: 'UNESCO', url: 'https://www.unesco.org/en/water' },
      ]),
      researchedReadingFocus('delhi', 'market-languages', 'Delhi - The Languages That Keep a Market Moving', 'Explore negotiation, trust, work, and multilingual public life.', 'Easy', 'Explain why commerce depends on language and relationships as well as goods.', ['reading', 'language', 'commerce'], IMAGES.delhi, MILESTONE_50_READINGS.delhi.marketLanguages, [
        { title: 'Delhi Tourism', publisher: 'Government of Delhi', url: 'https://delhitourism.gov.in/' },
        { title: 'India', publisher: 'UNESCO World Atlas of Languages', url: 'https://en.wal.unesco.org/countries/india' },
      ]),
    ],
  },
  {
    id: 'manila',
    city: 'Manila',
    country: 'Philippines',
    region: 'Southeast Asia',
    lat: 14.5995,
    lng: 120.9842,
    primaryAirport: 'MNL',
    airports: ['MNL'],
    scene: { terrain: 'coastal', vegetation: 'palms', skyline: 'highrise', landmarkSilhouette: 'harbour', palette: 'tropical' },
    heroImage: IMAGES.manila,
    focusOptions: [
      videoFocus('philippines-for-kids-video', 'Manila - Discovering the Philippines', 'Build a child-friendly introduction through islands, wildlife, food, and culture.', 'Easy', 'Identify major features of the Philippines before focusing on Manila.', ['listening', 'country introduction', 'younger learners'], 'hMNKHUvsUns', 'The Adventure Storytellers', 212, `This colorful child-friendly introduction presents the Philippines through clear cultural and geographic examples. It gives younger learners a foundation for understanding Manila as one part of a large and varied island country.`, '2026-06-12'),
      videoFocus('filipino-identity-video', 'Manila - What Does It Mean to Be Filipino?', 'Use an animated story to explore family, values, culture, and belonging.', 'Intermediate', 'Explain why national identity can include many experiences and influences.', ['listening', 'identity', 'animation'], 'RdClMXrQlTM', 'The Filipino Story Studio', 279, `This animated episode explores Filipino identity through values, family, history, and everyday culture. It supports discussion of belonging without reducing a diverse country to one simple description.`, '2026-06-12'),
      videoFocus('philippines-history-video', 'Manila - A Fast History of the Philippines', 'Trace major periods while questioning what a short national history can include.', 'Advanced', 'Summarize historical change and identify where further perspectives are needed.', ['listening', 'history', 'media literacy'], 'De08VKktvJ4', 'Mr History', 362, `This compact history provides a fast timeline for the Philippines. It supports advanced summary and media-literacy work by asking what a short overview emphasizes, simplifies, or leaves for further investigation.`, '2026-06-12'),
      researchedReadingFocus('manila', 'intramuros', 'Manila - Reading the Walls of Intramuros', 'Examine colonial power, exchange, wartime destruction, and reconstruction.', 'Advanced', 'Explain why a reconstructed heritage site is an interpretation of history.', ['reading', 'heritage', 'history'], IMAGES.manila, MILESTONE_50_READINGS.manila.intramuros, [
        { title: 'Intramuros Administration', publisher: 'Government of the Philippines', url: 'https://intramuros.gov.ph/' },
        { title: 'Baroque Churches of the Philippines', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/677' },
      ]),
      researchedReadingFocus('manila', 'bay-and-flooding', 'Manila - Living With the Bay, River, and Flood Risk', 'Connect coastal geography with drainage, housing, warning, and unequal protection.', 'Advanced', 'Analyze why coastal resilience must combine engineering with fairness.', ['reading', 'climate', 'urban planning'], IMAGES.manila, MILESTONE_50_READINGS.manila.bayAndFlooding, [
        { title: 'Metro Manila Flood Management', publisher: 'World Bank', url: 'https://www.worldbank.org/en/news/feature/2017/09/29/metro-manila-flood-management-project' },
        { title: 'Philippines Climate Change', publisher: 'Asian Development Bank', url: 'https://www.adb.org/countries/philippines/main' },
      ]),
      researchedReadingFocus('manila', 'jeepney-culture', 'Manila - Jeepneys as Transport and Visual Culture', 'Examine how modernization affects design, livelihoods, health, and access.', 'Easy', 'Explain why changing a cultural transport system creates difficult tradeoffs.', ['reading', 'culture', 'public transport'], IMAGES.manila, MILESTONE_50_READINGS.manila.jeepneyCulture, [
        { title: 'Philippines Transport Sector', publisher: 'Asian Development Bank', url: 'https://www.adb.org/countries/philippines/transport' },
        { title: 'Manila', publisher: 'Britannica', url: 'https://www.britannica.com/place/Manila' },
      ]),
    ],
  },
  {
    id: 'ho-chi-minh-city',
    city: 'Ho Chi Minh City',
    country: 'Vietnam',
    region: 'Southeast Asia',
    lat: 10.8231,
    lng: 106.6297,
    primaryAirport: 'SGN',
    airports: ['SGN'],
    scene: { terrain: 'coastal', vegetation: 'palms', skyline: 'highrise', landmarkSilhouette: 'harbour', palette: 'night' },
    heroImage: IMAGES.hoChiMinhCity,
    focusOptions: [
      videoFocus('tet-for-kids-video', 'Ho Chi Minh City - Learning About Tet', 'Use a child-friendly guide to explore Vietnamese New Year traditions.', 'Easy', 'Describe how a major festival uses food, family, symbols, and shared routines.', ['listening', 'festival', 'younger learners'], '8j-vnCCrhBM', 'Twinkl Teaching Resources', 212, `This child-friendly guide introduces Tet through clear examples of family traditions, food, symbols, and celebration. It gives younger learners a respectful and accessible cultural entry point.`, '2026-06-12'),
      videoFocus('vietnam-culture-video', 'Ho Chi Minh City - Vietnam Through Food and Culture', 'Use a five-minute journey to connect food, places, and everyday cultural details.', 'Intermediate', 'Describe cultural variety using specific observations rather than broad labels.', ['listening', 'food culture', 'comparison'], 'pDPDKrywT6o', 'theTravellers', 300, `This compact cultural journey includes Ho Chi Minh City alongside other Vietnamese places. It supports comparison of food, architecture, routines, and regional identity while keeping the focus on specific observable details.`, '2026-06-12'),
      videoFocus('vietnam-history-video', 'Ho Chi Minh City - A Fast History of Vietnam', 'Build a national timeline while recognizing the limits of a short historical summary.', 'Advanced', 'Summarize major periods and identify where historical perspectives may differ.', ['listening', 'history', 'media literacy'], 'j9aIpUwl5wE', 'Mr History', 413, `This compact history provides wider context for Ho Chi Minh City. It supports advanced summary and source evaluation by asking how a fast overview frames long periods of conflict, exchange, political change, and national identity.`, '2026-06-12'),
      researchedReadingFocus('ho-chi-minh-city', 'river-city', 'Ho Chi Minh City - The Waterways Beneath the Metropolis', 'Connect river history with trade, flooding, redevelopment, and public access.', 'Advanced', 'Explain why waterways remain essential inside a fast-changing city.', ['reading', 'water', 'urban planning'], IMAGES.hoChiMinhCity, MILESTONE_50_READINGS.hoChiMinhCity.riverCity, [
        { title: 'Ho Chi Minh City Development', publisher: 'World Bank', url: 'https://www.worldbank.org/en/country/vietnam' },
        { title: 'Ho Chi Minh City', publisher: 'Britannica', url: 'https://www.britannica.com/place/Ho-Chi-Minh-City' },
      ]),
      researchedReadingFocus('ho-chi-minh-city', 'coffee-culture', 'Ho Chi Minh City - Coffee, Work, and Social Space', 'Follow a daily drink through farms, cafes, history, and neighborhood routines.', 'Easy', 'Explain how a global crop becomes part of local city identity.', ['reading', 'food culture', 'economy'], IMAGES.hoChiMinhCity, MILESTONE_50_READINGS.hoChiMinhCity.coffeeCulture, [
        { title: 'Vietnam Coffee', publisher: 'Food and Agriculture Organization', url: 'https://www.fao.org/one-country-one-priority-product/asia-pacific/viet-nam/en' },
        { title: 'Vietnam Tourism', publisher: 'Vietnam National Authority of Tourism', url: 'https://vietnam.travel/' },
      ]),
      researchedReadingFocus('ho-chi-minh-city', 'changing-architecture', 'Ho Chi Minh City - What Ordinary Buildings Teach', 'Read architecture through climate adaptation, memory, affordability, and change.', 'Advanced', 'Analyze what can be lost when rapid development replaces ordinary buildings.', ['reading', 'architecture', 'urban change'], IMAGES.hoChiMinhCity, MILESTONE_50_READINGS.hoChiMinhCity.changingArchitecture, [
        { title: 'Ho Chi Minh City', publisher: 'Britannica', url: 'https://www.britannica.com/place/Ho-Chi-Minh-City' },
        { title: 'Vietnam Urban Development', publisher: 'World Bank', url: 'https://www.worldbank.org/en/country/vietnam/overview' },
      ]),
    ],
  },
];

export function getDestinationById(id: string) {
  return WORLD_DESTINATIONS.find((destination) => destination.id === id);
}
