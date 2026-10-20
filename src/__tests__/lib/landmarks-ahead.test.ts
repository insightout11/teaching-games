import { describe, expect, it } from 'vitest';
import { landmarksAhead } from '@/lib/live-room/landmarks-ahead';

describe('landmarks ahead of the plane', () => {
  it('sees Fuji ahead and to the side when flying towards it', () => {
    // 60 km south-east of Fuji, flying north-west (heading 315)
    const seen = landmarksAhead({ lat: 34.98, lng: 139.2 }, 315);
    const fuji = seen.find((l) => l.id === 'fuji');
    expect(fuji).toBeDefined();
    expect(fuji!.ahead).toBeGreaterThan(30);
    expect(Math.abs(fuji!.lateral)).toBeLessThan(fuji!.ahead);
  });

  it('does not see Fuji when flying away from it', () => {
    expect(landmarksAhead({ lat: 34.98, lng: 139.2 }, 135).some((l) => l.id === 'fuji')).toBe(false);
  });

  it('only includes landmarks that are drawn', () => {
    // over Agra: the Taj Mahal is a building, not drawn in the scenery yet
    expect(landmarksAhead({ lat: 26.7, lng: 78.04 }, 0).some((l) => l.id === 'taj-mahal')).toBe(false);
  });

  it('puts a landmark on the right with a positive side distance', () => {
    // flying north, Fuji to the north-east
    const fuji = landmarksAhead({ lat: 34.9, lng: 138.55 }, 0).find((l) => l.id === 'fuji');
    expect(fuji?.lateral).toBeGreaterThan(0);
  });
});
