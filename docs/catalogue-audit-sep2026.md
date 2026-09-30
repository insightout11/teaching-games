# Catalogue audit — September 2026

Branch: `codex/catalogue-audit`, based on `origin/main` at `dc6061eba508d6371bfb8b899ae000ffd5d069d5`.

This is a code-path audit of the requested modules and five live presets. “Phone” means the student controller/input spec, and “screen” means the shared teacher activity view. `flightPlanOnly` follows each module’s index metadata; omitted means the index does not mark it flight-plan-only. Citations point to implementation and wiring. No source code was changed.

## Part 1 — modules not yet upgraded

### would-you-rather

**Play and use.** Teacher starts a generated dilemma; every phone gets A/B options, students vote, the screen shows the split, then the teacher opens discussion and a follow-up prompt. The substantive task is spoken; the phone records only the choice. (`src/activities/would-you-rather/activity.tsx:34-67,107-164,205-216`; `src/activities/would-you-rather/index.ts:6-23`) Its validated generator receives topic, level, mission context and optional source context; a separate continue route can seed follow-up discussion from prior exchanges. (`src/app/api/lesson-plan/generate/route.ts:140-147`; `src/app/api/activity/continue/route.ts:50-73`) It is `flightPlanOnly`; in live presets it appears as a selectable micro-event in Captain’s Flight, Speak and Debate. (`src/activities/would-you-rather/index.ts:17-23`; `src/lib/flight-plan-presets.ts:367,436,605`)

**Quality, risks, overlap, verdict.** The generator validates content and can use source context, so it is stronger than topic-only prompt text; without source it remains topic-grounded rather than lesson-evidence-grounded. (`src/app/api/lesson-plan/generate/route.ts:140-147`) No component-local countdown; votes remain aggregated until reveal, avoiding projection of individual choices during the poll. (`src/activities/would-you-rather/activity.tsx:47-67,263-342`) It overlaps Quick Pulse on opinion sampling, Hot Take Arena/Team Debate on polar questions, and Rank It on stance collection. **Verdict: keep as is.** Keep it as the quick, low-friction dilemma option; a later improvement could add an evidence prompt or persistent before/after stance record while retaining its spoken-first forced-choice format.

### rank-it

**Play and use.** Phones rank the displayed list; the teacher screen aggregates mean positions into a class order. The teacher reveals AI-suggested facts and lets students rerank, then compares the new class order. Students explain rankings aloud; phones submit ordering rather than explanations. (`src/activities/rank-it/activity.tsx:11-52,113-160,181-212`) The generator contract requests topic/source grounding and an optional objectively correct ordering. (`src/app/api/lesson-plan/generate/route.ts:321-376`) It is not flagged flight-plan-only; it appears in the WYR pools in Captain’s Flight, Speak and Debate. (`src/activities/rank-it/index.ts:6-19`; `src/lib/flight-plan-presets.ts:367,436,605`)

**Quality, risks, overlap, verdict.** Ranking plus fact reveal makes it more than a poll, but an answer key is meaningful only for objectively defensible orders. (`src/app/api/lesson-plan/generate/route.ts:321-376`; `src/activities/rank-it/activity.tsx:39-52`) Per-student submissions are retained by client ID for the active run; teacher-adjusted ordering stops automatic aggregation. (`src/activities/rank-it/activity.tsx:104-148`) No module-local timer. Overlaps Quick Pulse and Would You Rather but differs through visible class aggregation and a second round. **Verdict: keep as is.** A narrow future improvement is to make the objective/subjective distinction explicit in the generated schema and reveal.

### prediction-round

**Play and use.** Teacher presents three prediction prompts; phones choose an answer, the teacher can defer the reveal until later, then shows the class split and correctness. (`src/activities/prediction-round/activity.tsx:9-29,243-264,281-384`) The phone vote is the response, with oral prediction discussion available around it. (`src/activities/prediction-round/activity.tsx:243-264`) The source-aware generator withholds answers where source material is attached; its safe builder can fill missing questions. (`src/app/api/lesson-plan/generate/route.ts:942-1007`; `src/activities/prediction-round/activity.tsx:34-55`) It is not flight-plan-only and is Captain’s Flight takeoff. (`src/activities/prediction-round/index.ts:6-19`; `src/lib/flight-plan-presets.ts:363,387`)

**Quality, risks, overlap, verdict.** Source-backed deferred reveal is useful anticipation; without a source it falls back to answerable topic predictions, not necessarily facts taught later. (`src/app/api/lesson-plan/generate/route.ts:942-1007`) Results are aggregated into session `predictionResults` and a Captain’s Flight log entry; Read Aloud can reveal them later. (`src/activities/prediction-round/activity.tsx:305-341`; `src/activities/read-aloud/activity.tsx:9-22`; `src/stores/session-store.ts:168-188,375-384`) Its countdown is local `setTimeout` state, not the synced timer. (`src/activities/prediction-round/activity.tsx:196-209`) It overlaps Fact Detective’s claim checking, but predictions have a useful takeoff/briefing role. **Verdict: keep as is.** Preserve the result link and move timing to the server-stamped clock in a later upgrade.

### vocab-radar

**Play and use.** Students see a word and tap the matching meaning/option on phones; the teacher advances through words and sees class response charts. It is written recognition; speech is not required. (`src/activities/vocab-radar/activity.tsx:180-218,252-337`) The generator can use canonical source vocabulary, otherwise topic vocabulary; generic fallback entries are available for topic-only generation. (`src/app/api/lesson-plan/generate/route.ts:823-939`) It is not flight-plan-only and appears as takeoff in legacy presets, not the five live presets. (`src/activities/vocab-radar/index.ts:6-19`; `src/lib/flight-plan-presets.ts:139,247,274`) Its timer is local. (`src/activities/vocab-radar/activity.tsx:161-173`)

