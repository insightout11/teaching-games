# Library video audit — 12 October 2026

Draft for owner review. No library entry was changed.

## Scope and method

- Branch `codex/library-round-35` from `origin/main`. Only this report, the audit JSON and the mechanical script are added.
- Exactly 641 non-World-Flight YouTube entries across 18 libraries; the 150 World Flight videos are excluded. The 641 audited entries have 641 distinct YouTube IDs.
- Cached `source_extractions` only, read using the main checkout’s existing environment file without copying or displaying it. No YouTube caption fetch, paid transcript service, AI API call, database write, or library modification.
- Compare titles and descriptions to readable caption evidence, use targeted full-text inspection for suspected missing promises, and record uncertain matches as `ok` with a caveat. This audits stored material, not live video/audio or current factual truth.
- At the owner’s explicit direction, non-English translated captions are `weak-captions` for English lesson use; a translation cannot establish the spoken English level.
- Word counts use whitespace-delimited word tokens in Latin and non-Latin scripts. WPM uses **the library duration**, not measured speaking speed. Sparse text, silence, translations, webpage extracts and bad durations can distort it.
- Last timestamp means the last **caption start**, with caption end reported separately where durations exist. Offset/duration fields use the existing pipeline’s milliseconds; plain text has no timing. A >25% duration difference is a review signal, not an automatic subject mismatch.
- Each entry gets one primary status. Notes retain secondary concerns. Suggested actions are recommendations for the owner, not changes performed.

## Progress and coverage

Completed libraries: 10/18; judged entries: 586/641. Cached inventory captured at 2026-10-12T15:07:11.259Z. All 641 have cached text; 607 have timestamped segments, 34 have untimed text.

## Totals per library

| Library | Entries | ok | mismatch | partial | weak-captions | no-captions | level-off |
|---|---:|---:|---:|---:|---:|---:|---:|
| bbc-library.json | 115 | 86 | 1 | 9 | 19 | 0 | 0 |
| crash-course-library.json | 14 | 1 | 0 | 1 | 11 | 0 | 1 |
| grammar-library.json | 89 | 77 | 0 | 4 | 8 | 0 | 0 |
| hooks-library.json | 60 | 53 | 1 | 4 | 2 | 0 | 0 |
| kids-library.json | 101 | 85 | 1 | 1 | 6 | 0 | 8 |
| kurzgesagt-library.json | 13 | 1 | 0 | 0 | 12 | 0 | 0 |
| listening-library.json | 60 | 58 | 0 | 2 | 0 | 0 | 0 |
| natgeo-library.json | 13 | 2 | 0 | 3 | 7 | 0 | 1 |
| ted-library.json | 20 | 1 | 0 | 0 | 19 | 0 | 0 |
| teded-library.json | 101 | 52 | 0 | 0 | 49 | 0 | 0 |
| **TOTAL** | **586** | 416 | 3 | 24 | 133 | 0 | 10 |

## Non-ok entries, grouped by library

### bbc-library.json

