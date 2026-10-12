# Library Round 36 — metadata corrections and progress

Draft for owner review. Completed locally on 13 October 2026, branch `codex/library-round-36` from `origin/main`. No video was replaced, added or removed.

## Scope and method

- Re-ran the cached-caption inventory against Supabase using the main checkout’s existing `.env.local`, without copying or exposing it. Database reads only; no YouTube fetch, paid service or API generation.
- All 112 refreshed caches were inspected individually in English. The other 529 caption bodies are unchanged from Round 35; retain the previous evidence, with targeted revisits for metadata changes. The audit concerns cached captions, not independently viewed video/audio or scientific fact-checking.
- Changed only titles, descriptions, summaries, tags, CEFR, difficulty labels and visibility fields, plus `publisherLevel` under the owner’s explicit follow-up. IDs, YouTube IDs, URLs, durations, needsReview, reviewNote, source text, retellings and packs are preserved. JSON uses 2-space indentation and preserves original key order; publisherLevel is appended.
- The 340 label disagreements were handled as directed: 108 equivalent names renamed, 120 StoryWeaver labels preserved in publisherLevel, and 112 genuine conflicts individually judged from stored text or captions. Every genuine judgement is listed below. None lacked material.
- Metadata-correction statuses are separate from the initial re-check. Correcting an entry makes its final status `ok` where its metadata now matches the evidence; hidden suitability/source uncertainties keep their outstanding status.

## Checker counts

| Status | Round 35 | Refreshed captions, before edits | After corrections |
|---|---:|---:|---:|
| ok | 444 | 526 | 604 |
| mismatch | 13 | 20 | 1 |
| partial | 32 | 41 | 6 |
| weak-captions | 141 | 30 | 30 |
| no-captions | 0 | 0 | 0 |
| level-off | 11 | 24 | 0 |

Audit coverage: **641/641**, **0 missing**, **0 invalid**, **0 unknown**. Library metadata: **1,388 entries**, **0 hidden without note**, **0 level disagreements**.

All 641 entries still have cached text: 607 timestamped, 34 untimed, 0 same-video fallbacks. Translation-only issues are resolved; the remaining weak-caption findings are sparse/garbled/incomplete English material plus the owner-reported caption-availability concern below.

## Outcomes

- Original 13 hidden mismatches: **12 corrected and unhidden**, **1 kept hidden** (the Titanic account).
- Original 11 level-off entries: **11 corrected**. The refreshed captions exposed **13 further level-off entries**, also corrected.
- Original 32 partials: **26 descriptions/summaries narrowed**, **4 child-suitability entries hidden**, **2 unresolved source/coverage problems hidden**. The four hidden wildlife descriptions remain accurate in subject; their explicit harm details remain in the visibility notes rather than being sanitised away.
- Two additional translated-cache subject mismatches (hydration/glass and material properties/digestion), four Business English mismatches and the airport/directions mismatch are corrected.
- **422 entries** changed across **24 library files**, including the level-label cleanup. Every entry change is listed below.

## Entries left hidden

| Entry | Why / evidence |
|---|---|
| bbc-library.json/bbc-grammar-r2-uTB5I8V9Eog | The cached first-person Titanic survivor account includes “people drowning”; it is not a grammar lesson and does not belong in this grammar-labelled selection. Keep hidden pending an owner decision. |
| bbc-library.json/bbc-grammar-r2-B5hDy53iGNA | Only an untimed future-continuous grammar extract is cached; the be-plus-infinitive section and full video speech cannot be verified. Keep hidden until complete English captions establish the lesson scope. |
| hooks-library.json/hook-r2-eT89nvkYNDM | Evidence: The child-oriented cache says “slurping them up” after external digestion and “eat each other” with an Uncle Brian joke; this is detailed cannibalistic predation. Keep hidden from child-facing recommendations. |
| hooks-library.json/hook-r2-W4og8g_X22o | Evidence: The narration says “bites off the stinger” and “freshly killed scorpion”, giving explicit killing/eating detail. Keep hidden from child-facing recommendations. |
| hooks-library.json/hook-r2-7rOvmN-qfaA | Evidence: The caption describes biting victims, then “liquefy their bodies and suck it all up”; this explicitly describes bodily destruction/eating. Keep hidden from child-facing recommendations. |
| hooks-library.json/hook-r2-xB74swq2LlI | Evidence: The narrator says “spray acid into the crab’s mouth and eyes”, followed by pain dialogue and a survival warning; the attack is described in detail. Keep hidden from child-facing recommendations. |
| hooks-library.json/hook-r2-iTHUUjTA-LI | The owner reports this video has no English captions. A short older English cache remains, but its speech alignment cannot be verified. Keep hidden pending verified English captions. |
| natgeo-library.json/natgeo-sleep-science | The cache identifies an Andrew Huberman podcast and lasts about 82 minutes, against the entry’s 295 seconds and National Geographic attribution. The allowed metadata edits cannot resolve duration/source identity; keep hidden. |

The BBC future-continuous and NatGeo sleep entries were hidden because the permitted edits cannot establish missing scope or repair source/duration identity. The owner reports no English captions for `hooks/hook-r2-iTHUUjTA-LI`; its older 91-word English cache remains. That discrepancy is explicitly recorded rather than reporting the cache as missing.

## Course preset gaps (no code or test edits)

| Preset / lesson | Reference and code line | Actual material / gap |
|---|---|---|
| Travel, Cities & Culture / Airport Journeys | travel-airport; src/lib/course-presets.ts:34 | General travel vocabulary with some check-in/gate content; no dedicated security or announcements walkthrough. |
| Travel, Cities & Culture / Asking For Directions | travel-directions; src/lib/course-presets.ts:48 | Airport/flight English; no city-directions lesson. |
| Food Around the World / Restaurant Language | travel-restaurant; src/lib/course-presets.ts:106 | Tourism discussion compilation; no menu/order/payment model. |
| Job Interview English / Smart Questions | business-interviews; src/lib/course-presets.ts:310 | Team-project language; no questions to ask an interviewer. |
| Job Interview English / Professional Emails | business-emails; src/lib/course-presets.ts:317 | Interview-answer lesson; no follow-up/thank-you email lesson. |
| Job Interview English / Networking Next Steps | business-networking; src/lib/course-presets.ts:324 | Describing jobs; no post-interview networking process. |

Publisher/speaker attribution inconsistencies in protected fields also remain for owner review: the immune-system cache uses a cell-army explanation rather than the named Emma Bryce attribution; DNA explicitly says Stated Clearly; NatGeo Egypt explicitly says John Green/Crash Course. The descriptions now avoid unsupported claims, but speaker fields were not changed. Duration/source alignment for retained compilations remains a separate issue.

## Genuine level conflicts — all 112 judgements

