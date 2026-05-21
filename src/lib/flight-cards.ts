import { getGame } from '@/games/registry';
import { getActivity } from '@/activities/registry';

interface ScoringProfile {
  tracksAccuracy?: boolean;
  supportsStandout?: boolean;
}

interface CardDef {
  key: string;
  weight: number;
  isCompatible: (profile: ScoringProfile) => boolean;
}

const CARD_POOL: CardDef[] = [
  { key: 'takeoff',       weight: 35, isCompatible: ()  => true },
  { key: 'clear-skies',   weight: 22, isCompatible: (p) => p.tracksAccuracy === true },
  { key: 'afterburner',   weight: 18, isCompatible: (p) => p.tracksAccuracy === true },
  { key: 'full-throttle', weight: 10, isCompatible: (p) => p.supportsStandout === true },
  { key: 'contrail',      weight: 15, isCompatible: ()  => true },
];

export function getScoringProfileForModule(moduleKey: string): ScoringProfile | null {
  const game = getGame(moduleKey);
  if (game?.scoringProfile) return game.scoringProfile;
  const activity = getActivity(moduleKey);
  if (activity?.scoringProfile) return activity.scoringProfile;
  return null;
}

function buildCompatiblePool(profile: ScoringProfile): CardDef[] {
  const compatible = CARD_POOL.filter((c) => c.isCompatible(profile));
  return compatible.length > 0 ? compatible : [CARD_POOL[0]]; // Takeoff is guaranteed fallback
}

export function drawCards(moduleKey: string, count: number): string[] {
  const profile = getScoringProfileForModule(moduleKey) ?? {};
  const initialPool = buildCompatiblePool(profile);
  let pool = [...initialPool];

  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    if (pool.length === 0) {
      pool = [...initialPool];
    }

    const totalWeight = pool.reduce((sum, c) => sum + c.weight, 0);
    let r = Math.random() * totalWeight;
    let drawnIndex = 0;
    for (let cardIndex = 0; cardIndex < pool.length; cardIndex++) {
      const card = pool[cardIndex];
      r -= card.weight;
      if (r <= 0) { drawnIndex = cardIndex; break; }
    }
    const [drawn] = pool.splice(drawnIndex, 1);
    results.push(drawn.key);
  }
  return results;
}