| ID | Title | Status | Caption evidence / limitation | Suggested action |
|---|---|---|---|---|
| bbc_grammar_advanced_learner_mistakes | Grammar: Advanced Learner Mistakes | partial | Dan teaches indirect WH-clause order and general-reference articles (“relative pronouns”), rather than the promised preposition coverage.  | Rewrite description around WH clauses and articles. |
| bbc_grammar_formal_informal | Grammar: Formal English and Informal English | partial | the presenter introduces herself as “Sian” and teaches formal/informal register, while the description names Dan.  | Rewrite description with Sian as presenter. |
| bbc_grammar_giving_emphasis | Grammar: Giving Emphasis in English | partial | the explanation covers it-clefts (“using a cleft sentence”), not the promised fronting and do-support.  | Rewrite description to describe it-cleft emphasis only. |
| bbc_grammar_what_emphasis | Grammar: Using 'What' to Give Emphasis | partial | “Sian here” introduces what/all-clefts, matching the grammar topic but contradicting the named presenter Dan.  | Rewrite description with Sian as presenter. |
| bbc_masterclass_conversation_phrases | Useful Phrases for English Conversation | partial | Sian introduces seven discourse markers, including “in other words”, while the description names Dan and advertises a broader phrase collection.  | Rewrite description with Sian and the seven covered markers. |
| bbc_masterclass_linking_words | How to Use Linking Words in English | partial | “Sian here” introduces conversational signposting, including basically and by the way, rather than a Dan-led cause-and-effect linking-word lesson.  | Rewrite description around Sian and spoken discourse markers. |
| bbc_grammar_verb_patterns | Grammar: 'Stop Buying' or 'Stop to Buy'? | partial | Sian explains stop, regret and go on (“stop buying” versus “stop to buy”); the description instead names Dan and promises remember and try.  | Rewrite description with the actual presenter and three covered verbs. |
| bbc_climate_saving_water | Saving Water in the Driest Place on Earth | partial | the captions call Yuma “one of the driest places on earth”, while the title claims the single driest place.  | Retitle to “Saving Water on Desert Date Farms” or retain “one of the driest places”. |
| bbc-grammar-r2-FBmjH6nh5-k | Phrasal verbs: types 1–4 — 6 Minute Grammar | weak-captions | The cache is a 324-word untimed multi-word-verb overview; it asks “Do you need to learn them?” but does not supply the promised types 1–4 clip as a transcript.  | Remove from video-caption lesson selection until the complete matching English transcript is cached. |
| bbc-grammar-r2-r6XpFWmA7Gk | Quantifiers — 6 Minute Grammar | weak-captions | Only a 94-word introduction is cached, ending “But what are the differences?”, without the actual distinctions or full lesson.  | Remove from video-caption lesson selection until the complete matching English transcript is cached. |
| bbc-grammar-r2-X6LuWwb9whM | How to use present tenses — 6 Minute Grammar | weak-captions | Only 51 untimed words are cached, directing the reader to “grammar notes on this page” rather than transcribing the video.  | Remove from video-caption lesson selection until the complete matching English transcript is cached. |
| bbc-grammar-r2-uTB5I8V9Eog | Past simple and past continuous — 6 Minute Grammar | mismatch | the cache is a first-person Titanic survivor account describing the ship sinking and “people drowning”, rather than a BBC grammar explanation.  | Remove pending verification of the video/caption pairing; retitle to “A Titanic Survivor Remembers” only if this is the intended source. |
| bbc-grammar-r2-tbru3bW2kVE | Using can, could, be able to and manage to — 6 Minute Grammar | weak-captions | The 63-word cache says “Read the grammar explanation” and try a quiz; the actual six-minute explanation is absent.  | Remove from video-caption lesson selection until the complete matching English transcript is cached. |
| bbc-grammar-r2-jwmKjgwlMk8 | Present perfect and past simple — 6 Minute Grammar | weak-captions | The 58-word cache tells readers to work through an activity and “try the verb form quiz”, rather than transcribing the lesson.  | Remove from video-caption lesson selection until the complete matching English transcript is cached. |
| bbc-grammar-r2-jcAX1RtKq3U | Talking about the future — 6 Minute Grammar | weak-captions | The 67-word cache says “read this explanation” and try an activity; it is an introductory page blurb, not a full transcript.  | Remove from video-caption lesson selection until the complete matching English transcript is cached. |
| bbc-grammar-r2-PgsG98vByiw | The past simple tense — 6 Minute Grammar | weak-captions | The 104-word cache is a short cycling-accident account (“I fell off my bike”), not enough to substantiate the promised six-minute explanation and practice.  | Remove from video-caption lesson selection until the complete matching English transcript is cached. |
| bbc-grammar-r2-elPHkXNxi2g | How to talk about the future — 6 Minute Grammar | weak-captions | The 61-word cache promises “six different ways” later in a session but does not provide those explanations.  | Remove from video-caption lesson selection until the complete matching English transcript is cached. |
| bbc-grammar-r2-3aQOLTfnAOc | State verbs — 6 Minute Grammar | weak-captions | Only a 73-word untimed sample conversation about London is cached; the claimed grammar explanation is missing.  | Remove from video-caption lesson selection until the complete matching English transcript is cached. |
| bbc-grammar-r2-8_nhtAwI0dA | The present perfect with just, already and yet — 6 Minute Grammar | weak-captions | The 127-word cache refers to what “Finn said this in the video” and instructs a quiz, indicating webpage notes rather than speech captions.  | Remove from video-caption lesson selection until the complete matching English transcript is cached. |
| bbc-grammar-r2-8VETylIxyhw | The first conditional — 6 Minute Grammar | weak-captions | The cache contains only 82 words of example advice about pregnancy and a baby, not the six-minute explanation and practice.  | Remove from video-caption lesson selection until the complete matching English transcript is cached. |
| bbc-grammar-r2-3OuqzHxlrHc | The second conditional — 6 Minute Grammar | weak-captions | The cache contains 125 words of conditional example sentences, but no complete explanation/practice transcript for the 367-second entry.  | Remove from video-caption lesson selection until the complete matching English transcript is cached. |
| bbc-grammar-r2-P4_kqBsj2sE | The third conditional — 6 Minute Grammar | weak-captions | The 85-word cache announces “We’re going to do two activities” but contains neither activity or the full lesson.  | Remove from video-caption lesson selection until the complete matching English transcript is cached. |
| bbc-grammar-r2-o-GWYDA4IQY | Present perfect with ever and never — 6 Minute Grammar | weak-captions | The 49-word cache tells readers to “look at the picture here” and describes tick/cross icons, not a present-perfect lesson transcript.  | Remove from video-caption lesson selection until a complete matching English transcript is cached. |
| bbc-grammar-r2-nI5zaB6QL-o | Present and past passive — 6 Minute Grammar | weak-captions | The 66-word cache introduces passive voice, then says “Read the grammar explanation”; the actual video explanation is not supplied.  | Remove from video-caption lesson selection until a complete matching English transcript is cached. |
| bbc-grammar-r2-ryRu8zFCKZE | Articles — 6 Minute Grammar | weak-captions | Only a 138-word Facebook travel-story example is cached, rather than the full article explanation/practice transcript advertised for 364 seconds.  | Remove from video-caption lesson selection until a complete matching English transcript is cached. |
| bbc-grammar-r2-B5hDy53iGNA | Future continuous and 'be' with the infinitive — 6 Minute Grammar | partial | the stored text explains only future continuous, including “I’ll be taking my driving test”, with no be-plus-infinitive section promised by the title.  | Rewrite description/title around future continuous or verify and replace the incomplete cache before use. |
| bbc-grammar-r2-3dA7P5arkyc | Used to — 6 Minute Grammar | weak-captions | The 47-word cache asks about used to versus past simple and says “look at some examples first”, without providing those examples.  | Remove from video-caption lesson selection until a complete matching English transcript is cached. |
| bbc-grammar-r2-38QqDrckyxM | Active and passive voice — 6 Minute Grammar | weak-captions | The 83-word cache explains only active voice, ending “So what is the passive voice?”, without transcribing the answer.  | Remove from video-caption lesson selection until a complete matching English transcript is cached. |
| bbc-grammar-r2-foyWhOHhTT0 | Question tags — 6 Minute Grammar | weak-captions | The 85-word cache tells readers to “stay on this page” to learn question tags; the tag lesson itself is absent.  | Remove from video-caption lesson selection until a complete matching English transcript is cached. |

### crash-course-library.json

| ID | Title | Status | Caption evidence / limitation | Suggested action |
|---|---|---|---|---|
| cc-ww1-overview | World War I: Crash Course World History | weak-captions | the stored text is an Arabic-script translation, beginning “مرحبًا، أنا جون غرين وهذه سلسلة”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| cc-ww2-overview | World War II: Crash Course European History #38 | level-off | The 2,467-word caption uses unscaffolded terms such as Judeo-Bolshevism, non-aggression pact and totalitarian aggression within a dense account of military strategy, exceeding the stored B1 label.  | Raise to B2 after checking delivery. |
| cc-psychology-intro | Introduction to Psychology: Crash Course | weak-captions | the stored text is an Arabic-script translation, beginning “ذلك الحلم عن الديناصور في ثوب”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| cc-economics-supply-demand | Supply and Demand: Crash Course Economics | weak-captions | the stored text is an Arabic-script translation, beginning “أنا السيد كليفورد، وهذه أدريان هيل،”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| cc-biology-evolution | Natural Selection: Crash Course Biology | weak-captions | the stored text is an Arabic-script translation, beginning “،مرحبًا، أنا "هانك" وأنا إنسان .لكني”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| cc-climate-science | Climate Science: Crash Course | partial | The climate mechanisms and consequences match, but the caption closes by naming SciShow, rather than the title’s Crash Course series.  | Correct the title/series attribution to a SciShow climate-change explainer after verifying the video/cache pairing. |
| cc-sociology-intro | Introduction to Sociology: Crash Course | weak-captions | the stored text is an Arabic-script translation, beginning “مرحبًا بكم انا نيكول سوين, لدي”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| cc-english-lit-hamlet | Ghosts, Murder, and More Murder - Hamlet Part 1: Crash Course Literature #203 | weak-captions | the stored text is an Arabic-script translation, beginning “مرحًبا، أنا جون غرين وهذا Crash”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| cc-philosophy-intro | Introduction to Philosophy: Crash Course | weak-captions | the stored text is an Arabic-script translation, beginning “كراش كورس الفلسفة مُقدَّمة لك من”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| cc-economics-globalisation | Globalization and Trade and Poverty: Crash Course Economics #16 | weak-captions | the stored text is an Arabic-script translation, beginning “مرحبًا بكم في Crash Course Economics.”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| cc-astronomy-solarsystem | The Solar System: Crash Course Astronomy | weak-captions | the stored text is an Arabic-script translation, beginning “النظام الشمسي هو الاسم الذي نطلقه”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| cc-us-constitution | Constitutional Compromises: Crash Course Government and Politics #5 | weak-captions | the stored text is an Arabic-script translation, beginning “مرحبا، أنا Craig، وهذا "كراش كورس":”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| cc-biology-cells | Cells: Crash Course Biology | weak-captions | The cached cell-biology body is Albanian translation, beginning Qelizat janë njësit me të vogla, not English speech captions.  | Replace with full English speech captions and verify the Hank Green attribution. |

