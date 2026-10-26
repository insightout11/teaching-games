/**
 * First-time student onboarding (Oct 2026): a few swipeable cards on a student's first boarding. Each step names the
 * feature it explains and shows only when that feature is in use, so when a feature changes, edit its step here.
 * Bump ONBOARDING_VERSION when the steps change enough that everyone should see them again.
 */

export const ONBOARDING_VERSION = 1;

export interface OnboardingContext { name: string; mascotName: string | null; hasShelf: boolean }

export type OnboardingVisual = 'avatar' | 'seat' | 'phone' | 'dots' | 'selfie' | 'mascot' | 'souvenir' | 'plane';

export interface OnboardingStep {
  id: string;
  title: (c: OnboardingContext) => string;
  text: (c: OnboardingContext) => string;
  visual: OnboardingVisual;
  /** Only shown when this is true (the feature is in use for this class). */
  when?: (c: OnboardingContext) => boolean;
}

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  { id: 'welcome', visual: 'avatar', title: (c) => `Welcome aboard, ${c.name}!`, text: () => 'This is your boarding pass. Every lesson is a flight, and you are part of the crew.' },
  { id: 'seat', visual: 'seat', title: () => 'Pick your seat', text: () => 'Choose a seat on the plane. Sit next to your friends!' },
  { id: 'answer', visual: 'phone', title: () => 'Answer on your phone', text: () => 'Votes, quick questions and games come to your phone. Tap to answer, then say it out loud.' },
  { id: 'dots', visual: 'dots', title: () => 'Three dots each', text: () => 'On the Class Board you get 3 dots. Put them on the ideas you like best.' },
  { id: 'selfie', visual: 'selfie', title: () => 'Window selfies', text: () => 'When we fly past a landmark, take your window selfie. Pick a face, then snap!' },
  { id: 'mascot', visual: 'mascot', title: (c) => `Meet ${c.mascotName}`, text: () => 'Our class mascot flies with us. You can put it in your selfies too.', when: (c) => !!c.mascotName },
  { id: 'souvenirs', visual: 'souvenir', title: () => 'Collect souvenirs', text: () => 'Talk about the countries we fly over and the class earns a souvenir for the cabin shelf.' },
  { id: 'ready', visual: 'plane', title: () => 'Ready for take-off', text: () => 'Listen to your captain, speak up, and enjoy the flight!' },
];

export function onboardingStepsFor(c: OnboardingContext): OnboardingStep[] {
  return ONBOARDING_STEPS.filter((s) => !s.when || s.when(c));
}

const KEY = 'lc-student-onboarded';
export function hasSeenOnboarding(): boolean {
  try { return Number(localStorage.getItem(KEY) ?? 0) >= ONBOARDING_VERSION; } catch { return true; }
}
export function markOnboardingSeen(): void {
  try { localStorage.setItem(KEY, String(ONBOARDING_VERSION)); } catch { /* private mode */ }
}
