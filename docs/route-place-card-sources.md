# Route-place card sources and editing

The bank contains explicitly authored cards, not position-based questions or
country metadata converted into prose. Source URLs are editorial references;
the app does not fetch them to produce ready cards.

## Rebuild offline

Using the existing project dependencies:

```powershell
pnpm exec tsx --tsconfig tsconfig.json scripts/dev/route-places.ts
pnpm exec tsx --tsconfig tsconfig.json scripts/dev/build-route-place-cards.ts
```

The audit and its selection are unchanged by the content revision. The card
compiler uses only checked-in files and performs no network or AI calls.

## Editable cards

`scripts/dev/data/route-place-editorial.tsv` has one row per card. Its ten columns
are place, card number, A1 headline, B1 headline, A1 detail, B1 detail, A1 questions
as JSON, B1 questions as JSON, photo search, and reference URLs as JSON. Tabs
separate columns; do not put tabs or line breaks inside a field. The first four
cards form A1; all five form B1. Both levels are explicit in the source.

Details begin with information beyond the headline. A1 uses two short sentences
of at most twelve words each;
B1 uses three. Questions concern that card's fact. They invite discussion without
pair work or private answers. Photo searches name the particular subject, such as
Songkran, Yushan, a weaving technique, a river crossing or a named animal.

`scripts/dev/data/route-place-source-data.json` preserves the audit identities,
aliases and ranks. Capital, latitude and population inputs have been removed.
It no longer supplies facts, city-name substitutions or picture defaults.

The builder rejects missing cards, repeated headlines, repeated headline openings,
wrong sentence counts, headline word-limit violations, long A1 sentences,
replacement characters, removed filler patterns, repeated photo searches,
landscape searches, and questions appearing on more than three distinct places.
Questions are compared across both levels after case, punctuation and whitespace
normalisation. Reusing the same question at both levels of one place counts once.
The compiler never repairs invalid editorial content by inventing text.

## References

Each card's references are preserved in the TSV; the runtime entry combines its
cards' source URLs. Original sentences paraphrase checkable geographic, historic,
cultural and natural-history facts. References include Wikipedia articles and
primary sources such as UNESCO, museums, conservation organisations, FAO and
JAMSTEC. No article prose or third-party photos are bundled.

Examples of primary references are [UNESCO's royal drumming entry](https://ich.unesco.org/en/RL/ritual-dance-of-the-royal-drum-00989),
[the Slovene Ethnographic Museum's beehive panel](https://www.etno-muzej.si/en/sem-z-zgodbami-predmetov/painted-beehive-panel),
[JAMSTEC's Kairei vent observations](https://www.jamstec.go.jp/shinkai6500/25th/history/2002.html)
and [FAO's Gambian oyster account](https://www.fao.org/fish4acp/where-we-work/gambia/en).

Questions may be shared by up to three places when the very same fact genuinely
applies to them, such as a shared mountain range or regional craft. Changing a
place name to disguise a repeated generic question is not an editorial method.

## Scope and limits

The source outline labels include territories and disputed areas; they do not
establish sovereignty. No current capital or population claims are derived from
metadata. Cordillera Oriental and Cordillera Occidental remain outside this
strict title-only bank because each bare name identifies multiple ranges.

Search phrases use the existing free photo service and its existing child-content
filter. Search results can change or be unavailable. The phrases identify specific
subjects, but this is not a manually inspected collection of image files.
No change automatically displays a photo or changes protected room or flight code.

The completion report lists checks, omissions and five full examples at both
levels. No claim is made about performance in a real class.
