# Class lens: concept

Written 20 October 2026 by Claude, from the owner's idea.

**Decided by the owner (20 Oct):**
- Students can vote for the lens.
- News and Politics are turned on per class.
- A lens stays for the whole lesson by default.
- Phase 1 lenses: Films and TV, Music, Sport, Food, News (per class), and the kid lenses.
- Every class type can use a lens, and free-talk classes are offered it first.
- Codex prepares the content (`docs/lens-content-brief.md`).

## The idea

A class can look at everything through a **lens**: films, music, sport, food, news, politics, science and more. Every
topic, facts board, "Where next?" suggestion and journey moment is then seen from that angle.

- Topic **China**, lens **Films**: the facts board covers Chinese cinema, animation and famous actors. Where next leads
  to Japanese animation or the history of kung fu films.
- The same topic with **Music**: C-pop, traditional instruments, a famous concert hall.
- The same topic with **News**: what is in the news about China this week, explained calmly.
- Flying over Vietnam with **Food**, the Look card is about pho. Passing Japan with **Films**, it is Studio Ghibli.

**Why it matters:** a conversation class works best when every topic connects to something the students care about.
One angle across a whole lesson gives the talk a thread, and the vocabulary builds on itself (a Films lesson keeps using
*director, scene, plot, character*). We saw this by accident when China came out all Olympics. The lens makes it a
choice.

## Lenses

### Teen and adult lenses

| Lens | What every topic turns into |
| --- | --- |
| Films and TV | famous films, studios, actors, how films get made there |
| Music | artists, instruments, styles, concerts, songs kids might know |
| Sport | teams, athletes, big events, how a sport started |
| Food | dishes, ingredients, eating customs, markets |
| News | what is happening there now, explained calmly (teens, see Care) |
| Politics and society | how it is governed, big debates, several viewpoints (teens, see Care) |
| Science and tech | inventions, scientists, space, how things work |
| History | turning points, famous people, how the past shaped today |
| Art and design | buildings, painting, fashion, street art |
| Nature and environment | animals, landscapes, climate, protecting places |
| Money and business | famous companies, jobs, what things cost |
| Games | video games, board games, traditional games |
| Travel | what to see and do, how to get around, customs to know |

### Kid lenses (Junior classes)

Short, friendly and picture-first. These are never news or politics.

| Lens | What every topic turns into |
| --- | --- |
| Animals | the animals that live there, what they eat, babies, record-breakers |
| Space | stars, planets, astronauts, the sky above that place |
| Dinosaurs and fossils | what lived there long ago |
| Cartoons and stories | famous cartoons, fairy tales and story characters from there |
| Yummy food | sweets, snacks and fun food |
| Sport and games | playground games, kids' sports, toys |
| Inventions and robots | cool machines and who invented them |
| Weather and nature | rain, snow, volcanoes, rainbows |

A kid lens also changes the tone everywhere: shorter cards, easier questions, picture words on the phones, and the
facts board's picture search tuned to child-friendly photos.

## Where the lens applies

1. **Facts board:** the cards for any topic, written through the lens.
2. **Where next?:** the next topics stay in the lens.
3. **Journey moments:** Look cards for places, landmarks, countries and live events, angled through the lens. For
   example, an earthquake with a Science lens explains plates; with a News lens it covers how people help.
4. **Talking points and prompts:** Warm-up, Opinion and Would you rather questions lean into the lens.
5. **Activities and games:** quiz, vocabulary and debate content generated from the current topic takes the lens too
   (a Flash Quiz about Japan with a Films lens asks about Japanese films).
6. **Phone vocabulary and phrasebook:** words for the lens (Films: *director, scene, sequel*), so the vocabulary grows
   across the lesson.

## How a teacher chooses it

- **Class setting:** "This class talks through music", remembered for every lesson. The default is no lens.
- **Per lesson:** a lens picker at boarding, next to the class type. Free-talk classes are offered it first.
- **Class vote:** the phones vote on the lens at boarding (a quick poll). It works well with teens.
- **Change any time:** a small "Lens: Films" chip near the topic, tap to switch or turn off. The facts board refreshes.
- On the shared screen it is subtle: a small lens icon on the topic label, and a line on the facts board ("China, seen
  through Films").

## Care (kids and teens)

- **News and Politics are teen lenses only** and are off by default. The teacher turns them on per class.
- Always neutral and factual, with **more than one viewpoint** on anything disputed, and nothing graphic.
- No election predictions, no telling students what to think, no living politicians as jokes.
- News comes from a dated source, with the date shown on the card, never presented as live when it is not.
- **Kid lenses** never touch news, politics, war or disasters. An event moment on a kid lens is told in its gentlest
  form (a volcano as "how volcanoes work").
- Characters and brands: talk about them; never copy their artwork. Photos come from Wikimedia, as now.

## How it works (in short)

- One setting, `lens`, on the class (default) and on the lesson (override). It is passed into every place that writes
  content: the focus route (facts board, Where next), the moment cards, the talking-point prompts, and the generate
  routes for quiz and vocabulary activities.
- Each lens has a short brief that says what to look for ("Films: famous films and studios from or about this topic,
  how they were made, actors kids may know"), plus a kid version of that brief.
- **Ready-made cards:** the 300 route places and 150 everyday topics are written with no lens. Two options:
  - with a lens on, the room writes the cards live;
  - or Codex prepares lens cards for the most-used places, which keeps those instant.
- **Cache:** generated cards are cached per topic and lens, so a second class doing "China with Films" opens instantly.

## What Codex can prepare

- **Lens briefs:** the instruction text for every lens, adult and kid, with good and bad examples.
- **Lens vocabulary:** 15 to 20 core words and sentence stems per lens, at A1 and B1.
- **Lens cards for the top places:** the 50 most-used route places × the 6 most popular lenses, checked like the route
  cards.
- **Where-next seeds:** for each lens, a list of good follow-on topics, so suggestions stay interesting.
- **Kid-safe photo searches** per kid lens.

## Phases

1. **Lens on the facts board and Where next:** one lens picker at boarding plus the topic chip. Live AI only. This
   proves the idea in a real class.
2. **Moments and talking points:** journey Look cards and prompts follow the lens. Class default setting and class vote.
3. **Activities:** quiz, vocabulary and debate content take the lens. Phone vocabulary per lens.
4. **Prepared content:** Codex's lens cards for top places, lens vocabulary, cache, kid lenses polished.

## Questions for the owner

1. Which lenses for phase 1? I would start with Films, Music, Sport, Food and Animals (kid), plus News for teens.
2. Should students be able to vote for the lens, or is it always the teacher's choice?
3. News and Politics: off by default and turned on per class, or never for under-13s at all?
4. Should a lens stay for the whole lesson by default, or reset when the topic changes?
5. Free-talk only at first, or every class type from the start?
