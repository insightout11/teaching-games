// First-run stage coaching (A3 / Captain's Flight Stage 6b). One-line "what you do
// now" hints shown under the live stage header for a teacher's first few sessions.
//
// RULES:
// - Projected-safe: these render on the shared class screen, so wording must read
//   fine if a student glimpses it — describe the mechanic, never reveal answers.
// - One short sentence, teacher-facing, present-tense.
// - Keyed by module/game/activity key (LessonSlot.key). Modules without an entry
//   simply show no hint — only add one where the teacher's role is non-obvious.

export const STAGE_HINTS: Record<string, string> = {
  // Takeoff / warm-up
  'prediction-round': 'Collect quick predictions now — on a source lesson you’ll reveal the answers after the briefing.',
  'quick-pulse': 'Take a fast read of the room, then use the split to open the conversation.',
  'wonder-board': 'Students post questions; feature a couple to steer where the lesson goes.',

  // Briefing
  'read-aloud': 'Assign reading turns around the class; a comprehension check follows.',
  'video-player': 'Play the clip, then run the comprehension prompt together.',

  // Opinion pulse
  'would-you-rather': 'Gather the class’s split — you’ll carry it into the main discussion.',
  'rank-it': 'Students rank the options; compare where the class agrees and splits.',

  // Vocab spine
  'language-toolkit': 'Introduce the key words; students practise saying them out loud — no typing.',

  // Accuracy check (timed races — all phones answer at once)
  'error-hunter': 'A timed race — the whole class answers on their phones at once.',
  'sentence-scramble': 'A timed race — the whole class answers on their phones at once.',
  'synonym-showdown': 'A timed race — the whole class answers on their phones at once.',
  'vocab-sprint': 'A timed race — the whole class answers on their phones at once.',
  'grid-rush': 'A timed race — the whole class answers on their phones at once.',

  // Main discussion
  'decision-council': 'Students propose ideas, back the strongest with signals, then vote — you moderate each phase.',
  'team-debate': 'Split the class into sides; each team preps points before the debate.',

  // Review games (all answer together; reveal after each round)
  'flash-quiz': 'Everyone answers each question together — reveal after each round.',
  'imposter': 'A whole-class round — students spot the odd one out from the source.',
  'connections': 'A whole-class round — students group the items from the source.',
  'sector-strike': 'Two teams take turns claiming sectors — the answering team’s phones light up.',

  // Landing
  'final-word': 'The closing beat — each student gives their final take.',
  'final-answer': 'The closing beat — each student commits to a final answer.',
};

/** Projected-safe one-line teacher hint for a module, or null if none. */
export function getStageHint(moduleKey: string | undefined | null): string | null {
  if (!moduleKey) return null;
  return STAGE_HINTS[moduleKey] ?? null;
}