**Quality, risks, overlap, verdict.** Topic-only top-ups can dilute a source-derived list, though source vocabulary is preferred when available. (`src/app/api/lesson-plan/generate/route.ts:823-939`) It overlaps Language Toolkit, Vocab Sprint and the vocabulary layer of Read Aloud. No phone dead end found in the recognition loop. **Verdict: merge into Language Toolkit.** Retain definitions and add an oral “use it in a sentence” turn, while preserving private phone answer input.

### wonder-board

**Play and use.** Teacher opens a live board; phones submit questions, the class can upvote, and teacher answers aloud or requests an AI answer. (`src/activities/wonder-board/activity.tsx:7-11,27-63,95-`) Phones collect typed questions and votes; discussion/answer is spoken. (`src/activities/wonder-board/activity.tsx:27-49`) It is absent from five live preset sequences and appears in older sequences. (`src/activities/wonder-board/index.ts:6-20`; `src/lib/flight-plan-presets.ts:223,305`) Its generator supplies a short topic frame; the answer endpoint receives topic and student question, not lesson source. (`src/app/api/lesson-plan/generate/route.ts:738-764`; `src/app/api/wonder-board/answer/route.ts:86-124`)

**Quality, risks, overlap, verdict.** Source-blind answers are the main quality gap; student questions are curated on the teacher board. (`src/app/api/wonder-board/answer/route.ts:86-124`; `src/activities/wonder-board/activity.tsx:63-95`) Phone questions have a board/answer phase path. It overlaps Quick Pulse and Hot Take Arena/Conversation Rounds, but student curiosity questions are distinct. **Verdict: upgrade.** Keep phone questions and upvotes, ground generated answers in lesson source where present, cue the teacher when an answer is general knowledge, and close with students responding to one another aloud.

### scene-igniter

**Play and use.** Teacher starts a generated scene, assigns lines to students, advances/rewinds/skips through scripted dialogue, then can enter improv. (`src/activities/scene-igniter/activity.tsx:68-83,92-186,290-415`) Students perform aloud; this module has no student phone input panel. (`src/activities/scene-igniter/activity.tsx:68-186`) The generator creates variants from topic and optional source. (`src/app/api/lesson-plan/generate/route.ts:1414-1430`) It appears in live Speak and older preset sequences; it is not flight-plan-only. (`src/activities/scene-igniter/index.ts:6-19`; `src/lib/flight-plan-presets.ts:170,251,278,306,435`)

**Quality, risks, overlap, verdict.** The teacher screen renders scene/line content before and during performance, projecting upcoming dialogue and spoiling turns. (`src/activities/scene-igniter/activity.tsx:290-415`) Four generated scene variants provide choice, but lines remain fixed scripts. (`src/app/api/lesson-plan/generate/route.ts:1414-1430`) No synced timer. It overlaps Conversation Rounds and Story Chain, with teacher-paced script as its distinction. **Verdict: upgrade.** Move the speaking student’s line to their phone, keep only role/turn cues shared, and make improv build on what students said.

### scenario-simulator

**Play and use.** A branching scenario runs several rounds: students choose/vote on an action, teacher reveals consequences, a reader is assigned, and students submit finale answers before the class selects a top three. (`src/activities/scenario-simulator/activity.tsx:112-165,181-247,303-337`) It mixes phone voting and typed finale responses with oral rationale. (`src/activities/scenario-simulator/activity.tsx:137-165`) The first round is generated with topic/source context; later rounds use prior story, choice, consequence and scores through the continue route. (`src/app/api/lesson-plan/generate/route.ts:481-582`; `src/app/api/activity/continue/route.ts:458-545`) It is not in preset sequences. (`src/activities/scenario-simulator/index.ts:6-19`; `src/lib/flight-plan-presets.ts:354-638`)

**Quality, risks, overlap, verdict.** Follow-up generation is stateful; if finale generation fails it uses student submissions, but can fill the top three from fewer than three submissions. (`src/activities/scenario-simulator/activity.tsx:52-54,230-247`; `src/app/api/activity/continue/route.ts:548-581`) Countdown loops are local. (`src/activities/scenario-simulator/activity.tsx:125-135`) Failure fallback uses submissions, so the phone flow does not dead-end there. It overlaps Story Chain’s evolving narrative and Team Debate’s group decisions. **Verdict: upgrade.** Preserve branching state, use the shared clock, and make later rounds build on spoken reasons as well as vote totals.

### expert-panel

**Play and use.** Students take expert roles; teacher asks generated panel questions, students answer aloud in turn, then the audience votes on phones. (`src/activities/expert-panel/activity.tsx:49-107,131-`; `src/activities/expert-panel/index.ts:6-21`) Phones are only used for the audience vote; teacher advances the speaking panel. (`src/activities/expert-panel/activity.tsx:98-131`) Generator receives topic and optional source/context to create roles and questions. (`src/app/api/lesson-plan/generate/route.ts:424-479`) It is not in live preset sequences or flight-plan-only. (`src/activities/expert-panel/index.ts:6-21`; `src/lib/flight-plan-presets.ts:354-638`)

**Quality, risks, overlap, verdict.** Questions are contextualized but have no separate evaluator/continuation route. (`src/app/api/lesson-plan/generate/route.ts:424-479`) Audience vote uses a local 12-second countdown. (`src/activities/expert-panel/activity.tsx:98-114`) No phone response dead end; panel answers are spoken. It overlaps Team Debate and Hot Take Arena, with role diversity as distinction. **Verdict: merge into Team Debate.** Add expert role cards and a panel/audience phase as a Team Debate format.

### problem-solvers

**Play and use.** Teacher presents a resource-constrained problem; phones collect team solutions, then a complication triggers a second adaptation submission; teacher reviews and students defend ideas aloud. (`src/activities/problem-solvers/activity.tsx:54-126,201-208`) Response is typed, not spoken-first. (`src/activities/problem-solvers/activity.tsx:103-124`) Generation builds a problem, resource limits and complications from topic/source context, without strong source grounding enforcement. (`src/app/api/lesson-plan/generate/route.ts:627-737`) Not used in preset sequences. (`src/activities/problem-solvers/index.ts:6-19`; `src/lib/flight-plan-presets.ts:354-638`)

