'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlannerShell } from '@/components/planner/planner-shell';
import { usePlannerStore } from '@/stores/planner-store';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** ?attach=<sessionId>&classId=<classId>: launched from a Live Room — fly into that session. */
function LiveRoomAttach() {
  const params = useSearchParams();
  const setAttachSessionId = usePlannerStore((s) => s.setAttachSessionId);
  const setSelectedClassId = usePlannerStore((s) => s.setSelectedClassId);
  useEffect(() => {
    const attach = params.get('attach');
    const classId = params.get('classId');
    setAttachSessionId(attach && UUID.test(attach) ? attach : null);
    if (attach && classId && UUID.test(classId)) setSelectedClassId(classId);
  }, [params, setAttachSessionId, setSelectedClassId]);
  const attachSessionId = usePlannerStore((s) => s.attachSessionId);
  if (!attachSessionId) return null;
  return (
    <div className="mx-auto mb-3 flex max-w-5xl flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/30 bg-amber-300/[0.07] px-4 py-2.5 text-sm text-amber-100">
      <span>Launching into your Live Room. Students stay joined, and you&apos;ll return to the room when the flight ends.</span>
      <a href={`/sessions/${attachSessionId}`} className="font-semibold text-white underline-offset-2 hover:underline">Back to room</a>
    </div>
  );
}

export default function LessonPlannerPage() {
  return (
    <>
      <Suspense fallback={null}>
        <LiveRoomAttach />
      </Suspense>
      <PlannerShell />
    </>
  );
}