### grammar-library.json

| ID | Title | Status | Caption evidence / limitation | Suggested action |
|---|---|---|---|---|
| bbc-grammar-r2-HUXXgVElADg | Have to and must — 6 Minute Grammar | weak-captions | Only an 86-word webpage exercise headed The doctor’s advice is cached, referring readers to activity 2/session 1, not a six-minute speech transcript.  | Replace the cache with complete English speech captions before lesson use. |
| bbc-grammar-r2-V2quIYo41Ig | Used to and would — 6 Minute Grammar | weak-captions | Only 86 words of webpage grammar notes are cached, starting with a reference to the last activity, not the six-minute dialogue.  | Replace the cache with complete English speech captions before lesson use. |
| bbc-grammar-r2-j9b1CNN_rFU | Asking questions — 6 Minute Grammar | partial | The complete 263-word cache is Alice, Sophie and Amith asking personal questions; it models questions but contains no grammar explanation.  | Describe it as a question-and-answer model, or verify the six-minute lesson’s correct cache. |
| bbc-grammar-r2-voQLMgJE-QE | Adverbs of frequency — 6 Minute Grammar | weak-captions | Only 52 words announcing what the session will teach are cached; no rules or worked examples follow.  | Replace the introductory webpage cache with full English speech captions. |
| bbc-grammar-r2-tzEt4iwsIdo | Using like for preference and description — 6 Minute Grammar | weak-captions | Only 57 words about Ginger the cat are cached, without the promised preference-versus-description explanation.  | Verify the cache and replace it with full speech captions. |
| bbc-grammar-r2-q-Jkx670rT8 | The definite article with abstract uncountable nouns — 6 Minute Grammar | weak-captions | The 147-word webpage extract introduces pens and air and ends at What about cheese; it does not reach definite articles with abstract nouns.  | Replace the incomplete webpage extract with the correct speech captions. |
| bbc_grammar_question_tags | Grammar: Question Tags | partial | The full cache mentions rising or falling intonation but does not explain the promised difference; most of it teaches tag formation and exceptions.  | Narrow the description to tag formation and special cases. |
| bbc_grammar_present_past | Grammar: Present to Talk About the Past | partial | The caption explicitly introduces Sian, not Dan; jokes, newspaper headlines and hearsay use the historical present.  | Correct the presenter to Sian and describe the examples actually covered. |
| grammar-r7-vVtnwR7Ytn4 | Prepositions of Place for Kids | weak-captions | The 78-word cache is largely repeated isolated prepositions separated by music, with garbled in/among/across and no recoverable place examples.  | Verify English captions against the visual examples or withhold from caption-built lessons. |
| grammar-r7-aF4tyqtzfuc | Reported Speech Exercises for Kids | weak-captions | The full exercise cache gives reported statements followed by yes/no without recoverable original prompts or correction explanations; several tenses are garbled.  | Verify the exercise captions and include the actual prompts/answers before caption-built use. |
| grammar-r7-ZWfYIqY8BsU | Relative Clauses and Relative Pronouns for Kids | weak-captions | The lesson’s target words are mistranscribed as booze for whose and the call riches blue for the car which is blue, obscuring the relative-pronoun examples.  | Replace or correct the English caption cache before using it to generate grammar lessons. |
| grammar-r7-HBQl0Nww0-g | Past Perfect Tense — English Grammar Quiz | partial | The complete cache contains fifteen past-perfect example sentences but no recoverable spoken question options or immediate answer checks.  | Describe it as a sentence-example reel, or verify the missing quiz prompts against the video. |

### hooks-library.json

| ID | Title | Status | Caption evidence / limitation | Suggested action |
|---|---|---|---|---|
| hook-r2-eT89nvkYNDM | Scorpion | partial | The child-oriented cache describes digesting prey on the outside and slurping it up, then eating each other with a joke about Uncle Brian; this is detailed cannibalistic predation.  | Remove from child-facing recommendations pending owner suitability review, or use an appropriate adult/teen audience label. |
| hook-r2-W4og8g_X22o | Meerkat Mischief | partial | The narration says the meerkat bites off the stinger and praises the crunchy goodness of a freshly killed scorpion, giving explicit killing/eating detail.  | Remove from child-facing recommendations pending owner suitability review, or use an appropriate adult/teen audience label. |
| hook-r2-7rOvmN-qfaA | Tarantula | partial | The caption says they bite victims, then liquefy their bodies and suck it all up like a straw; this explicitly describes bodily destruction/eating.  | Remove from child-facing recommendations pending owner suitability review. |
| hook-r2-xB74swq2LlI | Christmas Crab | partial | The narrator says ants spray acid into the crab’s mouth and eyes, followed by pain dialogue and if you’re still alive; the attack is described in detail.  | Review suitability before recommending to young children. |
| hook-r2-TQgRIJdp2c0 | Eggs-periments! | mismatch | The full cache demonstrates a homemade lava lamp using oil, water, colouring and salt; eggs only appear in the closing introduction to the next videos.  | Retitle to Homemade Lava Lamp and rewrite the description. |
| hook-r2-LYa9VPVAJI8 | Jerusalem | weak-captions | The 86-word cache is an IMAX promotional trailer ending coming soon; it offers only generic conflict/culture/ritual teasers, without substantive historic details.  | Mark as a trailer and verify whether it supplies enough material for caption-built lessons. |
| hook-r2-QOz6w7d9f94 | The National Geographic Society: Let’s Explore! | weak-captions | The 63-word cache is mostly promotional labels such as Trailblazers and World shakers interspersed with music and repeated lyrics; almost no explanatory science/geography content remains.  | Mark as promotional and withhold from caption-built lessons pending review. |

### kids-library.json

