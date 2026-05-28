'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePlannerStore } from '@/stores/planner-store';
import { PlannerStepIndicator } from './planner-step-indicator';
import { MissionSetupScreen } from './mission-setup-screen';
import { FlightPlanScreen } from './flight-plan-screen';
import { ReviewLaunchScreen } from './review-launch-screen';
import { FlightEnvironment } from '@/components/ui/flight-environment';
import { GateSceneOverlay } from '@/components/ui/gate-scene-overlay';

const STEP_SCENE = {
  'mission-setup': 'gate',
  'flight-plan':   'route',
  'launch':        'preflight',
} as const;

export function PlannerShell() {
  const step = usePlannerStore((s) => s.step);
  const scene = STEP_SCENE[step];

  return (
    <>
      {/* Pre-flight sky + ambient gate visuals; overrides dashboard's global sky */}
      <FlightEnvironment scene={scene} className="!left-64">
        <GateSceneOverlay scene={scene} />
      </FlightEnvironment>
      <div className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8 px-6 pt-8 lg:px-8 pb-12 min-h-[calc(100vh-4rem)]">
      <div className="mb-8">
        <PlannerStepIndicator current={step} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {step === 'mission-setup' && <MissionSetupScreen />}
          {step === 'flight-plan' && <FlightPlanScreen />}
          {step === 'launch' && <ReviewLaunchScreen />}
        </motion.div>
      </AnimatePresence>
    </div>
    </>
  );
}
