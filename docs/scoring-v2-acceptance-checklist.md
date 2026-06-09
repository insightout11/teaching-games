# Scoring V2 Acceptance Checklist

Status: QA checklist for Scoring Engine V2 implementation.

Use this after Scoring V2 is implemented and before pushing live. The goal is to verify that scores, accuracy, leaderboard display modes, proxy rows, and all module profiles behave coherently across the product.

## Core Data Checks

Run after each test session:

```sql
select
  points,
  outcome,
  accuracy_status,
  counts_for_leaderboard,
  counts_for_accuracy,
  scoring_version,
  streak_bonus,
  response_data
from scores
where session_id = '<SESSION_ID>'
order by created_at desc;
```

Pass criteria:

- Real score rows have `scoring_version = 2`
- Real score rows have populated `outcome`
- Real score rows have populated `accuracy_status`
- Real score rows have `streak_bonus = 0`
- Proxy/input rows have `counts_for_leaderboard = false`
- Proxy/input rows have `counts_for_accuracy = false`
- Proxy/input rows have `scoring_version = 1`

## Required Module Coverage

Scoring V2 should not ship with only pilot profiles.

Acceptance rule:

- No registered game or activity ships without `scoringProfile`
- Every module gets at least one smoke test
- Every accuracy-tracking module tests both correct and incorrect outcomes
- Every open-ended module confirms `accuracy_status = 'not_applicable'`
- Every team module confirms public display is team totals, not full individual ranking

Generate the module checklist from the actual registries:

```powershell
rg "key:|id:|slug:" src/games src/activities
```

Use `src/games/registry.ts` and `src/activities/registry.ts` as the source of truth.

## Module Profile Buckets

### Competitive Accuracy

Suggested profile:

```ts
{
  displayMode: 'competitive',
  supportsOnTask: true,
  supportsStandout: true,
  tracksAccuracy: true,
}
```

Modules:

- Flash Quiz
- VocabSprint
- Synonym Showdown
- Sentence Scramble
- Error Hunter
- Brain Teasers
- Connections

Checks:

- Wrong-but-genuine answer: `outcome = 'genuine'`, `points = 1`, `accuracy_status = 'incorrect'`
- Correct answer: `outcome = 'on-task'`, `points = 3`, `accuracy_status = 'correct'`
- Standout/winner, if supported: `outcome = 'standout'`, `points = 5`
- Public display uses competitive mode: round winner plus top 3
- Copy mentioning streak bonus is removed or updated

Note: Synonym Showdown currently references streak bonus in product copy. That must be updated if streak points are removed.

### Competitive Mixed / Quality

Suggested profile depends on the row type. Some rows may be objective, while creative/quality rows should not count toward accuracy.

Modules:

- Word Chain
- GridRush
- Dialogue Detective
- Bluff Definition
- Grammar Boss

Checks:

- Objective rows can track accuracy
- Creative or quality rows use `accuracy_status = 'not_applicable'`
- Standout is only emitted where there is a clear winner/top answer
- Raw AI or game scores do not bypass the central 0/1/3/5 ladder

Example:

- GridRush word validity can track accuracy
- GridRush sentence-writing round should be quality/open-ended unless the evaluator has an explicit correctness rule

### Team Mode

Suggested profile:

```ts
{
  displayMode: 'team',
  supportsOnTask: true,
  supportsStandout: true,
  tracksAccuracy: true, // only when answers are objectively right/wrong
}
```

Modules:

- Sector Strike
- Zone Board
- Password
- Taboo Sprint
- Problem Solvers
- Hot Take Arena
- Defend the Indefensible

Checks:

- Public display shows team totals, not full individual ranking
- Personal points still accumulate in the background
- Team totals sum eligible `counts_for_leaderboard = true` rows
- Qualitative team activities use `tracksAccuracy = false`
- Objective team activities include both correct and incorrect rows in accuracy attempts

Special review:

- Zone Board needs close verification because current scoring may not produce meaningful points.

### Class Accuracy / Reveal

Suggested profile:

```ts
{
  displayMode: 'class',
  supportsOnTask: true,
  supportsStandout: false,
  tracksAccuracy: true,
}
```

Modules:

- Prediction Round
- Two Truths & a Lie
- Two Truths & A Fabrication
- Listening Gap Fill
- Fact Detective
- Imposter

Checks:

- Correct reveal: `accuracy_status = 'correct'`
- Wrong reveal: `accuracy_status = 'incorrect'`
- Wrong answer is `genuine + incorrect`, not `invalid`
- Class display avoids full ranking by default
- Debrief accuracy includes both correct and incorrect attempts

### Class Open-Ended / Speaking / Writing

Suggested profile:

```ts
{
  displayMode: 'class',
  supportsOnTask: true,
  supportsStandout: false,
  tracksAccuracy: false,
  defaultOutcome: 'on-task',
}
```

Modules:

