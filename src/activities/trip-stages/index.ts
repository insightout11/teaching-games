import { ConciergeBell } from 'lucide-react';
import { ConversationRoundsActivity } from '../conversation-rounds/activity';
import type { ActivityPlugin } from '../types';

// Travel-arc roleplay stage(s) that reuse the ConversationRounds engine but are SEPARATE
// activity keys, so each gets its own content slot + source grounding (from buildTripItinerary).
// (Arrival is an adaptive Scene Igniter; Getting There, Attractions, and the Meal are
// purpose-built — see ../trip-getting-there, ../trip-attractions, ../trip-meal.)

const base: Omit<ActivityPlugin, 'key' | 'name' | 'description' | 'icon'> = {
  category: 'learning',
  pppStage: 'production',
  skills: ['Speaking', 'Role-play', 'Listening'],
  component: ConversationRoundsActivity,
  supportsCustomTopic: false,
  estimatedMinutes: 12,
  defaultTimerSeconds: 0,
  // Only meaningful inside the Travel arc (needs a per-stage travel source).
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'on-task' },
  // Reuses ConversationRounds' two-role engine — both roles collapse onto the same
  // student when solo, so this needs a real second student to be meaningful.
  minStudents: 2,
  idealStudents: { min: 2, max: null },
  deviceFree: false,
};

export const tripHotelPlugin: ActivityPlugin = {
  ...base,
  key: 'trip-hotel',
  name: 'Hotel Check-In',
  description: 'Roleplay the hotel front desk — check in, ask about the room, report a problem.',
  icon: ConciergeBell,
};