**Quality, risks, overlap, verdict.** Local `setInterval` countdown is unsynced. (`src/activities/problem-solvers/activity.tsx:83-93`) Phone submissions have a teacher review path. (`src/activities/problem-solvers/activity.tsx:103-124,201-208`) It overlaps Decision Council and Team Debate. **Verdict: merge into Decision Council.** Retain resource constraints and complications as a proposal round, then have teams speak a solution and challenge another team.

### decision-council

**Play and use.** Teacher frames a council question; phones may collect proposals, signal support, challenge, and vote; teacher screens selected proposal cards, AI support notes and result. (`src/activities/decision-council/activity.tsx:84-101,250-308,517-622,652-`) Main generation uses topic, mission and source; `sourceDetails` must be source-derived or empty if no source. (`src/app/api/lesson-plan/generate/route.ts:194-231`) It is live in Captain’s Flight production and an older preset. (`src/activities/decision-council/index.ts:6-25`; `src/lib/flight-plan-presets.ts:116,370,398`)

**Quality, risks, overlap, verdict.** Support-note endpoint receives source details and class pulse, but UI has generic fallback notes if AI fails. (`src/activities/decision-council/activity.tsx:517-622`; `src/app/api/decision-council/supports/route.ts`) Index advertises a 120-second default; component has no named local countdown. (`src/activities/decision-council/index.ts:15`) Proposals and notes are displayed on the shared screen. It overlaps Team Debate/Hot Take Arena, but proposal collection and source facts are distinct. **Verdict: keep as is.** A useful improvement would preserve proposal/support/challenge records through landing.

### opinion-shift

**Play and use.** Phones get a before/now prompt and optional opening stance; students submit a short typed reflection, then teacher reveals and compares responses. (`src/activities/opinion-shift/activity.tsx:54-112`) It is written-first despite its reflection purpose. Its generator is static prompt construction, not AI evaluation; no evaluation/continuation route. (`src/app/api/lesson-plan/generate/route.ts:2967-2970`) FlightPlanOnly; landing in Debate and a legacy preset. (`src/activities/opinion-shift/index.ts:6-20`; `src/lib/flight-plan-presets.ts:113,602,631`) Its 60-second countdown is local. (`src/activities/opinion-shift/activity.tsx:40-50`)

**Quality, risks, overlap, verdict.** Debate’s Quick Pulse does not populate the `openingStances` store read here, so the “before” baseline is not automatically present. (`src/activities/opinion-shift/activity.tsx:58-69`; `src/stores/session-store.ts:174,620-622`; `src/activities/quick-pulse/activity.tsx:159-243`) It overlaps Quick Pulse/Final Word; its distinction is opinion change. **Verdict: upgrade.** Make the close spoken-first and wire a same-student takeoff stance into it; retain typed input as an optional aid.

### listening-gap-fill

**Play and use.** Teacher plays/reads source audio or text; students fill blanks on phones; teacher reveals correct/wrong aggregates and accepted answers. (`src/activities/listening-gap-fill/activity.tsx:22-102,198-217,270-`) Written response with listening as stimulus. Generator extracts source lines and can blank the requested grammar target; without usable source it has a generic “topic is important for English learners” fallback. (`src/app/api/lesson-plan/generate/route.ts:1009-1095`) Not in the live presets and not flight-plan-only. (`src/activities/listening-gap-fill/index.ts:6-19`; `src/lib/flight-plan-presets.ts:354-638`) It uses `useSyncedTimer` with server-stamped round clock. (`src/activities/listening-gap-fill/activity.tsx:4,153-155`)

**Quality, risks, overlap, verdict.** Source extraction is appropriate when transcript/source exists; generic fallback is not lesson-specific. (`src/app/api/lesson-plan/generate/route.ts:1009-1095`) Wrong answers appear in aggregate on the teacher screen. (`src/activities/listening-gap-fill/activity.tsx:55-102`) It overlaps Read Aloud and comprehension quizzes. **Verdict: merge into Read Aloud.** Keep synced listen-and-fill as an optional phone response inside the source-reading flow, then have students say the completed phrase aloud.

### read-aloud

**Play and use.** Teacher presents a passage, assigned students read turns aloud, others follow on phones and mark tricky words; teacher can run a comprehension quiz and inspect vocabulary. (`src/activities/read-aloud/activity.tsx:22-46,120-196,209-271`) Spoken-first, with phone taps for vocabulary and quiz answers. Generation uses source when available; without source it creates a topic brief then derives vocabulary/questions from it. (`src/app/api/lesson-plan/generate/route.ts:2849-2902`) Live in Captain’s Flight briefing; not flight-plan-only. (`src/activities/read-aloud/index.ts:6-21`; `src/lib/flight-plan-presets.ts:366,389`)

**Quality, risks, overlap, verdict.** Preparation can create a class version; if prep fails, original text remains. (`src/activities/read-aloud/activity.tsx:68-83`) Prediction results can be shown in its reveal panel. (`src/activities/read-aloud/activity.tsx:9-22,92-`) Full passage is projected, appropriate for shared reading but reveals upcoming text. Reading cadence uses local word-count timeout rather than shared game clock. (`src/activities/read-aloud/activity.tsx:209`) It overlaps Listening Gap Fill. **Verdict: keep as is.** Retain source grounding and consider the gap-fill mode as an optional interaction.

### character-cards

**Play and use.** Teacher assigns a viewpoint/persona; each student sees their own card on phone, speaks from that role, and confirms; optional phone vote selects a character. (`src/activities/character-cards/activity.tsx:47-101,160-167`) Spoken output is not captured as text. Generator receives topic, mission and optional source; fallbacks are generic persona lines. (`src/app/api/lesson-plan/generate/route.ts:1838-1851,2974-2976`) FlightPlanOnly, used as Speak takeoff and in older presets. (`src/activities/character-cards/index.ts:6-20`; `src/lib/flight-plan-presets.ts:166,302,430,452`)