| ID | Title | Status | Caption evidence / limitation | Suggested action |
|---|---|---|---|---|
| kids_gotta_eat | Gotta Eat! | weak-captions | the stored text is an Arabic-script translation, beginning “(مقدمة) جميعنا نأكل صحيح؟ لكن هل”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| kids_here_comes_the_sun | Here Comes the Sun | weak-captions | the stored text is an Arabic-script translation, beginning “علوم، كراش كورس للأطفال ها قد”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| kids_defining_gravity | Defining Gravity | weak-captions | the stored text is an Arabic-script translation, beginning “تعريف الجاذبية إن أخبرتـُك أنك ربحت”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| kids_weathering_erosion | Weathering and Erosion | weak-captions | the stored text is an Arabic-script translation, beginning “هذه هي الأرض، موطن سبعة ملايين”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| kids_science_of_lunch | The Science of Lunch | weak-captions | the stored text is an Arabic-script translation, beginning “أتعلمون ما هو أسوأ جُزء بوجبة”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. Secondary subject concern: the Arabic cache describes the physical properties of a brown paper lunch bag, while the description promises food ingredients and body energy; verify the cache/video pairing before rewriting that description. |
| kids_home_sweet_habitat | Home Sweet Habitat | weak-captions | the stored text is an Arabic-script translation, beginning “تصوّرْ دباً قطبياً.. في الصَّحراء. ما”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| kids_every_kind_of_volcano | Every Kind of Volcano | level-off | The caption explains shield, cinder and composite volcanoes, magma, ash and eruption mechanisms in 1,173 words; sustained scientific explanation exceeds the stored A1/Beginner level.  | Raise the language level to B1 after checking spoken pacing. |
| kids_busy_bees | Busy Bees! Bumblebees and Honeybees | level-off | The 702-word explanation compares bee types and explains pollen, nectar and hive food production with causal clauses, rather than simple A1 phrases.  | Raise the language level to A2 after checking spoken pacing. |
| kids_dont_fear_spiders | Don't Be Afraid of Spiders! | level-off | The 775-word explanation distinguishes abdomen, thorax and cephalothorax and explains silk/web mechanisms; the anatomy and connected explanations exceed A1.  | Raise the language level to B1 after checking spoken pacing. |
| kids_cave_animals | The Amazing Adaptations of Cave Animals! | level-off | The 743-word explanation compares cave species, habitats and senses using relative clauses and adaptation reasoning, beyond short A1 everyday phrases.  | Raise the language level to A2 after checking spoken pacing. The description also promises glowing worms and names Jessi, but the full cache uses Mister Brown and has olm, tetra and cave wolf spider examples; rewrite those details when re-levelling. |
| kids_diamond_super_crystal | Diamond, the Super Crystal! | level-off | The 784-word caption explains carbon arrangements, molten rock, pressure and diamond formation with multi-step causes, beyond A1.  | Raise the language level to B1 after checking spoken pacing. |
| kids_whats_inside_rocks | What's Inside These Rocks? | level-off | The 568-word geode explanation describes mineral deposits building crystals over millions of years and gives multi-step hammering instructions, beyond A1.  | Raise the language level to A2 after checking spoken pacing. The full cache is specifically about geodes and crystals, not fossils; narrow the description when re-levelling. |
| kids_stalactites_stalagmites | What Are Stalactites and Stalagmites? | level-off | The 782-word explanation uses a dissolving-sugar analogy and evaporation to explain mineral deposition, including a conditional experiment, beyond A1.  | Raise the language level to B1 after checking spoken pacing. |
| kids_antarctica | Antarctica: The Coldest Place on Earth! | level-off | The 926-word explanation connects slanted sunlight, Earth’s shape and Antarctic dryness using extended causal clauses, beyond A1.  | Raise the language level to A2 after checking spoken pacing. |
| kids_look_whos_talking | Look Who's Talking | partial | The full cache explains plant investigations, Venus flytrap sensing and Darwin’s stem-tip experiment; communication is mentioned only briefly, and no animal communication examples are given.  | Rewrite the description as investigating how plants sense their surroundings. |
| kids_glow_on | Glow On | mismatch | The full cache explains nuclear fusion, stellar luminosity and Betelgeuse versus the Sun; it does not concern living things producing light.  | Retitle to Why Stars Glow and rewrite the description. |

### kurzgesagt-library.json

| ID | Title | Status | Caption evidence / limitation | Suggested action |
|---|---|---|---|---|
| kurzgesagt_optimistic_nihilism | Optimistic Nihilism | weak-captions | The cached body is Albanian translation (for example, Ekzistenca njerëzore është e frikshme dhe), not English speech captions; the spoken English level cannot be judged.  | Replace with complete English speech captions before English lesson use. |
| kurzgesagt_the_egg | The Egg – A Short Story | weak-captions | the stored text is an Arabic-script translation, beginning “كنت في طريقك إلى المنزل عندما”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| kurzgesagt_how_small_is_an_atom | How Small Is an Atom? Spoiler: Very Small. | weak-captions | The cached body is Albanian translation (for example, Atomet janë qesharakë dhe jashtëzakonisht të), not English speech captions; the spoken English level cannot be judged.  | Replace with complete English speech captions before English lesson use. |
| kurzgesagt_plastic_pollution | Plastic Pollution: How Humans are Turning the World into Plastic | weak-captions | the stored text is an Arabic-script translation, beginning “عندما منحت الآلهة الملك ميداس أمنية”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| kurzgesagt_what_is_something | What Is Something? | weak-captions | The cached body is Albanian translation (for example, Pyetjet e thjeshta janë ato më), not English speech captions; the spoken English level cannot be judged.  | Replace with complete English speech captions before English lesson use. |
| kurzgesagt_loneliness | Loneliness | weak-captions | The cached body is Albanian translation (for example, Të gjithë ndihemi të vetmuar kohë), not English speech captions; the spoken English level cannot be judged.  | Replace with complete English speech captions before English lesson use. |
| kurzgesagt_why_blue_whales_dont_get_cancer | Why Blue Whales Don't Get Cancer – Peto's Paradox | weak-captions | The cached body is Albanian translation (for example, Kanceri është diçka e frikshme dhe), not English speech captions; the spoken English level cannot be judged.  | Replace with complete English speech captions before English lesson use. |
| kurzgesagt_overpopulation_africa | Overpopulation & Africa | weak-captions | The cached body is Afrikaans translation (for example, Vir die grootste deel van mensdom), not English speech captions; the spoken English level cannot be judged.  | Replace with complete English speech captions before English lesson use. |
| kurzgesagt_why_are_you_alive | Why Are You Alive – Life, Energy & ATP | weak-captions | The cached body is Afrikaans translation (for example, Op hierdie sekonde is jy aan), not English speech captions; the spoken English level cannot be judged.  | Replace with complete English speech captions before English lesson use. |
| kurzgesagt_universal_basic_income | Universal Basic Income Explained – Free Money for Everybody? | weak-captions | the stored text is an Arabic-script translation, beginning “ماذا لو غطت الدولة تكلفة معيشتك”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| kurzgesagt_selfish_argument | A Selfish Argument for Making the World a Better Place – Egoistic Altruism | weak-captions | the stored text is an Arabic-script translation, beginning “حتى وقت قريب, الغالبية العظمى من”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| kurzgesagt_nuclear_energy | Do We Need Nuclear Energy to Stop Climate Change? | weak-captions | The cached body is Azerbaijani translation (for example, İqlim dəyişikliyini dayandırmaq üçün nüvə enerjisinə), not English speech captions; the spoken English level cannot be judged.  | Replace with complete English speech captions before English lesson use. |

### listening-library.json

| ID | Title | Status | Caption evidence / limitation | Suggested action |
|---|---|---|---|---|
| listening-r8-school-equipment | School public-address announcement — school equipment | partial | The full cache announces a book fair/raffle and science-day reporting, not an equipment announcement.  | Retitle to School book fair and science-day announcement; verify the institution attribution. |
| listening-r8-school-counselling-records | School public-address announcement — school counselling records | partial | The complete cache announces a special-education committee meeting at 12:10 on the third floor; it does not concern counselling records.  | Retitle to Special-education committee meeting announcement. |

