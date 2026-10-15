import { createServiceClient } from '@/lib/supabase/service';
import { postcardSouvenir, souvenirsForLanding, type Souvenir } from '@/lib/world-flight/souvenirs';

/**
 * Reading and saving a class's souvenirs and postcards (migration 065). Server only. Every function tolerates the
 * tables not existing yet (before 065 is applied): reads come back empty and saves are skipped, so ending a class
 * never fails because of souvenirs.
 */
type Service = ReturnType<typeof createServiceClient>;

export interface OwnedSouvenir { souvenirId: string; destinationId: string; sessionId: string | null; earnedAt: string }
export interface ClassPostcard { id: string; destinationId: string; prompt: string; message: string; createdAt: string }

export async function ownedSouvenirs(service: Service, classId: string): Promise<OwnedSouvenir[]> {
  const { data, error } = await service.from('class_souvenirs').select('souvenir_id, destination_id, session_id, earned_at').eq('class_id', classId);
  if (error) return [];
  return ((data ?? []) as Array<{ souvenir_id: string; destination_id: string; session_id: string | null; earned_at: string }>)
    .map((r) => ({ souvenirId: r.souvenir_id, destinationId: r.destination_id, sessionId: r.session_id, earnedAt: r.earned_at }));
}

export async function classPostcards(service: Service, classId: string): Promise<ClassPostcard[]> {
  const { data, error } = await service.from('class_postcards').select('id, destination_id, prompt, message, created_at').eq('class_id', classId).order('created_at', { ascending: false }).limit(60);
  if (error) return [];
  return ((data ?? []) as Array<{ id: string; destination_id: string; prompt: string; message: string; created_at: string }>)
    .map((r) => ({ id: r.id, destinationId: r.destination_id, prompt: r.prompt, message: r.message, createdAt: r.created_at }));
}

/** Was this lesson's landing the class's first in that city? (Any earlier completed leg there means a return visit.) */
export async function isFirstLanding(service: Service, classId: string, destinationId: string, sessionId: string): Promise<boolean> {
  const { data } = await service.from('class_world_flight_legs').select('session_id').eq('class_id', classId).eq('destination_id', destinationId).eq('status', 'completed');
  return !((data ?? []) as Array<{ session_id: string }>).some((l) => l.session_id !== sessionId);
}

/** At the end of a lesson that landed in a city: save the souvenirs the landing earned. Returns what was new. */
export async function awardLandingSouvenirs(classId: string, sessionId: string): Promise<Souvenir[]> {
  const service = createServiceClient();
  const { data: leg } = await service.from('class_world_flight_legs').select('destination_id, status, moves_class').eq('session_id', sessionId).maybeSingle();
  const row = leg as { destination_id: string; status: string; moves_class: boolean | null } | null;
  // Only a landing earns souvenirs (a far city's lesson taught without flying does not).
  if (!row || row.status !== 'completed' || row.moves_class === false) return [];
  const owned = new Set((await ownedSouvenirs(service, classId)).map((s) => s.souvenirId));
  const firstLanding = await isFirstLanding(service, classId, row.destination_id, sessionId);
  const earned = souvenirsForLanding({ destinationId: row.destination_id, sessionId, firstLanding, owned });
  if (earned.length === 0) return [];
  const { error } = await service.from('class_souvenirs').upsert(
    earned.map((s) => ({ class_id: classId, souvenir_id: s.id, destination_id: row.destination_id, session_id: sessionId })),
    { onConflict: 'class_id,souvenir_id', ignoreDuplicates: true },
  );
  return error ? [] : earned;
}

/** Save the class postcard from a city, and the souvenir that writing it earns. */
export async function savePostcard(classId: string, sessionId: string, destinationId: string, prompt: string, message: string): Promise<{ ok: boolean; souvenir: Souvenir | null }> {
  const service = createServiceClient();
  const { error } = await service.from('class_postcards').insert({ class_id: classId, session_id: sessionId, destination_id: destinationId, prompt, message });
  if (error) return { ok: false, souvenir: null };
  const souvenir = postcardSouvenir(destinationId);
  if (souvenir) {
    await service.from('class_souvenirs').upsert(
      { class_id: classId, souvenir_id: souvenir.id, destination_id: destinationId, session_id: sessionId },
      { onConflict: 'class_id,souvenir_id', ignoreDuplicates: true },
    );
  }
  return { ok: true, souvenir };
}
