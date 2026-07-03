// Curated demo videos for the public /video-lesson page + seed script. These are
// drawn from the existing curated libraries (real, recognizable YouTube IDs). The
// FEATURED_CHIPS always hit cache (warmed by scripts/seed-video-previews.ts), so the
// instant-gratification path on the page costs nothing and never fails.

import kurzgesagt from '@/data/kurzgesagt-library.json';
import vox from '@/data/vox-library.json';
import bbcIdeas from '@/data/bbc-ideas-library.json';
import natgeo from '@/data/natgeo-library.json';
import crashCourse from '@/data/crash-course-library.json';
import bigthink from '@/data/bigthink-library.json';

export interface DemoVideo {
  videoId: string;
  title: string;
  url: string;
  speaker?: string;
  durationSecs?: number;
  topicTags?: string[];
  difficultyLevel?: string;
  description?: string;
  genre?: string;
}

interface LibEntry {
  id: string;
  title: string;
  speaker?: string;
  youtubeId?: string | null;
  durationSecs?: number;
  topicTags?: string[];
  difficultyLevel?: string;
  description?: string;
  genre?: string;
}

function fromLibrary(lib: unknown): DemoVideo[] {
  return (lib as LibEntry[])
    .filter((e): e is LibEntry & { youtubeId: string } => typeof e.youtubeId === 'string' && e.youtubeId.length === 11)
    .map((e) => ({
      videoId: e.youtubeId,
      title: e.title,
      url: `https://www.youtube.com/watch?v=${e.youtubeId}`,
      speaker: e.speaker,
      durationSecs: e.durationSecs,
      topicTags: e.topicTags,
      difficultyLevel: e.difficultyLevel,
      description: e.description,
      genre: e.genre,
    }));
}

/** Full pool to warm in the seed script (~30 recognizable videos). */
export const DEMO_VIDEOS: DemoVideo[] = (() => {
  const all = [
    ...fromLibrary(natgeo),
    ...fromLibrary(vox),
    ...fromLibrary(kurzgesagt),
    ...fromLibrary(bbcIdeas),
    ...fromLibrary(crashCourse),
    ...fromLibrary(bigthink),
  ];
  const seen = new Set<string>();
  return all.filter((v) => (seen.has(v.videoId) ? false : (seen.add(v.videoId), true)));
})();

/**
 * Three one-click chips shown under the input. Hand-picked for recognizability — the
 * quality of this list carries the curated-mode launch. Each must be in DEMO_VIDEOS
 * (warmed by the seed script) so clicking always hits cache.
 */
export const FEATURED_CHIP_IDS = ['ysa5OBhXz-Q', 'kIID5FDi2JQ', 'h6fcK_fRYaI'] as const;

export const FEATURED_CHIPS: DemoVideo[] = FEATURED_CHIP_IDS.map((id) => {
  const found = DEMO_VIDEOS.find((v) => v.videoId === id);
  return found ?? { videoId: id, title: 'Featured video', url: `https://www.youtube.com/watch?v=${id}` };
});