### natgeo-library.json

| ID | Title | Status | Caption evidence / limitation | Suggested action |
|---|---|---|---|---|
| natgeo-wolves-change-rivers | How Wolves Change Rivers | weak-captions | the stored text is an Arabic-script translation, beginning “[ذئاب تعوي] - [الراوي] من أكثر”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| natgeo-octopus-intelligence | Why the Octopus Brain is So Extraordinary | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Ahmad Arnab المدقّق: Muhammad Samir”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| natgeo-deep-ocean | What's Hiding at the Most Solitary Place on Earth? The Deep Sea | weak-captions | the stored text is an Arabic-script translation, beginning “في بعض الأحيان تشعر بأن العالم,”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| natgeo-elephants-memory | Why Elephants Never Forget | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Lalla Khadija Tigha المدقّق: khalid”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| natgeo-how-volcanoes-work | How Volcanoes Work | level-off | The explanation combines tectonic plates, molten mantle, calderas and logarithmic eruption magnitudes in extended scientific clauses, beyond the stored A2/Easy language level.  | Raise to B1 after checking pacing. |
| natgeo-human-brain | The Incredible Human Brain | partial | The full cache describes mouse-brain tissue slicing and wiring diagrams; it gives neither the claimed 86-billion-neuron number nor a faster-than-computers comparison.  | Rewrite the description as mapping brain connections with thin tissue sections. |
| natgeo-amazon-rainforest | Is the Amazon Rainforest Disappearing? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Salma Mohammed المدقّق: Hani Eldalees”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| natgeo-coral-reef-crisis | Conserving our Spectacular, Vulnerable Coral Reefs | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Mahmoud Aghiorly المدقّق: Anwar Dafa-Alla”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| natgeo-ancient-egypt | The Secrets of Ancient Egypt | weak-captions | the stored text is an Arabic-script translation, beginning “مرحبًا، اسمي جون غرين، وهذه سلسلة”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. Secondary attribution concern: the Arabic introduction explicitly names John Green and Crash Course World History, rather than the library’s National Geographic attribution; verify source metadata. |
| natgeo-plastic-pollution | The Plastic Problem | partial | The full cache explains ocean plastics, circular packaging and agricultural nutrient pollution; the description’s 9%-recycled claim is absent.  | Rewrite the description around the actual ocean-pollution and packaging examples. |
| natgeo-sleep-science | The Science of Sleep | partial | The cache opens as Andrew Huberman’s Huberman Lab Podcast and runs to 4,919.853 seconds, while the entry names National Geographic and stores 295 seconds. Sleep matches, but this is an approximately 82-minute podcast cache.  | Verify the video/cache identity and correct publisher/duration before recommending it as a short clip. |

### ted-library.json

