# Handoff Brief: Travel Transport Anchors (per-city)

**Owner: Codex** · **Consumer: Claude (Travel "Getting There" stage)** · Drafted 2026-07-04

## Context

Follow-up to `docs/travel-trip-anchors-codex-brief.md`. You already shipped `travelAnchors` with `dishes` and `attractions` for all 50 cities — thank you, that data is great. But the two **optional** fields were left empty, and the Travel arc's **Getting There** stage needs one of them:

- **`transport`** — how a traveller gets from the city's real airport into the city. This is now **required content**, not optional. The stage currently falls back to generic "train, taxi, bus" text with no real options, which reads as empty and city-less.

(You can skip `localColor` for now — nothing consumes it yet.)

## What to build

Populate the **`transport`** array on each city's entry in `TRAVEL_ANCHORS_BY_DESTINATION` (in `src/data/world-flight/destinations.ts`). The type already exists in `src/lib/world-flight/types.ts` — no type changes needed:

```ts
export interface TravelTransportOption {
  mode: string;         // e.g. 'Airport Express Bus', 'Luas tram', 'Airport taxi'
  fromAirport: string;  // must match `primaryAirport` or an entry in `airports`
  approxTimeMin?: number;
  approxCost?: string;  // local + rough USD, e.g. '€8 (~$9)'
  note?: string;        // one short line — where it goes / when to use it
}
```

Add **2–3 real options per city**, covering the realistic main ways in (a public option + a taxi/rideshare at minimum). These are shown to students as choices to weigh (time vs cost) before a ticket/taxi roleplay, so accuracy matters — real line names, realistic times/costs.

## Quality bar

- **Real, named services.** "Luas" / "Airport Express 747" / "Narita Express" — not "the tram."
- **From the real airport.** `fromAirport` must match the city's `primaryAirport` (or an `airports` entry). Multi-airport cities can note which.
- **Realistic time + cost.** Rough is fine; local currency + a rough USD in parens.
- **Plain English notes** at roughly the destination's difficulty (ESL students read these).

## Worked examples

```ts
// dublin — primaryAirport 'Dublin (DUB)'
transport: [
  { mode: 'Airlink Express 747 bus', fromAirport: 'Dublin (DUB)', approxTimeMin: 40, approxCost: '€8 (~$9)', note: 'Direct to the city centre and O\'Connell Street.' },
  { mode: 'Aircoach', fromAirport: 'Dublin (DUB)', approxTimeMin: 45, approxCost: '€9 (~$10)', note: 'Coach to central and southside stops.' },
  { mode: 'Airport taxi', fromAirport: 'Dublin (DUB)', approxTimeMin: 30, approxCost: '€30 (~$33)', note: 'Fastest door-to-door; metered.' },
],

// tokyo — primaryAirport 'Narita (NRT)' (+ Haneda in airports)
transport: [
  { mode: 'Narita Express', fromAirport: 'Narita (NRT)', approxTimeMin: 60, approxCost: '¥3,000 (~$20)', note: 'Direct train to Tokyo & Shinjuku stations.' },
  { mode: 'Airport Limousine Bus', fromAirport: 'Narita (NRT)', approxTimeMin: 90, approxCost: '¥3,200 (~$21)', note: 'Drops at major hotels.' },
  { mode: 'Tokyo Monorail', fromAirport: 'Haneda (HND)', approxTimeMin: 20, approxCost: '¥500 (~$3)', note: 'Fastest option from Haneda.' },
],
```

## Validation & boundary

- Extend the existing `travelAnchors` validator in `src/data/world-flight/destinations.test.ts`: every city with `travelAnchors` should now have `transport.length >= 2`, and every `transport.fromAirport` must match the city's `primaryAirport` or an `airports` entry.
- **Codex owns** the data + validator. **Claude owns** the Getting There stage UI that consumes it (a transport chooser → ticket/taxi roleplay) — Claude reads `travelAnchors.transport` read-only.

## The contract in one line

Every city gets **2–3 real, named transport options from its real airport, with realistic time + cost**, validated. Claude builds the chooser UI on top.
