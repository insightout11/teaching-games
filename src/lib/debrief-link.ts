/**
 * Student results links (/debrief/[token]) are shared with families, so they show the first name only
 * (docs/kids-privacy-review.md). They already stop working 30 days after the lesson (see the page).
 */
export function debriefFirstName(displayName: string | null | undefined, fallback = 'Pilot'): string {
  return (displayName || fallback).trim().split(/\s+/)[0] || fallback;
}
