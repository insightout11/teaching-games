import { sourcesAction } from '@/lib/sources/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  return sourcesAction(request,params.sessionId,'read');
}