**Quality, risks, overlap, verdict.** Per-student role is sent with `perStudentData`, while teacher view renders role assignments, so roles/lines may be projected. (`src/activities/character-cards/activity.tsx:59-88`) Generated roles are grounded at prompt level but generic fallback text can lose specificity. (`src/app/api/lesson-plan/generate/route.ts:1838-1851`) Spoken viewpoints are not stored. It overlaps Team Debate/Hot Seat with assigned perspectives; equal-turn character performance distinguishes it. **Verdict: upgrade.** Keep role cards private on phones, reduce shared screen to speaker/turn cue, and let each student respond to a prior claim in character.

### cabin-mystery

**Play and use.** Teacher assigns private character facts, reveals clues at their pace, opens question rounds, collects phone questions/votes, then reveals culprit and solution. (`src/activities/cabin-mystery/activity.tsx:80-176,189-254,403-453`) Students speak interrogations; phone carries private role information. (`src/activities/cabin-mystery/activity.tsx:89-176,231-254`) It uses a hand-authored switched-suitcase case with topic adaptation and no AI generator/evaluator route. (`src/activities/cabin-mystery/cases/switched-suitcase.ts:19-26,587-612`) Not in preset sequences or flight-plan-only. (`src/activities/cabin-mystery/index.ts:6-18`; `src/lib/flight-plan-presets.ts:354-638`)

**Quality, risks, overlap, verdict.** Authored clue/role content is fixed; topic adaptation is limited. (`src/activities/cabin-mystery/cases/switched-suitcase.ts:19-26,587-612`) Culprit is withheld until reveal; per-student role data is phone payload. (`src/activities/cabin-mystery/activity.tsx:115-176,403-453`) It is teacher-paced and has no module timer. It overlaps Imposter’s hidden-role deduction and Fact Detective evidence, but its interrogative case is distinct. **Verdict: keep as is.** Maintain the verified authored case until a second verified case exists.

### boarding-call

**Play and use.** Teacher shows travel departure prompts; students answer aloud, then tap one ready/confirm button; teacher advances prompts. No answer text is captured or stored. (`src/activities/boarding-call/activity.tsx:7-10,23-82`) Content uses destination city and fixed fallback prompts. (`src/activities/boarding-call/content.ts:20`; `src/activities/boarding-call/activity.tsx:14-28`) FlightPlanOnly and Travel takeoff. (`src/activities/boarding-call/index.ts:6-20`; `src/lib/flight-plan-presets.ts:549,577`)

**Quality, risks, overlap, verdict.** Prompts are generic departure questions rather than a generated destination itinerary; phone confirms participation only. (`src/activities/boarding-call/activity.tsx:14-28,43-82`) No timer. It overlaps Quick Pulse as an opening check-in; travel oral rehearsal distinguishes it. **Verdict: keep as is.** It is a useful oral warm-up; its missing baseline is documented in Part 3.

### final-word

**Play and use.** Teacher asks each student for one spoken closing sentence; student phone confirms the turn and score, teacher can advance manually. (`src/activities/final-word/activity.tsx:77-174`) It records participation, not spoken answer. In Captain’s Flight, screen can show Captain-only flight-log recap. (`src/activities/final-word/activity.tsx:20-34,196,216`) Generated prompt uses topic/source and a topic-specific fallback. (`src/app/api/lesson-plan/generate/route.ts:2448-2479,3010-3012`) FlightPlanOnly; live landing for Captain’s Flight and Speak, plus legacy presets. (`src/activities/final-word/index.ts:6-22`; `src/lib/flight-plan-presets.ts:364,431,406,464`)

**Quality, risks, overlap, verdict.** Spoken answer is not persisted; only participation score and existing flight log are visible. (`src/activities/final-word/activity.tsx:103-145,196-216`) No module-owned timer. It overlaps Opinion Shift as a close, while preserving one spoken turn per student. **Verdict: keep as is.** It is the strongest spoken-first close among these modules; comparison remains limited by confirmation-only phone input.

### imposter

**Play and use.** Teacher chooses word/question/vocabulary mode, students privately peek at secret cards, give spoken clues or answers, then vote on the imposter; teacher reveals secret and result. (`src/activities/imposter/activity.tsx:11-25,70-104,260-`; `src/activities/imposter/activity.tsx:357-424`) Phone carries per-student assignments; screen withholds the solution until reveal. (`src/activities/imposter/activity.tsx:87-104,357-424`) Generated rounds receive topic/source; vocabulary mode draws from focus-bus vocabulary. (`src/activities/imposter/activity.tsx:38-79`; `src/app/api/lesson-plan/generate/route.ts:2977-2981`) Not flight-plan-only; end-game pool option in Captain’s Flight, Speak and Debate. (`src/activities/imposter/index.ts:6-17`; `src/lib/flight-plan-presets.ts:372,439,607`)

**Quality, risks, overlap, verdict.** Generation fallback hardcodes classroom/notebook/dictionary and generic prompts, so outage content can ignore topic. (`src/app/api/lesson-plan/generate/route.ts:1903-1909`) Spoken social deduction is strong; no module countdown. It overlaps Two Truths and a Lie/Fact Detective on bluff and inference, with asymmetrical private information as its mechanic. **Verdict: keep as is.** Replace the generic fallback with topic/source-safe cached rounds before increasing its use.

### cargo-hold (activity)

**Play and use.** Phones privately receive a hand of grammar/word cards, select a card to complete a prompt, one student reads the resulting sentence aloud, and classmates vote. (`src/activities/cargo-hold/activity.tsx:189-276`; `src/components/student/cargo-hand-input.tsx:40-`) Session state is persisted through cargo-hold state API; local timeout is save debounce, not gameplay clock. (`src/activities/cargo-hold/activity.tsx:80-112`; `src/app/api/session/cargo-hold-state/route.ts`) Generator validates lesson-grounded deck share and falls back to safe cards plus topic-shaped cards. (`src/app/api/lesson-plan/generate/route.ts:1977-2058`; `src/activities/cargo-hold/fallback-deck.ts:91-157`) Not flight-plan-only and absent from live preset sequences. (`src/activities/cargo-hold/index.ts:6-18`; `src/lib/flight-plan-presets.ts:354-638`)

