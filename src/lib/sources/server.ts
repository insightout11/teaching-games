import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { createServiceClient } from '@/lib/supabase/service';
import { assertSource, SourceError } from './validation';
import { discoveryRequest, wrapDiscovery } from './discovery';
import { searchSerper } from './serper';
import { searchSerperMedia } from './serper-media';
import { directUrlRequest } from './direct-url';
import { readSource } from './reader';

function response(body: unknown, status = 200) {
  return NextResponse.json(body,{ status,headers:{ 'Cache-Control':'private, no-store' } });
}
async function body(request: Request) {
  assertSource(request.headers.get('content-type')?.split(';')[0].trim() === 'application/json','JSON_REQUIRED',415);
  const origin = request.headers.get('origin');
  assertSource(!origin || origin === new URL(request.url).origin,'INVALID_ORIGIN',403);
  const reader = request.body?.getReader(); assertSource(reader);
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const next = await reader.read(); if (next.done) break;
      size += next.value.length;
      if (size > 8192) { await reader.cancel(); throw new SourceError('REQUEST_TOO_LARGE',413); }
      chunks.push(next.value);
    }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown; }
  catch { throw new SourceError('INVALID_JSON'); }
}
export async function reserveSearch(teacherId: string) {
  const cap = Number(process.env.LIVE_ROOM_SEARCH_DAILY_CAP ?? 100);
  assertSource(Number.isSafeInteger(cap) && cap >= 0 && cap <= 100000,'SEARCH_CONFIGURATION_INVALID',503);
  const { data,error } = await createServiceClient().rpc('reserve_teacher_source_search',{
    p_teacher_id:teacherId,p_cap:cap,
  });
  if (error) throw new SourceError(error.message === 'SOURCE_LIMIT' ? 'SOURCE_LIMIT' : 'SOURCE_BUDGET_UNAVAILABLE',error.message === 'SOURCE_LIMIT' ? 429 : 503);
  assertSource(Number.isInteger(data) && data >= 1 && data <= cap,'SOURCE_BUDGET_UNAVAILABLE',503);
}
export async function sourcesAction(request: Request, sessionId: string, action: 'search'|'read') {
  try {
    assertSource(process.env.SOURCES_ENABLED === 'true' && process.env.NEXT_PUBLIC_MOCK_MODE !== 'true','SOURCES_DISABLED',503);
    const { teacher,error } = await requireAuth();
    assertSource(teacher && !error,'AUTH_REQUIRED',401);
    assertSource(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId),'INVALID_SESSION');
    assertSource(new URL(request.url).search === '','INVALID_QUERY');
    const owned = await verifyTeacherOwnsSession(sessionId,teacher.id);
    if (owned.error) return response({ error:'SESSION_NOT_ACCESSIBLE' },owned.error.status);
    const input = await body(request);
    if (action === 'read') return response(await readSource(directUrlRequest(input)));
    const query = discoveryRequest(input);
    const key = process.env.SERPER_API_KEY?.trim(); assertSource(key,'SEARCH_UNAVAILABLE',503);
    await reserveSearch(teacher.id);
    if (query.surface === 'places' || query.surface === 'videos') {
      return response(await searchSerperMedia({ ...query,surface:query.surface },key));
    }
    return response(wrapDiscovery(await searchSerper({ query:query.query,page:query.page,tab:query.surface },key)));
  } catch (error) {
    return error instanceof SourceError ? response({ error:error.code },error.status)
      : response({ error:'SOURCE_SERVICE_UNAVAILABLE' },503);
  }
}
