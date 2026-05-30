'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePlannerStore } from '@/stores/planner-store';
import { PlannerStepIndicator } from './planner-step-indicator';
import { MissionSetupScreen } from './mission-setup-screen';
import { FlightPlanScreen } from './flight-plan-screen';
import { ReviewLaunchScreen } from './review-launch-screen';
import { SkyBackground } from '@/components/ui/sky-background';
import type { WeatherState } from '@/components/ui/sky-background';

// Pre-flight time-of-day arc — warms toward the dusk departure (lobby = climbing).
// blue hour → dusk twilight → sunset, grounded at the departure airfield.
const STEP_WEATHER: Record<string, WeatherState> = {
  'mission-setup': 'idle',     // blue hour — calm planning
  'flight-plan': 'golden',     // dusk gathering
  'launch': 'climbing',        // sunset — cleared for departure
};

export function PlannerShell() {
  const step = usePlannerStore((s) => s.step);

  return (
    <div className="relative -mx-6 -mt-6 lg:-mx-8 lg:-mt-8 px-6 pt-8 lg:px-8 pb-12 min-h-[calc(100vh-4rem)]">
      {/* Planner-scoped sky — one persistent instance that crossfades per step */}
      <SkyBackground
        weatherState={STEP_WEATHER[step] ?? 'idle'}
        earthState="takeoff"
        altitude={0}
        intensity="subtle"
        className="!left-64"
      />

      <div className="relative z-10">
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
    </div>
  );
}
