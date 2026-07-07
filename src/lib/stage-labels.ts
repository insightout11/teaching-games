import { FLIGHT_PLAN_PRESETS } from '@/lib/flight-plan-presets';

// Stage-label lookup merged from every preset's flightConfig, so callers can
// label modules from any active preset (Travel's trip-meal, Debate's
// team-debate, Grammar drills…), not just All-Around Flight. The session
// doesn't persist which preset is running, so we resolve gameKey → label
// across all of them. All-Around is merged first so its labels win on keys
// shared between presets; the raw gameKey is the final fallback.
const GAMEKEY_TO_STAGE_LABEL: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  const orderedPresets = [
    ...FLIGHT_PLAN_PRESETS.filter(p => p.id === 'all-around-flight-60'),
    ...FLIGHT_PLAN_PRESETS.filter(p => p.id !== 'all-around-flight-60'),
  ];
  for (const preset of orderedPresets) {
    const cfg = preset.flightConfig;
    if (!cfg) continue;
    const labelByStage = Object.fromEntries(cfg.stages.map(s => [s.stageId, s.label]));
    for (const [gameKey, stageId] of Object.entries(cfg.stageByKey)) {
      if (map[gameKey]) continue; // first preset to define the key wins
      const label = labelByStage[stageId];
      if (label) map[gameKey] = label;
    }
  }
  return map;
})();

export function getStageLabelForKey(gameKey: string | undefined | null): string | null {
  if (!gameKey) return null;
  return GAMEKEY_TO_STAGE_LABEL[gameKey] ?? gameKey;
}
