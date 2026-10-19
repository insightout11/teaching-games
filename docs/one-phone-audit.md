# One-phone audit — 19 October 2026

Initial audit of `origin/main`, before fixes. Coverage: **77 active plugins: 13 games,
64 activities**. Registries and `retired-plugins.ts` define the list; commented-out
vaults and retired plugins are excluded. Flight-plan-only entries remain included.

Trace: each plugin's `onSetInputSpec` → `InputSpec` → `student/dynamic-input.tsx`
→ its dedicated panel, plus persistent context in `student-controller.tsx`.
Each source below is relative to `src/games/` or `src/activities/`; game specs are
in `game.tsx`, activity specs in `activity.tsx`, except the explicit shared wrappers.

**passes** means the source supplies the task and its reference material, not that
it has been tested in a real class. Deliberately heard audio is not replaced with
an answer-giving transcript. Unannotated original reading text is context; answer
indices, solutions and explanations are not. For every plugin, idle/loading/closed,
feedback-only and teacher controls are **not needed**: they collect no phone answer.

## Failures first

Status is the initial state; the last column assigns the implementation item.

| Plugin / source | Phone step | Status | Phone shows | Missing | Fix item |
| --- | --- | --- | --- | --- | --- |
| mystery-flight | Clue-mode pin | **fails** | Map and generic instruction | Accumulated clues/photos; round ID embeds secret destination | 2 |
| rank-it | Re-ranking | **fails** | Question and item names | New facts | 3 |
| sector-strike | Pick / bonus pick; spoken question | **fails** | No active input | Board labels/ownership and spoken question | 4 |
| story-sprint | Written continuation | **fails** | Continue-story prompt and textbox | Recent story lines | 5 |
| decision-council | Challenge | **fails** | Support A / Challenge A / Need evidence A | Proposal text beside letters | 6 |
| vocab-sprint | Solo and race replacement | **fails** | Weak word / term and text field | Original sentence | 7 |
| dialogue-detective | Solo and race reply | **fails** | Speaker B task / goal | Scene and surrounding A dialogue | 7 |
| hot-take-arena | Raise hand / reason / verdict / final stance | **fails** | Generic argument/vote instruction | Statement; own assigned wild side while writing | 7 |
| mission-selector | Opening thought (non-Beginner) | **fails** | Write your first thought | Winning mission question | 7 |
| bluff-definition | Definition vote | **fails** | Definition choices | Word being defined | 7 |
| scenario-simulator | Round vote / finale write / finale vote | **fails** | Situation/options or generic finale | Read-lines/setup and latest revealed consequence | 7 |
| design-studio | Argue / vote | **fails** | Assigned option title/starters or option titles | Question/summary, descriptions, benefits and tradeoffs; partner-work flow conflicts with owner model | 7; partner-flow redesign deferred |
| evidence-cards | Sort / strongest card | **fails** | Fact and side choices; truncated strongest options | Debate motion and complete facts | 7 |
| compare-it | Comparison turn | **fails** | Item names, adjectives and forms | Item facts | 7 |
| trip-meal | Menu vote | **fails** | Dish name / price / tier | Dish descriptions; depends on previous Traveller Card | 7 |
| trip-getting-there | Transport vote | **fails** | Mode / price / tier | Travel times / notes; depends on previous Traveller Card | 7 |
| trip-attractions | Final vote | **fails** | Place names | Place descriptions / prices disappear after board | 7 |
| trip-arrival / shared/performed-exchange.tsx | Script / Take 2 | **fails** | Generic context and role phrases | Current scripted line and Take-2 situation | 7 |
| trip-hotel / shared/performed-exchange.tsx | Script / Take 2 | **fails** | Generic context and role phrases | Current scripted line and Take-2 situation | 7 |
| trip-meal / shared/performed-exchange.tsx | Order / Take 2 | **fails** | Generic context and role phrases | Personalised current script and situation | 7 |
| trip-getting-there / shared/performed-exchange.tsx | Ride / Take 2 | **fails** | Generic context and role phrases | Personalised current script and situation | 7 |
| picture-stories | Story questions | **fails** | Question and sticker choices | Original short story/pictures for reference | 7 |
| read-aloud | Passage gist / final comprehension | **fails** | Questions/options after queue closes | Original passage/text | 7 |
| story-predict / reading-flight | Prediction | **fails** | Prediction/options and confidence | Cast and already-shown previous recap | 7 |
| story-recap / reading-flight | Chapter check | **fails** | Check/options and confidence | Original read passages | 7 |
| cabin-mystery | Investigation / final theory | **fails** | Role, questions, suspects; evidence labels | Public case/evidence text | 7 |

