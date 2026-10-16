# Activity quality audit — brief for Codex (Astra)

Written 16 October 2026. **Read and report only.** Claude will check the findings and the owner decides what changes.

## What this is for

LessonCaptain is for live English lessons with children and teenagers (online over Zoom, or projected in a classroom). The teacher shares one screen; students answer on phones, or with no phones at all. Its whole promise is that **students speak more English**.

The question for this audit: **for each game and activity, does it actually get students using English, at the level chosen, in a real lesson?** This needs judgement, not grep. Think like an experienced English teacher running the activity with 2, 8 and 25 students.

## What to judge, for every game and activity

Every plugin in `src/games/registry.ts` and `src/activities/registry.ts`, except retired ones (`src/lib/retired-plugins.ts`) and vaulted ones (Tone Transformer, Interview Lab).

For each one, trace a real round from start to finish: the teacher's screen, what the phone shows (`src/components/student/dynamic-input.tsx` and the panels it uses), what the students do, what the AI writes, how the round ends. Then answer:

1. **English produced.** In a typical round, what does each student actually say or write in English, and how much? Is most of the class speaking, or tapping, waiting, or watching one student? Count roughly: minutes of student talk per 10 minutes of activity, for a class of 8.
2. **Level fit.** Does the content really change between Beginner (A1), Easy (A2), Intermediate (B1), Advanced (B2) and Expert (C1)? Judge the AI's output from **every** prompt that writes it: the generate route, and any evaluate, continue, hint or answer routes. Never judge from the first prompt alone. Quote the prompt lines that set the level, and say whether an A1 class could follow and a C1 class would be stretched.
3. **Class size fit.** Does it work at 1, 2, 8 and 25 students? Check the plugin's `minStudents`, `idealStudents` and `deviceFree` against what the code really needs. Flag one-student dead ends, and big-class rounds where most students do nothing.
4. **Junior fit.** In a Junior class (`classes.junior`, young children): is the reading load manageable, are there pictures where they help, and is anything ranked?
5. **Teacher load.** How many taps and decisions does the teacher make per round on the shared screen? Is there any moment where the teacher does not know what to do next, or the screen shows nothing useful while students work?
6. **The one change.** What single change would most increase the English students produce? It must be small and concrete (one sentence), not a redesign.

## The bar

This is about learning value, not bugs. Do not report: code style, refactors, performance, missing tests, safety (covered by the child-safety audit), or anything already listed in the critical or child-safety audit reports.

## The report

Write `docs/activity-quality-audit-report.md` on a branch `codex/activity-quality-audit`. Commit locally. No push, no merge. Change no code, data or migrations; make no AI calls and do not use the live site.

1. **A one-line verdict per activity**, in a table: name · English produced (high / medium / low) · level fit (good / weak / none) · best class size · keep / fix / cut.
2. **The ten weakest**, most important first, each with:
   - what students actually do in a round (numbered steps, with file and line where it matters),
   - why little English comes out of it,
   - the level problem, quoting the prompt lines,
   - the one change.
3. **The five strongest**, and what makes them work, so the others can borrow it.
4. **Overlaps:** activities that do the same job, where one could go.
5. **Gaps:** kinds of speaking practice the catalogue lacks (for example, a structured pair task, a short presentation, or role-play with a goal).

Keep it honest and specific. "Students tap one of four options, then the next round starts; nobody speaks unless the teacher asks" is useful; "could be more engaging" is not. Where you are unsure how something plays in practice, say so.
