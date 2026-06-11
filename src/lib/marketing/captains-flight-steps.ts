import { FLIGHT_PLAN_PRESETS } from '@/lib/flight-plan-presets';
import type { FlightPlanStep } from '@/components/ui/flight-plan';

// The REAL Captain's Flight route, mapped to FlightPlanStep[] for marketing surfaces.
// Mirrors the stage→step mapping in flight-session-view.tsx (kept in sync by hand —
// this is a marketing-only copy so the public hero never imports live session code,
// and so the flight plan shows the genuine lesson stages instead of invented steps).
const CAPTAINS_FLIGHT = FLIGHT_PLAN_PRESETS.find((p) => p.id === 'all-around-flight-60');

export const CAPTAINS_FLIGHT_STEPS: FlightPlanStep[] = (
  CAPTAINS_FLIGHT?.flightConfig?.stages ?? []
).map((stage, i) => ({
  id: stage.stageId,
  type:
    i === 0
      ? 'Takeoff'
      : stage.kind === 'landing'
        ? 'Landing'
        : stage.kind === 'micro-event'
          ? 'Check'
          : 'Stage',
  name: stage.label,
  kind:
    i === 0 || stage.kind === 'landing'
      ? 'terminal'
      : stage.kind === 'micro-event'
        ? 'checkpoint'
        : 'module',
}));
