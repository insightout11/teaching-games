# Student Device Feedback V2

Status: product/design direction for post-Scoring V2 student device work.

This note captures how the student device should use Scoring V2 results. The shared screen should stay class-safe; the student device should show personal progress.

## Core Principle

Public screen shows class-safe session status.

Student device shows personal progress.

The student device should not become a full public leaderboard. It should feel like a private flight log for the student.

## After Each Submission

After a student submits, show a compact result card.

Examples:

```text
+1
Submitted
You joined the round.
```

```text
+3
On task
Your answer counted for this challenge.
```

```text
+5
Standout
Top answer this round.
```

```text
0
Not counted
Try submitting a real answer next time.
```

The label should come from `outcome`:

- `genuine` -> Submitted
- `on-task` -> On task
- `standout` -> Standout
- `invalid` -> Not counted

## Accuracy Modules

When `accuracy_status` is `correct` or `incorrect`, show a small correctness line.

Examples:

```text
Correct
```

```text
Not quite
```

For open-ended modules, do not show correctness.

Use:

```text
On task
```

Not:

```text
Correct
```

## Personal Session Progress

The student should always be able to see:

- Points today
- Responses today
- Current module
- Team, if applicable

Example:

```text
Your Flight
14 pts - 6 responses
Blue Team
```

## Competitive Modules

Only in competitive modules, show private rank context.

Examples:

```text
You are 5th
2 points behind the Top 3
```

```text
You are 1 point behind 3rd
```

Do not show the full class ranking on the student device by default.

## Team Modules

Show contribution to the team.

Examples:

```text
+3 for Blue Team
Blue is 2 points behind
```

```text
Blue took the lead
```

## Class Mode Modules

Show personal contribution without ranking.

Examples:

```text
You helped the class reach 80% participation.
```

```text
You added response 10 of 12.
```

## Feedback Text

If AI or game feedback exists, keep it short.

Preferred shape:

- One positive signal
- One improvement tip, if useful

Example:

```text
Good use of "departure."
Try adding one more detail next time.
```

Do not make every result verbose. Most responses should stay compact.

## Suggested Student Device Layout

```text
Your Flight
14 pts - 6 responses

Last result
+3 On task

Current
Vocab Sprint - Round 2
```

Later, Flight Cards can live in this same area:

```text
Cards
Tailwind - Afterburner
```

## V1 Scope

For the first version, keep it simple:

- Your points
- Your response count
- Last result
- Current module
- Team context when relevant
- Private rank context only in competitive modules

Do not add:

- Full class leaderboard
- Public bottom rankings
- Dense analytics
- Long feedback by default

## Required Data From Scoring V2

Before implementing this UI, confirm the student session endpoint exposes:

- `outcome`
- `points`
- `accuracy_status`
- personal total points
- personal response count
- current module
- display mode
- team, when applicable
- private rank context, when applicable
- latest feedback, when available