| Entry | Original pair | Chosen pair | Text/caption evidence |
|---|---|---|---|
| african-storybook-library.json/african-storybook-38954 | A2/Beginner | A2/Easy | Granny’s missing location and green/red phone-button instructions use chronological past events and short when clauses. |
| african-storybook-library.json/african-storybook-1881 | A2/Beginner | A2/Easy | The elephant asks repeated why questions, then past-tense action and comparisons explain the trunk. |
| african-storybook-library.json/african-storybook-36489 | A2/Beginner | A2/Easy | Alex’s wolf encounter uses past continuous, when clauses and a chronological rescue, beyond isolated beginner phrases. |
| african-storybook-library.json/african-storybook-48726 | A2/Beginner | A1/Beginner | Sisi’s short sentences introduce animals and a farm with repeated simple actions and basic can/should dialogue. |
| african-storybook-library.json/african-storybook-8979 | B1/Beginner | B1/Intermediate | Tasneem’s long sequence includes jealousy, conditional reactions, passive purpose clauses and a later marriage decision. |
| african-storybook-library.json/african-storybook-15029 | B1/Beginner | B1/Intermediate | The narrator uses had grown up, passive loading and sensory bus-station detail with less common hawker/tout vocabulary. |
| african-storybook-library.json/african-storybook-2058 | B1/Beginner | B1/Intermediate | The hare story combines passive defeat, perfect forms and idioms about grudges, rivals and completing a diplomatic task. |
| african-storybook-library.json/african-storybook-17648 | B1/Beginner | A2/Easy | The rat story repeats who is greater, simple requests and can/cannot comparisons; length comes largely from the repeated pattern. |
| african-storybook-library.json/african-storybook-50056 | B1/Beginner | A2/Easy | The football story follows practice, goals and a final score with short past-tense clauses and familiar celebration vocabulary. |
| african-storybook-library.json/african-storybook-2205 | B1/Beginner | A2/Easy | Jackal’s trick uses short past narrative and direct invitations, with a few contextual words about flattery. |
| african-storybook-library.json/african-storybook-15291 | B1/Beginner | B1/Intermediate | The tree story uses past perfect, conditional friendship pressure, reported wishes and emotional changes across a longer narrative. |
| african-storybook-library.json/african-storybook-36820 | B1/Beginner | B1/Intermediate | Bohlale follows a long dream adventure with hypothetical ability, comparisons, directions and embedded questions. |
| african-storybook-library.json/african-storybook-2112 | B1/Beginner | A2/Easy | The talking-bag story repeats short questions and answers around a simple chronological journey and rescue. |
| african-storybook-library.json/african-storybook-2651 | B1/Beginner | B1/Intermediate | Demane’s long rescue uses past perfect, passive mistreatment and carrying-away clauses, reported lies and conditional promises. |
| african-storybook-library.json/african-storybook-13542 | B1/Beginner | A2/Easy | The meat story repeats past actions, simple accusations and a river rescue with a limited set of concrete verbs. |
| african-storybook-library.json/african-storybook-16535 | B1/Beginner | A2/Easy | Nita’s verse uses concrete body/appearance words and short comparisons, with a few idioms and present-perfect forms beyond bare A1. |
| african-storybook-library.json/african-storybook-9809 | B1/Beginner | B1/Intermediate | Wangari’s biography includes passive schooling, past perfect and paired comparative clauses connecting learning to later environmental action. |
| african-storybook-library.json/african-storybook-36715 | B1/Beginner | B1/Intermediate | Kisara’s rules use relative clauses, passive turn selection, ranking and conditional profit explanations across a longer procedure. |
| african-storybook-library.json/african-storybook-15028 | B1/Beginner | B1/Intermediate | Donkey’s story includes a counterfactual about remaining small, reported intentions, emotional inference and perfect forms. |
| african-storybook-library.json/african-storybook-50308 | B1/Beginner | A2/Easy | Kela’s school and home changes use mostly familiar past narrative, short reasons and household actions. |
| african-storybook-library.json/african-storybook-36914 | B1/Beginner | B1/Intermediate | Nido’s longer narrative embeds reported plans and explanations of friends’ future refusal, alongside habitual would. |
| african-storybook-library.json/african-storybook-34111 | B1/Beginner | B1/Intermediate | Wayan’s conservation story connects fishing, pollution, illness and community decisions through passive events and longer cause/effect clauses. |
| african-storybook-library.json/african-storybook-23861 | B1/Beginner | A2/Easy | Aku’s story repeats food requests and bigger/biggest comparisons in a concrete past-tense sequence. |
| african-storybook-library.json/african-storybook-17985 | B1/Beginner | B1/Intermediate | Wardit’s longer marriage/family narrative uses embedded thoughts, future hypotheticals, kinship terms and reported motives. |
| african-storybook-library.json/african-storybook-34756 | B1/Beginner | B1/Intermediate | The road-safety account uses habitual would, descriptive action verbs, passive injury and community petition language. |
| african-storybook-library.json/african-storybook-21728 | B1/Beginner | A2/Easy | The bag-making story uses concrete pattern/strap instructions and sequence markers, with occasional conditionals and passive sewing. |
| african-storybook-library.json/african-storybook-13636 | B1/Beginner | A2/Easy | The grandmother visit uses familiar family/travel actions in past sequence, simple when clauses and chores. |
| african-storybook-library.json/african-storybook-39472 | B1/Beginner | A2/Easy | Hully’s short school story uses past actions, basic comparisons and direct speech; a few perfect/passive forms are contextual. |
| african-storybook-library.json/african-storybook-35268 | B1/Beginner | A2/Easy | Duma describes family routines and basic handwashing imperatives with short reasons for changed behaviour. |
| african-storybook-library.json/african-storybook-36998 | B1/Beginner | B1/Intermediate | Lindiwe’s account uses passive competition awards, past perfect, reported plans and words such as disembarked and privileged. |
| african-storybook-library.json/african-storybook-12169 | B1/Beginner | A2/Easy | The farmer story uses a clear past sequence, habitual would and concrete crop/theft actions. |
| african-storybook-library.json/african-storybook-39123 | B1/Beginner | A2/Easy | Omotola gives direct, sequenced instructions with everyday cleaning/cooking objects and concrete action verbs. |
| african-storybook-library.json/african-storybook-20771 | B1/Beginner | B1/Intermediate | Petros’s long account includes perfect forms, hypothetical danger, conditional searching and reflective advice. |
| african-storybook-library.json/african-storybook-19876 | B1/Beginner | A2/Easy | The unity race is a chronological itinerary with repeated running/joining actions; place names add length rather than abstract syntax. |
| african-storybook-library.json/african-storybook-22166 | B1/Beginner | B1/Intermediate | Cassava/Palm debate uses purpose/passive clauses, hypothetical oil use and specialised agricultural terms for products and plant parts. |
| african-storybook-library.json/african-storybook-47814 | B1/Beginner | A2/Easy | The monkey trick follows concrete household/garden actions and short demands in direct speech. |
| african-storybook-library.json/african-storybook-22542 | B1/Beginner | B1/Intermediate | The rainbow story embeds one narrative inside another, using conditional illness, reported wishes and longer purpose clauses. |
| african-storybook-library.json/african-storybook-36114 | B1/Beginner | A2/Easy | The mask story follows familiar community actions, short quotations and handwashing instructions. |
| african-storybook-library.json/african-storybook-20155 | B1/Beginner | B1/Intermediate | Hyena/Monkey mediation uses first and second conditionals, inferred motives and dispute/judgement vocabulary. |
| bbc-library.json/bbc_masterclass_inversion_2 | B2/Expert | B2/Advanced | Dan explains inverted first/second/third conditionals, place-adverb inversion and so/such emphasis with explicit examples; these advanced constructions support B2 rather than the C1 Expert label. |
| bbc-library.json/bbc_r3ovou_sxhe | A2/Intermediate | A2/Easy | Neil and Georgie discuss running, yoga and spare time with explained vocabulary, simple habit/past questions and a future run plan; this supports A2 rather than Intermediate. |
| destination-reading-library.json/destination-reading-bangkok | B2/Intermediate | B2/Advanced | The profile uses embedded historical clauses, administrative incorporation and unscaffolded terms such as primate city and crippling congestion. |
| destination-reading-library.json/destination-reading-seoul | B2/Intermediate | B2/Advanced | Constitutional status, de facto administration and metropolitan economy are explained through dense embedded clauses. |
| destination-reading-library.json/destination-reading-buenos-aires | B2/Intermediate | B2/Advanced | Autonomous district, federalisation and administrative human-development comparisons require upper-intermediate expository reading. |
| destination-reading-library.json/destination-reading-jakarta | B2/Intermediate | B2/Advanced | Colonial administration, metropolitan status and land subsidence use long multi-clause explanations. |
| destination-reading-library.json/destination-reading-bogota | B2/Intermediate | B2/Advanced | Territorial administrative status, emancipation and foreign direct investment appear in dense encyclopedic clauses. |
| destination-reading-library.json/destination-reading-reykjavik | B2/Intermediate | B1/Intermediate | This short profile follows location, population, founding and tourism directly; a few formal terms sit within a clear factual sequence. |
| destination-reading-library.json/destination-reading-auckland | B2/Intermediate | B2/Advanced | The profile combines council jurisdiction, colonial settlement and census/ethnic-population comparisons in embedded clauses. |
| destination-reading-library.json/destination-reading-suva | B2/Intermediate | B2/Advanced | Restrictive colonial geography, transferred administration and diplomatic/regional headquarters use formal unscaffolded vocabulary. |
| destination-reading-library.json/destination-reading-ulaanbaatar | B2/Intermediate | B2/Advanced | Monastic settlement, independence proclamation, urban planning and primate-city status form dense historical exposition. |
| destination-reading-library.json/destination-reading-almaty | B2/Intermediate | B2/Advanced | Republican significance, regional rankings and international institutional classifications use unscaffolded formal vocabulary. |
| destination-reading-library.json/destination-reading-lisbon | B2/Intermediate | B2/Advanced | Political institutions, diplomacy and GDP/debt-market comparisons require upper-intermediate expository vocabulary. |
| destination-reading-library.json/destination-reading-panama-city | B2/Intermediate | B2/Advanced | Conquistadors, privateer destruction and the trade route use embedded historical clauses and specialised vocabulary. |
| destination-reading-library.json/destination-reading-addis-ababa | B2/Intermediate | B2/Advanced | Occupation, unplanned urban development and tectonic plates appear in dense geopolitical/historical exposition. |
| destination-reading-library.json/destination-reading-ho-chi-minh-city | B2/Intermediate | B2/Advanced | Expansionist/colonial policy and merged provincial status use embedded historical and administrative clauses. |
| destination-reading-library.json/destination-reading-singapore | B2/Intermediate | B2/Advanced | Ideological expulsion, a sovereign federation and PPP-adjusted income appear in dense geopolitical exposition. |
| destination-reading-library.json/destination-reading-paris | B2/Intermediate | B2/Advanced | The profile combines metropolitan statistics, architectural movements and international institutions in formal descriptive prose. |
| destination-reading-library.json/destination-reading-london | B2/Intermediate | B2/Advanced | Concentration of institutions, a tidal estuary and economic influence use long enumerations and embedded explanatory clauses. |
| destination-reading-library.json/destination-reading-cairo | B2/Intermediate | B2/Advanced | Agglomeration, predynastic settlement and foreign-direct-investment language support upper-intermediate reading. |
| destination-reading-library.json/destination-reading-dubai | B2/Intermediate | B2/Advanced | Diversification, expatriate population and land reclamation use compact but formal economic exposition. |
| destination-reading-library.json/destination-reading-sydney | B2/Intermediate | B2/Advanced | Penal-colony history, immigration and reserve/transport statistics use embedded explanatory clauses. |
| destination-reading-library.json/destination-reading-berlin | B2/Intermediate | B2/Advanced | Enlightenment, neoclassicism, occupation and industrialisation require formal historical vocabulary. |
| destination-reading-library.json/destination-reading-moscow | B2/Intermediate | B2/Advanced | Imperial capital relocation and federative political status are expressed through long embedded historical clauses. |
| destination-reading-library.json/destination-reading-istanbul | B2/Intermediate | B2/Advanced | Caliphate, strategic trade and imperial transformation require upper-intermediate political/history vocabulary. |
| destination-reading-library.json/destination-reading-vancouver | B2/Intermediate | B2/Advanced | Indigenous settlement, affordability and an urban-design philosophy combine specialised formal vocabulary and relative clauses. |
| destination-reading-library.json/destination-reading-toronto | B2/Intermediate | B2/Advanced | Canadian confederation, incorporation and diversified economic sectors use formal institutional prose. |
| destination-reading-library.json/destination-reading-rome | B2/Intermediate | B2/Advanced | Municipal jurisdiction, classical civilisations and architectural programmes use formal dense historical clauses. |
| destination-reading-library.json/destination-reading-rio-de-janeiro | B2/Intermediate | B2/Advanced | Colonial capitals, municipal GDP and industrial institutions appear in upper-intermediate historical/economic prose. |
| destination-reading-library.json/destination-reading-mexico-city | B2/Intermediate | B2/Advanced | The counterfactual about being an independent economy and progressive policies such as euthanasia use advanced civic vocabulary. |
| destination-reading-library.json/destination-reading-lagos | B2/Intermediate | B2/Advanced | Refineries, financial institutions and regional employers use formal economic description with embedded clauses. |
| destination-reading-library.json/destination-reading-amsterdam | B2/Intermediate | B2/Advanced | International comparisons, governmental institutions and rankings require upper-intermediate formal expository reading. |
| destination-reading-library.json/destination-reading-perth | B2/Intermediate | B2/Advanced | Conurbation, subsumed identity and net migration use specialised urban/economic vocabulary. |
| destination-reading-library.json/destination-reading-madrid | B2/Intermediate | B2/Advanced | Centralised state-building and urban GDP rankings appear in dense abstract historical exposition. |
| destination-reading-library.json/destination-reading-dublin | B2/Intermediate | B2/Advanced | The short Dublin history retains embedded census clauses, invasion/independence history and formal establishment language. |
| destination-reading-library.json/destination-reading-dakar | B2/Intermediate | B2/Advanced | The short Dakar history uses abolition, annexation and federation without simplified definitions. |
| destination-reading-library.json/destination-reading-recife | B2/Intermediate | B2/Advanced | Fiscal incentives, HDI comparisons and tributary geography require formal specialised vocabulary. |
| destination-reading-library.json/destination-reading-santiago | B2/Intermediate | B2/Advanced | Conurbation, independence chronology and geological/architectural descriptions use dense formal exposition. |
| destination-reading-library.json/destination-reading-manila | B2/Intermediate | B2/Advanced | Galleon trade, chartered/autonomous status and land subsidence require upper-intermediate institutional vocabulary. |
| listening-library.json/listening-r7-english-file-introductions | A2/Beginner | A2/Easy | Caption evidence: Birthplace, family, work and pets match basic introductions. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-library.json/listening-r7-english-file-likes-dislikes-1 | A2/Beginner | A2/Easy | Caption evidence: Barcelona, cooking and repeated film viewing match likes. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-library.json/listening-r7-english-file-likes-dislikes-2 | A2/Beginner | A2/Easy | Caption evidence: May, music and fantasy reading match preferences. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-library.json/listening-r7-english-file-names | A2/Beginner | A2/Easy | Caption evidence: Irish heritage and naming after Edward match name origins; spellings are auto-caption variants. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-library.json/listening-r7-english-file-how-often | A2/Beginner | A2/Easy | Caption evidence: Haircuts, eating out, phone replacement and recurring dreams match how-often questions. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-library.json/listening-r7-english-file-tv-movies | A2/Beginner | A2/Easy | Caption evidence: TV time, Dirty Dancing and film endings match viewing preferences. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-library.json/listening-r7-american-english-file-esl-at-a-caf | A2/Beginner | A2/Easy | Caption evidence: Rob and Jenny meet and order espresso/latte at a London café as claimed. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-library.json/listening-r7-american-english-file-esl-spilled-coffee | A2/Beginner | A2/Easy | Caption evidence: Jenny apologises and suggests buying Rob a replacement shirt, matching the spill incident. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-library.json/listening-r7-american-english-file-esl-a-new-shirt | A2/Beginner | A2/Easy | Caption evidence: Size, price, changing rooms and Jenny’s criticism match choosing a new shirt. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-library.json/listening-r7-american-english-file-esl-at-the-airport | A2/Beginner | A2/Easy | Caption evidence: Taxi/train transactions and Rob accepting New York work match the airport good news. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-library.json/listening-r8-school-registration | A2/Beginner | A2/Easy | Caption evidence: Registrar requests, scholarships and a college-program information session match a school announcement; the named institution cannot be independently identified from this cache. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-library.json/listening-r8-school-equipment | A2/Beginner | A2/Easy | Caption evidence: Evidence: The full cache announces a book fair/raffle and science-day reporting, not an equipment announcement. Suggested action: Retitle to School book fair and science-day announcement; verify the institution attribution. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-library.json/listening-r8-school-library | A2/Beginner | A2/Easy | Caption evidence: Book borrowing and library-officer meeting instructions match school library announcements. The cache mentions grades 7/8, so the claimed elementary-school attribution needs source verification; a wrong institution is not proved. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-library.json/listening-r8-school-it | A2/Beginner | A2/Easy | Caption evidence: Computer-room meetings and HDMI/projector instructions match school IT. Grade 7–9 wording makes the elementary-school attribution uncertain. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-library.json/listening-r8-school-sports | A2/Beginner | A2/Easy | Caption evidence: Stretches, exercise and sports-team meetings match PE announcements. Grade 7–9 wording makes the elementary-school attribution uncertain. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-library.json/listening-r8-school-health | A2/Beginner | A2/Easy | Caption evidence: Cleaning supplies, disinfecting and masks match health/hygiene announcements. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-library.json/listening-r8-school-general-affairs | A2/Beginner | A2/Easy | Caption evidence: Furniture, energy, earthquakes and visitor registration match general affairs. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-library.json/listening-r8-school-counselling | A2/Beginner | A2/Easy | Caption evidence: The brief guidance-officer reporting directions are coherent and complete enough for a short listening activity, despite only 38 words. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-library.json/listening-r8-school-records | A2/Beginner | A2/Easy | Caption evidence: Guidance-officer meetings, notice sheets and student-information requests match school records. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-library.json/listening-r8-school-counselling-records | A2/Beginner | A2/Easy | Caption evidence: Evidence: The complete cache announces a special-education committee meeting at 12:10 on the third floor; it does not concern counselling records. Suggested action: Retitle to Special-education committee meeting announcement. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-library.json/listening-r8-weather-report | A2/Beginner | A2/Easy | Caption evidence: Maria reports Chicago temperatures and a five-day forecast as claimed. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-library.json/listening-r8-school-listening-announcement | A2/Beginner | A2/Easy | Caption evidence: Freya and Steve discuss competition dates, registration and eligibility as claimed. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-library.json/listening-r8-school-announcement | A2/Beginner | A2/Easy | Caption evidence: Purple skirts/blazers and sock/pullover colours match a school-uniform announcement. Policy endorsement is outside this audit. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-library.json/listening-r8-school-radio-announcement | A2/Beginner | A2/Easy | Caption evidence: A repeated room/time invitation to organise a glee club matches school radio. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-library.json/listening-r8-weather-intermediate | B1/Beginner | B1/Intermediate | Caption evidence: Temperatures, winds, clear skies and rain chances match the forecast. Short question/answer turns and concrete everyday requests support B1; the Beginner name does not fit that connected language. |
| listening-library.json/listening-r8-one-minute-weather-forecast | B1/Beginner | B1/Intermediate | Caption evidence: Flood warnings, thunderstorms, fog and a football-day forecast match weather; occasional name/kickoff errors do not obscure the report. Short question/answer turns and concrete everyday requests support B1; the Beginner name does not fit that connected language. |
| voa-library.json/voa-artificial-intelligence-daily-life | B1/Upper-Intermediate | B2/Advanced | AI governance, opaque decisions, racial bias and high-stakes regulation use abstract policy exposition. |
| voa-library.json/voa-robots-future-of-work | B1/Upper-Intermediate | B2/Advanced | Automation/displacement and inequality are discussed through contrasting economic arguments and an abstract hedge metaphor. |
| voa-library.json/voa-digital-divide | B1/Upper-Intermediate | B2/Advanced | Equitable connectivity, structural inequalities and digital literacy use extended causal exposition. |
| voa-library.json/voa-entrepreneurship-startups | B1/Upper-Intermediate | B2/Advanced | Venture funding, IPOs, survivorship bias and startup ecosystems use specialised abstract business vocabulary. |
| voa-library.json/voa-immigration-cultural-identity | B1/Upper-Intermediate | B2/Advanced | Assimilation/integration, intergenerational identity and managed diversity use sustained abstract sociological prose. |
| voa-library.json/voa-american-dream | B1/Upper-Intermediate | B2/Advanced | Intergenerational mobility, deteriorating conditions and cultural archetypes use abstract historical/economic argument. |
| voa-library.json/voa-gig-economy | B1/Upper-Intermediate | B2/Advanced | Contractor classification, pension protections, deactivation and a legal framework use dense specialised employment-law exposition. |
| world-flight-library.json/world-flight-bangkok-river-transport-video | A2/Intermediate | A2/Easy | The English cache models concrete boat choices, tickets, boarding and exit instructions with repeated everyday travel verbs and short conditional requests; A2 is supported with travel vocabulary help. |

## Every library entry changed

### african-storybook-library.json