- Story Sprint
- 20 Questions
- Wonder Board
- Scene Igniter
- Would You Rather?
- Rank It!
- Expert Panel
- Conversation Rounds
- Scenario Simulator
- Grammar Boss, if mostly AI speaking feedback

Checks:

- Valid completion gets `outcome = 'on-task'`, `points = 3`
- `accuracy_status = 'not_applicable'`
- `counts_for_accuracy = false`
- No fake 100% accuracy appears in debrief or student summary
- No full public ranking in class mode

Future note:

- Some of these can later support `standout` through teacher spotlight, audience vote, or AI candidate selection, but do not turn that on by default unless the activity has a clear rule.

### Pulse / Familiarity

Suggested profile:

```ts
{
  displayMode: 'class',
  supportsOnTask: false,
  supportsStandout: false,
  tracksAccuracy: false,
  defaultOutcome: 'genuine',
}
```

Modules:

- Quick Pulse
- Vocab Radar

Checks:

- Participation gives `outcome = 'genuine'`, `points = 1`
- `accuracy_status = 'not_applicable'`
- `counts_for_accuracy = false`
- Class mode counts distinct participating students, not score rows

## Scenario Tests

### Vocab Sprint

Goal: competitive accuracy scoring.

Test:

- Student A answers wrong
- Student B answers correct
- Student C gets first correct / winner if applicable

Expected:

- Wrong answer: `outcome = 'genuine'`, `points = 1`, `accuracy_status = 'incorrect'`, `counts_for_accuracy = true`
- Correct answer: `outcome = 'on-task'`, `points = 3`, `accuracy_status = 'correct'`, `counts_for_accuracy = true`
- First correct/winner: `outcome = 'standout'`, `points = 5`, `accuracy_status = 'correct'`
- Leaderboard shows competitive mode
- Round winner callout uses latest `prompt_index`

### Quick Pulse

Goal: participation-only class mode.

Test:

- Three students answer a pulse question

Expected:

- Each answer: `outcome = 'genuine'`, `points = 1`
- `accuracy_status = 'not_applicable'`
- `counts_for_accuracy = false`
- Class mode shows distinct students answered, not ranking
- Debrief/control room does not show fake accuracy

### Story Sprint / Open-Ended Task

Goal: creative task completion without fake correctness.

Test:

- Student submits a valid story/response

Expected:

- `outcome = 'on-task'`
- `points = 3`
- `accuracy_status = 'not_applicable'`
- `counts_for_accuracy = false`
- No public individual ranking in class mode
- No row is counted as correct/incorrect accuracy

### Prediction Round

Goal: accuracy exists only after a real right/wrong judgment.

Test:

- Students make predictions
- Teacher/system reveals answer

Expected:

- Correct prediction: `points = 3`, `accuracy_status = 'correct'`
- Wrong prediction: `points = 1`, `accuracy_status = 'incorrect'`
- Both correct and incorrect rows count toward `accuracy_attempts`
- Display mode remains class unless intentionally changed

### Proxy Row Pollution

Goal: student-device input does not inflate leaderboard.

Test:

- Use any student-device activity that posts through `/api/student/submit`
- Submit from student device before game scoring resolves

Expected:

- `remote_vote` row exists
- `points = 0`
- `counts_for_leaderboard = false`
- `counts_for_accuracy = false`
- Student does not gain points from proxy row alone

### Team Mode

Goal: public display shows team totals without full ranking.

Test:

- Run a team-based game
- Have students on both teams score

Expected:

- Personal points write normally
- Team totals sum eligible score rows
- Public display shows team totals, not full individual ranking
- No fake accuracy if the team activity is qualitative

## Cross-Product Checks

### Student End Summary

Expected:

- Total points match V2 score rows only
- Accuracy appears only for accuracy-tracking activities
- Participation/open-ended activities do not create 100% accuracy
- Personal rank uses `counts_for_leaderboard = true` rows

### Control Room / Debrief

Expected:

- Accuracy = correct / accuracy attempts
- Wrong answers are included in denominator
- Participation-only activities show participation, not accuracy
- Progress report inputs do not treat open-ended participation as correct

### All-Time Leaderboard

Expected:

- Only `scoring_version = 2` rows count
- Old contaminated rows do not appear
- A stats updated/reset message appears if implemented
- No 100% accuracy inflation from proxy rows

### Deprecated Controls

Expected:

- Teacher hover `+1` / `+2` / `+5` buttons are gone
- Student scoring mode picker is gone
- Student score visibility toggle remains
- `/api/student/prefs` no longer accepts `scoring_mode`

## Minimum Pass Before Live

Do not push Scoring V2 live until these pass:

- Vocab Sprint
- Quick Pulse
- Story Sprint or another open-ended module
- One class accuracy/reveal module
- One team module
- Proxy row pollution test
- Debrief accuracy
- Student end summary
- All-time leaderboard reset/filter
- Deprecated scoring controls removed
