'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePlannerStore } from '@/stores/planner-store';
import { PlannerStepIndicator } from './planner-step-indicator';
import { MissionSetupScreen } from './mission-setup-screen';
import { FlightPlanScreen } from './flight-plan-screen';
import { ReviewLaunchScreen } from './review-launch-screen';

export function PlannerShell() {
  const step = usePlannerStore((s) => s.step);

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
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
  );
}