| ID | What changed | Evidence / reason |
|---|---|---|
| african-storybook-38954 | Level: A2/Beginner → A2/Easy | Granny’s missing location and green/red phone-button instructions use chronological past events and short when clauses. |
| african-storybook-1881 | Level: A2/Beginner → A2/Easy | The elephant asks repeated why questions, then past-tense action and comparisons explain the trunk. |
| african-storybook-36489 | Level: A2/Beginner → A2/Easy | Alex’s wolf encounter uses past continuous, when clauses and a chronological rescue, beyond isolated beginner phrases. |
| african-storybook-48726 | Level: A2/Beginner → A1/Beginner | Sisi’s short sentences introduce animals and a farm with repeated simple actions and basic can/should dialogue. |
| african-storybook-8979 | Level: B1/Beginner → B1/Intermediate | Tasneem’s long sequence includes jealousy, conditional reactions, passive purpose clauses and a later marriage decision. |
| african-storybook-15029 | Level: B1/Beginner → B1/Intermediate | The narrator uses had grown up, passive loading and sensory bus-station detail with less common hawker/tout vocabulary. |
| african-storybook-2058 | Level: B1/Beginner → B1/Intermediate | The hare story combines passive defeat, perfect forms and idioms about grudges, rivals and completing a diplomatic task. |
| african-storybook-17648 | Level: B1/Beginner → A2/Easy | The rat story repeats who is greater, simple requests and can/cannot comparisons; length comes largely from the repeated pattern. |
| african-storybook-50056 | Level: B1/Beginner → A2/Easy | The football story follows practice, goals and a final score with short past-tense clauses and familiar celebration vocabulary. |
| african-storybook-2205 | Level: B1/Beginner → A2/Easy | Jackal’s trick uses short past narrative and direct invitations, with a few contextual words about flattery. |
| african-storybook-15291 | Level: B1/Beginner → B1/Intermediate | The tree story uses past perfect, conditional friendship pressure, reported wishes and emotional changes across a longer narrative. |
| african-storybook-36820 | Level: B1/Beginner → B1/Intermediate | Bohlale follows a long dream adventure with hypothetical ability, comparisons, directions and embedded questions. |
| african-storybook-2112 | Level: B1/Beginner → A2/Easy | The talking-bag story repeats short questions and answers around a simple chronological journey and rescue. |
| african-storybook-2651 | Level: B1/Beginner → B1/Intermediate | Demane’s long rescue uses past perfect, passive mistreatment and carrying-away clauses, reported lies and conditional promises. |
| african-storybook-13542 | Level: B1/Beginner → A2/Easy | The meat story repeats past actions, simple accusations and a river rescue with a limited set of concrete verbs. |
| african-storybook-16535 | Level: B1/Beginner → A2/Easy | Nita’s verse uses concrete body/appearance words and short comparisons, with a few idioms and present-perfect forms beyond bare A1. |
| african-storybook-9809 | Level: B1/Beginner → B1/Intermediate | Wangari’s biography includes passive schooling, past perfect and paired comparative clauses connecting learning to later environmental action. |
| african-storybook-36715 | Level: B1/Beginner → B1/Intermediate | Kisara’s rules use relative clauses, passive turn selection, ranking and conditional profit explanations across a longer procedure. |
| african-storybook-15028 | Level: B1/Beginner → B1/Intermediate | Donkey’s story includes a counterfactual about remaining small, reported intentions, emotional inference and perfect forms. |
| african-storybook-50308 | Level: B1/Beginner → A2/Easy | Kela’s school and home changes use mostly familiar past narrative, short reasons and household actions. |
| african-storybook-36914 | Level: B1/Beginner → B1/Intermediate | Nido’s longer narrative embeds reported plans and explanations of friends’ future refusal, alongside habitual would. |
| african-storybook-34111 | Level: B1/Beginner → B1/Intermediate | Wayan’s conservation story connects fishing, pollution, illness and community decisions through passive events and longer cause/effect clauses. |
| african-storybook-23861 | Level: B1/Beginner → A2/Easy | Aku’s story repeats food requests and bigger/biggest comparisons in a concrete past-tense sequence. |
| african-storybook-17985 | Level: B1/Beginner → B1/Intermediate | Wardit’s longer marriage/family narrative uses embedded thoughts, future hypotheticals, kinship terms and reported motives. |
| african-storybook-34756 | Level: B1/Beginner → B1/Intermediate | The road-safety account uses habitual would, descriptive action verbs, passive injury and community petition language. |
| african-storybook-21728 | Level: B1/Beginner → A2/Easy | The bag-making story uses concrete pattern/strap instructions and sequence markers, with occasional conditionals and passive sewing. |
| african-storybook-13636 | Level: B1/Beginner → A2/Easy | The grandmother visit uses familiar family/travel actions in past sequence, simple when clauses and chores. |
| african-storybook-39472 | Level: B1/Beginner → A2/Easy | Hully’s short school story uses past actions, basic comparisons and direct speech; a few perfect/passive forms are contextual. |
| african-storybook-35268 | Level: B1/Beginner → A2/Easy | Duma describes family routines and basic handwashing imperatives with short reasons for changed behaviour. |
| african-storybook-36998 | Level: B1/Beginner → B1/Intermediate | Lindiwe’s account uses passive competition awards, past perfect, reported plans and words such as disembarked and privileged. |
| african-storybook-12169 | Level: B1/Beginner → A2/Easy | The farmer story uses a clear past sequence, habitual would and concrete crop/theft actions. |
| african-storybook-39123 | Level: B1/Beginner → A2/Easy | Omotola gives direct, sequenced instructions with everyday cleaning/cooking objects and concrete action verbs. |
| african-storybook-20771 | Level: B1/Beginner → B1/Intermediate | Petros’s long account includes perfect forms, hypothetical danger, conditional searching and reflective advice. |
| african-storybook-19876 | Level: B1/Beginner → A2/Easy | The unity race is a chronological itinerary with repeated running/joining actions; place names add length rather than abstract syntax. |
| african-storybook-22166 | Level: B1/Beginner → B1/Intermediate | Cassava/Palm debate uses purpose/passive clauses, hypothetical oil use and specialised agricultural terms for products and plant parts. |
| african-storybook-47814 | Level: B1/Beginner → A2/Easy | The monkey trick follows concrete household/garden actions and short demands in direct speech. |
| african-storybook-22542 | Level: B1/Beginner → B1/Intermediate | The rainbow story embeds one narrative inside another, using conditional illness, reported wishes and longer purpose clauses. |
| african-storybook-36114 | Level: B1/Beginner → A2/Easy | The mask story follows familiar community actions, short quotations and handwashing instructions. |
| african-storybook-20155 | Level: B1/Beginner → B1/Intermediate | Hyena/Monkey mediation uses first and second conditionals, inferred motives and dispute/judgement vocabulary. |

### bbc-ideas-library.json

| ID | What changed | Evidence / reason |
|---|---|---|
| bbcideas_philosophy_absurdism | Description: An introduction to absurdism, including Camus’s response to meaninglessness and examples from absurd theatre. | The full cache explains Camus, meaningless existence and absurd theatre, but never gives the promised Sisyphus example. |
| bbcideas_power_of_kindness | Level: A2/Easy → B1/Intermediate | The 833-word caption uses reward pathways, cooperative relationships, institutional enabling and abstract community consequences with idiomatic speech, beyond the stored A2/Easy level. |
| bbcideas_hidden_clues_personality | Title: Biometrics and Personal Data; Description: The film examines biometric identifiers, large personal-data collections and the tension between useful applications and privacy risks.; Tags: technology, privacy, society, biometrics; Hidden: False; hidden/hiddenNote removed | The cache discusses DNA, fingerprints, biometrics, government/corporate databases and privacy regulation, rather than personality cues from music, tidiness or walking. |

### bbc-library.json

| ID | What changed | Evidence / reason |
|---|---|---|
| bbc_grammar_advanced_learner_mistakes | Description: Dan explains two recurring grammar mistakes: word order in indirect WH clauses and using articles when talking generally. | Dan teaches indirect WH-clause order and general-reference articles (“relative pronouns”), rather than the promised preposition coverage. |
| bbc_grammar_formal_informal | Description: Sian compares formal and informal English and shows how wording changes with the situation. | the presenter introduces herself as “Sian” and teaches formal/informal register, while the description names Dan. |
| bbc_grammar_giving_emphasis | Description: Dan shows how it-cleft sentences give emphasis to different parts of a message. | the explanation covers it-clefts (“using a cleft sentence”), not the promised fronting and do-support. |
| bbc_grammar_what_emphasis | Description: Sian explains how what-clefts and all-clefts focus attention on particular information. | “Sian here” introduces what/all-clefts, matching the grammar topic but contradicting the named presenter Dan. |
| bbc_masterclass_conversation_phrases | Description: Sian introduces seven spoken discourse markers, including in other words, to help organise and clarify conversation. | Sian introduces seven discourse markers, including “in other words”, while the description names Dan and advertises a broader phrase collection. |
| bbc_masterclass_inversion_2 | Level: B2/Expert → B2/Advanced | The captions cover inverted conditionals, place-first order and so/such emphasis. B2 is plausible for the explanation; the Expert label is broad, so I have not inferred a level fault from the grammar topic alone. Dan explains inverted first/second/third conditionals, place-adverb inversion and so/such emphasis with explicit examples; these advanced constructions support B2 rather than the C1 Expert label. |
| bbc_masterclass_linking_words | Description: Sian models conversational signposts such as basically and by the way and explains how they organise spoken information. | “Sian here” introduces conversational signposting, including basically and by the way, rather than a Dan-led cause-and-effect linking-word lesson. |
| bbc_grammar_verb_patterns | Description: Sian contrasts the meanings of stop, regret and go on when followed by an -ing form or to-infinitive. | Sian explains stop, regret and go on (“stop buying” versus “stop to buy”); the description instead names Dan and promises remember and try. |
| bbc_climate_saving_water | Title: Saving Water on Desert Date Farms; Description: A report from Yuma, one of the driest places on Earth, looks at desert date farming and water use. | The caption calls Yuma “one of the driest places” and shows desert date farming and water supply; it does not establish the title’s absolute driest-place claim. |
| bbc_6me_social_media_teen_health | Level: B2/Upper-Intermediate → B2/Advanced | The captions discuss social-media algorithms, revenue and parents' responsibility for teenage use, matching benefits/risks and mental wellbeing. Equivalent label Upper-Intermediate → Advanced for existing B2; no CEFR change. |
| bbc_r3ovou_sxhe | Level: A2/Intermediate → A2/Easy | The Real Easy English conversation describes running, cricket, yoga and taking up hobbies; A2 is plausible despite the generic Intermediate difficulty label. Neil and Georgie discuss running, yoga and spare time with explained vocabulary, simple habit/past questions and a future run plan; this supports A2 rather than Intermediate. |
| bbc-grammar-r2-uTB5I8V9Eog | Level: A2/Pre-Intermediate → A2/Easy; Hidden: True; The cached first-person Titanic survivor account includes “people drowning”; it is not a grammar lesson and does not belong in this grammar-labelled selection. Keep hidden pending an owner decision. | the cache is a first-person Titanic survivor account describing the ship sinking and “people drowning”, rather than a BBC grammar explanation. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| bbc-grammar-r2-xFsYrTIndhI | Level: A2/Pre-Intermediate → A2/Easy | Sophie and Neil explain forms and uses of present simple/continuous and finish with a quiz, matching the description. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| bbc-grammar-r2-tbru3bW2kVE | Level: A2/Pre-Intermediate → A2/Easy | The 63-word cache says “Read the grammar explanation” and try a quiz; the actual six-minute explanation is absent. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| bbc-grammar-r2-jwmKjgwlMk8 | Level: A2/Pre-Intermediate → A2/Easy | The 58-word cache tells readers to work through an activity and “try the verb form quiz”, rather than transcribing the lesson. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| bbc-grammar-r2-jcAX1RtKq3U | Level: A2/Pre-Intermediate → A2/Easy | The 67-word cache says “read this explanation” and try an activity; it is an introductory page blurb, not a full transcript. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| bbc-grammar-r2-PgsG98vByiw | Level: A2/Pre-Intermediate → A2/Easy | The 104-word cache is a short cycling-accident account (“I fell off my bike”), not enough to substantiate the promised six-minute explanation and practice. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| bbc-grammar-r2-3aQOLTfnAOc | Level: A2/Pre-Intermediate → A2/Easy | Only a 73-word untimed sample conversation about London is cached; the claimed grammar explanation is missing. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| bbc-grammar-r2-8_nhtAwI0dA | Level: A2/Pre-Intermediate → A2/Easy | The 127-word cache refers to what “Finn said this in the video” and instructs a quiz, indicating webpage notes rather than speech captions. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| bbc-grammar-r2-8VETylIxyhw | Level: A2/Pre-Intermediate → A2/Easy | The cache contains only 82 words of example advice about pregnancy and a baby, not the six-minute explanation and practice. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| bbc-grammar-r2-3OuqzHxlrHc | Level: A2/Pre-Intermediate → A2/Easy | The cache contains 125 words of conditional example sentences, but no complete explanation/practice transcript for the 367-second entry. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| bbc-grammar-r2-o-GWYDA4IQY | Level: A2/Pre-Intermediate → A2/Easy | The 49-word cache tells readers to “look at the picture here” and describes tick/cross icons, not a present-perfect lesson transcript. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| bbc-grammar-r2-nI5zaB6QL-o | Level: A2/Pre-Intermediate → A2/Easy | The 66-word cache introduces passive voice, then says “Read the grammar explanation”; the actual video explanation is not supplied. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| bbc-grammar-r2-ryRu8zFCKZE | Level: A2/Pre-Intermediate → A2/Easy | Only a 138-word Facebook travel-story example is cached, rather than the full article explanation/practice transcript advertised for 364 seconds. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| bbc-grammar-r2-5UxMyCxQThE | Level: A2/Pre-Intermediate → A2/Easy | The cache explains too, enough and very with example forms, matching the topic. It is untimed reference-style prose with HTML entities, so alignment to the spoken video remains unverified; uncertainty is retained rather than claiming a proven mismatch. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| bbc-grammar-r2-B5hDy53iGNA | Hidden: True; Only an untimed future-continuous grammar extract is cached; the be-plus-infinitive section and full video speech cannot be verified. Keep hidden until complete English captions establish the lesson scope. | the stored text explains only future continuous, including “I’ll be taking my driving test”, with no be-plus-infinitive section promised by the title. |
| bbc-grammar-r2-3dA7P5arkyc | Level: A2/Pre-Intermediate → A2/Easy | The 47-word cache asks about used to versus past simple and says “look at some examples first”, without providing those examples. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| bbc-grammar-r2-foyWhOHhTT0 | Level: A2/Pre-Intermediate → A2/Easy | The 85-word cache tells readers to “stay on this page” to learn question tags; the tag lesson itself is absent. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |

### bigthink-library.json

| ID | What changed | Evidence / reason |
|---|---|---|
| bigthink_free_will_physics | Title: Physics and Free Will; Description: Michio Kaku contrasts Newtonian determinism with quantum uncertainty and argues that uncertainty leaves room for free will.; Hidden: False; hidden/hiddenNote removed | Kaku says quantum uncertainty means in some sense we do have some kind of free will, directly opposite the description’s claim that quantum mechanics undermines free will. |
| bigthink_free_will_pinker | Description: Steven Pinker distinguishes deliberate choices from involuntary reflexes and explains free will in terms of physical brain processes. | The full cache distinguishes conscious choices from reflexes and rejects a mysterious soul, but never discusses morality or law as promised. |
| bigthink_psychology_happiness | Title: How We React to Feedback; Description: Sheila Heen explains how emotional baseline, reaction strength and recovery time affect giving and receiving feedback.; Tags: psychology, communication, work, feedback; Hidden: False; hidden/hiddenNote removed | The full caption explains receiving feedback through baseline, emotional swing, recovery and distortions; it is not a guide to predicting what makes us happy. |
| bigthink_evolution_intelligence | Description: Michio Kaku discusses thumbs, predator eyesight and language as factors in human intelligence, then considers hypothetical genetic changes to chimpanzees. | The full caption covers thumbs, predator eyesight, language and making chimpanzees more intelligent through genes; it never discusses artificial intelligence. |

### book-library.json

| ID | What changed | Evidence / reason |
|---|---|---|
| book-jungle-1 | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| book-jungle-2 | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| book-jungle-3 | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| book-jungle-4 | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| book-alice-1 | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| book-alice-2 | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| book-alice-3 | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| book-alice-4 | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| book-oz-1 | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| book-oz-2 | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| book-oz-3 | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| book-oz-4 | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| book-peter-1 | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| book-peter-2 | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| book-peter-3 | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| book-peter-4 | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| book-sherlock-1 | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| book-sherlock-2 | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| book-sherlock-3 | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| book-sherlock-4 | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| book-aesop-1 | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| book-aesop-2 | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| book-aesop-3 | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| book-aesop-4 | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |

### business-english-library.json

| ID | What changed | Evidence / reason |
|---|---|---|
| business-emails | Title: Answering Job Interview Questions; Description: Gina demonstrates concise interview answers, signposting, the STAR structure and reflecting the interviewer’s key words.; Summary limited to caption-supported content; Tags: business, work, job-interviews, communication | The opening explicitly introduces answering job interview questions. |
| business-meetings | Title: Writing Emails in English; Description: Mike explains how to organise an email, state its purpose, add details and write a clear request or call to action.; Summary limited to caption-supported content; Tags: business, work, email, writing | The opening explicitly introduces writing an email and later shows calls to action. |
| business-presentations | Title: Formal Email Phrases; Description: The lesson models formal email openings, introducing a purpose, arranging appointments and closing politely.; Summary limited to caption-supported content; Tags: business, email, writing, communication; Hidden: False; hidden/hiddenNote removed | The cache explicitly teaches formal email openings, purpose, appointments and closings, not giving presentations or Q&A. |
| business-interviews | Title: English for Team Projects; Description: Martin teaches language for teamwork, assigning tasks, clarifying instructions and keeping a project on schedule.; Summary limited to caption-supported content; Tags: business, teamwork, communication, work; Hidden: False; hidden/hiddenNote removed | Martin introduces teamwork, task assignment, deadlines and clarification phrases, not common job interview answers. |
| business-networking | Title: Talking About Your Job; Description: Mike models ways to describe your job, employer, responsibilities and how you feel about your work.; Summary limited to caption-supported content; Tags: business, work, jobs, speaking | The opening asks where you work, what you do and what kind of company employs you. |
| business-phone | Title: Making Small Talk in English; Description: Oli models small-talk questions and answers, ways to extend a conversation and topics that may be too personal.; Summary limited to caption-supported content; Tags: business, communication, small-talk, speaking | The English opening explicitly introduces small talk, not telephone calls. |
| business-negotiating | Title: Work and Business Discussions; Description: A compilation of BBC discussions about returning to the office, self-employment, workplaces without bosses and product lifecycles.; Summary limited to caption-supported content; Tags: business, work, listening, communication; Hidden: False; hidden/hiddenNote removed | The 4,841-word cache joins BBC work-topic programmes about office return, self-employment, bossless firms and product lifecycle; it is not a negotiation-language lesson. |

### crash-course-library.json

| ID | What changed | Evidence / reason |
|---|---|---|
| cc-ww1-overview | Title: How World War I Began; Description: John Green examines the assassination, alliances, diplomatic decisions and mobilisation that led to World War I.; Summary limited to caption-supported content | The opening explicitly says this episode explains how WWI happened and the next video treats the war itself. |
| cc-ww2-overview | Level: B1/Intermediate → B2/Advanced | The 2,467-word caption uses unscaffolded terms such as Judeo-Bolshevism, non-aggression pact and totalitarian aggression within a dense account of military strategy, exceeding the stored B1 label. |
| cc-climate-science | Title: Climate Change: A SciShow Explainer; Description: Hank Green explains warming, greenhouse gases, ocean acidification and ecological consequences in a SciShow climate discussion.; Summary limited to caption-supported content | The climate mechanisms and consequences match, but the caption closes by naming SciShow, rather than the title’s Crash Course series. |
| cc-astronomy-solarsystem | Level: A2/Easy → B1/Intermediate | The caption explains planetesimals, gravitational formation and competing planet definitions in connected scientific language beyond A2. |
| cc-biology-cells | Level: A2/Easy → B1/Intermediate | The caption explains ribosomes, endoplasmic reticulum, mitochondria and cytoskeleton in connected scientific language beyond A2. |

### destination-reading-library.json

| ID | What changed | Evidence / reason |
|---|---|---|
| destination-reading-bangkok | Level: B2/Intermediate → B2/Advanced | The profile uses embedded historical clauses, administrative incorporation and unscaffolded terms such as primate city and crippling congestion. |
| destination-reading-seoul | Level: B2/Intermediate → B2/Advanced | Constitutional status, de facto administration and metropolitan economy are explained through dense embedded clauses. |
| destination-reading-buenos-aires | Level: B2/Intermediate → B2/Advanced | Autonomous district, federalisation and administrative human-development comparisons require upper-intermediate expository reading. |
| destination-reading-jakarta | Level: B2/Intermediate → B2/Advanced | Colonial administration, metropolitan status and land subsidence use long multi-clause explanations. |
| destination-reading-bogota | Level: B2/Intermediate → B2/Advanced | Territorial administrative status, emancipation and foreign direct investment appear in dense encyclopedic clauses. |
| destination-reading-reykjavik | Level: B2/Intermediate → B1/Intermediate | This short profile follows location, population, founding and tourism directly; a few formal terms sit within a clear factual sequence. |
| destination-reading-auckland | Level: B2/Intermediate → B2/Advanced | The profile combines council jurisdiction, colonial settlement and census/ethnic-population comparisons in embedded clauses. |
| destination-reading-suva | Level: B2/Intermediate → B2/Advanced | Restrictive colonial geography, transferred administration and diplomatic/regional headquarters use formal unscaffolded vocabulary. |
| destination-reading-ulaanbaatar | Level: B2/Intermediate → B2/Advanced | Monastic settlement, independence proclamation, urban planning and primate-city status form dense historical exposition. |
| destination-reading-almaty | Level: B2/Intermediate → B2/Advanced | Republican significance, regional rankings and international institutional classifications use unscaffolded formal vocabulary. |
| destination-reading-lisbon | Level: B2/Intermediate → B2/Advanced | Political institutions, diplomacy and GDP/debt-market comparisons require upper-intermediate expository vocabulary. |
| destination-reading-panama-city | Level: B2/Intermediate → B2/Advanced | Conquistadors, privateer destruction and the trade route use embedded historical clauses and specialised vocabulary. |
| destination-reading-addis-ababa | Level: B2/Intermediate → B2/Advanced | Occupation, unplanned urban development and tectonic plates appear in dense geopolitical/historical exposition. |
| destination-reading-ho-chi-minh-city | Level: B2/Intermediate → B2/Advanced | Expansionist/colonial policy and merged provincial status use embedded historical and administrative clauses. |
| destination-reading-singapore | Level: B2/Intermediate → B2/Advanced | Ideological expulsion, a sovereign federation and PPP-adjusted income appear in dense geopolitical exposition. |
| destination-reading-paris | Level: B2/Intermediate → B2/Advanced | The profile combines metropolitan statistics, architectural movements and international institutions in formal descriptive prose. |
| destination-reading-london | Level: B2/Intermediate → B2/Advanced | Concentration of institutions, a tidal estuary and economic influence use long enumerations and embedded explanatory clauses. |
| destination-reading-cairo | Level: B2/Intermediate → B2/Advanced | Agglomeration, predynastic settlement and foreign-direct-investment language support upper-intermediate reading. |
| destination-reading-dubai | Level: B2/Intermediate → B2/Advanced | Diversification, expatriate population and land reclamation use compact but formal economic exposition. |
| destination-reading-sydney | Level: B2/Intermediate → B2/Advanced | Penal-colony history, immigration and reserve/transport statistics use embedded explanatory clauses. |
| destination-reading-berlin | Level: B2/Intermediate → B2/Advanced | Enlightenment, neoclassicism, occupation and industrialisation require formal historical vocabulary. |
| destination-reading-moscow | Level: B2/Intermediate → B2/Advanced | Imperial capital relocation and federative political status are expressed through long embedded historical clauses. |
| destination-reading-istanbul | Level: B2/Intermediate → B2/Advanced | Caliphate, strategic trade and imperial transformation require upper-intermediate political/history vocabulary. |
| destination-reading-vancouver | Level: B2/Intermediate → B2/Advanced | Indigenous settlement, affordability and an urban-design philosophy combine specialised formal vocabulary and relative clauses. |
| destination-reading-toronto | Level: B2/Intermediate → B2/Advanced | Canadian confederation, incorporation and diversified economic sectors use formal institutional prose. |
| destination-reading-rome | Level: B2/Intermediate → B2/Advanced | Municipal jurisdiction, classical civilisations and architectural programmes use formal dense historical clauses. |
| destination-reading-rio-de-janeiro | Level: B2/Intermediate → B2/Advanced | Colonial capitals, municipal GDP and industrial institutions appear in upper-intermediate historical/economic prose. |
| destination-reading-mexico-city | Level: B2/Intermediate → B2/Advanced | The counterfactual about being an independent economy and progressive policies such as euthanasia use advanced civic vocabulary. |
| destination-reading-lagos | Level: B2/Intermediate → B2/Advanced | Refineries, financial institutions and regional employers use formal economic description with embedded clauses. |
| destination-reading-amsterdam | Level: B2/Intermediate → B2/Advanced | International comparisons, governmental institutions and rankings require upper-intermediate formal expository reading. |
| destination-reading-perth | Level: B2/Intermediate → B2/Advanced | Conurbation, subsumed identity and net migration use specialised urban/economic vocabulary. |
| destination-reading-madrid | Level: B2/Intermediate → B2/Advanced | Centralised state-building and urban GDP rankings appear in dense abstract historical exposition. |
| destination-reading-dublin | Level: B2/Intermediate → B2/Advanced | The short Dublin history retains embedded census clauses, invasion/independence history and formal establishment language. |
| destination-reading-dakar | Level: B2/Intermediate → B2/Advanced | The short Dakar history uses abolition, annexation and federation without simplified definitions. |
| destination-reading-recife | Level: B2/Intermediate → B2/Advanced | Fiscal incentives, HDI comparisons and tributary geography require formal specialised vocabulary. |
| destination-reading-santiago | Level: B2/Intermediate → B2/Advanced | Conurbation, independence chronology and geological/architectural descriptions use dense formal exposition. |
| destination-reading-manila | Level: B2/Intermediate → B2/Advanced | Galleon trade, chartered/autonomous status and land subsidence require upper-intermediate institutional vocabulary. |

### discussion-library.json

| ID | What changed | Evidence / reason |
|---|---|---|
| round10-ladder-kids-a2-welcome-circle | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| round10-ladder-kids-a2-festival-library | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| round10-ladder-kids-b2-urban-wetland | Level: B2/Upper Intermediate → B2/Advanced | Equivalent label Upper Intermediate → Advanced for existing B2; no CEFR change. |
| round10-ladder-kids-b2-coral-watch | Level: B2/Upper Intermediate → B2/Advanced | Equivalent label Upper Intermediate → Advanced for existing B2; no CEFR change. |
| round10-ladder-kids-b2-accessible-app | Level: B2/Upper Intermediate → B2/Advanced | Equivalent label Upper Intermediate → Advanced for existing B2; no CEFR change. |
| round10-ladder-kids-b2-sleep-study | Level: B2/Upper Intermediate → B2/Advanced | Equivalent label Upper Intermediate → Advanced for existing B2; no CEFR change. |
| round10-ladder-kids-b2-food-route | Level: B2/Upper Intermediate → B2/Advanced | Equivalent label Upper Intermediate → Advanced for existing B2; no CEFR change. |
| round10-ladder-kids-b2-market-memory | Level: B2/Upper Intermediate → B2/Advanced | Equivalent label Upper Intermediate → Advanced for existing B2; no CEFR change. |
| round10-ladder-teens-a2-family-map | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| round10-ladder-teens-a2-shared-walk | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |
| round10-ladder-teens-b2-coastal-agreement | Level: B2/Upper Intermediate → B2/Advanced | Equivalent label Upper Intermediate → Advanced for existing B2; no CEFR change. |
| round10-ladder-teens-b2-woodland-inheritance | Level: B2/Upper Intermediate → B2/Advanced | Equivalent label Upper Intermediate → Advanced for existing B2; no CEFR change. |
| round10-ladder-teens-b2-homework-data | Level: B2/Upper Intermediate → B2/Advanced | Equivalent label Upper Intermediate → Advanced for existing B2; no CEFR change. |
| round10-ladder-teens-b2-timetable | Level: B2/Upper Intermediate → B2/Advanced | Equivalent label Upper Intermediate → Advanced for existing B2; no CEFR change. |

