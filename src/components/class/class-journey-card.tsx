import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Globe2, Plane, Stamp } from 'lucide-react';
import { getDestinationById } from '@/data/world-flight/destinations';
import { getPlaneTier } from '@/lib/plane-progression';
import { JourneyShareControl } from '@/components/class/journey-share-control';

export function ClassJourneyCard({
  classId,
  currentDestinationId,
  planeTier,
  stampCount,
  shareEnabled,
  shareToken,
}: {
  classId: string;
  currentDestinationId: string | null;
  planeTier: number;
  stampCount: number;
  shareEnabled: boolean;
  shareToken: string | null;
}) {
  const destination = currentDestinationId ? getDestinationById(currentDestinationId) : null;
  const planeTierLabel = getPlaneTier(planeTier).label;

  return (
    <Card className="p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Globe2 className="w-4 h-4 text-lc-blue shrink-0" />
        <h2 className="text-sm font-semibold text-lc-text">Journey</h2>
      </div>

      {destination ? (
        <div className="space-y-1.5 font-instrument text-sm text-lc-text2">
          <p className="flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-lc-blue" />
            {destination.city}, {destination.country}
          </p>
          <p className="flex items-center gap-1.5">
            <Plane className="w-3.5 h-3.5 text-lc-text3" />
            {planeTierLabel}
          </p>
          <p className="flex items-center gap-1.5">
            <Stamp className="w-3.5 h-3.5 text-lc-text3" />
            {stampCount} stamp{stampCount === 1 ? '' : 's'}
          </p>
        </div>
      ) : (
        <p className="text-sm text-lc-text3">No destination lessons yet — start a World Flight lesson to begin the journey.</p>
      )}

      <div className="mt-4 pt-3 border-t border-lc-border/60 flex items-center justify-between gap-2">
        <Link href="/world-flight" className="text-xs font-semibold text-lc-blue hover:text-lc-blue-hover transition-colors">
          Open World Flight →
        </Link>
        <JourneyShareControl classId={classId} initialShareEnabled={shareEnabled} initialShareToken={shareToken} />
      </div>
    </Card>
  );
}
