import { describe, expect, it } from 'vitest';
import {
  DESTINATION_FACTS,
  getDestinationFacts,
  getLanguageHintForCountry,
} from './destination-facts';

const PRIORITY_POPULATION_FACTS = [
  'rio-de-janeiro',
  'panama-city',
  'bangkok',
  'tokyo',
  'london',
  'paris',
  'new-york',
  'cairo',
  'singapore',
];

describe('destination facts', () => {
  it('keeps priority destination population facts source-linked', () => {
    for (const destinationId of PRIORITY_POPULATION_FACTS) {
      const factSheet = getDestinationFacts(destinationId);

      expect(factSheet?.population?.value).toMatch(/M$/);
      expect(factSheet?.population?.year).toMatch(/\d{4}|June 2025/);
      expect(factSheet?.population?.name).toBeTruthy();
      expect(factSheet?.population?.url).toMatch(/^https?:\/\//);
    }
  });

  it('keeps priority destination briefing facts complete', () => {
    for (const destinationId of PRIORITY_POPULATION_FACTS) {
      const factSheet = getDestinationFacts(destinationId);

      expect(factSheet?.population).toBeTruthy();
      expect(factSheet?.language).toBeTruthy();
      expect(factSheet?.currency).toBeTruthy();
      expect(factSheet?.timeZone).toBeTruthy();
      expect(factSheet?.foodCulture?.length).toBeGreaterThanOrEqual(3);
      expect(factSheet?.knownFor?.length).toBeGreaterThanOrEqual(3);
      expect(factSheet?.prompt).toBeTruthy();
    }
  });

  it('keeps every source URL web-addressable', () => {
    for (const factSheet of Object.values(DESTINATION_FACTS)) {
      const sources = [
        factSheet.population,
        ...(factSheet.sources ?? []),
      ].filter(Boolean);

      for (const source of sources) {
        expect(source?.url).toMatch(/^https?:\/\//);
      }
    }
  });

  it('falls back to country language hints when a city has no fact sheet', () => {
    expect(getLanguageHintForCountry('Brazil')).toBe('Portuguese');
    expect(getLanguageHintForCountry('Unknownland')).toContain('Local and regional languages');
  });

  it('adds classroom-friendly cultural hooks for seeded destinations', () => {
    expect(getDestinationFacts('rio-de-janeiro')?.foodCulture).toContain('Feijoada');
    expect(getDestinationFacts('panama-city')?.knownFor).toContain('Panama Canal');
    expect(getDestinationFacts('delhi')?.prompt).toContain('regions and languages');
  });
});
