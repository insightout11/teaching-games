import type { DestinationCitation } from '@/lib/world-flight/types';
import { countWords, type WorldFlightReadingLevels } from '@/lib/world-flight/readings';

export interface DestinationReadingSeed {
  cityId: string;
  focusId: string;
  city: string;
  title: string;
  skills: string[];
  sourceText: string;
  citations: DestinationCitation[];
}

export interface DestinationReadingPack {
  id: string;
  levels: WorldFlightReadingLevels;
  citations: DestinationCitation[];
  reviewedAt: string;
}

type ReadingLens = 'environment' | 'movement' | 'history' | 'culture' | 'design' | 'economy' | 'public-life';

const SENTENCE_SPLIT = /(?<=[.!?])\s+/;
const CLASSROOM_DIRECTION =
  /\bfor students?\b|\b(students?|the class|class members|learners?|teachers?)\s+(can|could|should|will|must|need to|are asked to|is asked to|learn|practice|compare|design|write|map|debate|discuss|see)\b|\bhelps? (students?|the class|learners?)\b|\bdesign a\b|\bwrite a\b|\bhold a\b|\bcompare (it|this|a|the|two|their|your)\b/i;

const CITY_NAMES: Record<string, string> = {
  amsterdam: 'Amsterdam',
  bangkok: 'Bangkok',
  beijing: 'Beijing',
  berlin: 'Berlin',
  bogota: 'Bogotá',
  'buenos-aires': 'Buenos Aires',
  cairo: 'Cairo',
  'cape-town': 'Cape Town',
  dubai: 'Dubai',
  'hong-kong': 'Hong Kong',
  honolulu: 'Honolulu',
  istanbul: 'Istanbul',
  jakarta: 'Jakarta',
  lagos: 'Lagos',
  lima: 'Lima',
  london: 'London',
  'los-angeles': 'Los Angeles',
  'mexico-city': 'Mexico City',
  miami: 'Miami',
  moscow: 'Moscow',
  mumbai: 'Mumbai',
  nairobi: 'Nairobi',
  'new-york': 'New York',
  paris: 'Paris',
  perth: 'Perth',
  reykjavik: 'Reykjavik',
  'rio-de-janeiro': 'Rio de Janeiro',
  rome: 'Rome',
  seoul: 'Seoul',
  singapore: 'Singapore',
  sydney: 'Sydney',
  tokyo: 'Tokyo',
  toronto: 'Toronto',
  vancouver: 'Vancouver',
};

function topicFromTitle(title: string): string {
  return title.includes(' - ') ? title.split(' - ').slice(1).join(' - ') : title;
}

function stableIndex(value: string, length: number): number {
  let hash = 0;
  for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return hash % length;
}

function contextualizeLensParagraphs(paragraphs: string[], city: string, topic: string): string[] {
  const contextSentences = [
    `In ${city}, these connections shape how the issue appears in daily life.`,
    `This pattern is especially important in the way ${city} manages the issue.`,
    `The consequences are visible in both public decisions and everyday life across ${city}.`,
    `That relationship places the issue within the wider life of ${city}.`,
    `The local result depends on the institutions, communities, and geography of ${city}.`,
    `This is why the issue cannot be separated from the wider development of ${city}.`,
    `In ${city}, the issue makes these competing needs unusually visible.`,
    `The example also shows how broad systems become practical choices in ${city}.`,
    `This pattern connects individual experience with citywide decisions in ${city}.`,
    `The way ${city} responds reveals which needs receive the most attention.`,
    `For ${city}, the issue links a visible feature to less visible systems and decisions.`,
    `The effects in ${city} depend on who can participate and who carries the greatest burden.`,
    `The issue shows how citywide systems influence ordinary choices in ${city}.`,
    `This connection helps explain why the subject remains important to ${city}.`,
    `The question reaches beyond one site because it affects the wider life of ${city}.`,
    `In ${city}, the issue brings long-term planning and daily experience together.`,
    `The result reflects both the physical setting and public priorities of ${city}.`,
    `This connection makes the subject a citywide question for ${city}.`,
    `The issue reveals how a decision in one part of ${city} can affect many others.`,
    `Across ${city}, the same issue can look different from one community to another.`,
    `The example shows how ${city} balances immediate needs with longer-term effects.`,
    `This is one way large public systems become visible in everyday life across ${city}.`,
    `The subject also reveals how ${city} changes while preserving important relationships.`,
    `Its significance depends on the choices ${city} makes over time.`,
  ];

  return paragraphs.map((paragraph, index) => {
    if (paragraph.includes(city) && paragraph.includes(topic)) return paragraph;
    const context = contextSentences[stableIndex(`${city}/${topic}/${index}`, contextSentences.length)];
    return `${paragraph} ${context}`;
  });
}