### grammar-library.json

| ID | What changed | Evidence / reason |
|---|---|---|
| grammar-r2-tcOLyvkBc48 | Level: A2/Pre-Intermediate → A2/Easy | If-clause meaning, future reference and will exceptions match the first conditional. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| grammar-r2-uRO9jRcF7Ek | Level: A2/Pre-Intermediate → A2/Easy | Predictions, instant decisions, promises and shall alternatives match will. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| grammar-r2-gb2P04ZfAjc | Level: A2/Pre-Intermediate → A2/Easy | Past habits, states and spelling of used to match used to versus would. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| grammar-r2-cO51ghRAWLI | Level: A2/Pre-Intermediate → A2/Easy | Can for ability, common behaviour and sensory verbs matches the modal. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| grammar-r2-OsW5sV3GMDM | Level: A2/Pre-Intermediate → A2/Easy | Habit/current-action and future uses distinguish present simple and continuous. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| grammar-r2-cGfF6jIl_dU | Level: A2/Pre-Intermediate → A2/Easy | Comparative spelling and degree of difference match comparatives. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| grammar-r2-A5ld4J3_kTk | Level: A2/Pre-Intermediate → A2/Easy | Frequency order and adverb placement match the target. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| grammar-r2-O-jJPd5ZYo4 | Level: A2/Pre-Intermediate → A2/Easy | Obligation, prohibition and voluntary actions distinguish must and have to. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| grammar-r2-P6R1V2uQM4M | Level: A2/Pre-Intermediate → A2/Easy | Advice, criticism and regrets with should/should have match the target; idiomatic comedy makes A2 demanding but not clearly wrong. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| grammar-r2-lGcXggbeLH8 | Level: A2/Pre-Intermediate → A2/Easy | A bike-training plan and family phone call model will, going to and present continuous future forms. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| grammar-r2-yhGQchXSkKY | Level: A2/Pre-Intermediate → A2/Easy | London memories and changed clothing model used to for past habits/states. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| grammar-r2-r2cf1qcltzY | Level: A2/Pre-Intermediate → A2/Easy | The driving-test dialogue uses stopped, appeared, escaped and agreed as regular past verbs. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| grammar-r2-qT5Ul3tMjDA | Level: A2/Pre-Intermediate → A2/Easy | Plans, visible evidence and gonna pronunciation explain going to. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| grammar-r2-FtruQRWZ44U | Level: A2/Pre-Intermediate → A2/Easy | Affirmatives, requests and some/any of examples match quantifiers. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| grammar-r2-MGLedoA3SSE | Level: A2/Pre-Intermediate → A2/Easy | Past events in progress, while/when and polite distancing match past continuous. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| grammar-r2-zfQh-Dg2Ggo | Level: A2/Pre-Intermediate → A2/Easy | Adjective spelling, irregular forms and superlative usage match the quiz subject. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| grammar-r2-MK300_aeKaA | Level: A2/Pre-Intermediate → A2/Easy | Fruit examples distinguish first mention a/an from known specific the; imperfect transcription remains usable. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| grammar-r2-9fgQaoDNU2k | Level: A2/Pre-Intermediate → A2/Easy | Definite, indefinite and zero articles are explained in quiz rounds. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| bbc-grammar-r2-HUXXgVElADg | Level: A2/Pre-Intermediate → A2/Easy | Only an 86-word webpage exercise headed The doctor’s advice is cached, referring readers to activity 2/session 1, not a six-minute speech transcript. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| bbc-grammar-r2-V2quIYo41Ig | Level: A2/Pre-Intermediate → A2/Easy | Only 86 words of webpage grammar notes are cached, starting with a reference to the last activity, not the six-minute dialogue. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| bbc-grammar-r2-j9b1CNN_rFU | Title: Asking Personal Questions; Level: A2/Pre-Intermediate → A2/Easy; Description: Alice, Sophie and Amith ask and answer personal questions about family, feelings, drinks and languages.; Summary limited to caption-supported content | The complete 263-word cache is Alice, Sophie and Amith asking personal questions; it models questions but contains no grammar explanation. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| bbc-grammar-r2-voQLMgJE-QE | Level: A2/Pre-Intermediate → A2/Easy | Only 52 words announcing what the session will teach are cached; no rules or worked examples follow. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| bbc-grammar-r2-tzEt4iwsIdo | Level: A2/Pre-Intermediate → A2/Easy | Only 57 words about Ginger the cat are cached, without the promised preference-versus-description explanation. Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| bbc_grammar_question_tags | Description: Dan explains tag formation, negative words, indefinite pronouns, imperatives, let’s and special conversational uses.; Summary limited to caption-supported content | The full cache mentions rising or falling intonation but does not explain the promised difference; most of it teaches tag formation and exceptions. |
| bbc_grammar_present_past | Description: Sian shows how present forms describe past events in stories, jokes, headlines and reports of what someone heard.; Summary limited to caption-supported content | The caption explicitly introduces Sian, not Dan; jokes, newspaper headlines and hearsay use the historical present. |
| grammar-r7-HBQl0Nww0-g | Title: Past Perfect Examples; Description: A short sequence models past perfect in statements, questions and negatives with repeated example sentences.; Summary limited to caption-supported content | The complete cache contains fifteen past-perfect example sentences but no recoverable spoken question options or immediate answer checks. |

### hooks-library.json

| ID | What changed | Evidence / reason |
|---|---|---|
| hook-r2-eT89nvkYNDM | Hidden: True; Evidence: The child-oriented cache says “slurping them up” after external digestion and “eat each other” with an Uncle Brian joke; this is detailed cannibalistic predation. Keep hidden from child-facing recommendations. | The child-oriented cache says “slurping them up” after external digestion and “eat each other” with an Uncle Brian joke; this is detailed cannibalistic predation. |
| hook-r2-W4og8g_X22o | Hidden: True; Evidence: The narration says “bites off the stinger” and “freshly killed scorpion”, giving explicit killing/eating detail. Keep hidden from child-facing recommendations. | The narration says “bites off the stinger” and “freshly killed scorpion”, giving explicit killing/eating detail. |
| hook-r2-7rOvmN-qfaA | Hidden: True; Evidence: The caption describes biting victims, then “liquefy their bodies and suck it all up”; this explicitly describes bodily destruction/eating. Keep hidden from child-facing recommendations. | The caption describes biting victims, then “liquefy their bodies and suck it all up”; this explicitly describes bodily destruction/eating. |
| hook-r2-xB74swq2LlI | Hidden: True; Evidence: The narrator says “spray acid into the crab’s mouth and eyes”, followed by pain dialogue and a survival warning; the attack is described in detail. Keep hidden from child-facing recommendations. | The narrator says “spray acid into the crab’s mouth and eyes”, followed by pain dialogue and a survival warning; the attack is described in detail. |
| hook-r2-TQgRIJdp2c0 | Title: Homemade Lava Lamp; Description: A presenter makes a small lava lamp with oil, water, colouring and salt, explaining the movement through differences in density.; Summary limited to caption-supported content; Tags: science, experiments, materials, density; Hidden: False; hidden/hiddenNote removed | The full cache demonstrates a homemade lava lamp using oil, water, colouring and salt; eggs only appear in the closing introduction to the next videos. |
| hook-r2-iTHUUjTA-LI | Hidden: True; The owner reports this video has no English captions. A short older English cache remains, but its speech alignment cannot be verified. Keep hidden pending verified English captions. | Only the older 91-word English narration remains; the owner reports no English captions are available, so alignment is unverified. |

### internet-memes-library.json

| ID | What changed | Evidence / reason |
|---|---|---|
| memes-history | Title: How Memes Spread; Description: Speakers discuss memes as units of culture that spread and evolve, with examples of internet jokes and shared communities.; Summary limited to caption-supported content; Tags: internet, culture, communication, memes; Hidden: False; hidden/hiddenNote removed | The cache discusses Richard Dawkins, memes as cultural replicators and a Celine Dion image joke; it is not an ARPANET-to-social-media history. |
| memes-viral | Title: Internet Culture and the Cultural Singularity; Description: A discussion connects rapid internet remixes and shared culture with the idea of a cultural singularity. It uses the Olympics, a Mars landing and online humour as examples.; Summary limited to caption-supported content | The cache develops an internet cultural singularity analogy using Olympics/Mars remixes; it does not give the promised psychological comparison of why some content spreads and other content disappears. |

### kids-library.json

| ID | What changed | Evidence / reason |
|---|---|---|
| kids_defining_gravity | Description: Sabrina explains gravity using Newton’s apple story and a ball thrown in different directions, showing why unsupported objects fall back to the ground. | The full cache explains falling apples/balls, without the promised orbiting-planet example. |
| kids_science_of_lunch | Title: Properties of Your Lunch; Description: Sabrina uses a lunch bag and foods to investigate material properties, including hardness, malleability and conductivity.; Summary limited to caption-supported content; Tags: science, materials, properties, experiments | The cache studies a paper bag, bread, apples and other objects for hardness, malleability and conductivity, not digestion or body energy. |
| kids_home_sweet_habitat | Description: Sabrina uses polar bears and Arctic food webs to explain food, water, shelter and space, and how animals are suited to their habitats. | The caption lists food, water, shelter and space, then explains Arctic food webs and adaptations; it does not list five needs including air. |
| kids_every_kind_of_volcano | Level: A1/Beginner → B1/Intermediate | The caption explains shield, cinder and composite volcanoes, magma, ash and eruption mechanisms in 1,173 words; sustained scientific explanation exceeds the stored A1/Beginner level. |
| kids_busy_bees | Level: A1/Beginner → A2/Easy | The 702-word explanation compares bee types and explains pollen, nectar and hive food production with causal clauses, rather than simple A1 phrases. |
| kids_dont_fear_spiders | Level: A1/Beginner → B1/Intermediate | The 775-word explanation distinguishes abdomen, thorax and cephalothorax and explains silk/web mechanisms; the anatomy and connected explanations exceed A1. |
| kids_cave_animals | Level: A1/Beginner → A2/Easy; Description: Mister Brown explores cave habitats and how eyeless salamanders, fish and spiders use senses suited to darkness. | The 743-word explanation compares cave species, habitats and senses using relative clauses and adaptation reasoning, beyond short A1 everyday phrases. |
| kids_diamond_super_crystal | Level: A1/Beginner → B1/Intermediate | The 784-word caption explains carbon arrangements, molten rock, pressure and diamond formation with multi-step causes, beyond A1. |
| kids_whats_inside_rocks | Level: A1/Beginner → A2/Easy; Description: Jessi and Squeaks explain how crystals form inside geodes, then break geodes open with adult help and safety equipment. | The 568-word geode explanation describes mineral deposits building crystals over millions of years and gives multi-step hammering instructions, beyond A1. |
| kids_stalactites_stalagmites | Level: A1/Beginner → B1/Intermediate | The 782-word explanation uses a dissolving-sugar analogy and evaporation to explain mineral deposition, including a conditional experiment, beyond A1. |
| kids_antarctica | Level: A1/Beginner → A2/Easy | The 926-word explanation connects slanted sunlight, Earth’s shape and Antarctic dryness using extended causal clauses, beyond A1. |
| kids_look_whos_talking | Description: Sabrina explains how scientists investigate plant sensing, using Venus flytraps and Darwin’s stem-tip experiment.; Summary limited to caption-supported content | The full cache explains plant investigations, Venus flytrap sensing and Darwin’s stem-tip experiment; communication is mentioned only briefly, and no animal communication examples are given. |
| kids_glow_on | Title: Why Stars Glow; Level: A2/Easy → B1/Intermediate; Description: Sabrina explains why stars glow through nuclear fusion, then compares true and apparent brightness using the Sun and Betelgeuse.; Summary limited to caption-supported content; Tags: science, space, stars, astronomy; Hidden: False; hidden/hiddenNote removed | The full cache explains nuclear fusion, stellar luminosity and Betelgeuse versus the Sun; it does not concern living things producing light. |

### kurzgesagt-library.json

| ID | What changed | Evidence / reason |
|---|---|---|
| kurzgesagt_why_blue_whales_dont_get_cancer | Description: The lesson introduces Peto’s paradox: larger animals have far less cancer than their cell counts suggest, then considers possible explanations and implications for research.; Summary limited to caption-supported content | The same-rate comparison is humans versus mice; the caption says whales seem to have much less cancer than expected. |
| kurzgesagt_nuclear_energy | Description: The lesson compares nuclear power with fossil fuels and renewables, considering emissions, dependable electricity, costs and the difficulty of a rapid energy transition.; Summary limited to caption-supported content | The caption centres on low-carbon electricity and transition trade-offs and explicitly refers waste/accident concerns to other videos. |

### listening-library.json

