import type { SourceMaterial } from '@/types/source-material';
import type { DestinationFocus, DestinationImage, DestinationPack } from '@/lib/world-flight/types';
import {
  assessWorldFlightReadingQuality,
  buildWorldFlightBriefingOptions,
  countWords,
  type WorldFlightReadingLevels,
} from '@/lib/world-flight/readings';
import { VANCOUVER_READINGS } from './reading-content';

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
  const candidate = focus(cityId, id, title, subtitle, difficulty, lessonGoal, skills, image, reading);
  const publishable = assessWorldFlightReadingQuality(candidate.sourceMaterial).publishable;
  return {
    ...candidate,
    citations,
    sourceMaterial: {
      ...candidate.sourceMaterial,
      citations,
    },
    review: publishable
      ? { status: 'researched', reviewedAt: '2026-06-11' }
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
      reviewedAt: '2026-06-08',
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
        'Intermediate',
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
        'Intermediate',
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
        'Intermediate',
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
        'Intermediate',
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
        'Intermediate',
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
        'Intermediate',
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
        'Intermediate',
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
        'Intermediate',
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
        'Intermediate',
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
        'Intermediate',
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
        'Intermediate',
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
        'Intermediate',
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
        'Intermediate',
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
      researchedReadingFocus('beijing', 'temple-of-heaven-symbols', 'Beijing - Reading Symbols at the Temple of Heaven', 'Use architecture to discuss ritual, design, color, and meaning.', 'Intermediate', 'Explain how a building can communicate ideas without words.', ['reading', 'architecture', 'interpretation'], IMAGES.beijing, `The Temple of Heaven is useful for class discussion because students can read it like a text. Its round and square forms, colors, platforms, and open spaces were designed for imperial rituals connected to heaven, harvests, and order. The site shows that architecture can carry political and spiritual meaning, not only shelter people from weather.\n\nStudents can choose one design feature and explain what it might communicate. Then they can compare it with a school, temple, stadium, or government building they know. What does the design ask visitors to feel: respect, quiet, pride, power, or belonging?`, [
        { title: 'Temple of Heaven', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/881' },
        { title: 'Temple of Heaven', publisher: 'Britannica', url: 'https://www.britannica.com/topic/Temple-of-Heaven' },
      ]),
      researchedReadingFocus('beijing', 'forbidden-city-scale', 'Beijing - Why the Forbidden City Feels So Large', 'Discuss scale, hierarchy, movement, and who gets access to power.', 'Intermediate', 'Explain how space can organize people and authority.', ['reading', 'history', 'critical thinking'], IMAGES.beijing, `The Forbidden City is not only famous because it is old. Its size and layout make power visible. Gates, courtyards, halls, walls, and long central paths guide movement and separate people by status. A visitor feels distance before reaching important rooms, and that distance is part of the message.\n\nStudents can map a route through a powerful place: a palace, court, school office, airport, or stadium. Who can enter each area? Who waits? Who watches? Beijing helps students see that buildings can organize behavior before anyone speaks.`, [
        { title: 'Imperial Palaces of the Ming and Qing Dynasties', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/439' },
          { title: 'Forbidden City', publisher: 'Britannica', url: 'https://www.britannica.com/topic/Forbidden-City' },
      ]),
      researchedReadingFocus('beijing', 'olympic-legacy', 'Beijing - What an Olympic City Keeps After the Games', 'Use the 2008 Olympics to discuss image, infrastructure, pride, and cost.', 'Intermediate', 'Evaluate what a city gains and risks when hosting a global event.', ['reading', 'sports', 'urban planning'], IMAGES.beijing, `When Beijing hosted the 2008 Summer Olympics, the city presented itself to a global audience. Stadiums, ceremonies, transport upgrades, and media attention helped shape how outsiders saw China. But Olympic legacy is not only the opening ceremony. It includes what happens to venues, neighborhoods, public spending, and city identity after visitors leave.\n\nStudents can design a legacy checklist for any host city. Which changes should still help residents ten years later? Which changes are mostly for television? This turns a sports event into a city-planning question.`, [
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
      researchedReadingFocus('berlin', 'tempelhofer-feld', 'Berlin - Turning an Airport Into a Public Field', 'Use Tempelhofer Feld to discuss parks, housing pressure, and public choice.', 'Intermediate', 'Evaluate competing uses for large urban land.', ['reading', 'urban planning', 'debate'], IMAGES.berlin, `Tempelhofer Feld was once an airport. Today it is a huge open public space where people cycle, skate, garden, fly kites, and meet friends. Its openness is unusual in a dense city, which is why it creates debate. Some people see it as a rare shared field. Others see land that could help with housing needs.\n\nStudents can hold a city council debate. Should a large empty space become homes, sports fields, gardens, shops, or stay open? Berlin makes the tradeoff concrete.`, [
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
      researchedReadingFocus('moscow', 'river-capital', 'Moscow - Reading the City Along the River', 'Use the Moscow River to discuss settlement, trade, defense, and identity.', 'Intermediate', 'Explain why rivers often shape capital cities.', ['reading', 'geography', 'history'], IMAGES.moscow, `The Moscow River helps explain why the city grew where it did. Rivers can support transport, trade, defense, water supply, and symbolic views. Even when roads, railways, and airports become more important, the river still shapes bridges, embankments, parks, and the mental map of the city.\n\nStudents can trace a river city they know. Where are the bridges? Where are the old centers? Which neighborhoods face the water, and which turn away from it? Moscow shows that geography remains visible even in a modern capital.`, [
        { title: 'Moscow', publisher: 'Britannica', url: 'https://www.britannica.com/place/Moscow' },
        { title: 'Moskva River', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Moskva_(river)' },
      ]),
      researchedReadingFocus('moscow', 'winter-public-life', 'Moscow - Designing Public Life for Winter', 'Discuss how cold weather changes parks, streets, clothing, and schedules.', 'Intermediate', 'Describe how climate affects public-space design and daily routines.', ['reading', 'climate', 'urban design'], IMAGES.moscow, `Winter changes how people use Moscow. A public place that works in July may need different lighting, surfaces, shelter, maintenance, and activities in January. Ice, snow, darkness, and cold can limit movement, but they can also create skating, festivals, warm indoor gathering places, and seasonal routines.\n\nStudents can redesign a park for two seasons. What must change when it is hot, cold, wet, or dark? Moscow helps the class see climate as a design problem, not just a weather report.`, [
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
      videoFocus('original-cities-video', "Vancouver - The Original Three Cities", 'Use local history to discuss names, boundaries, and older places.', 'Intermediate', 'Explain how one modern city can contain several older settlement stories.', ['listening', 'history', 'identity'], 'ZeRPpyrvunE', 'Kumtuks Education', 57, `This short local-history clip introduces earlier city identities around Vancouver. Students can discuss how maps change and why older names and communities still matter inside a modern city.`),
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
      researchedReadingFocus('toronto', 'ravine-city', 'Toronto - The Ravines Under the City Map', 'Use Toronto ravines to discuss hidden nature, flooding, paths, and protection.', 'Intermediate', 'Explain why natural systems inside cities need active care.', ['reading', 'nature', 'urban planning'], IMAGES.toronto, `Toronto is often described through towers, streets, and neighborhoods, but ravines cut through the city like hidden green corridors. They support plants and animals, carry stormwater, shape walking routes, and give residents access to nature. They also need protection because erosion, invasive species, trash, and development can damage them.\n\nStudents can look for hidden nature in their own city. Is it a canal, empty lot, hill, stream, park, or roadside trees? Toronto shows that nature is not always outside the city.`, [
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
      researchedReadingFocus('mumbai', 'monsoon-city', 'Mumbai - Living With the Monsoon', 'Discuss rain, drainage, work, school, trains, and preparation.', 'Intermediate', 'Explain how seasonal weather changes city routines and infrastructure.', ['reading', 'climate', 'problem solving'], IMAGES.mumbai, `Mumbai's monsoon is not just rainy weather. It affects train schedules, roads, school days, waste, drainage, housing, and public health. People plan clothes, travel time, work routines, and repairs around a season that can be both life-giving and disruptive.\n\nStudents can write a monsoon checklist for a resident, commuter, or school. What should people carry? What should the city maintain before rains begin? Mumbai shows how climate becomes part of everyday language and planning.`, [
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
      researchedReadingFocus('cape-town', 'fynbos-biodiversity', 'Cape Town - A City Inside a Biodiversity Hotspot', 'Use fynbos to discuss plants, fire, conservation, and urban edges.', 'Intermediate', 'Explain why city nature can be globally important.', ['reading', 'science', 'nature'], IMAGES.capeTown, `Cape Town sits near extraordinary plant diversity, including fynbos vegetation in the Cape Floristic Region. This makes city nature more than decoration. It raises questions about fire, invasive species, hiking, water, housing pressure, and conservation.\n\nStudents can compare two types of nature: a park planted for beauty and a habitat protected for biodiversity. What rules should visitors follow? Cape Town helps students see that a city can be part of a rare ecosystem.`, [
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
      researchedReadingFocus('rome', 'layers-underfoot', 'Rome - A City With Layers Underfoot', 'Use archaeology to discuss old streets, new streets, and building over time.', 'Intermediate', 'Explain how cities preserve and disrupt their own past.', ['reading', 'archaeology', 'urban change'], IMAGES.rome, `In Rome, the past is not only in museums. It appears under streets, beside churches, inside basements, and around construction sites. This creates a challenge: how can a modern city build subway lines, homes, and utilities while protecting ancient layers?\n\nStudents can discuss whether preservation should slow development. When is delay worth it? When does a city need to move forward? Rome makes the tension between past and present visible.`, [
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
      researchedReadingFocus('rio-de-janeiro', 'beach-public-life', 'Rio - Beach as Public Stage', 'Discuss how beaches support sport, fashion, vendors, class, and identity.', 'Intermediate', 'Describe a public place where many social worlds meet.', ['reading', 'public space', 'culture'], IMAGES.rio, `In Rio, the beach can be a place to swim, exercise, sell snacks, meet friends, play music, show style, or simply be seen. That makes it a public stage as well as a natural place. Beaches can bring people together, but they can also reveal differences in money, safety, access, and status.\n\nStudents can describe a public place in their own city where many groups mix. What rules are written? What rules are understood? Rio helps students read social life in open space.`, [
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
      researchedReadingFocus('buenos-aires', 'la-boca-color', 'Buenos Aires - La Boca, Color, and Visitor Attention', 'Use a famous neighborhood to discuss art, immigration, tourism, and performance.', 'Intermediate', 'Explain how a neighborhood can become a symbol and still be lived in.', ['reading', 'neighborhoods', 'media literacy'], IMAGES.buenosAires, `La Boca is often shown through bright colors, tango images, football, and tourist streets. Those images are real but incomplete. The neighborhood also has migration history, working-class identity, port connections, and residents whose lives are not only performance for visitors.\n\nStudents can discuss how tourism changes a neighborhood's image. What gets photographed? What gets ignored? Buenos Aires helps students separate symbol from full story.`, [
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
      researchedReadingFocus('los-angeles', 'murals-and-neighborhoods', 'Los Angeles - Murals as Neighborhood Voice', 'Discuss public art, identity, memory, and who controls walls.', 'Intermediate', 'Describe how public art communicates local stories.', ['reading', 'art', 'identity'], IMAGES.losAngeles, `Murals in Los Angeles can mark identity, protest, memory, celebration, and neighborhood pride. Unlike art hidden inside a museum, a mural speaks from a wall that people pass every day. That makes public art visible but also contested.\n\nStudents can design a mural for a route in their city. What story should be public? Who should approve it? Los Angeles helps students see walls as communication space.`, [
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
      researchedReadingFocus('jakarta', 'old-batavia', 'Jakarta - Kota Tua and the Colonial Port', 'Use Old Batavia to discuss trade, buildings, names, and memory.', 'Intermediate', 'Explain how colonial port history remains visible in a modern capital.', ['reading', 'history', 'heritage'], IMAGES.jakarta, `Kota Tua, or Jakarta's old town, helps students see the city's port and colonial layers. Warehouses, squares, museums, and street names point to trade, power, and the movement of goods and people.\n\nStudents can compare an old port district with a new business district. What gets preserved? What becomes a museum? Jakarta shows how a city can keep older layers while still changing fast.`, [
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
      researchedReadingFocus('lagos', 'nollywood-city', 'Lagos - Nollywood and the City of Production', 'Use film to discuss low-cost creativity, work, language, and audience.', 'Intermediate', 'Explain how a city can become a media-production hub.', ['reading', 'media', 'work'], IMAGES.lagos, `Lagos is central to Nollywood, Nigeria's film industry. The topic is useful because it connects creativity with speed, budgets, actors, language, distribution, and audience demand. A film industry is not only stars. It includes writers, editors, drivers, makeup artists, marketers, and viewers.\n\nStudents can plan a short film production in their city. What locations, workers, and languages would they need? Lagos makes media feel practical and local.`, [
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
      researchedReadingFocus('amsterdam', 'canal-ring-planning', 'Amsterdam - Planning the Canal Ring', 'Use canals to discuss engineering, trade, housing, and long-term planning.', 'Intermediate', 'Explain how a city plan can still shape daily life centuries later.', ['reading', 'urban planning', 'history'], IMAGES.amsterdam, `Amsterdam's canal ring was not accidental scenery. It was a planned system connected to trade, drainage, defense, housing, and movement. Centuries later, the same canals shape tourism, transport, architecture, and the city's image.\n\nStudents can draw a simple city plan with water routes and streets. What should be close together? Where should people live? Amsterdam shows how old planning decisions can remain active.`, [
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
];

export function getDestinationById(id: string) {
  return WORLD_DESTINATIONS.find((destination) => destination.id === id);
}