function cleanSourceParagraphs(sourceText: string): string[] {
  return sourceText
    .split(/\n\s*\n/)
    .map((paragraph) => {
      const sentences = paragraph.split(SENTENCE_SPLIT);
      const includesClassroomDirection = sentences.some((sentence) => CLASSROOM_DIRECTION.test(sentence.trim()));
      return sentences
        .filter((sentence) => !CLASSROOM_DIRECTION.test(sentence.trim()))
        .filter((sentence) => !(includesClassroomDirection && sentence.trim().endsWith('?')))
        .join(' ')
        .trim();
    })
    .filter(Boolean);
}

function takeParagraphsToWordLimit(paragraphs: string[], limit: number): string[] {
  const selected: string[] = [];
  let words = 0;

  for (const paragraph of paragraphs) {
    const sentences = paragraph.split(SENTENCE_SPLIT);
    const kept: string[] = [];
    for (const sentence of sentences) {
      const sentenceWords = countWords(sentence);
      if (words + sentenceWords > limit && selected.length + kept.length > 0) break;
      kept.push(sentence);
      words += sentenceWords;
    }
    if (kept.length > 0) selected.push(kept.join(' '));
    if (words >= limit) break;
  }

  return selected;
}

function readingLens(skills: string[], title: string): ReadingLens {
  const terms = `${skills.join(' ')} ${title}`.toLowerCase();
  if (/(water|climate|nature|environment|biodiversity|disaster|earthquake|heat|forest|beach|river)/.test(terms)) {
    return 'environment';
  }
  if (/(transport|movement|ferry|freeway|cycling|commute|route|transit)/.test(terms)) return 'movement';
  if (/(history|heritage|memory|museum|literature|memorial|colonial|indigenous)/.test(terms)) return 'history';
  if (/(architecture|urban design|urban planning|design|public space|housing|infrastructure)/.test(terms)) return 'design';
  if (/(commerce|economy|work|business|enterprise|market|production)/.test(terms)) return 'economy';
  if (/(culture|food|language|identity|fashion|music|art|media|festival|daily life)/.test(terms)) return 'culture';
  return 'public-life';
}