| ID | What changed | Evidence / reason |
|---|---|---|
| listening-r7-english-file-introductions | Level: A2/Beginner → A2/Easy | Birthplace, family, work and pets match basic introductions. Caption evidence: Birthplace, family, work and pets match basic introductions. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-r7-english-file-likes-dislikes-1 | Level: A2/Beginner → A2/Easy | Barcelona, cooking and repeated film viewing match likes. Caption evidence: Barcelona, cooking and repeated film viewing match likes. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-r7-english-file-likes-dislikes-2 | Level: A2/Beginner → A2/Easy | May, music and fantasy reading match preferences. Caption evidence: May, music and fantasy reading match preferences. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-r7-english-file-names | Level: A2/Beginner → A2/Easy | Irish heritage and naming after Edward match name origins; spellings are auto-caption variants. Caption evidence: Irish heritage and naming after Edward match name origins; spellings are auto-caption variants. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-r7-english-file-how-often | Level: A2/Beginner → A2/Easy | Haircuts, eating out, phone replacement and recurring dreams match how-often questions. Caption evidence: Haircuts, eating out, phone replacement and recurring dreams match how-often questions. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-r7-english-file-tv-movies | Level: A2/Beginner → A2/Easy | TV time, Dirty Dancing and film endings match viewing preferences. Caption evidence: TV time, Dirty Dancing and film endings match viewing preferences. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-r7-american-english-file-esl-at-a-caf | Level: A2/Beginner → A2/Easy | Rob and Jenny meet and order espresso/latte at a London café as claimed. Caption evidence: Rob and Jenny meet and order espresso/latte at a London café as claimed. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-r7-american-english-file-esl-spilled-coffee | Level: A2/Beginner → A2/Easy | Jenny apologises and suggests buying Rob a replacement shirt, matching the spill incident. Caption evidence: Jenny apologises and suggests buying Rob a replacement shirt, matching the spill incident. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-r7-american-english-file-esl-a-new-shirt | Level: A2/Beginner → A2/Easy | Size, price, changing rooms and Jenny’s criticism match choosing a new shirt. Caption evidence: Size, price, changing rooms and Jenny’s criticism match choosing a new shirt. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-r7-american-english-file-esl-at-the-airport | Level: A2/Beginner → A2/Easy | Taxi/train transactions and Rob accepting New York work match the airport good news. Caption evidence: Taxi/train transactions and Rob accepting New York work match the airport good news. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-r8-school-registration | Level: A2/Beginner → A2/Easy | Registrar requests, scholarships and a college-program information session match a school announcement; the named institution cannot be independently identified from this cache. Caption evidence: Registrar requests, scholarships and a college-program information session match a school announcement; the named institution cannot be independently identified from this cache. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-r8-school-equipment | Title: School Book Fair and Science Day; Level: A2/Beginner → A2/Easy; Description: A school announcement invites students to a book fair and raffle and tells science-day participants where to report.; Summary limited to caption-supported content | The full cache announces a book fair/raffle and science-day reporting, not an equipment announcement. Caption evidence: Evidence: The full cache announces a book fair/raffle and science-day reporting, not an equipment announcement. Suggested action: Retitle to School book fair and science-day announcement; verify the institution attribution. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-r8-school-library | Level: A2/Beginner → A2/Easy | Book borrowing and library-officer meeting instructions match school library announcements. The cache mentions grades 7/8, so the claimed elementary-school attribution needs source verification; a wrong institution is not proved. Caption evidence: Book borrowing and library-officer meeting instructions match school library announcements. The cache mentions grades 7/8, so the claimed elementary-school attribution needs source verification; a wrong institution is not proved. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-r8-school-it | Level: A2/Beginner → A2/Easy | Computer-room meetings and HDMI/projector instructions match school IT. Grade 7–9 wording makes the elementary-school attribution uncertain. Caption evidence: Computer-room meetings and HDMI/projector instructions match school IT. Grade 7–9 wording makes the elementary-school attribution uncertain. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-r8-school-sports | Level: A2/Beginner → A2/Easy | Stretches, exercise and sports-team meetings match PE announcements. Grade 7–9 wording makes the elementary-school attribution uncertain. Caption evidence: Stretches, exercise and sports-team meetings match PE announcements. Grade 7–9 wording makes the elementary-school attribution uncertain. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-r8-school-health | Level: A2/Beginner → A2/Easy | Cleaning supplies, disinfecting and masks match health/hygiene announcements. Caption evidence: Cleaning supplies, disinfecting and masks match health/hygiene announcements. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-r8-school-general-affairs | Level: A2/Beginner → A2/Easy | Furniture, energy, earthquakes and visitor registration match general affairs. Caption evidence: Furniture, energy, earthquakes and visitor registration match general affairs. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-r8-school-counselling | Level: A2/Beginner → A2/Easy | The brief guidance-officer reporting directions are coherent and complete enough for a short listening activity, despite only 38 words. Caption evidence: The brief guidance-officer reporting directions are coherent and complete enough for a short listening activity, despite only 38 words. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-r8-school-records | Level: A2/Beginner → A2/Easy | Guidance-officer meetings, notice sheets and student-information requests match school records. Caption evidence: Guidance-officer meetings, notice sheets and student-information requests match school records. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-r8-school-counselling-records | Title: Special-Education Committee Meeting; Level: A2/Beginner → A2/Easy; Description: A short announcement gives the time and room for a special-education committee meeting.; Summary limited to caption-supported content | The complete cache announces a special-education committee meeting at 12:10 on the third floor; it does not concern counselling records. Caption evidence: Evidence: The complete cache announces a special-education committee meeting at 12:10 on the third floor; it does not concern counselling records. Suggested action: Retitle to Special-education committee meeting announcement. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-r8-weather-report | Level: A2/Beginner → A2/Easy | Maria reports Chicago temperatures and a five-day forecast as claimed. Caption evidence: Maria reports Chicago temperatures and a five-day forecast as claimed. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-r8-school-listening-announcement | Level: A2/Beginner → A2/Easy | Freya and Steve discuss competition dates, registration and eligibility as claimed. Caption evidence: Freya and Steve discuss competition dates, registration and eligibility as claimed. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-r8-school-announcement | Level: A2/Beginner → A2/Easy | Purple skirts/blazers and sock/pullover colours match a school-uniform announcement. Policy endorsement is outside this audit. Caption evidence: Purple skirts/blazers and sock/pullover colours match a school-uniform announcement. Policy endorsement is outside this audit. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-r8-school-radio-announcement | Level: A2/Beginner → A2/Easy | A repeated room/time invitation to organise a glee club matches school radio. Caption evidence: A repeated room/time invitation to organise a glee club matches school radio. Short question/answer turns and concrete everyday requests support A2; the Beginner name does not fit that connected language. |
| listening-r8-weather-intermediate | Level: B1/Beginner → B1/Intermediate | Temperatures, winds, clear skies and rain chances match the forecast. Caption evidence: Temperatures, winds, clear skies and rain chances match the forecast. Short question/answer turns and concrete everyday requests support B1; the Beginner name does not fit that connected language. |
| listening-r8-one-minute-weather-forecast | Level: B1/Beginner → B1/Intermediate | Flood warnings, thunderstorms, fog and a football-day forecast match weather; occasional name/kickoff errors do not obscure the report. Caption evidence: Flood warnings, thunderstorms, fog and a football-day forecast match weather; occasional name/kickoff errors do not obscure the report. Short question/answer turns and concrete everyday requests support B1; the Beginner name does not fit that connected language. |

### minecraft-library.json

| ID | What changed | Evidence / reason |
|---|---|---|
| minecraft-crafting | Title: Starting a Minecraft Survival World; Description: Waddles starts a survival world and makes basic tools, a furnace and a campfire, with food gathering and early-world decisions.; Summary limited to caption-supported content | Waddles calls this the first episode of a new survival adventure and crafts basic tools, a furnace and campfire; this is not everything you can make in a complete crafting walkthrough. |
| minecraft-building | Title: Minecraft Beginner Survival Guide; Description: A broad Minecraft beginner guide introduces basic play, tools, mining and building a starter house.; Summary limited to caption-supported content | The caption introduces an everything-including-basics Minecraft 2023 beginner guide and covers tools, mining and a house, rather than a house-focused planning/interior-design tutorial. |
| minecraft-redstone | Title: Getting Started in Minecraft; Level: A2/Easy → B1/Intermediate; Description: Capp00 introduces starting a Minecraft world, gathering wood, crafting and making early stone tools.; Summary limited to caption-supported content; Tags: minecraft, gaming, survival, crafting; Hidden: False; hidden/hiddenNote removed | Capp00 introduces starting Minecraft, wood planks, crafting and stone tools; the complete caption contains no redstone or circuit explanation. |

### natgeo-library.json

| ID | What changed | Evidence / reason |
|---|---|---|
| natgeo-octopus-intelligence | Description: The lesson explains octopus intelligence through its distributed nervous system, flexible arms and coordination of movement.; Summary limited to caption-supported content | The cache explains ganglia, arm neurons and motor control, not the promised heart count or blue blood. |
| natgeo-how-volcanoes-work | Level: A2/Easy → B1/Intermediate | The explanation combines tectonic plates, molten mantle, calderas and logarithmic eruption magnitudes in extended scientific clauses, beyond the stored A2/Easy language level. |
| natgeo-human-brain | Description: A researcher describes slicing mouse-brain tissue and tracing cells across images to build wiring diagrams of neural connections.; Summary limited to caption-supported content | The full cache describes mouse-brain tissue slicing and wiring diagrams; it gives neither the claimed 86-billion-neuron number nor a faster-than-computers comparison. |
| natgeo-coral-reef-crisis | Description: Scientists explain how connected marine parks can help protect coral reefs, using migration between reserves and recovery after damage.; Summary limited to caption-supported content | The full cache concerns connected marine reserves, migration and recovery; neither the 1% nor 25% statistic is given. |
| natgeo-ancient-egypt | Title: Ancient Egypt: Kingdoms and Conquests; Description: John Green introduces ancient Egypt through Nile geography, the Old, Middle and New Kingdoms, monuments and political change.; Summary limited to caption-supported content | John Green names Crash Course World History and surveys kingdoms; no modern technology discovery is promised in the cache. |
| natgeo-plastic-pollution | Description: The film discusses ocean plastic, circular packaging and agricultural nutrient pollution, including the role of soil health in protecting water.; Summary limited to caption-supported content | The full cache explains ocean plastics, circular packaging and agricultural nutrient pollution; the description’s 9%-recycled claim is absent. |
| natgeo-sleep-science | Hidden: True; The cache identifies an Andrew Huberman podcast and lasts about 82 minutes, against the entry’s 295 seconds and National Geographic attribution. The allowed metadata edits cannot resolve duration/source identity; keep hidden. | The cache opens as Andrew Huberman’s Huberman Lab Podcast and runs to 4,919.853 seconds, while the entry names National Geographic and stores 295 seconds. Sleep matches, but this is an approximately 82-minute podcast cache. |

### picture-books-library.json

| ID | What changed | Evidence / reason |
|---|---|---|
| jack-beanstalk | Level: A2/Elementary → A2/Easy | Equivalent label Elementary → Easy for existing A2; no CEFR change. |

### storyweaver-library.json