**Quality, risks, overlap, verdict.** Validator requires at least half the deck lesson-grounded; degraded fallback can still be generic airline phrases and topic-shaped fragments. (`src/app/api/lesson-plan/generate/route.ts:2009-2058`; `src/activities/cargo-hold/fallback-deck.ts:15-62,140-157`) Private hands go to phones and completed round state appears on screen. (`src/activities/cargo-hold/activity.tsx:189-276`) It overlaps Grammar Boss/Vocab Sprint as language production, but sentence building and humor are distinct. **Verdict: upgrade.** Keep private hands and spoken reading; prevent topic fragments from being labeled as lesson vocabulary and add a short spoken justification for the winning sentence.

### dialogue-detective (game)

**Play and use.** Students complete a missing dialogue line on phones; race mode tracks submitters and reveals best answers after the race, while turn mode selects one student at a time. (`src/games/dialogue-detective/game.tsx:27-77,80-145,419-468`) Student answer is written and evaluated, with no required aloud rehearsal. (`src/games/dialogue-detective/game.tsx:93-114,259-292`) Lesson-plan generation uses topic-only dialogue content; its own endpoint can resolve source material and asks for role-consistent, inferable lines. (`src/app/api/lesson-plan/generate/route.ts:1632-1665`; `src/app/api/dialogue-detective/generate/route.ts:32-104`) Evaluation scores naturalness/context/lead-in and returns 500 on failure; game surfaces retry error. (`src/app/api/dialogue-detective/evaluate/route.ts:32-92`; `src/games/dialogue-detective/game.tsx:259-292`) No flightPlanOnly flag; not in live preset sequences. (`src/games/dialogue-detective/index.ts:6-20`; `src/lib/flight-plan-presets.ts:354-638`) Race timing uses local `Date.now()`, not shared server-stamped clock. (`src/hooks/use-race-mode.ts:20-55`)

**Quality, risks, overlap, verdict.** Own endpoint supports source-aware content, but standard lesson-plan generation bypasses it; evaluation failure leaves a retry state. (`src/app/api/lesson-plan/generate/route.ts:1632-1665`; `src/app/api/dialogue-detective/evaluate/route.ts:92`; `src/games/dialogue-detective/game.tsx:259-292`) Race hides live answer text until finish. (`src/games/dialogue-detective/game.tsx:419-468`) It overlaps Conversation Rounds, but tests pragmatic dialogue completion rather than extended speaking. **Verdict: upgrade.** Route standard generation through the source-aware endpoint, use synced race clock, and add an aloud “why this line fits” turn after evaluation.

### Part 1 verdict summary

| Module | Where used / plan-only | Verdict | Main reason |
|---|---|---|---|
| would-you-rather | Captain, Speak, Debate pools; yes | Keep as is | Spoken forced-choice discussion. (`src/lib/flight-plan-presets.ts:367,436,605`; `src/activities/would-you-rather/index.ts:17-23`) |
| rank-it | Captain, Speak, Debate pools; no | Keep as is | Class aggregation plus fact reveal. (`src/lib/flight-plan-presets.ts:367,436,605`; `src/activities/rank-it/activity.tsx:11-52`) |
| prediction-round | Captain takeoff; no | Keep as is | Source-aware delayed reveal and saved result. (`src/lib/flight-plan-presets.ts:363`; `src/activities/prediction-round/activity.tsx:305-341`) |
| vocab-radar | Legacy presets; no | Merge into Language Toolkit | Recognition duplicates vocabulary support. (`src/lib/flight-plan-presets.ts:139,247,274`; `src/app/api/lesson-plan/generate/route.ts:823-939`) |
| wonder-board | Legacy only; no | Upgrade | AI answer endpoint lacks lesson source. (`src/app/api/wonder-board/answer/route.ts:86-124`) |
| scene-igniter | Speak and legacy; no | Upgrade | Full script projected; no phone flow. (`src/lib/flight-plan-presets.ts:435`; `src/activities/scene-igniter/activity.tsx:290-415`) |
| scenario-simulator | None; no | Upgrade | Branching format worth retaining; local timers. (`src/activities/scenario-simulator/activity.tsx:112-165`) |
| expert-panel | None; no | Merge into Team Debate | Same debate purpose, panel format distinct. (`src/activities/expert-panel/activity.tsx:49-131`) |
| problem-solvers | None; no | Merge into Decision Council | Written proposal/adaptation overlaps council proposals. (`src/activities/problem-solvers/activity.tsx:103-124`; `src/activities/decision-council/activity.tsx:250-308`) |
| decision-council | Captain production; no | Keep as is | Source facts and proposals distinguish it. (`src/lib/flight-plan-presets.ts:370`; `src/app/api/lesson-plan/generate/route.ts:194-231`) |
| opinion-shift | Debate landing and legacy; yes | Upgrade | Quick Pulse does not populate opening stance. (`src/lib/flight-plan-presets.ts:602`; `src/activities/opinion-shift/activity.tsx:58-69`) |
| listening-gap-fill | None; no | Merge into Read Aloud | Source comprehension extension; synced timer. (`src/activities/listening-gap-fill/activity.tsx:153-155`) |
| read-aloud | Captain briefing; no | Keep as is | Spoken source lesson with phone comprehension. (`src/lib/flight-plan-presets.ts:366`; `src/activities/read-aloud/activity.tsx:120-196`) |
| character-cards | Speak takeoff and legacy; yes | Upgrade | Private role can be projected. (`src/lib/flight-plan-presets.ts:430`; `src/activities/character-cards/activity.tsx:59-88`) |
| cabin-mystery | None; no | Keep as is | Authored spoken deduction and private roles. (`src/activities/cabin-mystery/activity.tsx:115-176`) |
| boarding-call | Travel takeoff; yes | Keep as is | Oral travel warm-up, no answer capture. (`src/lib/flight-plan-presets.ts:549`; `src/activities/boarding-call/activity.tsx:7-10`) |
| final-word | Captain/Speak landing and legacy; yes | Keep as is | One spoken turn per student. (`src/lib/flight-plan-presets.ts:364,431`; `src/activities/final-word/activity.tsx:103-145`) |
| imposter | Captain/Speak/Debate end-game pools; no | Keep as is | Spoken asymmetric social deduction. (`src/lib/flight-plan-presets.ts:372,439,607`) |
| cargo-hold | None; no | Upgrade | Keep private hand/spoken payoff; improve fallback grounding. (`src/activities/cargo-hold/activity.tsx:189-276`; `src/activities/cargo-hold/fallback-deck.ts:140-157`) |
| dialogue-detective | None; no | Upgrade | Own source-aware route differs from topic-only plan path. (`src/app/api/lesson-plan/generate/route.ts:1632-1665`; `src/app/api/dialogue-detective/generate/route.ts:32-104`) |