function easyLensParagraphs(lens: ReadingLens, city: string, topic: string): string[] {
  const sharedEnding = `${topic} is therefore more than a famous fact about ${city}. It is one way to understand how a city works and what its residents value.`;
  const paragraphs: Record<ReadingLens, string[]> = {
    environment: [
      `The natural setting around ${city} affects daily life. Water, weather, land, plants, buildings, and public services are connected. ${topic} makes some of those connections easier to see.`,
      `A change in one part of the system can affect many people. Heavy rain, heat, dry weather, or damaged land can change travel, work, health, and the cost of keeping a city safe.`,
      `Cities can respond with strong infrastructure, clear rules, public information, and long-term care. These choices often work best when local knowledge and scientific evidence are used together.`,
      sharedEnding,
    ],
    movement: [
      `Movement shapes the size and rhythm of ${city}. A route is useful only when people can reach it, understand it, afford it, and trust it to work.`,
      `${topic} affects more than travel time. It can change access to jobs, schools, shops, parks, and family. It can also change noise, air quality, and the amount of public space.`,
      `No transport choice works equally well for everyone. Cost, safety, distance, disability, weather, and crowded streets all affect which journeys are possible.`,
      sharedEnding,
    ],
    history: [
      `Places in ${city} hold evidence from different periods. Buildings, names, objects, maps, and public traditions can show what earlier communities built and believed.`,
      `${topic} also raises questions about memory. A city chooses what to protect, what to explain, and what to leave less visible. Those choices shape how the past is understood today.`,
      `History is not separate from modern life. Older decisions can still affect streets, institutions, identities, and relationships between groups of people.`,
      sharedEnding,
    ],
    culture: [
      `Culture grows through repeated choices in everyday life. People use food, clothing, language, music, art, and celebrations to show belonging and share ideas.`,
      `${topic} changes as people move, technology develops, and new audiences participate. Change can keep a tradition active, but it can also create debate about meaning and ownership.`,
      `A cultural practice can be personal and public at the same time. It may carry family memories while also becoming part of the image that ${city} presents to visitors.`,
      sharedEnding,
    ],
    design: [
      `Design affects how people experience ${city}. Streets, buildings, signs, parks, and services guide movement and make some activities easier than others.`,
      `${topic} shows that a place is never shaped by appearance alone. Decisions about space also affect safety, comfort, access, cost, and who feels welcome.`,
      `Good city design must work for many people over a long time. That usually means balancing different needs instead of finding one perfect answer.`,
      sharedEnding,
    ],
    economy: [
      `A city economy is made from many connected jobs and decisions. Goods, services, skills, transport, money, and trust all help daily business continue.`,
      `${topic} shows how large systems depend on individual workers and small organizations. Their choices affect price, access, quality, and the character of ${city}.`,
      `Economic growth can create opportunity, but benefits and risks are not always shared equally. Rules, public investment, and changing demand can alter who succeeds.`,
      sharedEnding,
    ],
    'public-life': [
      `Public life develops in the places people share. Streets, parks, institutions, businesses, and gathering spaces help residents meet needs and encounter one another.`,
      `${topic} reveals some of the choices behind daily life in ${city}. It affects who can participate, what behavior is expected, and how people understand the place.`,
      `Shared spaces often serve several purposes at once. Their value depends on access, care, clear rules, and the ability to change when residents' needs change.`,
      sharedEnding,
    ],
  };
  return paragraphs[lens];
}

