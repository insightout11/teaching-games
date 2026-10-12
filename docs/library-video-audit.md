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

Completed libraries: 2/18; judged entries: 216/641. Cached inventory captured at 2026-10-12T15:07:11.259Z. All 641 have cached text; 607 have timestamped segments, 34 have untimed text.

## Totals per library

| Library | Entries | ok | mismatch | partial | weak-captions | no-captions | level-off |
|---|---:|---:|---:|---:|---:|---:|---:|
| bbc-library.json | 115 | 86 | 1 | 9 | 19 | 0 | 0 |
| teded-library.json | 101 | 52 | 0 | 0 | 49 | 0 | 0 |
| **TOTAL** | **216** | 138 | 1 | 9 | 68 | 0 | 0 |

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
