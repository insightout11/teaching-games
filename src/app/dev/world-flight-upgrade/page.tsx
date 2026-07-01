import { WorldFlightPage } from '@/components/world-flight/world-flight-page';
import type { WorldFlightClassSummary } from '@/lib/world-flight/journey';

const upgradeReadyClass: WorldFlightClassSummary = {
  id: 'dev-world-flight-upgrade',
  name: 'Upgrade QA Class',
  currentDestinationId: 'new-york',
  planeTier: 1,
  planeKey: 'starter-biplane',
  planeSelectionRequired: true,
  rangeKm: 5200,
  flightHours: 3,
  crewStars: 3,
  visitedDestinationIds: ['new-york'],
  completedLegCount: 0,
  completedLegs: [],
  recentLegs: [],
  investigations: [],
  expeditionRuns: [],
};

export default function WorldFlightUpgradeDevPage() {
  return <WorldFlightPage initialClasses={[upgradeReadyClass]} />;
}