function standardLensParagraphs(lens: ReadingLens, city: string, topic: string): string[] {
  const paragraphs: Record<ReadingLens, string[]> = {
    environment: [
      `${topic} can be understood as part of an urban environmental system. Natural conditions around ${city} interact with buildings, transport, utilities, public health, and the routines of residents. When one part changes, effects can travel through the rest of the city.`,
      `Responses usually combine physical infrastructure with human behavior. Engineering can reduce risk, but maintenance, public information, rules, and neighborhood knowledge determine whether a plan works in practice. The strongest response is rarely a single structure or policy.`,
      `Environmental choices also raise questions of fairness. People do not have the same exposure to danger or the same resources to recover. A plan that improves the city overall may still leave particular neighborhoods carrying more cost or risk.`,
    ],
    movement: [
      `${topic} shows that transport is a network rather than a collection of vehicles. The usefulness of a route depends on connections, frequency, cost, signs, safety, and the distance between a stop and a person's real destination.`,
      `Movement systems shape land use and opportunity across ${city}. Reliable access can support work and education, while slow or expensive journeys can isolate residents. The same project may shorten one journey while making another neighborhood noisier or less connected.`,
      `Transport policy therefore involves tradeoffs among speed, public space, pollution, cost, and access. The most visible vehicle is only one part of a much larger system of choices.`,
    ],
    history: [
      `${topic} is evidence of how ${city} remembers its past. Preservation does not simply freeze history. Institutions and communities decide which objects, places, names, and stories receive attention and how they are explained.`,
      `Those decisions can change over time as new evidence appears and groups that were previously excluded gain a stronger public voice. A familiar landmark may then be understood not as one simple symbol, but as a place connected to several experiences.`,
      `The value of historical study lies partly in this complexity. It links earlier decisions to present streets, institutions, identities, and disagreements without assuming that every resident remembers the city in the same way.`,
    ],
    culture: [
      `${topic} demonstrates how culture is produced through participation. A practice may begin in a particular community, yet it changes as new generations, migrants, businesses, media, and visitors become involved.`,
      `Visibility can bring recognition and economic opportunity, but it can also simplify a complex practice into an image that is easy to sell. People may disagree about which changes are creative, respectful, commercial, or harmful.`,
      `In ${city}, cultural life is therefore both inherited and continually made. Its meaning depends on who participates, whose voice is heard, and whether people can adapt a tradition while keeping important relationships intact.`,
    ],
    design: [
      `${topic} reveals that urban design is a form of decision-making. The arrangement of routes, entrances, buildings, open space, signs, and services influences behavior before any official instruction is given.`,
      `A design may appear successful from one viewpoint while creating difficulty from another. Efficiency, beauty, heritage, housing, safety, climate resilience, and public access can point toward different solutions.`,
      `${city}'s choices become more useful when their long-term effects are considered. Construction is only the beginning; maintenance, changing population needs, cost, and the ability to adapt determine whether a place continues to work.`,
    ],
    economy: [
      `${topic} connects the public image of ${city} with the less visible systems that support work. Supply chains, transport, skills, finance, regulation, and relationships between workers and customers all shape what can be produced and sold.`,
      `Economic activity can strengthen a neighborhood by creating income and useful services. It can also raise costs, increase competition, or make workers vulnerable when demand, technology, or rules change quickly.`,
      `The central issue is not simply whether an activity grows. It is how opportunity, risk, decision-making power, and the value created by that activity are distributed across the city.`,
    ],
    'public-life': [
      `${topic} provides a window into public life in ${city}. Shared institutions and spaces do more than serve a practical function; they establish expectations about access, behavior, belonging, and responsibility.`,
      `The same place can be experienced differently according to age, income, language, mobility, or familiarity with local rules. A public resource is most effective when people can understand it and use it without unnecessary barriers.`,
      `Public life remains active because residents and institutions keep negotiating how shared places should change. That process can be slow, but it is how a city responds to new needs without losing every existing relationship.`,
    ],
  };
  return paragraphs[lens];
}