## Part 2 — lesson thread across the five live presets

**Shared contract.** Lesson generation accepts grammar target, source text/transcript, course context, source vocabulary and topic; it builds `sourceCtx`, and generates canonical source vocabulary only when a selected activity requests it. (`src/app/api/lesson-plan/generate/route.ts:2625-2693`) Per selected activity it generally passes effective topic and source context, with targeted exceptions below. (`src/app/api/lesson-plan/generate/route.ts:2747-2776,2804-2902,2967-3012`) At runtime the session obtains effective topic, stage source, source vocabulary and course context for each stage; activity content is prefetched, loaded from plan content, or generated on demand using stage/global source, topic, difficulty, mission and grammar target. (`src/hooks/use-lesson-session.ts:202-243,302-352`) Thus source context does not imply a shared canonical word list; only activities requesting `sourceVocab` trigger it. (`src/app/api/lesson-plan/generate/route.ts:2685-2693,2804-2848`)

### Captain’s Flight

| Stage | Inputs actually passed | What it could receive / gap |
|---|---|---|
| Takeoff: Prediction Round | Topic and source context; source-backed questions defer reveal. (`src/app/api/lesson-plan/generate/route.ts:942-1007`; `src/hooks/use-lesson-session.ts:302-352`) | Prediction results are stored for Read Aloud; no default source-vocab list. (`src/activities/prediction-round/activity.tsx:305-341`) |
| Briefing: Read Aloud | Raw source if present; otherwise topic brief then derived vocab/questions. (`src/app/api/lesson-plan/generate/route.ts:2849-2902`) | Runtime also receives prediction results for reveal. (`src/activities/read-aloud/activity.tsx:9-22`) |
| Opinion Pulse pool | WYR or Rank It gets topic, optional source context, mission. (`src/app/api/lesson-plan/generate/route.ts:140-147,321-376`) | No guaranteed canonical words. (`src/app/api/lesson-plan/generate/route.ts:2685-2693`) |
| Language Toolkit | Canonical `sourceVocab` generated once from source and passed to toolkit. (`src/app/api/lesson-plan/generate/route.ts:2685-2693,2830-2844`) | This is the explicit shared word list. (`src/lib/flight-plan-presets.ts:368`) |
| Accuracy pool | Error Hunter, Sentence Scramble, Synonym Showdown, Vocab Sprint. (`src/lib/flight-plan-presets.ts:369,393-396`) | Some generators receive vocabulary if requested; pool membership does not ensure reuse. (`src/app/api/lesson-plan/generate/route.ts:3046-3057`) |
| Production: Decision Council | Topic, source context and derived `sourceDetails`, empty if no source. (`src/app/api/lesson-plan/generate/route.ts:194-231`) | Support endpoint receives source details and class pulse. (`src/activities/decision-council/activity.tsx:517-622`) |
| Navigation Check | Radar Fix only on world-flight-only route. (`src/lib/flight-plan-presets.ts:371,397`) | Legacy module key remains in live Captain sequence. (`src/lib/flight-plan-presets.ts:371`) |
| Review game | Flash Quiz, Connections, Grid Rush, Imposter, Sector Strike. (`src/lib/flight-plan-presets.ts:372,399-405`) | Not structurally built from Toolkit items; selected generator may use topic/source. (`src/app/api/lesson-plan/generate/route.ts:2977-2981,3046-3057`) |
| Landing: Final Word | Topic/source prompt; Captain flight log displayed when available. (`src/app/api/lesson-plan/generate/route.ts:3010-3012`; `src/activities/final-word/activity.tsx:20-34`) | Spoken answer itself is not captured. (`src/activities/final-word/activity.tsx:103-145`) |

Preset/order: Prediction Round, Read Aloud, WYR/Rank It, Language Toolkit, accuracy pool, Decision Council, radar-fix, review pool, Final Word. (`src/lib/flight-plan-presets.ts:363-407`)

### Speak

