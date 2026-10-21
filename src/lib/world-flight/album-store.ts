import { createServiceClient } from '@/lib/supabase/service';

/**
 * The Landmark Album (migration 068): photos a class takes of landmarks on its flights. Server only. Works before 068
 * is applied: reads come back empty and saves are skipped, so a lesson never fails because of the album.
 */
type Service = ReturnType<typeof createServiceClient>;
export const ALBUM_BUCKET = 'landmark-album';
const MAX_BYTES = 3 * 1024 * 1024;

export interface AlbumPhoto { id: string; landmarkId: string; takenAt: string; timeOfDay: string; weather: string; fromCity: string; toCity: string; rare: boolean; url: string | null }

/** A rare photo: a landmark seen at dawn, dusk or night, or in snow, a storm or the northern lights. */
export function isRarePhoto(timeOfDay: string, weather: string): boolean {
  return ['dawn', 'dusk', 'night'].includes(timeOfDay) || ['snow', 'storm', 'aurora'].includes(weather);
}

/** Save a photo (a JPEG data URL from the windscreen) to the class album. */
export async function saveLandmarkPhoto(input: { classId: string; sessionId: string; landmarkId: string; timeOfDay: string; weather: string; fromCity: string; toCity: string; image: string }): Promise<{ ok: boolean; rare: boolean }> {
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(input.image);
  if (!m) return { ok: false, rare: false };
  const bytes = Buffer.from(m[1], 'base64');
  if (bytes.length === 0 || bytes.length > MAX_BYTES) return { ok: false, rare: false };
  const service = createServiceClient();
  const path = `${input.classId}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const up = await service.storage.from(ALBUM_BUCKET).upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
  if (up.error) return { ok: false, rare: false };
  const rare = isRarePhoto(input.timeOfDay, input.weather);
  const { error } = await service.from('class_landmark_photos').insert({
    class_id: input.classId, session_id: input.sessionId, landmark_id: input.landmarkId, time_of_day: input.timeOfDay,
    weather: input.weather, from_city: input.fromCity, to_city: input.toCity, image_path: path, rare,
  });
  if (error) { await service.storage.from(ALBUM_BUCKET).remove([path]); return { ok: false, rare: false }; }
  return { ok: true, rare };
}

/** The class album, newest first, with links that last an hour. */
export async function classAlbum(service: Service, classId: string, limit = 60): Promise<AlbumPhoto[]> {
  const { data, error } = await service.from('class_landmark_photos').select('id, landmark_id, taken_at, time_of_day, weather, from_city, to_city, rare, image_path').eq('class_id', classId).order('taken_at', { ascending: false }).limit(limit);
  if (error || !data?.length) return [];
  const rows = data as Array<{ id: string; landmark_id: string; taken_at: string; time_of_day: string; weather: string; from_city: string; to_city: string; rare: boolean; image_path: string }>;
  const signed = await service.storage.from(ALBUM_BUCKET).createSignedUrls(rows.map((r) => r.image_path), 3600);
  const urlOf = new Map((signed.data ?? []).map((s) => [s.path, s.signedUrl]));
  return rows.map((r) => ({ id: r.id, landmarkId: r.landmark_id, takenAt: r.taken_at, timeOfDay: r.time_of_day, weather: r.weather, fromCity: r.from_city, toCity: r.to_city, rare: r.rare, url: urlOf.get(r.image_path) ?? null }));
}