| ID | What changed | Evidence / reason |
|---|---|---|
| storyweaver-71-everything-looks-new | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-86-hot-tea-and-warm-rugs | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-88-kheer-on-a-full-moon-night | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-89-peacocks-and-pakodas | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-111-little-by-little | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-127-the-missing-bat | Level: A2/StoryWeaver Level 3 → A2/Easy; Publisher label preserved: StoryWeaver Level 3 | Preserve the publisher’s StoryWeaver Level 3 in publisherLevel; use the app’s Easy name for stored A2. |
| storyweaver-141-going-to-a-wedding | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-156-paper-play | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-173-the-jungle-school | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-189-ramya-s-stars | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-208-too-many-bananas | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-258-goodnight-tinku | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-283-annual-haircut-day | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-296-lassi-ice-cream-or-falooda | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-486-gulli-s-box-of-things | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-633-cheenu-s-gift | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-678-the-day-the-vegetables-came-to-school | Level: A2/StoryWeaver Level 3 → A2/Easy; Publisher label preserved: StoryWeaver Level 3 | Preserve the publisher’s StoryWeaver Level 3 in publisherLevel; use the app’s Easy name for stored A2. |
| storyweaver-684-when-amma-went-to-school | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-691-grandpa-fish-and-the-radio | Level: A2/StoryWeaver Level 3 → A2/Easy; Publisher label preserved: StoryWeaver Level 3 | Preserve the publisher’s StoryWeaver Level 3 in publisherLevel; use the app’s Easy name for stored A2. |
| storyweaver-839-flying-high | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-2057-the-rainbow-story | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-2083-animals-are-kind | Level: A2/StoryWeaver Level 3 → A2/Easy; Publisher label preserved: StoryWeaver Level 3 | Preserve the publisher’s StoryWeaver Level 3 in publisherLevel; use the app’s Easy name for stored A2. |
| storyweaver-2093-the-boy-who-hated-vegetables | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-639293-the-surprise | Level: A1/StoryWeaver Level 1 → A1/Beginner; Publisher label preserved: StoryWeaver Level 1 | Preserve the publisher’s StoryWeaver Level 1 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-47971-where-is-my-mother | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-2171-kaushik-the-kind-detective | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-2245-the-party | Level: A1/StoryWeaver Level 1 → A1/Beginner; Publisher label preserved: StoryWeaver Level 1 | Preserve the publisher’s StoryWeaver Level 1 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-2325-the-unusual-rainmaking-duet | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-2352-sheela-learns-to-make-friends | Level: A2/StoryWeaver Level 3 → A2/Easy; Publisher label preserved: StoryWeaver Level 3 | Preserve the publisher’s StoryWeaver Level 3 in publisherLevel; use the app’s Easy name for stored A2. |
| storyweaver-2380-the-story-of-stories | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-2433-no-tricking-kutti | Level: B1/StoryWeaver Level 4 → B1/Intermediate; Publisher label preserved: StoryWeaver Level 4 | Preserve the publisher’s StoryWeaver Level 4 in publisherLevel; use the app’s Intermediate name for stored B1. |
| storyweaver-2597-granny-and-her-bird-friend | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-2616-shruti-s-secret-to-winning | Level: A1/StoryWeaver Level 1 → A1/Beginner; Publisher label preserved: StoryWeaver Level 1 | Preserve the publisher’s StoryWeaver Level 1 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-2909-windy-s-adventure | Level: A1/StoryWeaver Level 1 → A1/Beginner; Publisher label preserved: StoryWeaver Level 1 | Preserve the publisher’s StoryWeaver Level 1 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-2914-dia-s-favourite-festivals | Level: A1/StoryWeaver Level 1 → A1/Beginner; Publisher label preserved: StoryWeaver Level 1 | Preserve the publisher’s StoryWeaver Level 1 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-2942-the-love-of-art | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-2953-nina-plays-with-the-butterflies | Level: A1/StoryWeaver Level 1 → A1/Beginner; Publisher label preserved: StoryWeaver Level 1 | Preserve the publisher’s StoryWeaver Level 1 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-2985-aditi-s-trip-to-moon | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-3266-king-of-birds | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-3291-croaky-the-frog | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-16-vayu-the-wind | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-40-listen-to-my-body | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-54-susheela-s-kolams | Level: A1/StoryWeaver Level 1 → A1/Beginner; Publisher label preserved: StoryWeaver Level 1 | Preserve the publisher’s StoryWeaver Level 1 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-98-rani-s-first-day-at-school | Level: A1/StoryWeaver Level 1 → A1/Beginner; Publisher label preserved: StoryWeaver Level 1 | Preserve the publisher’s StoryWeaver Level 1 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-144-going-home | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-149-timmy-and-pepe | Level: A1/StoryWeaver Level 1 → A1/Beginner; Publisher label preserved: StoryWeaver Level 1 | Preserve the publisher’s StoryWeaver Level 1 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-7759-the-scarecrows-on-parade | Level: A1/StoryWeaver Level 1 → A1/Beginner; Publisher label preserved: StoryWeaver Level 1 | Preserve the publisher’s StoryWeaver Level 1 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-169-what-does-anu-see | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-332-bheema-the-sleepyhead | Level: A1/StoryWeaver Level 1 → A1/Beginner; Publisher label preserved: StoryWeaver Level 1 | Preserve the publisher’s StoryWeaver Level 1 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-652-the-generous-crow | Level: A2/StoryWeaver Level 3 → A2/Easy; Publisher label preserved: StoryWeaver Level 3 | Preserve the publisher’s StoryWeaver Level 3 in publisherLevel; use the app’s Easy name for stored A2. |
| storyweaver-33-not-now-not-now | Level: A1/StoryWeaver Level 1 → A1/Beginner; Publisher label preserved: StoryWeaver Level 1 | Preserve the publisher’s StoryWeaver Level 1 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-49-my-fish-no-my-fish | Level: A1/StoryWeaver Level 1 → A1/Beginner; Publisher label preserved: StoryWeaver Level 1 | Preserve the publisher’s StoryWeaver Level 1 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-80-aunty-jui-s-baby | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-82-i-want-that-one | Level: A1/StoryWeaver Level 1 → A1/Beginner; Publisher label preserved: StoryWeaver Level 1 | Preserve the publisher’s StoryWeaver Level 1 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-90-goloo-the-circle | Level: A1/StoryWeaver Level 1 → A1/Beginner; Publisher label preserved: StoryWeaver Level 1 | Preserve the publisher’s StoryWeaver Level 1 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-269-my-balwadi | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-209-the-timid-train | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-270-ritu-s-letter-gets-longer | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-369-the-red-raincoat | Level: A1/StoryWeaver Level 1 → A1/Beginner; Publisher label preserved: StoryWeaver Level 1 | Preserve the publisher’s StoryWeaver Level 1 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-409-colours-of-nature | Level: A1/StoryWeaver Level 1 → A1/Beginner; Publisher label preserved: StoryWeaver Level 1 | Preserve the publisher’s StoryWeaver Level 1 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-723-the-boat-ride | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-749-the-sparrow-and-the-fruit | Level: A2/StoryWeaver Level 3 → A2/Easy; Publisher label preserved: StoryWeaver Level 3 | Preserve the publisher’s StoryWeaver Level 3 in publisherLevel; use the app’s Easy name for stored A2. |
| storyweaver-758-going-to-buy-a-book | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-776-samira-goes-shopping | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-167682-the-hare-and-the-tortoise-again | Level: A2/StoryWeaver Level 3 → A2/Easy; Publisher label preserved: StoryWeaver Level 3 | Preserve the publisher’s StoryWeaver Level 3 in publisherLevel; use the app’s Easy name for stored A2. |
| storyweaver-821-here-comes-the-camel-and-other-poems | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-876-mouse-in-the-house | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-880-what-if | Level: A1/StoryWeaver Level 1 → A1/Beginner; Publisher label preserved: StoryWeaver Level 1 | Preserve the publisher’s StoryWeaver Level 1 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-927-the-royal-toothache | Level: A1/StoryWeaver Level 1 → A1/Beginner; Publisher label preserved: StoryWeaver Level 1 | Preserve the publisher’s StoryWeaver Level 1 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-944-smart-sona-helps-her-mother | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-163-veeru-goes-to-the-circus | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-396-bani | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-790-sniffles-the-crocodile-and-punch-the-butterfly | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-946-too-much-noise | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-952-phani-s-funny-chappals | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-997-pehelwaan-ji-plays-cricket | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-1017-saboo-and-jojo | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-1024-first-house | Level: A2/StoryWeaver Level 3 → A2/Easy; Publisher label preserved: StoryWeaver Level 3 | Preserve the publisher’s StoryWeaver Level 3 in publisherLevel; use the app’s Easy name for stored A2. |
| storyweaver-1034-grandma-s-glasses | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-1052-busy-ants | Level: A1/StoryWeaver Level 1 → A1/Beginner; Publisher label preserved: StoryWeaver Level 1 | Preserve the publisher’s StoryWeaver Level 1 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-1057-clean-cat | Level: A1/StoryWeaver Level 1 → A1/Beginner; Publisher label preserved: StoryWeaver Level 1 | Preserve the publisher’s StoryWeaver Level 1 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-1062-noisy-crows | Level: A1/StoryWeaver Level 1 → A1/Beginner; Publisher label preserved: StoryWeaver Level 1 | Preserve the publisher’s StoryWeaver Level 1 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-1112-we-are-all-animals | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-1208-singing-in-the-rain | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-1261-thangwang-and-bhalluka | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-1278-my-juggling-granny | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-1591-where-is-gogo | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-1791-my-musical-adventure | Level: A2/StoryWeaver Level 3 → A2/Easy; Publisher label preserved: StoryWeaver Level 3 | Preserve the publisher’s StoryWeaver Level 3 in publisherLevel; use the app’s Easy name for stored A2. |
| storyweaver-1531-mili-s-birthday-celebration | Level: A2/StoryWeaver Level 3 → A2/Easy; Publisher label preserved: StoryWeaver Level 3 | Preserve the publisher’s StoryWeaver Level 3 in publisherLevel; use the app’s Easy name for stored A2. |
| storyweaver-1658-ammu-s-puppy | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-122-no-smiles-today | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-921-samira-s-awful-lunch | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-957-topsy-turvy | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-981-wailers-three-a-folktale-from-china | Level: A2/StoryWeaver Level 3 → A2/Easy; Publisher label preserved: StoryWeaver Level 3 | Preserve the publisher’s StoryWeaver Level 3 in publisherLevel; use the app’s Easy name for stored A2. |
| storyweaver-986-tok-tok | Level: A2/StoryWeaver Level 3 → A2/Easy; Publisher label preserved: StoryWeaver Level 3 | Preserve the publisher’s StoryWeaver Level 3 in publisherLevel; use the app’s Easy name for stored A2. |
| storyweaver-1002-anaya-s-thumb | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-1067-naughty-dog | Level: A1/StoryWeaver Level 1 → A1/Beginner; Publisher label preserved: StoryWeaver Level 1 | Preserve the publisher’s StoryWeaver Level 1 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-1205-pishi-caught-in-a-storm | Level: A2/StoryWeaver Level 3 → A2/Easy; Publisher label preserved: StoryWeaver Level 3 | Preserve the publisher’s StoryWeaver Level 3 in publisherLevel; use the app’s Easy name for stored A2. |
| storyweaver-1219-tara-finds-her-stars | Level: A2/StoryWeaver Level 3 → A2/Easy; Publisher label preserved: StoryWeaver Level 3 | Preserve the publisher’s StoryWeaver Level 3 in publisherLevel; use the app’s Easy name for stored A2. |
| storyweaver-1583-booboo-sings-for-vihaan | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-1685-mangoes-for-moidootty | Level: A2/StoryWeaver Level 3 → A2/Easy; Publisher label preserved: StoryWeaver Level 3 | Preserve the publisher’s StoryWeaver Level 3 in publisherLevel; use the app’s Easy name for stored A2. |
| storyweaver-1687-the-woman-with-no-soul | Level: A2/StoryWeaver Level 3 → A2/Easy; Publisher label preserved: StoryWeaver Level 3 | Preserve the publisher’s StoryWeaver Level 3 in publisherLevel; use the app’s Easy name for stored A2. |
| storyweaver-1722-the-princess-and-the-veggy-lion | Level: A2/StoryWeaver Level 3 → A2/Easy; Publisher label preserved: StoryWeaver Level 3 | Preserve the publisher’s StoryWeaver Level 3 in publisherLevel; use the app’s Easy name for stored A2. |
| storyweaver-1804-asha-gives-up-a-bad-habit | Level: A2/StoryWeaver Level 3 → A2/Easy; Publisher label preserved: StoryWeaver Level 3 | Preserve the publisher’s StoryWeaver Level 3 in publisherLevel; use the app’s Easy name for stored A2. |
| storyweaver-1933-jaggee-s-mornings | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-1974-my-friend-trace-roger-the-robot | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-1983-nadir-s-pet | Level: A2/StoryWeaver Level 3 → A2/Easy; Publisher label preserved: StoryWeaver Level 3 | Preserve the publisher’s StoryWeaver Level 3 in publisherLevel; use the app’s Easy name for stored A2. |
| storyweaver-2011-long-water | Level: A1/StoryWeaver Level 1 → A1/Beginner; Publisher label preserved: StoryWeaver Level 1 | Preserve the publisher’s StoryWeaver Level 1 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-2711-the-day-it-rained-fish | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-1828-the-cave-party | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-218-little-painters | Level: A1/StoryWeaver Level 1 → A1/Beginner; Publisher label preserved: StoryWeaver Level 1 | Preserve the publisher’s StoryWeaver Level 1 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-702-the-flyaway-cradle | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-847-rumniya | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-2976-guess-this-place-ghost-town | Level: A2/StoryWeaver Level 3 → A2/Easy; Publisher label preserved: StoryWeaver Level 3 | Preserve the publisher’s StoryWeaver Level 3 in publisherLevel; use the app’s Easy name for stored A2. |
| storyweaver-2064-prakruti | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-2138-happy-world | Level: A2/StoryWeaver Level 3 → A2/Easy; Publisher label preserved: StoryWeaver Level 3 | Preserve the publisher’s StoryWeaver Level 3 in publisherLevel; use the app’s Easy name for stored A2. |
| storyweaver-2166-tina-and-the-crazy-animal | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-2198-richard-s-unlucky-day | Level: A2/StoryWeaver Level 3 → A2/Easy; Publisher label preserved: StoryWeaver Level 3 | Preserve the publisher’s StoryWeaver Level 3 in publisherLevel; use the app’s Easy name for stored A2. |
| storyweaver-2962-gargi-and-soapy | Level: A1/StoryWeaver Level 2 → A1/Beginner; Publisher label preserved: StoryWeaver Level 2 | Preserve the publisher’s StoryWeaver Level 2 in publisherLevel; use the app’s Beginner name for stored A1. |
| storyweaver-3234-wonders-of-martina-s-adventure | Level: A2/StoryWeaver Level 3 → A2/Easy; Publisher label preserved: StoryWeaver Level 3 | Preserve the publisher’s StoryWeaver Level 3 in publisherLevel; use the app’s Easy name for stored A2. |

### ted-library.json

| ID | What changed | Evidence / reason |
|---|---|---|
| angela_duckworth_grit | Level: A2/Easy → B1/Intermediate | The speech moves from management consulting to cadet research, standardised scores and graduation prediction in sustained multi-clause academic narration, beyond A2. |
| carol_dweck_power_of_believing | Level: A2/Easy → B1/Intermediate | The speech explains growth/fixed mindsets, brain responses, school-transition studies and equality in sustained abstract causal clauses, beyond A2. |
| sal_khan_reinvent_education | Level: A2/Easy → B1/Intermediate; Description: Sal Khan explains how tutoring his cousins led to reusable videos and a free learning platform, then shows how self-paced practice can support classroom teaching.; Summary limited to caption-supported content | The lengthy talk uses hypotenuse, differentiated/self-paced learning, mastery exercises and classroom models, exceeding A2. |

### teded-library.json

| ID | What changed | Evidence / reason |
|---|---|---|
| teded_what_is_depression | Level: A2/Easy → B1/Intermediate | Psychiatric diagnosis, neurotransmitters and electroconvulsive/transcranial treatment explanations use sustained specialised language beyond A2. |
| teded_what_if_you_didnt_sleep | Level: A2/Easy → B1/Intermediate | DNA repair, fatal insomnia, dementia and brain waste mechanisms use connected scientific explanations beyond A2. |
| teded_how_to_practice_effectively | Level: A2/Easy → B1/Intermediate | Myelin sheaths, axons, insulation and physical/mental practice research exceed A2 language. |
| teded_immune_system | Description: The lesson follows immune cells responding to infection, showing how messenger proteins, T cells, B cells and antibodies work together.; Summary limited to caption-supported content | Macrophages, neutrophils, T cells and B cells explain infection response, but the complete cache does not explain vaccines. |
| teded_why_do_cats_act_so_weird | Level: A1/Beginner → B1/Intermediate | A sustained 646-word evolutionary explanation with opportunistic predators, unconventional hiding and resource competition clearly exceeds A1. |
| teded_why_is_glass_transparent | Title: How Much Water Do We Need?; Description: The lesson explains water’s roles in the body, what happens when water balance is too low or too high, and factors that affect hydration needs.; Summary limited to caption-supported content; Tags: health, science, hydration, biology | The English caption concerns body water balance, dehydration and overhydration, not transparency or glass. |
| teded_how_does_stock_market_work | Level: A2/Easy → B1/Intermediate | Initial public offerings, fluctuating costs, market forces and investor psychology exceed A2 everyday language. |
| teded_how_do_vaccines_work | Level: A2/Easy → B1/Intermediate | Adaptive immune response, live attenuated/inactive/subunit vaccines and immunity trade-offs exceed A2. |
| teded_history_of_world_according_to_cats | Level: A2/Easy → B1/Intermediate | Neolithic farming, archaeological history, religious culture and domestication in extended clauses exceed A2. |
| teded_how_do_solar_panels_work | Level: A2/Easy → B1/Intermediate | Charged electrons/holes, silicon bonds and p/n junction physics exceed A2. |

### travel-english-library.json

