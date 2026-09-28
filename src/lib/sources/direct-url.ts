import { object, assertSource } from './validation';
import { publicUrl } from './public-fetch';
/** Direct URLs use the same protected reader as search results. No room/capture state. */

export function directUrlRequest(raw: unknown): string {
  object(raw);
  assertSource(Object.keys(raw).length === 1 && typeof raw.url === 'string', 'INVALID_REQUEST');
  return publicUrl(raw.url.trim()).href;
}
