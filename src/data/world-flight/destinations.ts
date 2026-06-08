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
      focus('bangkok', 'street-food', 'Bangkok - Street Food and Night Markets', 'Compare street food, night markets, and everyday choices.', 'Intermediate', 'Discuss food culture and make recommendations.', ['reading', 'vocabulary', 'discussion'], IMAGES.bangkok, `Bangkok is famous for food that feels close to everyday life. In many neighborhoods, people can buy grilled meat, noodle soup, fruit, rice dishes, and sweet drinks from small stalls. A night market is not only a place to eat. It is also a place to meet friends, compare prices, watch people cook, and notice how busy city life continues after dark. For visitors, the experience can be exciting but also confusing. There are many smells, sounds, and choices at the same time. Students can discuss what makes food feel local, how people decide where to eat, and whether street food should be seen as tourism, convenience, or community life.`),
      focus('bangkok', 'river-city', 'Bangkok - Life Along the Chao Phraya', 'Use the river to talk about transport, history, and city change.', 'Intermediate', 'Describe how geography shapes a city.', ['reading', 'speaking', 'comparison'], IMAGES.bangkok, `The Chao Phraya River runs through Bangkok and gives the city one of its clearest identities. Boats carry commuters, tourists, goods, and families past temples, hotels, houses, bridges, and office buildings. The river shows old and new Bangkok at the same time. On one side, students may notice historic temples and wooden houses. On another side, they may see glass towers, shopping centers, and modern transport links. This contrast creates useful questions for discussion. How does a river help a city grow? What should be protected when a city changes quickly? Is water transport practical, beautiful, or both?`),
      focus('bangkok', 'travel-english', 'Bangkok - Asking for Help in a Busy City', 'Practice directions, transport, and polite questions.', 'Easy', 'Build practical travel English for crowded places.', ['functional English', 'role-play', 'listening'], IMAGES.bangkok, `A first visit to Bangkok can require many small conversations. A traveler may need to ask where the train platform is, how to get to a pier, whether a taxi uses the meter, or where to buy a ticket. The city has trains, buses, boats, taxis, motorbike taxis, and walking routes. Each option has different advantages. Some are fast, some are cheap, and some are easier for tourists to understand. Polite questions are important because the city can be crowded and noisy. Students can practice asking for help clearly, checking information, and confirming directions before moving to the next place.`),
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
        'train-system-video',
        "Tokyo's Train System, Explained",
        'Learn the colors, station numbers, operators, and habits that make a complex network usable.',
        'Intermediate',
        'Explain a complex transport system and give practical navigation advice.',
        ['listening', 'systems thinking', 'travel English'],
        '2Abrpfj3Aa4',
        'Bright Trip',
        994,
        `Tokyo's rail map can look overwhelming, but this practical guide breaks it into understandable parts. It explains how lines use names, colors, letters, and numbered stations; how above-ground railways and subway operators connect; and how route-planning apps and transit cards help passengers move through the city. The video also introduces useful travel habits such as checking the train direction, recognizing express services, and navigating large interchange stations. Students can use the source to explain a system clearly, compare public transport in different cities, and create advice for a first-time visitor.`,
      ),
      videoFocus(
        'convenience-store-video',
        'Convenience Stores: Everyday Infrastructure',
        'See how compact stores combine food, services, logistics, and changing technology.',
        'Intermediate',
        'Discuss how a familiar business can become part of a city’s infrastructure.',
        ['listening', 'business', 'daily life'],
        'mKg4aZvKVu0',
        'NHK WORLD-JAPAN',
        1686,
        `This Japanology Plus episode examines how Japanese convenience stores evolved into compact service hubs. Alongside food and everyday products, stores may provide ATMs, parcel services, administrative terminals, and other functions that support daily life. The program looks at how chains organize many products in limited space, respond to changing customer needs, and experiment with new technology. Students can discuss what convenience means, why the model works in dense cities, and whether constant availability improves life or creates new costs.`,
      ),
      videoFocus(
        'zoning-video',
        'Why Tokyo Neighborhoods Mix Homes, Shops, and Work',
        'Use Japanese zoning to understand why Tokyo streets feel different from many Western cities.',
        'Advanced',
        'Compare city-planning rules and evaluate mixed-use neighborhoods.',
        ['listening', 'urban design', 'comparison'],
        'wfm2xCKOCNk',
        "Life Where I'm From",
        875,
        `This explainer uses Japanese zoning to show why homes, small shops, schools, clinics, offices, and light industry often appear close together. Instead of separating every activity into a single-use district, Japan's zoning system generally permits several less disruptive uses inside each zone. The video connects those rules to walkable streets, neighborhood businesses, varied building types, and rail-oriented city life. Students can compare planning systems, identify tradeoffs, and debate what should or should not be allowed near their homes.`,
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
      focus('seoul', 'pop-culture', 'Seoul - Pop Culture and Global Influence', 'Discuss music, drama, fashion, and soft power.', 'Intermediate', 'Explain why local culture becomes global.', ['discussion', 'media literacy', 'vocabulary'], IMAGES.seoul, `Seoul has become a global culture center through music, television, fashion, beauty, games, and online media. Many people first become interested in Korea through a song, drama, film, or social media clip. This raises useful questions for class discussion. Why do some local stories travel around the world? What changes when culture becomes an export? Seoul also shows how entertainment connects to language learning, tourism, business, and identity. Students can compare Korean pop culture with global culture from other countries and decide what makes media feel fresh, emotional, or easy to share.`),
      focus('seoul', 'palaces-city', 'Seoul - Palaces Inside a Modern City', 'Use Seoul to compare history and high-speed urban life.', 'Intermediate', 'Describe contrasts between heritage and modern routines.', ['reading', 'comparison', 'speaking'], IMAGES.seoul, `In Seoul, historic palace walls, mountain views, shopping districts, subway stations, and office towers can appear close together. This makes the city useful for studying contrast. A palace is not only an old building. It can be a public memory, a tourist site, a place for ceremonies, and a quiet space inside a fast city. Students can discuss how cities decide which historic places to protect. They can also compare how people behave in a palace, a shopping street, a subway station, and a business district.`),
      focus('seoul', 'study-work', 'Seoul - Study, Work, and Pressure', 'Talk about ambition, education, and balance.', 'Advanced', 'Debate pressure, success, and personal wellbeing.', ['debate', 'opinion', 'critical thinking'], IMAGES.seoul, `Seoul is often associated with energy, ambition, and high expectations. Students, workers, and families may face pressure to perform well, improve skills, and compete for opportunities. At the same time, the city offers creativity, entertainment, technology, and strong social life. This topic helps students discuss success in a balanced way. When is hard work motivating, and when is it unhealthy? What should schools, companies, and families do to support people? Students can compare pressure in different societies and propose realistic ways to protect wellbeing.`),
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
      focus('singapore', 'future-city', 'Singapore - City of the Future', 'Discuss planning, green buildings, and public systems.', 'Intermediate', 'Describe future city ideas and tradeoffs.', ['reading', 'discussion', 'urban design'], IMAGES.singapore, `Singapore is often used as an example of a carefully planned city. It has dense housing, busy transport, green spaces, high-rise buildings, and strict rules about public behavior. The city tries to solve practical problems: limited land, heat, transport, water, and waste. Students can discuss whether planning makes a city more comfortable or too controlled. They can also design their own future city and decide what matters most: parks, trains, housing, safety, freedom, food, or technology.`),
      focus('singapore', 'hawker-centres', 'Singapore - Hawker Centres and Shared Tables', 'Explore food courts, identity, and everyday community.', 'Easy', 'Practice ordering food and comparing dishes.', ['functional English', 'vocabulary', 'role-play'], IMAGES.singapore, `Hawker centres are important public eating places in Singapore. Many stalls sell different dishes in one shared space, so friends or families can choose different meals and still sit together. The food reflects many communities, including Chinese, Malay, Indian, and other influences. For language learners, a hawker centre is a practical setting for ordering, asking about ingredients, comparing prices, and recommending dishes. It is also a cultural setting. Students can discuss why shared food spaces matter and how food can show the history of a city.`),
      focus('singapore', 'airport-design', 'Singapore - Changi Airport as a Destination', 'Use an airport to discuss design, comfort, and travel stress.', 'Intermediate', 'Evaluate public spaces and service design.', ['discussion', 'travel English', 'design'], IMAGES.singapore, `Changi Airport is known not only as a transport hub but also as a public experience. Travelers may find gardens, shops, art, rest areas, and clear signs. The airport tries to make waiting feel less stressful. This creates a useful classroom question: what makes a public space comfortable? Students can compare airports they know, describe good and bad travel experiences, and design a better airport for tired passengers, families, first-time travelers, and people who do not speak the local language.`),
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
      focus('paris', 'tourism-pressure', 'Paris - Tourism and Pressure on Famous Cities', 'Discuss crowds, expectations, and local life.', 'Intermediate', 'Debate how cities can welcome visitors responsibly.', ['discussion', 'debate', 'vocabulary'], IMAGES.paris, `Paris is one of the world's most visited cities. Many travelers arrive with strong expectations shaped by films, photos, guidebooks, and social media. They may want museums, cafes, fashion, history, and famous views. But heavy tourism can also create problems: crowded streets, expensive housing, pressure on public services, and frustration for residents. Students can discuss how a city should balance visitors and local life. They can also compare real travel experiences with ideal images and decide whether famous destinations are helped or harmed by their popularity.`),
      focus('paris', 'cafe-culture', 'Paris - Cafe Culture and Public Life', 'Use cafes to discuss conversation, time, and social habits.', 'Easy', 'Practice describing routines and making recommendations.', ['speaking', 'vocabulary', 'comparison'], IMAGES.paris, `Paris cafes are often seen as places for coffee, conversation, reading, people-watching, and slow time. A cafe can be a meeting place, a workplace, a tourist stop, or a quiet corner in a busy city. Students can compare cafe culture in different countries. Do people sit for a long time or leave quickly? Do they work, talk, eat, or relax? This topic also creates practical language for ordering, asking for a table, recommending a place, and describing atmosphere.`),
      focus('paris', 'art-museums', 'Paris - Museums, Art, and Public Memory', 'Discuss why cities protect art and historical collections.', 'Advanced', 'Explain the value and controversy of museums.', ['critical thinking', 'discussion', 'culture'], IMAGES.paris, `Paris is strongly connected with museums, galleries, monuments, and public art. These spaces can teach history, inspire visitors, and help a city protect cultural memory. They can also raise difficult questions. Who owns art? What should happen when objects were taken during conflict or colonial rule? How can museums welcome new audiences instead of feeling formal or distant? Students can discuss whether museums are mainly educational, cultural, political, or commercial spaces.`),
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
      focus('london', 'multicultural-city', 'London - A Multicultural Capital', 'Discuss identity, migration, food, and neighborhoods.', 'Intermediate', 'Describe how migration shapes city life.', ['discussion', 'culture', 'vocabulary'], IMAGES.london, `London is a city of many languages, backgrounds, foods, accents, and neighborhood identities. People may experience the city through markets, schools, offices, museums, music, sport, or public transport. This makes London useful for discussing multicultural life. Students can ask what helps different communities live together and what challenges may appear in a large diverse city. They can compare London with cities they know and describe how food, language, and public spaces show cultural mixing.`),
      focus('london', 'public-transport', 'London - The Underground and City Navigation', 'Practice signs, maps, announcements, and travel choices.', 'Easy', 'Build practical English for public transport.', ['functional English', 'role-play', 'directions'], IMAGES.london, `The London Underground is one of the most famous transport systems in the world. Its map, station names, signs, and announcements help millions of people move through the city. For visitors, the system can feel confusing at first because there are many lines, zones, ticket rules, and peak times. Students can practice asking for directions, checking platforms, choosing a route, and explaining a delay. They can also discuss what makes a transport map easy or difficult to use.`),
      focus('london', 'old-new-power', 'London - Old Power and New Money', 'Compare royal history, finance, media, and modern inequality.', 'Advanced', 'Debate how old cities handle modern power.', ['debate', 'comparison', 'critical thinking'], IMAGES.london, `London contains signs of old political power and modern economic power at the same time. Royal buildings, government institutions, financial districts, global media, expensive housing, and tourist sites all share the city. This makes London a strong topic for discussing inequality and influence. Who benefits from being in a global city? What makes a city attractive to business, tourists, artists, and residents? Students can compare old symbols of power with new ones and decide what responsibilities a global city should have.`),
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
      focus('new-york', 'immigration', 'New York - Immigration and New Beginnings', 'Discuss migration stories, opportunity, and belonging.', 'Intermediate', 'Use personal story language and compare experiences.', ['speaking', 'culture', 'discussion'], IMAGES.newYork, `New York is often connected with immigration and the idea of a new beginning. For many people, the city represents work, risk, diversity, ambition, and the chance to build a different life. Neighborhoods, food, music, language, and family histories all show layers of migration. Students can discuss why people move to big cities and what challenges they face when they arrive. They can also practice telling a migration story from different perspectives: a student, a parent, a worker, a business owner, or a new neighbor.`),
      focus('new-york', 'skyscrapers', 'New York - Skyscrapers and Ambition', 'Use tall buildings to discuss design, business, and identity.', 'Intermediate', 'Describe symbols of ambition and city branding.', ['reading', 'discussion', 'design'], IMAGES.newYork, `New York's skyline is one of its strongest symbols. Skyscrapers can show ambition, business power, engineering skill, and the need to use limited land carefully. They also change how people feel in a city. Some people find tall buildings exciting and beautiful. Others feel that they make streets crowded, expensive, or impersonal. Students can discuss why cities build upward, what a skyline communicates, and whether iconic buildings are mainly useful, symbolic, or commercial.`),
      focus('new-york', 'street-life', 'New York - Street Life and Fast Conversations', 'Practice quick interactions in shops, stations, and sidewalks.', 'Easy', 'Build confidence with short city conversations.', ['functional English', 'role-play', 'listening'], IMAGES.newYork, `A day in New York can include many short conversations: ordering food, asking where the subway entrance is, checking a price, buying a ticket, or apologizing after bumping into someone on a crowded sidewalk. These conversations are often quick and direct. Students can practice short phrases that help them sound clear without being rude. They can also compare communication styles in busy cities. Is direct language efficient, unfriendly, or both?`),
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
      focus('cairo', 'ancient-modern', 'Cairo - Ancient History and Modern Life', 'Compare the pyramids, museums, traffic, and daily routines.', 'Intermediate', 'Describe contrast between heritage and everyday life.', ['comparison', 'reading', 'discussion'], IMAGES.cairo, `Cairo is often imagined through ancient history, especially the pyramids and museums. But it is also a huge modern city where people commute, study, work, shop, and manage ordinary problems. This contrast makes Cairo a strong classroom destination. Students can discuss how famous historical sites affect a modern city's identity. Do they create pride, tourism, pressure, or all three? They can also compare what tourists notice with what residents may care about in daily life.`),
      focus('cairo', 'nile', 'Cairo - The Nile and City Survival', 'Use the river to discuss water, farming, transport, and growth.', 'Advanced', 'Explain why natural geography matters for cities.', ['geography', 'discussion', 'critical thinking'], IMAGES.cairo, `The Nile has shaped life in Egypt for thousands of years. Around Cairo, the river is not only a scenic feature. It connects to farming, transport, settlement, history, and questions about water use. As cities grow, water becomes even more important. Students can discuss how a river can support a city and what problems appear when many people depend on the same resource. This topic also works well for comparing rivers in different countries and debating how cities should protect them.`),
      focus('cairo', 'market-language', 'Cairo - Market Bargaining and Polite Pressure', 'Practice prices, negotiation, and respectful refusals.', 'Easy', 'Build practical shopping and travel language.', ['role-play', 'functional English', 'vocabulary'], IMAGES.cairo, `Markets in Cairo can be lively places full of color, sound, movement, and conversation. Visitors may need to ask prices, compare items, negotiate, and say no politely. Bargaining can feel fun for some people and stressful for others. Students can practice useful language for shopping without sounding too aggressive or too passive. They can also discuss when bargaining is normal, when prices should be fixed, and how tourists can show respect while still protecting their budget.`),
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
      focus('dubai', 'desert-city', 'Dubai - Building a City in the Desert', 'Discuss water, heat, design, and rapid growth.', 'Intermediate', 'Explain tradeoffs in extreme urban environments.', ['discussion', 'design', 'vocabulary'], IMAGES.dubai, `Dubai is known for rapid growth, tall buildings, airports, shopping, tourism, and desert surroundings. Building a major city in a hot dry environment requires difficult choices about water, energy, transport, shade, and public space. Students can discuss what makes a city impressive and what makes it sustainable. They can compare visual ambition with practical needs and design a desert neighborhood that helps people move, work, and relax in extreme heat.`),
      focus('dubai', 'global-hub', 'Dubai - Airport Hub and Global Travel', 'Use Dubai to discuss connections, layovers, and global business.', 'Easy', 'Practice airport and travel English.', ['functional English', 'travel English', 'role-play'], IMAGES.dubai, `Dubai is a major global travel hub. Many people pass through its airport on the way to another destination. A layover can involve checking gates, finding food, asking about delays, resting, or moving between terminals. Students can practice travel English for a large international airport. They can also discuss why some cities become global hubs. Is it location, business, airlines, tourism, or planning?`),
      focus('dubai', 'luxury-image', 'Dubai - Luxury, Image, and City Branding', 'Debate whether a city should sell an image of success.', 'Advanced', 'Discuss branding, inequality, and aspiration.', ['debate', 'media literacy', 'critical thinking'], IMAGES.dubai, `Dubai often presents itself through images of luxury, modern towers, expensive hotels, and ambitious projects. These images attract tourists, investors, and workers, but they also raise questions. What does a city choose to show the world? What gets hidden behind a luxury image? Students can discuss city branding and compare it with personal branding on social media. They can debate whether impressive images create opportunity, pressure, unrealistic expectations, or genuine pride.`),
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
      focus('sydney', 'harbour-life', 'Sydney - Harbour Life and Public Space', 'Discuss ferries, beaches, parks, and outdoor routines.', 'Intermediate', 'Describe how climate and coast shape daily life.', ['reading', 'comparison', 'speaking'], IMAGES.sydney, `Sydney is strongly shaped by its harbour, beaches, parks, and outdoor public spaces. Many people connect the city with ferries, coastal walks, sport, cafes, and views of the water. This topic helps students discuss how geography and climate influence daily routines. Would people spend more time outside if their city had better public spaces? What makes a waterfront useful, beautiful, or too expensive? Students can compare Sydney with inland cities and design a public space that encourages community life.`),
      focus('sydney', 'iconic-buildings', 'Sydney - The Opera House and Iconic Buildings', 'Explore why some buildings become symbols.', 'Intermediate', 'Explain how architecture creates city identity.', ['design', 'discussion', 'vocabulary'], IMAGES.sydney, `The Sydney Opera House is one of the world's most recognizable buildings. It is used for performance, tourism, photography, and city identity. Iconic buildings can help a city become memorable, but they can also be expensive and controversial. Students can discuss what makes a building iconic. Is it shape, location, history, function, or media attention? They can compare famous buildings from different cities and decide whether a city needs a landmark to feel special.`),
      focus('sydney', 'nature-city', 'Sydney - Nature Near the City', 'Talk about beaches, wildlife, climate, and responsibility.', 'Easy', 'Build vocabulary for nature and outdoor activities.', ['vocabulary', 'speaking', 'comparison'], IMAGES.sydney, `Sydney gives many residents and visitors access to nature close to the city. Beaches, parks, cliffs, and coastal paths can be part of ordinary life. But nature near a city also needs protection. Crowds, litter, climate change, and development can damage places people enjoy. Students can describe outdoor activities, compare nature in different cities, and discuss simple responsibilities for visitors and residents. They can also plan a weekend in Sydney for someone who wants fresh air, exercise, and local experiences.`),
    ],
  },
];

export function getDestinationById(id: string) {
  return WORLD_DESTINATIONS.find((destination) => destination.id === id);
}
