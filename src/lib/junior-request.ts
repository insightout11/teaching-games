import { JUNIOR_HEADER } from '@/lib/junior';

/**
 * SERVER ONLY. True when the request being handled comes from a Junior class's lesson screen (it sends
 * JUNIOR_HEADER on every call to the app's API). Outside a request (tests, scripts) there are no headers to read,
 * and the answer is no.
 */
export async function isJuniorRequest(): Promise<boolean> {
  try {
    const { headers } = await import('next/headers');
    return headers().get(JUNIOR_HEADER) === '1';
  } catch {
    return false;
  }
}