| Stage | Inputs actually passed | What it could receive / gap |
|---|---|---|
| Takeoff: Character Cards | Topic, mission, source context; per-student role. (`src/app/api/lesson-plan/generate/route.ts:2974-2976`; `src/activities/character-cards/activity.tsx:59-88`) | No canonical vocab list is wired by preset. (`src/lib/flight-plan-presets.ts:434-439`) |
| Scene | Topic and optional source context. (`src/app/api/lesson-plan/generate/route.ts:1414-1430`; `src/hooks/use-lesson-session.ts:302-352`) | Spoken lines are not submitted, so later content cannot reuse them. (`src/activities/scene-igniter/activity.tsx:68-186`) |
| Opinion Pulse pool | WYR or Rank It receives topic/source/mission. (`src/app/api/lesson-plan/generate/route.ts:140-147,321-376`) | No guaranteed reuse of character output. (`src/activities/character-cards/activity.tsx:93-101`) |
| Conversation Rounds | Topic/scenario, optional scene context and source; fallback is a topic-only role-play. (`src/app/api/lesson-plan/generate/route.ts:2514-2557`) | Spoken output is not a canonical word list. (`src/lib/flight-plan-presets.ts:437`) |
| Vocab Check | Topic-shaped `vocab-micro`; no Language Toolkit stage establishes `sourceVocab`. (`src/lib/flight-plan-presets.ts:438`; `src/app/api/lesson-plan/generate/route.ts:2822-2826`) | No guaranteed phrases from scene/conversation. (`src/app/api/lesson-plan/generate/route.ts:2685-2693`) |
| Review pool | Connections, Synonym Showdown, Vocab Sprint, Taboo Sprint, Imposter. (`src/lib/flight-plan-presets.ts:439,458-463`) | Selected generator gets topic/source, not guaranteed prior-stage expressions. (`src/app/api/lesson-plan/generate/route.ts:2977-2981,3046-3057`) |
| Landing: Final Word | Topic/source prompt and available flight log. (`src/app/api/lesson-plan/generate/route.ts:3010-3012`; `src/activities/final-word/activity.tsx:20-34`) | No stored takeoff speech to compare. (`src/activities/character-cards/activity.tsx:93-101`) |

Preset/stage list. (`src/lib/flight-plan-presets.ts:430-465`)

### Grammar

| Stage | Inputs actually passed | What it could receive / gap |
|---|---|---|
| Takeoff: Grammar Check-In | Topic and configured grammar target; three sentence/vote choices. (`src/app/api/lesson-plan/generate/route.ts:2999`; `src/lib/flight-plan-presets.ts:488-489`) | Confirmed student target triggers regeneration of target-dependent content. (`src/hooks/use-lesson-session.ts:446-450`) |
| Clarify | Topic, grammar target, source context. (`src/app/api/lesson-plan/generate/route.ts:3002-3005`) | Could reuse lesson phrases, but grammar target is the explicit thread. (`src/lib/flight-plan-presets.ts:491-492`) |
| Error Hunter / Sentence Scramble | Topic and grammar target through generated plan/session content. (`src/lib/flight-plan-presets.ts:493-494,510-512`; `src/hooks/use-lesson-session.ts:302-352`) | Not guaranteed to reuse source vocabulary. (`src/lib/flight-plan-presets.ts:491-496`) |
| Grammar Boss | Topic and grammar context, but generator can choose from grammar-target list instead of consistently following check-in target. (`src/app/api/lesson-plan/generate/route.ts:1880-1909`; `src/lib/flight-plan-presets.ts:495,513`) | Target drift weakens the stated thread. (`src/lib/flight-plan-presets.ts:483,490-496`) |
| Review pool | Grid Rush, Flash Quiz, Connections, Synonym Showdown, Vocab Sprint. (`src/lib/flight-plan-presets.ts:496,514-518`) | Pool membership does not ensure selected target or source vocabulary. (`src/lib/flight-plan-presets.ts:496`) |
| Landing: Grammar Proof | Topic and selected/confirmed grammar target; phone collects two written sentences. (`src/app/api/lesson-plan/generate/route.ts:3002`; `src/activities/grammar-proof/activity.tsx:46-60`) | Check-In votes are not passed to Proof; target is shared. (`src/activities/grammar-check-in/activity.tsx:131-135`; `src/hooks/use-lesson-session.ts:446-450`) |

Preset and mapping. (`src/lib/flight-plan-presets.ts:488-520`)

### Travel

| Stage | Inputs actually passed | What it could receive / gap |
|---|---|---|
| Takeoff: Boarding Call | Destination/city plus fixed prompts; no answer capture. (`src/activities/boarding-call/content.ts:20`; `src/activities/boarding-call/activity.tsx:7-10,14-28`) | No source vocabulary or itinerary input is recorded at takeoff. |
| Arrival / Getting There | Per-stage city source/trip itinerary; generated line-by-line exchanges with deterministic fallback. (`src/lib/flight-plan-presets.ts:546-557`) | Runtime can ground each stage separately. (`src/hooks/use-lesson-session.ts:202-243,302-352`) |
| Directions | Destination route micro-event. (`src/lib/flight-plan-presets.ts:558,580`) | No shared canonical word list. |
| Hotel | Conversation Rounds hotel scenario. (`src/lib/flight-plan-presets.ts:552-554,559,581`) | Stage/topic context; not necessarily arrival expressions. |
| Attractions | City’s real attractions seed activity; no AI. (`src/lib/flight-plan-presets.ts:553-554,560,582`) | Fact grounding depends on city pack anchors. |
| Meal | PerformedExchange with AI-varied lines and deterministic fallback. (`src/lib/flight-plan-presets.ts:552-562`) | Per-stage source is separate from prior spoken answers. |
| Trip Quiz | Flash Quiz, Connections or Vocab Sprint. (`src/lib/flight-plan-presets.ts:562,584-587`) | Pool does not guarantee trip phrases/city anchors. |
| Landing: Trip Recap | Reads session trip log and displays stops/chips for oral retell. (`src/activities/trip-recap/activity.tsx:7-10,44-120`; `src/stores/session-store.ts:179,614-616`) | Compares logged travel stops, not Boarding Call answers. |

Travel skips a single source briefing and uses per-stage sources. (`src/lib/flight-plan-presets.ts:546-554`)

### Debate