| ID | Title | Status | Caption evidence / limitation | Suggested action |
|---|---|---|---|---|
| ken_robinson_schools_kill_creativity | Do Schools Kill Creativity? | weak-captions | The cached body is Afrikaans translation (for example, Goeie môre. Hoe gaan dit? (Gelag)), not English speech captions; the spoken English level cannot be judged.  | Replace with complete English speech captions before English lesson use. |
| brene_brown_power_of_vulnerability | The Power of Vulnerability | weak-captions | The cached body is Albanian translation (for example, Po e filloj me një histori:), not English speech captions; the spoken English level cannot be judged.  | Replace with complete English speech captions before English lesson use. |
| angela_duckworth_grit | Grit: The Power of Passion and Perseverance | weak-captions | The cached body is Albanian translation (for example, Kur isha 27 vjeç, hoqa dore), not English speech captions; the spoken English level cannot be judged.  | Replace with complete English speech captions before English lesson use. |
| carol_dweck_power_of_believing | The Power of Believing That You Can Improve | weak-captions | The cached body is Albanian translation (for example, Fuqia e "ende". Dëgjova për një), not English speech captions; the spoken English level cannot be judged.  | Replace with complete English speech captions before English lesson use. |
| shawn_achor_happy_secret | The Happy Secret to Better Work | weak-captions | The cached body is Albanian translation (for example, Kur une isha shtate vjece dhe), not English speech captions; the spoken English level cannot be judged.  | Replace with complete English speech captions before English lesson use. |
| robert_waldinger_good_life | What Makes a Good Life? Lessons From the Longest Study on Happiness | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Taycir Yahmed المدقّق: Mohammed Basheer”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| chimamanda_adichie_danger_single_story | The Danger of a Single Story | weak-captions | The cached body is Afrikaans translation (for example, Ek is ’n storieverteller. Ek wil), not English speech captions; the spoken English level cannot be judged.  | Replace with complete English speech captions before English lesson use. |
| dan_pink_puzzle_of_motivation | The Puzzle of Motivation | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Anwar Dafa-Alla المدقّق: Mahmoud Aghiorly”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| tim_urban_procrastinator | Inside the Mind of a Master Procrastinator | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Ali Sumait المدقّق: Ahmad Abdelwahb”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| susan_cain_power_of_introverts | The Power of Introverts | weak-captions | The cached body is Albanian translation (for example, Kur isha 9 vjeçe për herë), not English speech captions; the spoken English level cannot be judged.  | Replace with complete English speech captions before English lesson use. |
| amy_cuddy_body_language | Your Body Language May Shape Who You Are | weak-captions | The cached body is Albanian translation (for example, Dua t'ia filloj duke ju treguar), not English speech captions; the spoken English level cannot be judged.  | Replace with complete English speech captions before English lesson use. |
| adam_grant_originals | The Surprising Habits of Original Thinkers | weak-captions | The cached body is Albanian translation (for example, Shtate vjet më parë, një student), not English speech captions; the spoken English level cannot be judged.  | Replace with complete English speech captions before English lesson use. |
| jill_bolte_taylor_stroke | My Stroke of Insight | weak-captions | The cached body is Albanian translation (for example, U rrita duke studiuar trurin sepse), not English speech captions; the spoken English level cannot be judged.  | Replace with complete English speech captions before English lesson use. |
| yuval_harari_why_humans_rule | What Explains the Rise of Humans? | weak-captions | The cached body is Albanian translation (for example, Shtatëdhjetë mijë vjet më parë, paraardhësit), not English speech captions; the spoken English level cannot be judged.  | Replace with complete English speech captions before English lesson use. |
| elizabeth_gilbert_creative_genius | Your Elusive Creative Genius | weak-captions | The cached body is Albanian translation (for example, Unë jam shkrimtare. Shkrimi i librave), not English speech captions; the spoken English level cannot be judged.  | Replace with complete English speech captions before English lesson use. |
| bill_gates_teachers_need_feedback | Teachers Need Real Feedback | weak-captions | The cached body is Albanian translation (for example, Çdokush ka nevojë për një trajner.), not English speech captions; the spoken English level cannot be judged.  | Replace with complete English speech captions before English lesson use. |
| sal_khan_reinvent_education | Let's Use Video to Reinvent Education | weak-captions | the stored text is an Arabic-script translation, beginning “اشتهرت أكاديمية خان بمجموعة مقاطع فيديو”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| temple_grandin_all_kinds_of_minds | The World Needs All Kinds of Minds | weak-captions | The cached body is Albanian translation (for example, Mendoj që do filloj duke treguar), not English speech captions; the spoken English level cannot be judged.  | Replace with complete English speech captions before English lesson use. |
| steven_johnson_where_good_ideas_come | Where Good Ideas Come From | weak-captions | the stored text is an Arabic-script translation, beginning “:منذ خمس سنوات وأنا أعمل على”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |

### teded-library.json

| ID | Title | Status | Caption evidence / limitation | Suggested action |
|---|---|---|---|---|
| teded_how_sugar_affects_brain | How sugar affects the brain | weak-captions | the stored captions are Albanian rather than English (“biskota te ngrohta e te lengshme,”); their translation cannot establish the spoken English level.  | Remove from English-caption lesson selection until a matching English cache is supplied. |
| teded_why_do_we_dream | Why do we dream? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Yazed AlMulhem المدقّق: Anwar Dafa-Alla”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_how_stress_affects_brain | How stress affects your brain | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Shada Shaheen المدقّق: Ghalia Turki”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_what_is_depression | What is depression? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Muhammad Samir المدقّق: Samar Mohamed”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_what_if_you_didnt_sleep | What would happen if you didn't sleep? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Inas Mar المدقّق: Hussain Laghabi”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_tragedy_of_the_commons | What is the tragedy of the commons? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Mariam Aboud المدقّق: Mennatullah Mustafa”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_prisoner_hat_riddle | Can you solve the prisoner hat riddle? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Ahmad Jarbou المدقّق: Hussain Laghabi”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_psychology_of_narcissism | The psychology of narcissism | weak-captions | the stored captions are Albanian rather than English (“përpara selfie-t të parë, grekët dhe”); their translation cannot establish the spoken English level.  | Remove from English-caption lesson selection until a matching English cache is supplied. |
| teded_antibiotic_resistance | What causes antibiotic resistance? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Ahmad Wadan المدقّق: khalid marbou”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_how_to_practice_effectively | How to practice effectively...for just about anything | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Mohammed Dz المدقّق: Eman Salah”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_immune_system | How does the immune system work? | weak-captions | the stored captions are Albanian rather than English (“nen rrezik. Miliarda bakterie, viruse dhe”); their translation cannot establish the spoken English level.  | Remove from English-caption lesson selection until a matching English cache is supplied. |
| teded_what_is_kafkaesque | What makes something 'Kafkaesque'? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Mohammad Houri المدقّق: Ghalia Turki”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_philosophy_of_stoicism | The philosophy of Stoicism | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: El Hacene BOULKROUNE المدقّق: Hani”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_how_memories_form | How memories form and how we lose them | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Ahmad Jarbou المدقّق: Hussain Laghabi”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_plato_allegory_cave | Plato's Allegory of the Cave | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Amy Alzidan المدقّق: Anwar Dafa-Alla”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_what_makes_a_hero | What makes a hero? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Mahmoud Aghiorly المدقّق: Anwar Dafa-Alla”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_food_and_gut | How the food you eat affects your gut | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Maryam Eladdad المدقّق: Hani Eldalees”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_what_is_dna | What is DNA and how does it work? | weak-captions | the stored text is an Arabic-script translation, beginning “Stated Clearly تقدم ما هو DNA”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_how_did_hitler_rise_to_power | How did Hitler rise to power? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Hani Eldalees المدقّق: Muhammad Samir”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_bridge_riddle | Can you solve the bridge riddle? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Muhammad Baraa Karazeh المدقّق: Mualla”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_why_hard_to_cure_cancer | Why is it so hard to cure cancer? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Nada Shokry المدقّق: Mennatullah Mustafa”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_is_light_particle_or_wave | Is light a particle or a wave? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Mahmoud Aghiorly المدقّق: khalid marbou”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_what_is_entropy | What is entropy? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Nawal Sharabati المدقّق: Hani Eldalees”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_how_memories_can_be_manipulated | How memories can be distorted and manipulated | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Esraa Almoraifea المدقّق: Ayman Mahmoud”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_power_of_creative_constraints | The power of creative constraints | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Mohammed Abubaker المدقّق: Ayman Mahmoud”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_why_do_cats_act_so_weird | Why do cats act so weird? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Abeer Darweesh المدقّق: Hani Eldalees”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_what_makes_a_poem | What makes a poem … a poem? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: somyah puth المدقّق: Rana Al-Mahameed”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_why_is_glass_transparent | Why is glass transparent? | weak-captions | the stored text is Albanian translation (“Uji është pothuajse gjithkund, nga lagështia”), not usable English speech captions. The translated cache also opens with water in the body and hydration, rather than glass transparency.  | Remove from English-caption selection pending an English cache; verify the caption/video subject where noted. |
| teded_how_does_stock_market_work | How does the stock market work? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Ahmed samy المدقّق: Nada Qanbar”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_how_do_vaccines_work | How do vaccines work? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Haroun SMIDA المدقّق: Anwar Dafa-Alla”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_how_did_english_evolve | How did English evolve? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Razan Alrashed المدقّق: Anwar Dafa-Alla”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_what_is_consciousness | What is consciousness? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Tarek Aamer المدقّق: AFRAA ALZOUBI”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_heisenberg_uncertainty_principle | What is the Heisenberg Uncertainty Principle? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Nora Mohammad المدقّق: Abd Al-Rahman”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_what_is_imposter_syndrome | What is imposter syndrome and how can you combat it? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Aseel Obeidi المدقّق: Abdellatif ZOUMHANE”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_history_of_world_according_to_cats | The history of the world according to cats | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: israa abdelkarim المدقّق: Fatima Zahra”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_how_does_money_laundering_work | How does money laundering work? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: khalid kittani المدقّق: Ayman Mahmoud”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_what_is_dyslexia | What is dyslexia? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Hussain Laghabi المدقّق: Anwar Dafa-Alla”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_evolution_of_human_eye | The evolution of the human eye | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Salih Ahmed المدقّق: khalid marbou”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_how_do_solar_panels_work | How do solar panels work? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: ahmed turk المدقّق: Abd Al-Rahman”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_what_is_a_calorie | What is a calorie? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Allam Zedan المدقّق: Lalla Khadija”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_why_do_we_feel_nostalgia | Why do we feel nostalgia? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Khaled Ali المدقّق: Fatima Zahra”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_science_of_attraction | The science of attraction | weak-captions | the stored text is Albanian translation (“Ne kemi deshire te mendojme per”), not usable English speech captions.  | Remove from English-caption selection pending an English cache; verify the caption/video subject where noted. |
| teded_what_causes_insomnia | What causes insomnia? | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Kowthar Alasady المدقّق: Hussain Laghabi”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_myth_prometheus | The myth of Prometheus | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Fatima Zahra El Hafa المدقّق:”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_myth_orpheus_eurydice | The tragic myth of Orpheus and Eurydice | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Mariam Aboud المدقّق: Fatima Zahra”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_myth_sisyphus | The myth of Sisyphus | weak-captions | the stored text is Albanian translation (“Qoftë i lidhur në një rrotë”), not usable English speech captions.  | Remove from English-caption selection pending an English cache; verify the caption/video subject where noted. |
| teded_myth_king_midas | The myth of King Midas and his golden touch | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Rana Al-Mahameed المدقّق: Hussain Laghabi”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_myth_arachne | The myth of Arachne | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Hani Eldalees من البحّارة الذين”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |
| teded_fairy_tale_origins | The dark origins of Disney fairy tales | weak-captions | the stored text is an Arabic-script translation, beginning “المترجم: Shimaa Nabil المدقّق: Selma Djaadi”, rather than usable English speech captions; the spoken English level cannot be checked from this translation.  | Remove from English-caption lesson selection until an English cache is supplied. |

## Mechanical checks (entire 641-entry inventory)

### Twenty shortest existing caption sets

| Entry | Word tokens | Raw characters |
|---|---:|---:|
| listening-library.json/listening-r8-school-counselling | 38 | 891 |
| listening-library.json/listening-r8-aef-rob-buys-lunch | 40 | 794 |
| listening-library.json/listening-r8-school-counselling-records | 43 | 852 |
| bbc-library.json/bbc-grammar-r2-3dA7P5arkyc | 47 | 251 |
| bbc-library.json/bbc-grammar-r2-o-GWYDA4IQY | 49 | 240 |
| bbc-library.json/bbc-grammar-r2-X6LuWwb9whM | 51 | 268 |
| grammar-library.json/bbc-grammar-r2-voQLMgJE-QE | 52 | 325 |
| listening-library.json/listening-r8-school-equipment | 55 | 1261 |
| grammar-library.json/bbc-grammar-r2-tzEt4iwsIdo | 57 | 323 |
| bbc-library.json/bbc-grammar-r2-jwmKjgwlMk8 | 58 | 311 |
| bbc-library.json/bbc-grammar-r2-elPHkXNxi2g | 61 | 306 |
| bbc-library.json/bbc-grammar-r2-tbru3bW2kVE | 63 | 340 |
| hooks-library.json/hook-r2-QOz6w7d9f94 | 63 | 1214 |
| bbc-library.json/bbc-grammar-r2-nI5zaB6QL-o | 66 | 385 |
| bbc-library.json/bbc-grammar-r2-jcAX1RtKq3U | 67 | 392 |
| listening-library.json/listening-r8-aef-rob-checks-in | 72 | 1260 |
| bbc-library.json/bbc-grammar-r2-3aQOLTfnAOc | 73 | 401 |
| listening-library.json/listening-r8-school-announcement | 76 | 1329 |
| grammar-library.json/grammar-r7-vVtnwR7Ytn4 | 78 | 3274 |
| listening-library.json/listening-r8-aef-jennys-night-out | 78 | 1718 |

### Twenty lowest word counts per library minute

| Entry | WPM | Tokens | Library duration (s) |
|---|---:|---:|---:|
| bbc-library.json/bbc-grammar-r2-3dA7P5arkyc | 7.75 | 47 | 364 |
| bbc-library.json/bbc-grammar-r2-o-GWYDA4IQY | 7.99 | 49 | 368 |
| bbc-library.json/bbc-grammar-r2-X6LuWwb9whM | 8.18 | 51 | 374 |
| grammar-library.json/bbc-grammar-r2-voQLMgJE-QE | 8.72 | 52 | 358 |
| grammar-library.json/bbc-grammar-r2-tzEt4iwsIdo | 9.53 | 57 | 359 |
| bbc-library.json/bbc-grammar-r2-jwmKjgwlMk8 | 9.64 | 58 | 361 |
| bbc-library.json/bbc-grammar-r2-elPHkXNxi2g | 9.84 | 61 | 372 |
| bbc-library.json/bbc-grammar-r2-tbru3bW2kVE | 10.11 | 63 | 374 |
| bbc-library.json/bbc-grammar-r2-nI5zaB6QL-o | 10.73 | 66 | 369 |
| ted-library.json/sal_khan_reinvent_education | 10.97 | 229 | 1253 |
| bbc-library.json/bbc-grammar-r2-jcAX1RtKq3U | 10.98 | 67 | 366 |
| bbc-library.json/bbc-grammar-r2-3aQOLTfnAOc | 11.56 | 73 | 379 |
| bbc-library.json/bbc-grammar-r2-8VETylIxyhw | 13.33 | 82 | 369 |
| bbc-library.json/bbc-grammar-r2-38QqDrckyxM | 13.46 | 83 | 370 |
| bbc-library.json/bbc-grammar-r2-P4_kqBsj2sE | 13.64 | 85 | 374 |
| bbc-library.json/bbc-grammar-r2-foyWhOHhTT0 | 14.01 | 85 | 364 |
| grammar-library.json/bbc-grammar-r2-V2quIYo41Ig | 14.33 | 86 | 360 |
| grammar-library.json/bbc-grammar-r2-HUXXgVElADg | 14.37 | 86 | 359 |
| bbc-library.json/bbc-grammar-r2-r6XpFWmA7Gk | 14.92 | 94 | 378 |
| bbc-library.json/bbc-grammar-r2-PgsG98vByiw | 16.77 | 104 | 372 |

### Duration differs from last caption timestamp by over 25%

This list includes only timestamped caches. Plain-text caches have unknown alignment, not a zero-second endpoint.

| Entry | Library seconds | Last start | Caption end | Difference |
|---|---:|---:|---:|---:|
| bbc-ideas-library.json/bbcideas_philosophy_hedonism | 150 | 109.710 | 112.52 | 26.9% |
| bbc-ideas-library.json/bbcideas_philosophy_absurdism | 300 | 158.640 | 160.7 | 47.1% |
| bbc-ideas-library.json/bbcideas_psychology_seduction | 450 | 286.979 | 289.46 | 36.2% |
| bbc-library.json/bbc_grammar_advanced_learner_mistakes | 300 | 185.659 | 191.759 | 38.1% |
| bbc-library.json/bbc_grammar_formal_informal | 330 | 238.770 | 241.39 | 27.6% |
| bbc-library.json/bbc_grammar_giving_emphasis | 300 | 181.600 | 190.06 | 39.5% |
| bbc-library.json/bbc_grammar_native_speaker_mistakes | 330 | 227.050 | 234.01 | 31.2% |
| bbc-library.json/bbc_grammar_linking_words_contrast | 270 | 159.959 | 163.859 | 40.8% |
| bbc-library.json/bbc_grammar_more_advanced_mistakes | 270 | 188.480 | 192.809 | 30.2% |
| bbc-library.json/bbc_masterclass_conversation_phrases | 330 | 205.510 | 211.35 | 37.7% |
| bbc-library.json/bbc_masterclass_inversion_1 | 330 | 212.719 | 214.209 | 35.5% |
| bbc-library.json/bbc_masterclass_inversion_2 | 390 | 255.760 | 260.76 | 34.4% |
| bbc-library.json/bbc_masterclass_linking_words | 360 | 247.410 | 248.73 | 31.3% |
| bbc-library.json/bbc_grammar_verb_patterns | 315 | 230.660 | 236.52 | 26.8% |
| bbc-library.json/bbc_grammar_mixing_conditionals | 390 | 249.129 | 251.129 | 36.1% |
| bigthink-library.json/bigthink_free_will_physics | 180 | 104.340 | 105.919 | 42.0% |
| bigthink-library.json/bigthink_free_will_pinker | 270 | 130.280 | 134 | 51.7% |
| bigthink-library.json/bigthink_psychology_happiness | 330 | 207.379 | 209 | 37.2% |
| bigthink-library.json/bigthink_reverse_unhappiness | 360 | 202.110 | 204.293 | 43.9% |
| bigthink-library.json/bigthink_teenage_brain | 480 | 239.340 | 242.59 | 50.1% |
| business-english-library.json/business-emails | 718 | 1246.370 | 1249.32 | 73.6% |
| business-english-library.json/business-presentations | 914 | 328.770 | 332.449 | 64.0% |
| business-english-library.json/business-networking | 445 | 622.990 | 623.749 | 40.0% |
| business-english-library.json/business-phone | 668 | 893.579 | 894.759 | 33.8% |
| business-english-library.json/business-negotiating | 523 | 1817.200 | 1817.7 | 247.5% |
| crash-course-library.json/cc-ww2-overview | 660 | 950.010 | 969.6 | 43.9% |
| crash-course-library.json/cc-biology-cells | 688 | 419.839 | 423.159 | 39.0% |
| grammar-library.json/bbc_grammar_question_tags | 345 | 257.650 | 260.299 | 25.3% |
| grammar-library.json/bbc_masterclass_choose_tense | 315 | 219.950 | 223.85 | 30.2% |
| grammar-library.json/bbc_grammar_present_past | 270 | 160.100 | 161.46 | 40.7% |
| internet-memes-library.json/memes-viral | 547 | 385.870 | 389.249 | 29.5% |
| internet-memes-library.json/memes-language | 631 | 977.990 | 980.05 | 55.0% |
| internet-memes-library.json/memes-culture | 489 | 1023.924 | 1026.507 | 109.4% |
| kids-library.json/kids_weathering_erosion | 330 | 234.080 | 236.08 | 29.1% |
| kids-library.json/kids_home_sweet_habitat | 390 | 271.000 | 281 | 30.5% |
| kids-library.json/kids_food_webs | 300 | 218.078 | 221.142 | 27.3% |
| kids-library.json/kids_everything_revolves | 390 | 255.213 | 263.031 | 34.6% |
| kids-library.json/kids_climate_change | 450 | 220.400 | 222.48 | 51.0% |
| kids-library.json/kids_busy_bees | 300 | 224.389 | 227.829 | 25.2% |
| kids-library.json/kids_cave_animals | 360 | 264.540 | 274.56 | 26.5% |
| kids-library.json/kids_diamond_super_crystal | 360 | 262.220 | 270.92 | 27.2% |
| kids-library.json/kids_whats_inside_rocks | 270 | 172.900 | 173.8 | 36.0% |
| kids-library.json/kids_antarctica | 480 | 349.618 | 361.11 | 27.2% |
| kurzgesagt-library.json/kurzgesagt_loneliness | 358 | 644.060 | 647.78 | 79.9% |
| kurzgesagt-library.json/kurzgesagt_addiction | 551 | 339.770 | 342.82 | 38.3% |
| minecraft-library.json/minecraft-survival | 812 | 1179.780 | 1187.72 | 45.3% |
| minecraft-library.json/minecraft-crafting | 734 | 1169.480 | 1175.099 | 59.3% |
| minecraft-library.json/minecraft-building | 678 | 2326.200 | 2330.18 | 243.1% |
| natgeo-library.json/natgeo-coral-reef-crisis | 310 | 181.511 | 183.339 | 41.4% |
| natgeo-library.json/natgeo-ancient-egypt | 368 | 700.659 | 704.246 | 90.4% |
| natgeo-library.json/natgeo-climate-change | 362 | 183.710 | 185.77 | 49.3% |
| natgeo-library.json/natgeo-plastic-pollution | 302 | 178.680 | 181.68 | 40.8% |
| natgeo-library.json/natgeo-sleep-science | 295 | 4919.853 | 4922.686 | 1567.7% |
| natgeo-library.json/natgeo-space-exploration | 360 | 242.130 | 251.61 | 32.7% |
| ted-library.json/sal_khan_reinvent_education | 1253 | 153.292 | 155.138 | 87.8% |
| ted-library.json/steven_johnson_where_good_ideas_come | 1016 | 232.320 | 233.19 | 77.1% |
| teded-library.json/teded_antibiotic_resistance | 357 | 256.840 | 259.625 | 28.1% |
| teded-library.json/teded_immune_system | 300 | 406.000 | 409 | 35.3% |
| teded-library.json/teded_bridge_riddle | 287 | 210.589 | 213.415 | 26.6% |
| teded-library.json/teded_how_memories_can_be_manipulated | 312 | 1047.397 | 1051.116 | 235.7% |
| teded-library.json/teded_history_of_world_according_to_cats | 340 | 254.844 | 258.844 | 25.0% |
| teded-library.json/teded_how_do_solar_panels_work | 196 | 278.646 | 282.041 | 42.2% |
| travel-english-library.json/travel-airport | 312 | 703.440 | 712.92 | 125.5% |
| travel-english-library.json/travel-hotel | 360 | 152.610 | 158.379 | 57.6% |
| travel-english-library.json/travel-restaurant | 492 | 1833.240 | 1835.96 | 272.6% |
| travel-english-library.json/travel-shopping | 356 | 1049.130 | 1053.369 | 194.7% |
| vox-library.json/vox_healthcare_cost | 570 | 318.600 | 321.1 | 44.1% |

## Progress log — full non-ok tables for the three largest libraries

The three largest are BBC (115), TED-Ed (101) and Kids (101). Their complete non-ok tables appear in the grouped sections above as each library is completed; those sections are the progress-log tables too, avoiding an unapproved fourth file.

## Reproduce the mechanical checks

```powershell
npx tsx scripts/audit-library-videos.ts --inventory --env-file C:\Users\insig\Documents\teaching-games\.env.local --snapshot C:\Users\insig\Documents\Codex\_outputs\round35-caption-inventory.json
npx tsx scripts/audit-library-videos.ts --check --snapshot C:\Users\insig\Documents\Codex\_outputs\round35-caption-inventory.json
```

Judgements are editorial entries in the audit JSON; the script computes inventory/metrics and checks coverage, not verdicts.
