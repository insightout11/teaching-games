# Child safety and moderation audit — brief for Codex (Astra)

Written 15 October 2026. **Read and report only.** Claude will verify each finding and make any changes afterwards.

## What this is for

LessonCaptain is used in live English lessons with children and teenagers, worldwide. The teacher shares one screen with the whole class (projected, or on a Zoom call). Students join from phones with a code and no account, and type or tap answers. Several features put **students' own words**, or **AI-written text**, on that shared screen in front of everyone.

Find the ways a real class could see something it should not, or a child could be harmed or embarrassed, during a normal lesson. Nothing else.

## The bar for a finding

Report a problem only if you can show, from the code, that it leads to one of these:

1. **Hurtful or inappropriate text reaches the shared screen**: a student's rude, sexual, violent, bullying or hateful words, or another student's name used against them, shown to the class without the teacher choosing to show it, or with no way for the teacher to remove it quickly.
2. **The AI produces unsuitable content for a child**: an AI route that could write sexual, violent, frightening, hateful or otherwise unsuitable text for a class of children, because nothing tells it the audience is young, or because a student's or pasted source's words steer it there (for example a pasted video or article on an adult topic, or a student typing a prompt into a feature that sends it to the AI).
3. **A child is singled out or exposed**: a child's full name, answers, low score or ranking shown to the class against the product's own rules (Junior classes are never ranked; the student can choose to stay anonymous in Captain's Pick; the shared screen never shows answers or private information), or a student able to post under another student's name.
4. **A stranger can reach the class**: someone outside the lesson able to join, post to the shared screen, or read what children wrote, through the normal join flow.
5. **The teacher cannot stop it**: something unsuitable appears and the teacher has no quick way to hide, remove or end it on the shared screen.

Leave out anything that does not reach that bar. Do not report: general security already covered by the October critical audit (database access rules, service routes, paid routes, see `docs/critical-audit-brief.md`), code style, missing tests, accessibility, performance, or theoretical cases that need a teacher acting in bad faith.

**At most 10 findings.** Fewer is better. If an area is sound, say so in one line.

## Where to look, in this order

1. **Every place student text reaches the shared screen.** Start from the phone input types in `src/lib/input-spec.ts` and the student submit routes under `src/app/api/student/`, and follow each one to what the teacher screen renders. Include at least: Captain's Pick / spotlight (`src/app/api/session/spotlight/`, `src/components/session/captain-pick-card.tsx`), the class board and wonder board (`src/app/api/class-board/`, `src/app/api/wonder-board/`), class questions, debate points (`src/app/api/debate-board/`), word clouds and widgets (`src/components/session/`, the Live Room widgets), display names chosen at join (`src/app/api/student/join/`), and any activity that shows a student's sentence to the class. For each: is it shown only after the teacher approves it, or straight away? Is there any filter for rude or hurtful words? Can the teacher remove it from the screen?
2. **Display names.** A student types their name when joining. Can a name be offensive, or someone else's name? Where does it appear on the shared screen (boarding, cabin seats, leaderboards, Captain's Pick, spotlight, results)?
3. **AI prompts and the audience.** Every route that calls `src/lib/ai` (see the paid-route inventory in the critical audit report for the list). For each, check whether the prompt tells the model it is writing for a class of children or teenagers, and whether a student's own text, a pasted source, a video transcript or a web search result is passed into the prompt where it could steer the output. Pay most attention to routes whose output goes straight to the shared screen or to phones without the teacher seeing it first: the Live Room topic summary and talking points (`src/app/api/session/[sessionId]/focus/`, `src/app/api/live-room/talk-prompts/`), AI answers on the class board and wonder board, Twenty Questions answers, story and scenario continuations (`src/app/api/activity/continue/`), and any evaluator that writes feedback a student reads.
4. **Sources from the open web.** The Live Room can search the web for pages, images and videos (`src/lib/sources/`, `src/app/api/sessions/[sessionId]/sources/`) and show them to the class. Is there safe-search or any filtering on what comes back, especially images and videos? Can a search result be shown on the shared screen without the teacher seeing it first?
5. **Junior classes and rankings.** Junior classes (`classes.junior`) must never show ranks. Find any screen that still shows a ranking, a "last place", or a score comparison in a Junior class.
6. **Anonymity in Captain's Pick.** Students can ask not to show their name. Check every path that shows a spotlighted answer respects it.
7. **Joining.** Can someone with only the class code or link join and post to the shared screen without the teacher seeing them arrive? Is there a way for the teacher to remove a student from the lesson?

## Before you report a finding, prove it

- Trace the whole path: where the text comes from, every step it passes through, and where it is shown. Quote the file and line for each step.
- Check whether something already stops it: an approval queue, a filter, a teacher-only view, a Junior check. Many apparent problems are handled one step away.
- If you could not confirm a step, mark the finding "unconfirmed" and say what is missing.

## Rules

- Work from `origin/main` in your own worktree. Do not use the main checkout.
- Change no application code, data or migrations. Do not install packages.
- Make no writes to the production database and do not use the live site.
- Do not write fixes. For each finding give one or two sentences on the smallest change that would close it. No new systems or libraries unless nothing smaller would work, and say so.

## The report

Write `docs/child-safety-audit-report.md` on a branch `codex/child-safety-audit`. Commit locally. No push, no merge.

For each finding, most serious first:

- **Title** in plain words.
- **Which of the five harms**, and who is affected.
- **How it happens**: numbered steps a real class would go through, with file and line for each.
- **What should have stopped it**, and why it does not.
- **Confidence**: confirmed, or unconfirmed with what is missing.
- **Smallest fix**: one or two sentences.

End with two short lists: areas you checked and found sound, and areas you did not get to.
