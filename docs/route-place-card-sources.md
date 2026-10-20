# Route-place card sources

These are original classroom sentences, prepared on 20 October 2026. Each entry in
`scripts/dev/data/route-place-source-data.json` carries its reference URLs, actual
app label, aliases and audit rank. The checked runtime file also carries source
URLs. These URLs are attribution, not runtime downloads.

## Reproduce

Using the project's existing dependencies (no installation):

```powershell
pnpm exec tsx --tsconfig tsconfig.json scripts/dev/route-places.ts
pnpm exec tsx --tsconfig tsconfig.json scripts/dev/build-route-place-cards.ts
```

The first command runs the app's geographic helpers against its bundled country
outlines. It produces the ranked Markdown and machine-readable selection. The
second is entirely offline: it combines the checked source metadata with the
original three-part editorial sentences in `scripts/dev/data/route-place-editorial.tsv`.
Each line is a place, a tab, then cards separated by `~`; within a card, `^`
separates the headline, short extension and B1 extension. No generative service
is involved in either command.

The runtime bank has only A1 and B1. A1 has four two-sentence cards. B1 has five
three-sentence cards. Country records use location, a named city, a dated
population estimate and two editorial facts; A1 leaves the population card out.
Other places have five editorial cards and A1 takes the first four. Short
questions invite individual students to speak; there is no answer key or pair work.

## References and limitations

- [Natural Earth 1:110m admin-0 countries, v5.1.2](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_110m_admin_0_countries.geojson)
  provides continent, subregion, `POP_EST` and `POP_YEAR`. Natural Earth data are
  [public domain](https://www.naturalearthdata.com/about/terms-of-use/).
  Population cards explicitly state the estimate's original year, rounded to
  the nearest 100,000 above one million or nearest 1,000 below it. These are not
  current population claims. The checked recipe preserves the original values.
- [World Bank country metadata](https://api.worldbank.org/v2/country?format=json&per_page=400)
  supplies named cities and approximate latitude, rounded to a whole degree.
  [World Bank data terms](https://www.worldbank.org/en/about/legal/terms-of-use-for-datasets)
  generally use CC BY 4.0. Its capital field is treated as a city name, not proof
  of current capital status. Stale capital designations were not copied into cards.
- Each place's linked Wikipedia article supplies geographic and historical
  references for the original editorial sentences. No article prose is bundled.
  The source table is an editorial snapshot, not an automatically refreshed feed.
  Broad labels use the correct geographic references: the North American Central
  Lowlands, Ligurian Apennines, southern China, Scandinavian forest, and Dubai's
  Palm Islands, rather than guessing from similarly named pages.

The outline source includes territories and disputed areas as well as countries.
Its labels do not establish sovereignty. Cards for disputed areas focus on
physical geography and cities and make no recognition or capital claims.

The bare labels Cordillera Oriental and Cordillera Occidental identify multiple
different ranges in the app's own source polygons. They are deliberately omitted
from this title-only bank; existing context-sensitive lookup remains available.
All other selected app spellings, including abbreviated or legacy outline names
and Bogota/Bogotá, are explicit aliases. Runtime matching does not invent aliases
by dropping punctuation, accents or word endings.

Photo phrases name the place, qualify destination cities by country, and avoid
quiz answers. They use the existing free picture lookup and its existing
child-content filter. Search results and availability can change; these phrases
are not a curated, permanently guaranteed collection of image files. No image
is bundled or automatically shown by this change.

Uncertain capital, population, recognition and ambiguous-range claims omitted
during preparation are listed in the task's completion report. Card wording
and the automatic checks have not been tested in a real class.