function advancedLensParagraphs(lens: ReadingLens, city: string, topic: string): string[] {
  const paragraphs: Record<ReadingLens, string[]> = {
    environment: [
      `${topic} is best understood as part of a coupled urban and environmental system. Conditions around ${city} interact with engineered infrastructure, land use, public health, transport, economic activity, and household routines. A change that begins with water, heat, soil, weather, or habitat can therefore produce effects far beyond the original site.`,
      `Cities often respond through a combination of construction, regulation, maintenance, forecasting, and public communication. Each measure addresses a different part of the problem, and none removes uncertainty. Infrastructure can fail if it is poorly maintained, while technically sound plans can fail when they overlook how residents actually live and move.`,
      `The distribution of risk is a central issue. Exposure, political influence, income, health, and access to services vary across a city. An intervention may improve average conditions while leaving a particular group with greater danger, higher costs, or less control over decisions that affect its future.`,
      `For ${city}, the lasting value of ${topic.toLowerCase()} lies in the relationships it makes visible. Environmental resilience depends not only on resisting a shock, but on learning, adapting, and deciding fairly which places and people receive protection.`,
    ],
    movement: [
      `${topic} demonstrates that mobility is produced by an entire network rather than by vehicles alone. Routes, transfers, frequency, ticketing, signs, accessibility, maintenance, and the final distance to a destination determine whether movement is genuinely available. A fast service can still exclude people if another part of the journey fails.`,
      `Transport networks reshape ${city} by influencing where homes, jobs, schools, shops, and public services can operate. They create valuable connections, but they may also divide neighborhoods, concentrate pollution, consume public space, or make access dependent on income and physical ability.`,
      `Every mobility policy therefore distributes benefits and burdens. Speed, reliability, safety, cost, emissions, land value, and public space rarely improve at the same rate for everyone. Measuring success requires attention to whose journeys become easier and whose become longer, riskier, or more expensive.`,
      `${topic} matters because transport is ultimately about participation. The ability to move through a city determines which opportunities, relationships, and institutions a person can realistically reach.`,
    ],
    history: [
      `${topic} shows that public memory is constructed rather than simply inherited. In ${city}, institutions and communities decide which buildings, objects, names, and accounts receive protection, where they are displayed, and what explanations accompany them. Those decisions give some histories greater visibility than others.`,
      `Interpretations change as evidence is reexamined and groups that were once excluded gain a stronger public voice. A landmark can remain physically unchanged while its meaning shifts. New labels, memorials, research, or public debate may reveal relationships involving power, migration, labor, loss, or resistance that an earlier account minimized.`,
      `Preservation also creates practical tensions. Protecting a place can support education and identity, yet it can restrict new uses, attract tourism, or turn a living community into a simplified historical image. Removing a difficult symbol may reduce harm while also changing the evidence available for future interpretation.`,
      `${topic} is therefore valuable not because it offers one final story about ${city}, but because it makes the process of remembering visible. It asks who has authority to describe the past and how that description shapes present choices.`,
    ],
    culture: [
      `${topic} illustrates how culture is created through repeated participation rather than preserved as a fixed object. In ${city}, individuals and communities adapt inherited practices as generations change, people migrate, technology develops, businesses respond to demand, and new audiences become involved.`,
      `Greater visibility can produce recognition, income, and opportunities for creative exchange. It can also compress a complex practice into a marketable image. When that happens, disagreements often emerge over authenticity, ownership, access, and whether the people most closely connected to the practice still control how it is represented.`,
      `Cultural change is neither automatically a loss nor automatically progress. A practice may survive precisely because participants adapt it, while a popular new form may remove the relationships or knowledge that once gave it meaning. Careful interpretation must therefore examine who is changing the practice and under what conditions.`,
      `Seen through ${topic.toLowerCase()}, ${city} is not simply a container for culture. It is an active setting in which identity, memory, creativity, commerce, and public attention continually influence one another.`,
    ],
    design: [
      `${topic} demonstrates that urban design is a material form of governance. The placement of routes, thresholds, buildings, open space, signs, and services directs movement and establishes expectations before any rule is spoken. Design determines not only what a place looks like, but which actions are convenient, difficult, visible, or excluded.`,
      `No design serves every objective equally. Efficiency may conflict with heritage; additional housing may alter views; security measures may reduce openness; and a celebrated public space may remain inaccessible to people who cannot afford nearby transport or services. Evaluating a project requires examining these competing effects rather than relying on appearance alone.`,
      `Time adds another layer. Construction receives attention, but maintenance, climate, changing population needs, operating cost, and the ability to adapt determine whether a design continues to work. A solution that appears successful on opening day may create rigid or expensive problems later.`,
      `${topic} makes ${city}'s priorities legible. It reveals which users and activities were considered during planning, whose needs were treated as secondary, and how future decisions might distribute space and opportunity differently.`,
    ],
    economy: [
      `${topic} links the visible economy of ${city} to systems that are easier to overlook. Supply chains, transport, finance, regulation, technology, skills, informal relationships, and public infrastructure all influence what can be produced, sold, repaired, or experienced.`,
      `Growth can create income, useful services, and new forms of specialization. It can also increase rents, intensify competition, shift risk onto workers, or make a neighborhood dependent on a narrow source of demand. The value created by an activity is not necessarily received by the people who contribute most directly to it.`,
      `Economic systems are especially revealing during disruption. Changes in fuel cost, weather, tourism, technology, regulation, or consumer habits expose which businesses can adapt and which workers lack protection. Flexibility is valuable, but it should not be confused with security.`,
      `${topic} therefore raises a distributional question for ${city}: not only how an economy expands, but who has decision-making power, who carries uncertainty, and who can participate in the opportunities that result.`,
    ],
    'public-life': [
      `${topic} offers a way to examine how public life is organized in ${city}. Shared spaces and institutions provide practical services, but they also establish expectations about access, behavior, belonging, and responsibility. Their design and rules communicate who is imagined as a normal user.`,
      `People experience the same resource differently according to income, age, language, mobility, working hours, and familiarity with local customs. Formal public access is therefore not enough by itself. Cost, information, safety, transport, and social welcome determine whether participation is realistic.`,
      `Shared places also hold competing purposes. A space used for rest may also support commerce, ceremony, protest, movement, or tourism. Conflict does not necessarily mean that the space has failed; it may show that the place matters to groups with legitimate but different needs.`,
      `${topic} reveals public life as an ongoing negotiation. The quality of a city depends partly on whether residents can understand, use, question, and help reshape the systems they share.`,
    ],
  };
  return paragraphs[lens];
}

