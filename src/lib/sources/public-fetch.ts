import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { brotliDecompressSync, gunzipSync, inflateSync } from 'node:zlib';
import { SourceError, assertSource } from './validation';

const MAX_BYTES = 2 * 1024 * 1024;
export interface Address { address: string; family: number }

/** Conservative global-unicast allowlist; special-use and transition space is denied. */
export function publicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 0 || b === 168 || (b === 88 && c === 99))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113));
  }
  if (isIP(address) !== 6) return false;
  const normalized = new URL(`http://[${address}]/`).hostname.slice(1, -1);
  const [first, second] = normalized.split(':').map(part => parseInt(part || '0', 16));
  return first >= 0x2000 && first <= 0x3fff && first !== 0x2002 &&
    !(first === 0x2001 && (second < 0x200 || second === 0xdb8)) &&
    !(first === 0x3fff && second < 0x1000);
}

export function publicUrl(value: unknown): URL {
  assertSource(typeof value === 'string' && value.length <= 2048, 'UNSAFE_URL');
  let url: URL;
  try { url = new URL(value); } catch { throw new SourceError('UNSAFE_URL'); }
  assertSource(['http:', 'https:'].includes(url.protocol) && !url.username && !url.password &&
    !url.port, 'UNSAFE_URL'); // Only default web ports.
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  assertSource(!host.endsWith('.') && !host.includes('%') &&
    (isIP(host) ? publicAddress(host) : host.includes('.') &&
      !['localhost', 'local', 'internal', 'home', 'test', 'invalid'].some(suffix => host.endsWith(`.${suffix}`))), 'UNSAFE_URL');
  url.hash = '';
  return url;
}

function abortable<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new SourceError('SOURCE_TIMEOUT', 504));
    if (signal.aborted) { abort(); return; }
    signal.addEventListener('abort', abort, { once: true });
    work.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}

export function decodeBody(encoded: Buffer, encoding: string): Buffer {
  assertSource(encoded.length <= MAX_BYTES, 'SOURCE_TOO_LARGE', 413);
  let decoded: Buffer;
  try {
    const options = { maxOutputLength: MAX_BYTES };
    if (!encoding || encoding === 'identity') decoded = encoded;
    else if (encoding === 'gzip') decoded = gunzipSync(encoded, options);
    else if (encoding === 'deflate') decoded = inflateSync(encoded, options);
    else if (encoding === 'br') decoded = brotliDecompressSync(encoded, options);
    else throw new SourceError('SOURCE_ENCODING', 415);
  } catch (error) {
    if (error instanceof SourceError) throw error;
    throw new SourceError('SOURCE_DECODE_FAILED', 422);
  }
  assertSource(decoded.length <= MAX_BYTES, 'SOURCE_TOO_LARGE', 413);
  return decoded;
}

export interface Hop { status: number; location?: string; contentType: string; body: Buffer }
/** Exported for injected-transport tests; production callers use fetchPublicText. */
export async function requestPinned(url: URL, address: Address, signal: AbortSignal): Promise<Hop> {
  return new Promise((resolve, reject) => {
    // URL retains the original Host and TLS servername. DNS cannot change the
    // target between validation and connect; no proxy/env dispatcher is used.
    const req = (url.protocol === 'https:' ? httpsRequest : httpRequest)(url, {
      agent: false, signal, family: address.family,
      lookup: (_hostname, _options, callback) => callback(null, address.address, address.family),
      headers: { Accept: 'text/html, text/plain', 'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': 'LessonCaptain-Reader/1.0' },
    }, res => {
      void (async () => {
        const status = res.statusCode ?? 502;
        const contentType = res.headers['content-type'] ?? '';
        if ([301, 302, 303, 307, 308].includes(status)) {
          const location = res.headers.location;
          res.destroy(); resolve({ status, location, contentType, body: Buffer.alloc(0) }); return;
        }
        if (status !== 200) { res.destroy(); throw new SourceError('SOURCE_HTTP_ERROR', 422); }
        const mime = contentType.split(';')[0].trim().toLowerCase();
        if (!['text/html', 'text/plain'].includes(mime)) {
          res.destroy(); throw new SourceError('SOURCE_CONTENT_TYPE', 415);
        }
        const chunks: Buffer[] = []; let size = 0;
        for await (const chunk of res) {
          const bytes = Buffer.from(chunk); size += bytes.length;
          if (size > MAX_BYTES) { res.destroy(); throw new SourceError('SOURCE_TOO_LARGE', 413); }
          chunks.push(bytes);
        }
        resolve({ status, contentType, body: decodeBody(Buffer.concat(chunks), String(res.headers['content-encoding'] ?? '').toLowerCase()) });
      })().catch(reject);
    });
    req.on('error', reject); req.end();
  });
}

export interface FetchDependencies {
  resolve(host: string): Promise<Address[]>;
  hop(url: URL, address: Address, signal: AbortSignal): Promise<Hop>;
}
const defaults: FetchDependencies = { resolve: host => lookup(host, { all: true, verbatim: true }), hop: requestPinned };
export async function fetchPublicText(value: string, deps: FetchDependencies = defaults) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    let url = publicUrl(value);
    for (let redirects = 0; redirects <= 3; redirects++) {
      const host = url.hostname.replace(/^\[|\]$/g, '');
      const addresses = isIP(host) ? [{ address: host, family: isIP(host) }] :
        await abortable(deps.resolve(host), controller.signal);
      assertSource(addresses.length > 0 && addresses.every(item => publicAddress(item.address)), 'UNSAFE_ADDRESS');
      const result = await abortable(deps.hop(url, addresses[0], controller.signal), controller.signal);
      if ([301, 302, 303, 307, 308].includes(result.status)) {
        assertSource(redirects < 3 && result.location, 'SOURCE_REDIRECT_LIMIT', 422);
        url = publicUrl(new URL(result.location, url).href); continue;
      }
      assertSource(result.status === 200, 'SOURCE_HTTP_ERROR', 422);
      const mime = result.contentType.split(';')[0].trim().toLowerCase();
      assertSource(['text/html', 'text/plain'].includes(mime), 'SOURCE_CONTENT_TYPE', 415);
      assertSource(result.body.length <= MAX_BYTES, 'SOURCE_TOO_LARGE', 413);
      const charset = /charset\s*=\s*["']?([^;\s"']+)/i.exec(result.contentType)?.[1];
      assertSource(!charset || /^(utf-8|utf8|us-ascii)$/i.test(charset), 'SOURCE_CHARSET', 415);
      return { finalUrl: url.href, mime, text: new TextDecoder('utf-8', { fatal: true }).decode(result.body) };
    }
    throw new SourceError('SOURCE_REDIRECT_LIMIT', 422);
  } catch (error) {
    if (error instanceof SourceError) throw error;
    throw new SourceError(controller.signal.aborted ? 'SOURCE_TIMEOUT' : 'SOURCE_FETCH_FAILED', 502);
  } finally { clearTimeout(timeout); }
}