## Passing steps and steps without phone input

Mixed plugins also appear above: each row here refers only to the named steps.

| Plugin / source | Phone steps and actual display | Status |
| --- | --- | --- |
| flash-quiz | Bet: confidence choices; question: complete prompt/options; locks/result after reveal | **passes** |
| vocab-sprint | Other phases are teacher generation/evaluation only | **not needed** |
| synonym-showdown | Solo target/entry; race SynonymPanel has target, own entries and status | **passes** |
| grid-rush | GridRushPanel has letters/bonus/own words; round-two textarea has own found words and sentence task | **passes** |
| sentence-scramble | Solo/race word tiles and task; feedback update collects no answer | **passes** |
| grammar-boss | Solo/race full task and grammar rule/example hint | **passes** |
| error-hunter | Solo/race full tokenised paragraph and correction task | **passes** |
| story-sprint / story-chain.tsx | Spoken StoryChainPanel has recent story, own card, turn cue | **passes** |
| dialogue-detective | Other phases are generation/evaluation only | **not needed** |
| connections | Solo remaining words/select-four; race own solved groups/lives and remaining tiles | **passes** |
| twenty-questions | Host secret picker; guesser question/history and guess fields in TwentyQuestionsPanel | **passes** |
| sector-strike | Written active-team question/options; defending team holding state | **passes** |
| mystery-flight | Traveller private place card; guessers hear the classmate's description and pin | **passes** |
| mission-selector | Full mission question choices; Beginner stance is spoken | **passes** |
| character-cards | Own viewpoint/line at read/perform; full character names for vote | **passes** |
| imposter | Own private assignment at briefing/clue turns; student-name choices at vote | **passes** |
| bluff-definition | Fake-writing task includes target word; real definition not sent | **passes** |
| cargo-hold | Collect own hand; choose with prompt blanks/acceptance; read own sentence; anonymous sentence vote, own option disabled | **passes** |
| taboo-sprint | Speaker private target/taboo card; guessers listen and use guess field | **passes** |
| hot-seat | Clue givers have private word; hot-seat student has guess/status; clues heard aloud | **passes** |
| radio-check | Complete question/options after spoken segment; no transcript before reveal | **passes** |
| static | Full replacement options after two spoken versions | **passes** |
| black-box | Full word cloud after audio; result card only after reveal | **passes** |
| fix-the-captain | Found-it confirmation after flawed announcement heard aloud; teacher calls oral correction | **passes** |
| tense-time-machine | TimeMachinePanel has time cue, scene/role and phrase scaffolds | **passes** |
| answer-first | SpeakingFramePanel has supplied answer stimulus, question word and frames; model question stays hidden | **passes** |
| grammar-spotlight | HeardItPanel names target grammar and tap/listen task | **passes** |
| flight-question | Full mission/Likert question; prediction prompt and both options | **passes** |
| flight-verdict | SpeakingFramePanel has final question/starters and turn cue | **passes** |
| grammar-check-in | Full sentence and rating options, no correctness marker | **passes** |
| vocab-micro | Full cloze sentence and word choices | **passes** |
| quick-pulse | Statement plus complete binary/Likert labels | **passes** |
| wonder-board | Framing question and five-W sections; controller's existing question-wall panel carries follow-ups | **passes** |
| trip-attractions | Board entry has place names/descriptions/prices in zone descriptions | **passes** |
| trip-directions | Guide's map alone has target; others have street map, START marker and spoken directions; warm-up Ready prompt | **passes** |
| trip-plan | Named stop choices and explicit selection count | **passes** |
| trip-announcement / radio-check | Complete question/options after heard announcement | **passes** |
| speak-check | SpeakCheckPanel has situation, replies, can-do; no answer index | **passes** |
| speak-reveal | Try-three situation/replies; free spoken response includes situation/phrases | **passes** |
| quick-fire | SpeakingFramePanel has current task, frames and own turn | **passes** |
| pass-the-line | SpeakingFramePanel has line/prompt and turn scaffolds | **passes** |
| say-it-again | SpeakingFramePanel has sentence to improve and frames | **passes** |
| first-listen / listen-check | BriefingMissionPanel has full gist questions/options after clip; audio deliberately assessed | **passes** |
| final-listen / listen-check | Full repeated/harder gist questions/options; transcript follows reveal | **passes** |
| motion-pulse | Complete motion stance question and Likert labels | **passes** |
| evidence-cards | Reveals and teacher discussion collect no new phone answer | **not needed** |
| tag-team-debate | Prep card has motion/own points/evidence; public turn card has motion, own point/frames and side | **passes** |
| story-predict / reading-flight | Confidence question has every label; prior cast/recap reference failure listed above | **passes** |
| story-recap / reading-flight | Confidence has every label; retelling is oral/teacher-paced, no phone submission | **passes** |
| prediction-round | Every full question and both option labels; stable question identity | **passes** |
| two-truths-and-a-lie | Writer has three fields/private lie selector; guessers full statements without lie marker | **passes** |
| scene-igniter | SceneScriptPanel has own role/lines/prior cue/current turn/improv prompt | **passes** |
| would-you-rather | Both full dilemma texts plus A/B labels; BinaryInput renders text and submits labels | **passes** |
| picture-quiz | Question and sticker tiles/labels; spoken question assists Junior reading; no ranks | **passes** |
| rank-it | First ranking has full prompt/item names; hidden facts not sent yet | **passes** |
| video-player | Watching mission and ComprehensionQuiz send complete questions/options; heard-content questions work; visual-only questions need media-authoring review below | **passes**, with content-dependent exception |
| read-aloud | Reading/follow-along has full queue paragraphs and current slide | **passes** |
| fact-detective | Fib mode full claims; true/false full claim/labels; evidence follows reveal | **passes** |
| scenario-simulator | Narrative playback and reveals collect no phone answer | **not needed** |
| design-studio | Finished blueprint panel has pitch/decisions/cities | **passes** |
| conversation-rounds | Own role/goal/phrases plus context; featured exchange is public, not breakout pair work | **passes** |
| hot-take-arena | Side selection includes full statement/labels; wild own-side card | **passes** |
| decision-council | Proposal task has council question; shortlist/final vote have full proposal texts | **passes** |
| cabin-mystery | Own full role at briefing; culprit-side performance follows final reveal | **passes** |
| language-toolkit | Teaching/discussion only; input spec is cleared, no phone response | **not needed** |
| final-answer | Ordinary prompt/keywords; personal question persists in Your Mission panel in student-controller.tsx | **passes** |
| opinion-shift | Before/now reflection and stance prefill; pulse original statement/labels; strongest-argument choices have text | **passes** |
| grammar-proof | Written task/grammar target; Wings Check full sentence/options | **passes** |
| final-word | Complete final prompt; callbacks discuss already-heard contributions | **passes** |
| trip-recap | Can-do descriptors; postcard task and personalised frames/keywords | **passes** |
| boarding-call | Own Traveller Card; full can-do descriptors; complete spoken prompts/hints | **passes** |

## Limits requiring review

- Design Studio allocates partners and says “convince your partner.” Context can be
  fixed locally, but changing its turn allocation and teacher controls is a teaching-flow
  redesign. The brief permits deferring redesigns; this remains an owner-model failure.
- Generated video questions can depend on a visual-only detail. There is no reliable
  per-question still-image reference. This content-dependent case needs media authoring,
  not an answer-giving transcript/evidence snippet, and remains for review.
- Students need working Zoom audio while answering listening tasks. Local browser
  inspection cannot verify background Zoom behaviour on a real one-device call.
- Private role delivery and Junior rank suppression remain the existing controller/server
  responsibilities. The fixes add public task context, not new shared-screen secrets/ranks.
- Final commits, validation, fixes and remaining exceptions are in the completion report
  under `C:/Users/insig/Documents/Codex/_outputs/`.
