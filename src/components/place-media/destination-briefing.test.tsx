import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getDestinationById, WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { DestinationBriefing, getBriefingMedia } from './destination-briefing';

const WORLD_FLIGHT_DESTINATION_IDS = WORLD_DESTINATIONS.map((destination) => destination.id);

describe('DestinationBriefing', () => {
  it('does not use video thumbnails in the place image carousel', () => {
    const rio = getDestinationById('rio-de-janeiro');
    expect(rio).toBeTruthy();

    const media = getBriefingMedia(rio!);

    expect(media.length).toBeGreaterThanOrEqual(4);
    expect(media[0]?.title).toBe('Rio de Janeiro arrival view');
    expect(media.map((asset) => asset.title)).toEqual(
      expect.arrayContaining([
        'Christ the Redeemer',
        'Copacabana Beach',
        'Tijuca Forest Waterfall',
      ])
    );
    expect(media.some((asset) => asset.url?.includes('i.ytimg.com'))).toBe(false);
    expect(media.some((asset) => asset.sourceUrl.includes('youtube.com'))).toBe(false);
    expect(media.some((asset) => asset.title.includes('Carnival Explained'))).toBe(false);
  });

  it('gives priority destination briefings a multi-image gallery', () => {
    for (const destinationId of WORLD_FLIGHT_DESTINATION_IDS) {
      const destination = getDestinationById(destinationId);
      expect(destination).toBeTruthy();

      const media = getBriefingMedia(destination!);

      expect(media.length, destinationId).toBeGreaterThanOrEqual(4);
      expect(media[0]?.title, destinationId).toContain('arrival view');
      expect(media.some((asset) => asset.url?.includes('i.ytimg.com')), destinationId).toBe(false);
      expect(media.some((asset) => asset.sourceUrl.includes('youtube.com')), destinationId).toBe(false);
    }
  });

  it('renders the compact fact briefing without the redundant lesson lens block', () => {
    const rio = getDestinationById('rio-de-janeiro');
    expect(rio).toBeTruthy();

    const html = renderToStaticMarkup(
      <DestinationBriefing destination={rio!} onClose={() => {}} continueLabel="Continue to Character Cards" />
    );

    expect(html).toContain('Destination Briefing');
    expect(html).toContain('6.77M');
    expect(html).toContain('Food + Culture');
    expect(html).toContain('City setting');
    expect(html).toContain('object-contain');
    expect(html).toContain('Enlarge destination image');
    expect(html).not.toContain('absolute bottom-3');
    expect(html).toContain('Class Question');
    expect(html).not.toContain('Arrival profile');
    expect(html).not.toContain('Lesson Lens');
  });
});
