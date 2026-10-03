import type { DestinationAnnouncement, DestinationPack } from '@/lib/world-flight/types';
import type { RadioCheckContent } from '../types';

// Travel v2 listening break: the city's real airport-train/metro announcement, read by the
// synthetic voice and played on the Radio Check engine. Deterministic, so it always works. The
// script carries traps: a second platform (a cancelled train) and the station you're standing in.

function shiftTime(time: string, minutes: number): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m) return time;
  const total = (Number(m[1]) * 60 + Number(m[2]) + minutes + 24 * 60) % (24 * 60);
  const h = Math.floor(total / 60);
  const mm = total % 60;
  return `${h < 10 ? '0' : ''}${h}:${mm < 10 ? '0' : ''}${mm}`;
}

function shiftPlatform(p: string, by: number): string {
  const n = Number(p);
  if (Number.isFinite(n)) return String(Math.max(1, n + by));
  // Letter platforms (A, B, C…): neighbouring letters.
  const code = p.toUpperCase().charCodeAt(0) - 65;
  return /^[A-Za-z]$/.test(p) ? String.fromCharCode(65 + Math.abs(code + by)) : p;
}

/** First n distinct values, in order. */
function distinct(values: string[], n: number): string[] {
  const out: string[] = [];
  values.forEach((v) => { if (out.length < n && out.indexOf(v) < 0) out.push(v); });
  return out;
}

/** Stable order so the right answer isn't always first. */
function rotate<T>(items: T[], seed: number): { options: T[]; correctIndex: number } {
  const k = seed % items.length;
  const options = items.slice(k).concat(items.slice(0, k));
  return { options, correctIndex: (items.length - k) % items.length };
}

export function buildTripAnnouncementContent(destination: DestinationPack): RadioCheckContent {
  return buildAnnouncementFor(destination.city, destination.announcement ?? genericAnnouncement(destination.city));
}

/** For a city without announcement data (or a launch without the trip pack). */
export function genericAnnouncement(city: string): DestinationAnnouncement {
  return { place: `${city} Airport station`, line: 'Airport Express', destination: `${city} Central`, platform: '3', time: '10:45' };
}

export function buildAnnouncementFor(city: string, a: DestinationAnnouncement): RadioCheckContent {
  const seed = city.length + a.platform.length;
  const trapPlatform = shiftPlatform(a.platform, 2);
  const script = [
    `Attention please. This is an announcement for passengers at ${a.place}.`,
    `The ${a.line} to ${a.destination} will depart from platform ${a.platform} at ${a.time}.`,
    `The earlier service from platform ${trapPlatform} has been cancelled.`,
    `Once again: the ${a.line} to ${a.destination}, platform ${a.platform}, departing at ${a.time}. Thank you.`,
  ].join(' ');
  const keyLine = `The ${a.line} to ${a.destination} will depart from platform ${a.platform} at ${a.time}.`;

  const platformQ = rotate(distinct([a.platform, trapPlatform, shiftPlatform(a.platform, 1), shiftPlatform(a.platform, -1), shiftPlatform(a.platform, 3), shiftPlatform(a.platform, 4), '7', '12'], 4), seed);
  const timeQ = rotate([a.time, shiftTime(a.time, 15), shiftTime(a.time, -30), shiftTime(a.time, 60)], seed + 1);
  const destQ = rotate([a.destination, a.place, 'the city centre', 'the main bus station'].filter((x, i, arr) => arr.indexOf(x) === i), seed + 2);

  return {
    activityKey: 'trip-announcement',
    topicContext: city,
    title: `Announcement at ${a.place}`,
    mode: 'voice',
    inputKey: 'trip-announcement',
    brand: {
      label: 'Announcement',
      heading: `Your train into ${city}`,
      intro: `You're at ${a.place}. Listen to the announcement and catch the details on your phone: the platform, the time and where the train goes. Ask to hear it again!`,
    },
    segments: [
      { question: 'Which platform does your train leave from?', ...platformQ, keyLine, script },
      { question: 'What time does it leave?', ...timeQ, keyLine, script },
      { question: 'Where is the train going?', ...destQ, keyLine, script },
    ],
  };
}
