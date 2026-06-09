# Flight Status And Three-Screen Model

Status: product/design direction for post-Scoring V2 leaderboard work.

This note captures the intended direction for replacing the idea of a single public leaderboard with a stable class-safe status system supported by student and teacher devices.

## Core Principle

LessonCaptain should not treat the shared screen as the place where every individual ranking and private result is exposed.

Instead:

- Shared screen = collective energy
- Student device = personal progress
- Teacher device = private control and review

This preserves excitement while reducing embarrassment and giving each person the right information in the right place.

## Shared Screen: Flight Status

The public panel should feel stable across the whole lesson.

Do not visibly switch between unrelated interfaces such as "Class Mode," "Team Mode," and "Competitive Mode." Instead, use one consistent panel:

- Flight Status

The internal module `displayMode` can still decide which secondary widget appears, but the public experience should feel continuous.

Always show:

- Class progress or participation
- Current module status
- Recent class activity

Sometimes show:

- Top 3, only when the module is competitive
- Team totals, only when the module is team-based
- Spotlighted or public-safe answers
- Round winner or current result

Avoid showing:

- Full individual ranking by default
- Bottom students
- Private accuracy
- Embarrassing misses
- Raw submission details before teacher review

## Student Device: Personal Progress

The student device should show the personal information students naturally care about, without exposing it publicly.

Can show:

- My points
- My last result
- My current team
- My progress this session
- My private rank or distance from top 3 when competitive
- My feedback when available
- My cards/power-ups later if Flight Cards are added

Examples:

- Class-style module: "You answered. +3 on-task. Today: 11 points."
- Competitive module: "You got +3. You are 5th, 2 points behind 3rd."
- Team module: "You earned +3 for Blue Team. Your team is 3 points behind."

## Teacher Device: Private Control

The teacher device can eventually become a private remote/control surface.

Can show:

- Student submissions
- Suggested follow-ups
- Scripts and teaching notes
- Definitions and language support
- Spotlight candidates
- Next/pause/freeze controls
- Moderation tools

The teacher device lets the main shared screen stay clean while still giving the teacher richer live information.

## Display Mode Interpretation

Scoring V2 still uses module-level display modes:

- `class`
- `team`
- `competitive`

But these should not feel like separate products on the public screen.

They should control the secondary widget inside Flight Status:

- Class module: participation/current class result
- Competitive module: round winner/top 3
- Team module: team totals/recent team gain

The anchor remains the same:

- Flight Status
- Class progress
- Current activity

## Widget Scope Clarification

Flight Status is a replacement/refactor of the current leaderboard widget, not a redesign of the whole session screen.

The main game/activity area should continue to teach and run the current module. The Flight Status widget should primarily answer:

- How is the whole session going?

It should not try to duplicate the current module UI.

Recommended V1 structure:

```text
Flight Status
Module 3 of 5 - Practice
12 active - 48 responses

[mode-specific summary]
```

The mode-specific summary is the only part that should change significantly by active module:

```text
Class-style module:
Participation 80%

Competitive module:
Top 3: Sara 18 - Ali 15 - Mina 14

Team module:
Blue 24 - Red 21
```

For V1:

- No tabs
- No teacher switching
- No dense activity-specific detail
- Automatic summary based on the active module's `scoringProfile.displayMode`

This keeps the widget useful as a session dashboard without competing with the main activity screen.

## Design Goal

The public screen should make the class feel alive without turning every lesson into a public individual ranking.

The student device should still satisfy the individual student's curiosity about their own performance.

The teacher device should let the teacher guide, moderate, and enrich the lesson privately.