| ID | What changed | Evidence / reason |
|---|---|---|
| travel-airport | Title: Travel Vocabulary and Idioms; Description: A BBC lesson teaches travel vocabulary and idioms, including check-in and gates, budgets, sightseeing, jet lag and the return home.; Summary limited to caption-supported content; Tags: travel, vocabulary, idioms, airports | The full cache has some check-in/gate vocabulary but mainly teaches travel idioms, sightseeing, budgets, jet lag and post-holiday blues; airport security is not covered. |
| travel-restaurant | Title: Tourism and Travel Discussions; Level: A2/Easy → B1/Intermediate; Description: A BBC discussion compilation begins with Antarctic tourism and includes heritage tourism and other travel-related conversations.; Summary limited to caption-supported content; Tags: travel, tourism, listening, culture; Hidden: False; hidden/hiddenNote removed | The 4,687-word cache is a BBC compilation beginning with Antarctic tourism and continuing through heritage, time perception and other topics, not restaurant ordering/menu/payment. |
| travel-directions | Title: English at the Airport; Description: Justin models airport conversations, including check-in, flight problems and useful instructions for take-off and landing.; Summary limited to caption-supported content; Tags: travel, airports, check-in, flights, travel-announcements | The opening explicitly introduces airport English and the cache includes seatbelts and tray tables. |
| travel-shopping | Title: Hotel Check-In English; Level: A2/Easy → B1/Intermediate; Description: The presenter explains hotel check-in language, reservations, room upgrades and asking about facilities such as the pool and gym.; Summary limited to caption-supported content; Tags: travel, hotels, check-in, hospitality; Hidden: False; hidden/hiddenNote removed | The caption explicitly teaches hotel check-in, booking, upgrades, pools and gyms, not shopping/bargaining/returns. |
| travel-transport | Description: Neil and Georgie discuss commuting by bus and Tube, crowded or delayed services and long-distance train experiences.; Summary limited to caption-supported content | Neil and Georgie describe commuting, crowded trains and long-distance travel; the complete cache has no ticket-buying language promised by the description. |

### voa-library.json

| ID | What changed | Evidence / reason |
|---|---|---|
| voa-science-of-sleep | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-history-of-jazz | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-artificial-intelligence-daily-life | Level: B1/Upper-Intermediate → B2/Advanced | AI governance, opaque decisions, racial bias and high-stakes regulation use abstract policy exposition. |
| voa-managing-stress | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-learning-second-language | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-robots-future-of-work | Level: B1/Upper-Intermediate → B2/Advanced | Automation/displacement and inequality are discussed through contrasting economic arguments and an abstract hedge metaphor. |
| voa-sugar-and-health | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-digital-divide | Level: B1/Upper-Intermediate → B2/Advanced | Equitable connectivity, structural inequalities and digital literacy use extended causal exposition. |
| voa-entrepreneurship-startups | Level: B1/Upper-Intermediate → B2/Advanced | Venture funding, IPOs, survivorship bias and startup ecosystems use specialised abstract business vocabulary. |
| voa-immigration-cultural-identity | Level: B1/Upper-Intermediate → B2/Advanced | Assimilation/integration, intergenerational identity and managed diversity use sustained abstract sociological prose. |
| voa-american-dream | Level: B1/Upper-Intermediate → B2/Advanced | Intergenerational mobility, deteriorating conditions and cultural archetypes use abstract historical/economic argument. |
| voa-science-of-nutrition | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-words-and-their-stories-idioms | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-gig-economy | Level: B1/Upper-Intermediate → B2/Advanced | Contractor classification, pension protections, deactivation and a legal framework use dense specialised employment-law exposition. |
| voa-level1-lesson-32-welcome-to-the-treehouse | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-level1-lesson-33-learning-america-s-sport | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-level1-lesson-34-what-will-i-do | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-level1-lesson-35-let-s-make-dinner | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-level1-lesson-36-i-can-fix-this | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-level1-lesson-37-let-s-agree-to-disagree | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-level1-lesson-38-she-s-my-best-friend | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-level1-lesson-39-it-s-unbelievable | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-level1-lesson-40-the-woods-are-alive | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-level1-lesson-41-teamwork-works-best-with-a-team | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-level1-lesson-30-rolling-on-the-river | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-level1-lesson-31-take-me-out-to-the-ball-game | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-level1-lesson-42-i-was-minding-my-own-business | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-level1-lesson-43-time-for-plan-b | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-level1-lesson-44-making-healthy-choices | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-level1-lesson-46-may-i-borrow-that | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-level1-lesson-47-how-can-i-help | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-level1-lesson-48-have-you-ever | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-level1-lesson-49-operation-spy | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-level1-lesson-50-back-to-school | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-level1-lesson-51-a-good-habit | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |
| voa-level1-lesson-52-taking-chances | Level: A2/Pre-Intermediate → A2/Easy | Equivalent label Pre-Intermediate → Easy for existing A2; no CEFR change. |

### world-flight-library.json

| ID | What changed | Evidence / reason |
|---|---|---|
| world-flight-bangkok-river-transport-video | Level: A2/Intermediate → A2/Easy | The English cache models concrete boat choices, tickets, boarding and exit instructions with repeated everyday travel verbs and short conditional requests; A2 is supported with travel vocabulary help. |

## Duration discrepancies after refresh

**66**, down from 67. Durations were not changed. Difference compares the library duration with the last caption start, as in Round 35; it is a review signal, not proof that a different video is present.

| Entry | Stored seconds | Last caption start | Difference |
|---|---:|---:|---:|
| bbc-ideas-library.json/bbcideas_philosophy_hedonism | 150 | 109.710 | 26.9% |
| bbc-ideas-library.json/bbcideas_philosophy_absurdism | 300 | 158.640 | 47.1% |
| bbc-ideas-library.json/bbcideas_psychology_seduction | 450 | 286.979 | 36.2% |
| bbc-library.json/bbc_grammar_advanced_learner_mistakes | 300 | 185.659 | 38.1% |
| bbc-library.json/bbc_grammar_formal_informal | 330 | 238.770 | 27.6% |
| bbc-library.json/bbc_grammar_giving_emphasis | 300 | 181.600 | 39.5% |
| bbc-library.json/bbc_grammar_native_speaker_mistakes | 330 | 227.050 | 31.2% |
| bbc-library.json/bbc_grammar_linking_words_contrast | 270 | 159.959 | 40.8% |
| bbc-library.json/bbc_grammar_more_advanced_mistakes | 270 | 188.480 | 30.2% |
| bbc-library.json/bbc_masterclass_conversation_phrases | 330 | 205.510 | 37.7% |
| bbc-library.json/bbc_masterclass_inversion_1 | 330 | 212.719 | 35.5% |
| bbc-library.json/bbc_masterclass_inversion_2 | 390 | 255.760 | 34.4% |
| bbc-library.json/bbc_masterclass_linking_words | 360 | 247.410 | 31.3% |
| bbc-library.json/bbc_grammar_verb_patterns | 315 | 230.660 | 26.8% |
| bbc-library.json/bbc_grammar_mixing_conditionals | 390 | 249.129 | 36.1% |
| bigthink-library.json/bigthink_free_will_physics | 180 | 104.340 | 42.0% |
| bigthink-library.json/bigthink_free_will_pinker | 270 | 130.280 | 51.7% |
| bigthink-library.json/bigthink_psychology_happiness | 330 | 207.379 | 37.2% |
| bigthink-library.json/bigthink_reverse_unhappiness | 360 | 202.110 | 43.9% |
| bigthink-library.json/bigthink_teenage_brain | 480 | 239.340 | 50.1% |
| business-english-library.json/business-emails | 718 | 1249.320 | 74.0% |
| business-english-library.json/business-presentations | 914 | 328.770 | 64.0% |
| business-english-library.json/business-networking | 445 | 622.990 | 40.0% |
| business-english-library.json/business-phone | 668 | 893.579 | 33.8% |
| business-english-library.json/business-negotiating | 523 | 1817.200 | 247.5% |
| crash-course-library.json/cc-ww2-overview | 660 | 950.010 | 43.9% |
| crash-course-library.json/cc-biology-cells | 688 | 419.839 | 39.0% |
| grammar-library.json/bbc_grammar_question_tags | 345 | 257.650 | 25.3% |
| grammar-library.json/bbc_masterclass_choose_tense | 315 | 219.950 | 30.2% |
| grammar-library.json/bbc_grammar_present_past | 270 | 160.100 | 40.7% |
| internet-memes-library.json/memes-viral | 547 | 385.870 | 29.5% |
| internet-memes-library.json/memes-language | 631 | 977.990 | 55.0% |
| internet-memes-library.json/memes-culture | 489 | 1023.924 | 109.4% |
| kids-library.json/kids_weathering_erosion | 330 | 234.543 | 28.9% |
| kids-library.json/kids_home_sweet_habitat | 390 | 269.158 | 31.0% |
| kids-library.json/kids_food_webs | 300 | 218.078 | 27.3% |
| kids-library.json/kids_everything_revolves | 390 | 255.213 | 34.6% |
| kids-library.json/kids_climate_change | 450 | 220.400 | 51.0% |
| kids-library.json/kids_busy_bees | 300 | 224.389 | 25.2% |
| kids-library.json/kids_cave_animals | 360 | 264.540 | 26.5% |
| kids-library.json/kids_diamond_super_crystal | 360 | 262.220 | 27.2% |
| kids-library.json/kids_whats_inside_rocks | 270 | 172.900 | 36.0% |
| kids-library.json/kids_antarctica | 480 | 349.618 | 27.2% |
| kurzgesagt-library.json/kurzgesagt_loneliness | 358 | 649.255 | 81.4% |
| kurzgesagt-library.json/kurzgesagt_addiction | 551 | 339.770 | 38.3% |
| minecraft-library.json/minecraft-survival | 812 | 1179.780 | 45.3% |
| minecraft-library.json/minecraft-crafting | 734 | 1169.480 | 59.3% |
| minecraft-library.json/minecraft-building | 678 | 2326.200 | 243.1% |
| natgeo-library.json/natgeo-coral-reef-crisis | 310 | 182.149 | 41.2% |
| natgeo-library.json/natgeo-ancient-egypt | 368 | 700.649 | 90.4% |
| natgeo-library.json/natgeo-climate-change | 362 | 183.710 | 49.3% |
| natgeo-library.json/natgeo-plastic-pollution | 302 | 178.680 | 40.8% |
| natgeo-library.json/natgeo-sleep-science | 295 | 4919.853 | 1567.7% |
| natgeo-library.json/natgeo-space-exploration | 360 | 242.130 | 32.7% |
| ted-library.json/steven_johnson_where_good_ideas_come | 1016 | 232.200 | 77.1% |
| teded-library.json/teded_antibiotic_resistance | 357 | 256.839 | 28.1% |
| teded-library.json/teded_immune_system | 300 | 380.600 | 26.9% |
| teded-library.json/teded_bridge_riddle | 287 | 210.589 | 26.6% |
| teded-library.json/teded_how_memories_can_be_manipulated | 312 | 1047.397 | 235.7% |
| teded-library.json/teded_history_of_world_according_to_cats | 340 | 254.844 | 25.0% |
| teded-library.json/teded_how_do_solar_panels_work | 196 | 278.646 | 42.2% |
| travel-english-library.json/travel-airport | 312 | 703.440 | 125.5% |
| travel-english-library.json/travel-hotel | 360 | 152.610 | 57.6% |
| travel-english-library.json/travel-restaurant | 492 | 1833.240 | 272.6% |
| travel-english-library.json/travel-shopping | 356 | 1049.130 | 194.7% |
| vox-library.json/vox_healthcare_cost | 570 | 318.600 | 44.1% |

## Validation and progress

- Cached-caption refresh review complete; all 112 changed bodies are English.
- Metadata edits complete; checker coverage and both new metadata error counts pass.
- Protected-field and key-order comparison passed across all 1,388 entries.
- `pnpm test src/lib src/data`: **441 passed, 3 failed** (96 files passed, 2 failed). Failures are stale source expectations at `src/lib/source-library.test.ts:132` (directions expects travel-directions), `src/lib/course-presets.test.ts:263` (Smart Questions points at the teamwork source), and `:291` (directions keywords versus airport metadata). As instructed, neither tests nor course presets were edited.
- `npx tsc --noEmit -p .`: only the known missing `@anthropic-ai/sdk` errors at `src/lib/ai/providers/anthropic.ts:1` and `:32`, and resulting implicit-any error at `:53`. No dependency installed.
- `git diff --check`: passed.
- Owner approved these exact 27 files for local library-by-library commits on 13 October 2026. Only these own files are staged; no push or merge.

## Files touched

- `src/data/african-storybook-library.json`
- `src/data/bbc-ideas-library.json`
- `src/data/bbc-library.json`
- `src/data/bigthink-library.json`
- `src/data/book-library.json`
- `src/data/business-english-library.json`
- `src/data/crash-course-library.json`
- `src/data/destination-reading-library.json`
- `src/data/discussion-library.json`
- `src/data/grammar-library.json`
- `src/data/hooks-library.json`
- `src/data/internet-memes-library.json`
- `src/data/kids-library.json`
- `src/data/kurzgesagt-library.json`
- `src/data/listening-library.json`
- `src/data/minecraft-library.json`
- `src/data/natgeo-library.json`
- `src/data/picture-books-library.json`
- `src/data/storyweaver-library.json`
- `src/data/ted-library.json`
- `src/data/teded-library.json`
- `src/data/travel-english-library.json`
- `src/data/voa-library.json`
- `src/data/world-flight-library.json`
- `src/data/library-video-audit.json`
- `scripts/audit-library-videos.ts`
- `docs/library-round-36-progress.md`

## Local commit progress

- Completed `src/data/african-storybook-library.json` metadata corrections and audit status update.
- Completed `src/data/bbc-ideas-library.json` metadata corrections and audit status update.
- Completed `src/data/bbc-library.json` metadata corrections and audit status update.
- Completed `src/data/bigthink-library.json` metadata corrections and audit status update.
- Completed `src/data/book-library.json` metadata corrections and audit status update.
- Completed `src/data/business-english-library.json` metadata corrections and audit status update.
- Completed `src/data/crash-course-library.json` metadata corrections and audit status update.
- Completed `src/data/destination-reading-library.json` metadata corrections and audit status update.
- Completed `src/data/discussion-library.json` metadata corrections and audit status update.
- Completed `src/data/grammar-library.json` metadata corrections and audit status update.
- Completed `src/data/hooks-library.json` metadata corrections and audit status update.
- Completed `src/data/internet-memes-library.json` metadata corrections and audit status update.
- Completed `src/data/kids-library.json` metadata corrections and audit status update.
- Completed `src/data/kurzgesagt-library.json` metadata corrections and audit status update.
- Completed `src/data/listening-library.json` metadata corrections and audit status update.
- Completed `src/data/minecraft-library.json` metadata corrections and audit status update.
- Completed `src/data/natgeo-library.json` metadata corrections and audit status update.
- Completed `src/data/picture-books-library.json` metadata corrections and audit status update.
- Completed `src/data/storyweaver-library.json` metadata corrections and audit status update.
- Completed `src/data/ted-library.json` metadata corrections and audit status update.