function synthesisParagraph(lens: ReadingLens, city: string, topic: string): string {
  const paragraphs: Record<ReadingLens, string> = {
    environment: `Examining ${topic.toLowerCase()} in ${city} therefore requires more than describing the natural setting. The important questions concern how environmental conditions, infrastructure, public decisions, and daily routines affect one another. Evidence about who receives protection, who carries risk, and how the system changes over time helps distinguish a durable response from a solution that only appears successful at first.`,
    movement: `${topic} provides a practical test of mobility in ${city}. Its value depends on the complete journey and on the different people trying to make it, not simply on the speed or visibility of one route. Looking at access, reliability, cost, safety, and effects on surrounding neighborhoods reveals whether the network expands participation or merely moves existing advantages elsewhere.`,
    history: `A careful account of ${topic.toLowerCase()} must therefore connect historical evidence with the choices ${city} makes in the present. The strongest interpretation acknowledges disagreement, identifies whose perspectives shaped the surviving record, and explains why the story still matters. That approach treats history as an active public responsibility rather than a collection of facts separated from modern city life.`,
    culture: `Understanding ${topic.toLowerCase()} in ${city} finally depends on examining both continuity and change. Attention to the people who create, adapt, finance, perform, and represent the practice reveals more than a famous image can show. It also makes it possible to ask whether wider recognition strengthens the relationships behind the culture or replaces them with a simpler version designed mainly for outsiders.`,
    design: `${topic} can therefore be evaluated by tracing how people actually use it across time. In ${city}, appearance is only the most visible evidence; access, maintenance, operating cost, adaptability, and effects on nearby communities reveal whether the design works. Comparing intended goals with lived results also shows which tradeoffs were accepted and whose needs should receive more attention in future decisions.`,
    economy: `The wider significance of ${topic.toLowerCase()} lies in how it distributes opportunity and uncertainty across ${city}. Following the movement of money, labor, materials, knowledge, and decision-making power reveals who makes the activity possible and who benefits from it. This systems view also helps explain why the same economic change can create security for one group while increasing pressure or risk for another.`,
    'public-life': `${topic} is therefore a useful measure of public life in ${city}. Its success depends not only on whether it exists, but on whether different residents can understand, reach, use, and influence it. Examining barriers, competing purposes, and changes over time reveals how a shared resource can support belonging while still requiring debate, care, and revision.`,
  };
  return paragraphs[lens];
}

