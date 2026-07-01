# Handoff Brief: Travel Anchors (per-city data layer)

**Owner: Codex** · **Consumer: Claude (Travel Trip arc)** · Drafted 2026-07-01

## Why this exists

The World Flight **Travel** preset is being rebuilt from "one situation, deep" into a **whole-trip speaking arc**, repeated per city:

> Departures → Arrival scene → Getting there → Hotel → **Attraction** → **Local Table** → Landing

The guiding rule for content is **"curate the nouns, generate the language"**: the *named facts a student learns and sees on the shared screen* (real dishes, real landmarks) must be real and correct, because a wrong "traditional dish" shown to a class as fact costs trust. The *language* (dialogue, phrase chips, the waiter's lines, directions, complications) is AI-generated at runtime and is **not** your job.

Your job is the real nouns: a small, curated **`travelAnchors`** block per destination.

## What to build

Add a `travelAnchors` block to each `DestinationPack` in `src/data/world-flight/destinations.ts`, and the supporting types in `src/lib/world-flight/types.ts`.

### The type (add to `src/lib/world-flight/types.ts`)

```ts
export type TravelAnchorReviewStatus = 'draft' | 'researched' | 'verified';

export interface TravelAnchorReview {
  status: TravelAnchorReviewStatus;
  reviewedAt?: string; // ISO date
}

/** A real signature dish of the city. Feeds the Local Table menu board + ordering roleplay. */
export interface TravelDish {
  id: string;          // stable kebab-case, unique within the city (e.g. 'okonomiyaki')
  name: string;        // real local name; include romanization if non-Latin (e.g. 'Monjayaki (もんじゃ焼き)')
  whatItIs: string;    // one plain-English line, ~8–16 words
  note?: string;       // optional: how it's eaten / dietary flag / cultural note
  sourceUrl?: string;  // recommended once status is 'verified'
  review: TravelAnchorReview;
}

/** A real, *visitable* place. Feeds the Attraction Class Board. NOT the same as focusOptions. */
export interface TravelAttraction {
  id: string;          // stable kebab-case, unique within the city (e.g. 'senso-ji')
  name: string;        // real place a traveler would actually go to
  whatItIs: string;    // one plain-English line
  whyVisit?: string;   // optional traveler hook
  sourceUrl?: string;  // recommended once status is 'verified'
  review: TravelAnchorReview;
}

/** How to get from the real airport into the city. Grounds the getting-there roleplay. */
export interface TravelTransportOption {
  mode: string;         // e.g. 'Narita Express', 'Airport taxi', 'BTS Skytrain'
  fromAirport: string;  // must match `primaryAirport` or an entry in `airports`
  approxTimeMin?: number;
  approxCost?: string;  // local + rough USD, e.g. '~¥3,000 (~$20)'
  note?: string;
}

/** An authentic traveler-should-know note. Feeds the weighted "travel moment" deck. */
export interface TravelLocalColorNote {
  id: string;
  text: string;         // one authentic custom / norm / tip, one line
  category?: 'custom' | 'etiquette' | 'money' | 'safety' | 'seasonal' | 'transport';
}

export interface TravelAnchors {
  dishes: TravelDish[];                 // REQUIRED — 3 to 5
  attractions: TravelAttraction[];      // REQUIRED — 3 or more
  transport?: TravelTransportOption[];  // optional — 2 to 3
  localColor?: TravelLocalColorNote[];  // optional — 2 to 3
}
```

Then extend `DestinationPack` (same file's type in `types.ts`):

```ts
export interface DestinationPack {
  // ...existing fields...
  focusOptions: DestinationFocus[];
  travelAnchors?: TravelAnchors; // NEW — optional so unfilled cities still typecheck
}
```

**Keep it optional.** That lets us roll out hero cities first without breaking the other cities' compile. The consumer AI-falls-back when `travelAnchors` is absent.

## Priorities & rollout

1. **Essential fields first, everywhere you touch a city:** `dishes` (3–5) and `attractions` (3+). These block the arc; `transport` and `localColor` do not (I can AI-fallback those).
2. **Hero cities verified first.** Start with the cities you've curated most deeply (e.g. Tokyo, Paris, Rio — whichever set is furthest along), mark them `review.status: 'verified'` with a `sourceUrl`. AI-draft the long tail as `'draft'` and upgrade over time. This mirrors the `review` status pattern you already use on `focusOptions`.

## Quality bar (important)

- **Attractions are *visitable places*, not learning topics.** This is the key distinction from `focusOptions`, which are videos/readings/learning angles. The Attraction board wants "Senso-ji Temple", "Shibuya Crossing" — places a tourist physically goes — *not* "urban history of Tokyo." Treat `attractions` as brand-new data even where a related `focusOption` exists.
- **Dishes must be specific and genuinely local.** "Ramen" for Tokyo, not "noodle soup"; "Ceviche" for Lima, not "seafood." Avoid dishes that are only loosely associated with the city.
- **Everything is real and checkable.** For `'verified'` items, include a `sourceUrl`. Don't invent "traditional" dishes or festivals.
- **One-liners are plain English** at roughly the destination's difficulty — these are read by ESL students.

## Worked example — Tokyo (`tokyo`)

```ts
travelAnchors: {
  dishes: [
    { id: 'sushi', name: 'Edomae Sushi', whatItIs: 'Fresh fish served on small pillows of vinegared rice.', note: 'Eat in one bite; dip fish-side, not rice-side.', review: { status: 'verified' } },
    { id: 'ramen', name: 'Ramen', whatItIs: 'Wheat noodles in a rich hot broth, often with pork.', note: 'Slurping is normal and polite.', review: { status: 'verified' } },
    { id: 'monjayaki', name: 'Monjayaki (もんじゃ焼き)', whatItIs: 'A runny savoury pancake you cook and scrape off a hot griddle.', note: 'A Tokyo specialty from the Tsukishima area.', review: { status: 'verified' } },
    { id: 'taiyaki', name: 'Taiyaki (たい焼き)', whatItIs: 'A fish-shaped cake filled with sweet red bean paste.', review: { status: 'verified' } },
  ],
  attractions: [
    { id: 'senso-ji', name: 'Senso-ji Temple', whatItIs: 'Tokyo\'s oldest temple, reached through a busy market street.', whyVisit: 'Old Tokyo atmosphere and street snacks in Asakusa.', review: { status: 'verified' } },
    { id: 'meiji-jingu', name: 'Meiji Shrine', whatItIs: 'A calm forest shrine in the middle of the city.', whyVisit: 'A quiet break steps from busy Harajuku.', review: { status: 'verified' } },
    { id: 'shibuya-crossing', name: 'Shibuya Crossing', whatItIs: 'The world\'s busiest pedestrian crossing.', whyVisit: 'The iconic wall of people and neon.', review: { status: 'verified' } },
  ],
  transport: [
    { mode: 'Narita Express', fromAirport: 'Narita (NRT)', approxTimeMin: 60, approxCost: '~¥3,000 (~$20)', note: 'Direct to Tokyo/Shinjuku stations.' },
    { mode: 'Airport Limousine Bus', fromAirport: 'Narita (NRT)', approxTimeMin: 90, approxCost: '~¥3,200 (~$21)', note: 'Drops at major hotels.' },
    { mode: 'Tokyo Monorail', fromAirport: 'Haneda (HND)', approxTimeMin: 20, approxCost: '~¥500 (~$3)', note: 'Fastest option from Haneda.' },
  ],
  localColor: [
    { id: 'no-tipping', text: 'Tipping is not expected and can cause confusion.', category: 'money' },
    { id: 'ic-card', text: 'Get a Suica or Pasmo card to tap onto almost all trains and buses.', category: 'transport' },
    { id: 'escalator-left', text: 'In Tokyo, stand on the left of the escalator and let people pass on the right.', category: 'etiquette' },
  ],
},
```

## Validation

Add a catalog validator alongside the existing `src/data/world-flight/destinations.test.ts`, in the style of `validateWorldFlightExpeditionCatalog`. For every city that has `travelAnchors`, assert:
- `dishes.length` is 3–5; `attractions.length >= 3`
- `id`s are unique within each list, kebab-case, non-empty
- every `whatItIs` is non-empty
- every `transport.fromAirport` matches the city's `primaryAirport` or an entry in `airports`
- any item with `review.status: 'verified'` has a `sourceUrl`

## Boundary (so we don't collide)

- **Codex owns:** `travelAnchors` data + the new types in `types.ts` + the validator. You add the field; Claude reads it.
- **Claude owns (do not touch):** `src/lib/flight-plan-presets.ts`, the activities (Character Cards / Scene Igniter / Conversation Rounds), the Class Board attraction stage, the travel-moment deck, the directions game, and `src/lib/world-flight/travel-context.ts` (`buildTravelContext`, which Claude generalizes to a per-stage itinerary that reads `travelAnchors`).
- The only shared surface is the `DestinationPack` type addition — Codex makes it, Claude consumes it read-only.

## The contract in one line

Codex guarantees: **every hero city has ≥3 real verified dishes and ≥3 real verified visitable attractions in `travelAnchors`, typed and validated.** Claude builds everything that turns that into a spoken lesson.
