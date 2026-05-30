'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePlannerStore } from '@/stores/planner-store';
import { PlannerStepIndicator } from './planner-step-indicator';
import { MissionSetupScreen } from './mission-setup-screen';
import { FlightPlanScreen } from './flight-plan-screen';
import { ReviewLaunchScreen } from './review-launch-screen';
import { SkyBackground } from '@/components/ui/sky-background';

export function PlannerShell() {
  const step = usePlannerStore((s) => s.step);

  return (
    <div className="relative -mx-6 -mt-6 lg:-mx-8 lg:-mt-8 px-6 pt-8 lg:px-8 pb-12 min-h-[calc(100vh-4rem)]">
      {/* Quiet pre-flight sunset sky (grounded) — soft clouds + a faint warm
          horizon, muted by a dark scrim so it stays premium, not a bold scene. */}
      <SkyBackground
        weatherState="climbing"
        altitude={0}
        intensity="subtle"
        showEarth={false}
        showCityLights={false}
        className="!left-64"
      />
      <div
        className="fixed inset-0 pointer-events-none bg-gradient-to-t from-[#070b14]/70 via-[#080c16]/45 to-[#080c16]/20 !left-64"
        style={{ zIndex: 0 }}
        aria-hidden
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