function evidenceParagraph(lens: ReadingLens, city: string, topic: string): string {
  const paragraphs: Record<ReadingLens, string> = {
    environment: `Evidence about ${topic.toLowerCase()} comes from both measured conditions and lived experience in ${city}. Maps, environmental records, infrastructure performance, and public-health data reveal broad patterns, while accounts from affected communities show how those patterns shape daily decisions. Together, these forms of evidence expose gaps that an average or citywide statistic can hide.`,
    movement: `The effects of ${topic.toLowerCase()} become clearer when network maps and travel data are considered alongside daily experience in ${city}. Ridership and journey times describe broad patterns, while accounts of missed connections, unsafe crossings, high fares, or inaccessible stations reveal obstacles that systemwide averages can overlook.`,
    history: `Evidence surrounding ${topic.toLowerCase()} may include physical remains, official records, photographs, oral histories, and later interpretations. These sources do not always agree, and their survival is often uneven. Reading them together helps explain both what happened in ${city} and why different groups may understand its significance differently.`,
    culture: `The meaning of ${topic.toLowerCase()} is visible in performances, objects, language, businesses, archives, and the accounts of participants. No single source represents all of ${city}'s cultural life. Contrasting public images with community experience reveals which elements remain rooted in relationships and which have been reshaped for wider attention.`,
    design: `Plans and photographs can document the intended form of ${topic.toLowerCase()}, but its real effects appear through use, maintenance records, access patterns, and changes in the surrounding area. Considering these forms of evidence together allows ${city}'s design choices to be judged by their results as well as their stated aims.`,
    economy: `Statistics can show the scale of activity connected to ${topic.toLowerCase()}, but they do not explain the full experience of work in ${city}. Business records, prices, employment conditions, supply chains, and worker accounts reveal how value and risk move through the system, including contributions that formal measures may overlook.`,
    'public-life': `The character of ${topic.toLowerCase()} is documented through rules, maps, schedules, observations, and the accounts of people who use or avoid it. Combining these sources shows how a shared resource functions across ${city}, including the difference between formal access and meaningful participation.`,
  };
  return paragraphs[lens];
}

function ensureMinimumWords(
  paragraphs: string[],
  minimum: number,
  fallbackParagraphs: string[],
  closingParagraphs: string[],
): string[] {
  const result = [...paragraphs];
  for (const paragraph of fallbackParagraphs) {
    if (countWords(result.join('\n\n')) >= minimum) break;
    if (!result.includes(paragraph)) result.push(paragraph);
  }
  for (const paragraph of closingParagraphs) {
    if (countWords(result.join('\n\n')) >= minimum) break;
    result.push(paragraph);
  }
  return result;
}

export function buildDestinationReadingPack(seed: DestinationReadingSeed): DestinationReadingPack {
  const city = seed.city || CITY_NAMES[seed.cityId] || seed.cityId;
  const topic = topicFromTitle(seed.title);
  const lens = readingLens(seed.skills, seed.title);
  const sourceParagraphs = cleanSourceParagraphs(seed.sourceText);

  const easyLens = contextualizeLensParagraphs(easyLensParagraphs(lens, city, topic), city, topic);
  const standardLens = contextualizeLensParagraphs(standardLensParagraphs(lens, city, topic), city, topic);
  const advancedLens = contextualizeLensParagraphs(advancedLensParagraphs(lens, city, topic), city, topic);
  const synthesis = synthesisParagraph(lens, city, topic);
  const evidence = evidenceParagraph(lens, city, topic);

  const easy = ensureMinimumWords(
    takeParagraphsToWordLimit(sourceParagraphs, 95),
    150,
    easyLens,
    [synthesis, evidence],
  ).join('\n\n');
  const standard = ensureMinimumWords(
    [...takeParagraphsToWordLimit(sourceParagraphs, 170), ...standardLens],
    225,
    advancedLens,
    [synthesis, evidence],
  ).join('\n\n');
  const advanced = ensureMinimumWords([...sourceParagraphs, ...advancedLens], 300, [], [synthesis, evidence]).join('\n\n');

  return {
    id: `${seed.cityId}/${seed.focusId}`,
    levels: { easy, standard, advanced },
    citations: seed.citations,
    reviewedAt: '2026-06-11',
  };
}
