import { ConciergeBell, UtensilsCrossed, TramFront } from 'lucide-react';
import { ConversationRoundsActivity } from '../conversation-rounds/activity';
import type { ActivityPlugin } from '../types';

// Travel-arc roleplay stages. All three reuse the ConversationRounds engine but are
// SEPARATE activity keys, so each gets its own content slot and its own source grounding
// (from buildTripItinerary) — different roles, tasks, and complications per stage, so they
// don't feel like the same activity three times. See travel-trip-anchors-codex-brief.md.

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
};

export const tripGettingTherePlugin: ActivityPlugin = {
  ...base,
  key: 'trip-getting-there',
  name: 'Getting There',
  description: 'Roleplay getting from the airport into the city — buy a ticket or direct the driver.',
  icon: TramFront,
};

export const tripHotelPlugin: ActivityPlugin = {
  ...base,
  key: 'trip-hotel',
  name: 'Hotel Check-In',
  description: 'Roleplay the hotel front desk — check in, ask about the room, report a problem.',
  icon: ConciergeBell,
};

export const tripMealPlugin: ActivityPlugin = {
  ...base,
  key: 'trip-meal',
  name: 'Local Table',
  description: "Roleplay ordering a real local dish — ask what's in it and handle the bill.",
  icon: UtensilsCrossed,
};
