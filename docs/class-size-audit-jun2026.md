# Class-Size Audit — all modules (first pass for review)

> Status: **DRAFT for teacher review** (June 2026). Replaces the `interactionModel` heuristic
> behind the home "Great for your class" chips with real per-module data.
>
> Today the class-size chip is *inferred* from `interactionModel` (how students interact),
> which is a proxy, not an audit — and there are no min/max limits at all. This table is the
> proposed real data. **Please correct any row**, then we encode it as `idealClassSizes` +
> `minStudents` / `maxStudents` on `FlightPlanItem` and rewire `getClassSizeChip`.
>
> Legend: ★ shines · ○ works · – poor/impossible. Min = students needed to function.
> Max = soft ceiling where turn-taking drags (— = scales freely). Sizes: 1:1 · Small (2–6) · Class (7+).

## Games (14)

| Module | 1:1 | Small | Class | Min | Max | Note |
|---|:--:|:--:|:--:|:--:|:--:|---|
| Vocab Sprint | ★ | ★ | ★ | 1 | — | Individual phone quiz; scales freely. |
| Synonym Showdown | ★ | ★ | ★ | 1 | — | Individual quiz. |
| Word Chain | – | ★ | ★ | 3 | — | Relay chain; needs a group to pass around. |
| Grid Rush | ○ | ★ | ★ | 2 | — | Team race; best with 2+ teams. |
| Sentence Scramble | ★ | ★ | ★ | 1 | — | Individual reorder. |
| Grammar Boss | ★ | ★ | ★ | 1 | — | Individual submission. |
| Error Hunter | ★ | ★ | ★ | 1 | — | Individual spot-the-error. |
| Story Sprint | ○ | ★ | ★ | 2 | ~20 | Round-robin story; drags very large. |
| Dialogue Detective | ★ | ★ | ★ | 1 | — | Analyze a dialogue. |
| Connections | ★ | ★ | ★ | 1 | — | Grouping puzzle; team mode best in groups. |
| Twenty Questions | ★ | ★ | ★ | 2 | ~20 | One knows, others guess; 1:1 works w/ teacher. |
| Flash Quiz | ★ | ★ | ★ | 1 | — | Buzzer quiz. |
| Brain Teasers | ★ | ★ | ★ | 1 | — | Puzzles. |
| Defend It | ○ | ★ | ★ | 2 | — | Take a side; needs opposing voices. |

## Activities (34)

| Module | 1:1 | Small | Class | Min | Max | Note |
|---|:--:|:--:|:--:|:--:|:--:|---|
| Quick Pulse | ★ | ★ | ★ | 1 | — | Opinion vote. |
| Vocab Radar | ★ | ★ | ★ | 1 | — | Self-rate word knowledge. |
| Prediction Round | ★ | ★ | ★ | 1 | — | Predict outcomes. |
| Imposter | – | ★ | ★ | 4 | — | Social deduction; impossible 1:1, weak under 4. |
| Scene Igniter | ★ | ★ | ○ | 1 | ~16 | Roleplay; rich 1:1/small, big class limits speaking. |
| Would You Rather | ★ | ★ | ★ | 1 | — | Opinion + talk. |
| Two Truths | ★ | ★ | ★ | 2 | — | One presents, others guess. |
| Two Truths and a Lie | ○ | ★ | ★ | 2 | — | Needs others to guess each person. |
| Rank It | ★ | ★ | ★ | 1 | — | Rank & discuss. |
| Read Aloud | ★ | ★ | ○ | 1 | — | Round-robin reading drags in big classes. |
| Listening Gap-Fill | ★ | ★ | ★ | 1 | — | Fill blanks from audio. |
| Fact Detective | ★ | ★ | ★ | 1 | — | True/false reasoning. |
| Expert Panel | – | ○ | ★ | 3 | — | Panel + audience; weak with few. |
| Scenario Simulator | ★ | ★ | ★ | 1 | — | Branching decisions. |
| Problem Solvers | ○ | ★ | ★ | 2 | — | Group problem-solving. |
| Hot Take Arena | ○ | ★ | ★ | 2 | — | Thrives on multiple opinions. |
| Decision Council | – | ★ | ★ | 3 | — | Council needs several voices. |
| Final Answer | ★ | ★ | ★ | 1 | — | Closing recap. |
| Mic Drop | ★ | ★ | ★ | 1 | — | Closing one-liner. |
| Lightning Round | ★ | ★ | ★ | 1 | — | Rapid recap. |
| Mission Selector | ★ | ★ | ★ | 1 | — | Setup / mission pick. |
| Opinion Shift | ★ | ★ | ★ | 1 | — | Re-vote after the lesson. |
| Conversation Rounds | ○ | ★ | ★ | 2 | — | Rotating conversations; 1:1 = single convo. |
| Character Cards | ★ | ★ | ★ | 1 | — | Assume a persona. |
| Grammar Check-In | ★ | ★ | ★ | 1 | — | Quick diagnostic. |
| Grammar Proof | ★ | ★ | ★ | 1 | — | Proofread/fix. |
| Final Word | ★ | ★ | ○ | 1 | ~16 | Each speaks; big class limits time. |
| Contribution Break | ★ | ★ | ★ | 1 | — | Submit a contribution. |
| Language Toolkit | ★ | ★ | ★ | 1 | — | Phrase-bank practice. |
| Wonder Board | ★ | ★ | ★ | 1 | — | Post questions/wonderings. |
| Password | ★ | ★ | ★ | 2 | — | Describe a word for a partner; 1:1 works. |
| In Your Words | ★ | ★ | ★ | 1 | — | Paraphrase. |
| Bluff Definition | ○ | ★ | ★ | 3 | — | Needs others to be fooled; weak in pairs. |
| Taboo Sprint | ★ | ★ | ★ | 2 | — | Describe avoiding taboo words. |

## How this gets used once you approve

- Encode on `FlightPlanItem` as `idealClassSizes: ClassSize[]` (the ★ columns) plus optional
  `minStudents` / `maxStudents`.
- `getClassSizeChip` reads the real field instead of inferring from `interactionModel`:
  "Great for your class" only when the teacher's setup is a ★ for that module.
- `minStudents` can later **gate recommendations** (e.g., never recommend Imposter to a 1:1
  teacher) and warn when a launched session has too few/many students for the module.

## Open questions for you

1. Are the **Min** floors right (esp. Imposter 4, Expert Panel / Decision Council / Bluff 3)?
2. Do we want **soft Max** ceilings at all, or only hard minimums?
3. Should `minStudents` *hide/dim* a module for a mismatched class, or just affect the chip?
