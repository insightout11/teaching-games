import type { SourceMaterial } from '@/types/source-material';
import type { DestinationFocus, DestinationImage, DestinationPack } from '@/lib/world-flight/types';

function unsplashPhoto(photoId: string, city: string, caption: string): DestinationImage {
  return {
    url: `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1200&q=80`,
    alt: `${city} destination photo`,
    caption,
    sourceName: 'Unsplash',
    sourceUrl: 'https://unsplash.com/',
  };
}

function textSource(id: string, title: string, summary: string, rawText: string): SourceMaterial {
  return {
    sourceType: 'text',
    sourceKey: id,
    title,
    summary,
    rawText,
    briefingText: rawText,
    originalText: rawText,
    briefingMode: 'generated',
    wordCount: rawText.trim().split(/\s+/).length,
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
  reading: string,
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
  reading: string,
  citations: NonNullable<DestinationFocus['citations']>,
): DestinationFocus {
  return {
    ...focus(cityId, id, title, subtitle, difficulty, lessonGoal, skills, image, reading),
    citations,
    review: { status: 'researched', reviewedAt: '2026-06-08' },
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
  seoul: unsplashPhoto('photo-1538485399081-7c8ed6f61d27', 'Seoul', 'Seoul skyline and night streets.'),
  singapore: unsplashPhoto('photo-1525625293386-3f8f99389edd', 'Singapore', 'Singapore skyline and waterfront.'),
  paris: unsplashPhoto('photo-1502602898657-3e91760cbb34', 'Paris', 'Paris landmarks and historic streets.'),
  london: unsplashPhoto('photo-1513635269975-59663e0ac1ad', 'London', 'London river, skyline, and bridges.'),
  newYork: unsplashPhoto('photo-1499092346589-b9b6be3e94b2', 'New York', 'New York streets and high-rise skyline.'),
  cairo: unsplashPhoto('photo-1539650116574-75c0c6d73f6e', 'Cairo', 'Cairo and the pyramids at the edge of the desert.'),
  dubai: unsplashPhoto('photo-1512453979798-5ea266f8880c', 'Dubai', 'Dubai towers and desert city design.'),
  sydney: unsplashPhoto('photo-1506973035872-a4ec16b8e8d9', 'Sydney', 'Sydney harbour and coastal city life.'),
};

export const WORLD_FLIGHT_ORIGIN_ID = 'bangkok';
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
];

export function getDestinationById(id: string) {
  return WORLD_DESTINATIONS.find((destination) => destination.id === id);
}
