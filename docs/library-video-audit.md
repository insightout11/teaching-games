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

Completed libraries: 1/18; judged entries: 115/641. Cached inventory captured at 2026-10-12T15:07:11.259Z. All 641 have cached text; 607 have timestamped segments, 34 have untimed text.

## Totals per library

| Library | Entries | ok | mismatch | partial | weak-captions | no-captions | level-off |
|---|---:|---:|---:|---:|---:|---:|---:|
| bbc-library.json | 115 | 86 | 1 | 9 | 19 | 0 | 0 |
| **TOTAL** | **115** | 86 | 1 | 9 | 19 | 0 | 0 |

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