| Stage | Inputs actually passed | What it could receive / gap |
|---|---|---|
| Takeoff: Quick Pulse | Topic and short prompt set; phone quick responses/votes. (`src/app/api/lesson-plan/generate/route.ts:766-812`; `src/activities/quick-pulse/activity.tsx:203-243`) | Does not write `openingStances` read by Opinion Shift. (`src/activities/quick-pulse/activity.tsx:159-243`; `src/activities/opinion-shift/activity.tsx:58-69`) |
| Evidence: Fact Detective | Topic and source context. (`src/lib/flight-plan-presets.ts:604,620`; `src/hooks/use-lesson-session.ts:302-352`) | Can supply source-based facts; no guaranteed vocab list. |
| Take Side: WYR / Rank It | Topic, optional source and mission. (`src/app/api/lesson-plan/generate/route.ts:140-147,321-376`) | Votes/ranks are not automatically Opinion Shift baseline. (`src/activities/opinion-shift/activity.tsx:58-69`) |
| Debate: Team Debate | Topic/source and generated motion for structured opening, rebuttal, closing. (`src/app/api/lesson-plan/generate/route.ts:234-`; `src/lib/flight-plan-presets.ts:606,623`) | Student claims are not reused as canonical vocabulary. |
| Review game | Flash Quiz, Connections, Synonym Showdown, Imposter, Twenty Questions, Sector Strike. (`src/lib/flight-plan-presets.ts:607,624-630`) | Pool does not guarantee motion/evidence reuse. |
| Landing: Opinion Shift | Static prompts; reads `openingStances` only if another activity populated it. (`src/app/api/lesson-plan/generate/route.ts:2967-2970`; `src/activities/opinion-shift/activity.tsx:58-69`) | Quick Pulse is not that writer; no matched before/after measure. (`src/activities/quick-pulse/activity.tsx:159-243`; `src/stores/session-store.ts:620-622`) |

Preset and stage order. (`src/lib/flight-plan-presets.ts:601-632`)

## Part 3 — takeoff and landing data pairs

| Preset / pair | Takeoff phone data | Storage / handoff | Landing data and comparison |
|---|---|---|---|
| Captain’s Flight: Prediction Round → Final Word | One vote per question/client; no phone text. (`src/activities/prediction-round/activity.tsx:243-264`) | Aggregate correctness/results saved in session `predictionResults`; Captain log stores summary. (`src/activities/prediction-round/activity.tsx:305-341`; `src/stores/session-store.ts:184,375-384`) | Final Word captures confirmation/participation only and can show flight-log summary; it cannot compare spoken closing sentence to each prediction. (`src/activities/final-word/activity.tsx:103-145,196-216`) |
| Grammar: Grammar Check-In → Grammar Proof | Phones choose Sounds correct / Not sure / Sounds wrong; teacher confirms target. (`src/activities/grammar-check-in/activity.tsx:46-90,131-135`) | Votes/scores are local activity state; target is session/lesson state. (`src/activities/grammar-check-in/activity.tsx:131-135`; `src/hooks/use-lesson-session.ts:446-450`) | Proof phones submit two written sentences; endpoint scores them and `onLandingAnswer` stores text in `landingAnswers`. (`src/activities/grammar-proof/activity.tsx:46-60,89-149`; `src/stores/session-store.ts:170,614-616`) Shared target permits teacher class-level comparison, but no matched-student comparison to check-in votes. (`src/activities/grammar-check-in/activity.tsx:131-135`; `src/activities/grammar-proof/activity.tsx:89-149`) |
| Debate: Quick Pulse → Opinion Shift | Phones vote/submit short pulse responses. (`src/activities/quick-pulse/activity.tsx:203-243`) | Local activity state/scores; Quick Pulse does not write `openingStances`. (`src/activities/quick-pulse/activity.tsx:159-243`; `src/stores/session-store.ts:620-622`) | Opinion Shift may prefill `openingStances` and stores typed landing text in `landingAnswers`; Debate has no takeoff handoff, so no comparison. (`src/activities/opinion-shift/activity.tsx:58-69,94-112`; `src/stores/session-store.ts:170,174,614-622`) |
| Travel: Boarding Call → Trip Recap | Ready taps after oral prompts; no spoken answer transcribed or retained. (`src/activities/boarding-call/activity.tsx:7-10,43-66`) | Participation score/ready state only; travel stages, not Boarding Call, write trip log. (`src/activities/boarding-call/activity.tsx:57-82`; `src/stores/session-store.ts:179,614-616`) | Trip Recap reads logged stops and prompts oral retell; compares itinerary stages, not departure responses. (`src/activities/trip-recap/activity.tsx:44-120`; `src/stores/session-store.ts:179,614-616`) |
| Speak: Character Cards → Final Word | Phone gets private character card and confirms speaking turn; optional vote. (`src/activities/character-cards/activity.tsx:59-101`) | Spoken lines are not captured into `characterAssignments`/`openingStances`; assignment is activity state/phone payload. (`src/activities/character-cards/activity.tsx:19-28,59-101`; `src/stores/session-store.ts:174-175,624-625`) | Final Word receives confirmation and scores participation, not Character Cards performance; no automatic comparison. (`src/activities/final-word/activity.tsx:103-145`; `src/stores/session-store.ts:624-625`) |

## Largest cross-cutting gaps

Several spoken activities do not capture spoken content for later lesson threading (Boarding Call, Character Cards, Final Word); Debate Quick Pulse does not populate Opinion Shift’s baseline; topic-only or generic fallbacks can detach content from the lesson (Wonder Board answers, Imposter, Listening Gap Fill, Cargo Hold, Dialogue Detective standard plan path); and multiple modules use local countdowns instead of shared clock (Prediction Round, Vocab Radar, Scenario Simulator, Expert Panel, Problem Solvers, Opinion Shift, Dialogue Detective). (`src/activities/boarding-call/activity.tsx:7-10`; `src/activities/character-cards/activity.tsx:93-101`; `src/activities/final-word/activity.tsx:103-145`; `src/activities/quick-pulse/activity.tsx:159-243`; `src/activities/opinion-shift/activity.tsx:58-69`; `src/app/api/wonder-board/answer/route.ts:86-124`; `src/app/api/lesson-plan/generate/route.ts:1903-1909,1009-1095,1632-1665,2009-2058`; `src/activities/prediction-round/activity.tsx:196-209`; `src/activities/vocab-radar/activity.tsx:161-173`; `src/activities/scenario-simulator/activity.tsx:125-135`; `src/activities/expert-panel/activity.tsx:111-114`; `src/activities/problem-solvers/activity.tsx:83-93`; `src/hooks/use-race-mode.ts:20-55`)
