import { describe, expect, it, vi } from 'vitest';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { decodeBody, fetchPublicText, publicAddress, publicUrl, type FetchDependencies } from '@/lib/sources/public-fetch';

const ok = { status: 200, contentType: 'text/html; charset=utf-8', body: Buffer.from('<p>Hello</p>') };

const dependencies = (): FetchDependencies => ({
  resolve: vi.fn(async () => [{ address: '93.184.216.34', family: 4 }]), hop: vi.fn(async () => ok),
});
describe('source fetch boundary', () => {
  it.each(['127.0.0.1', '10.2.3.4', '169.254.169.254', '172.31.2.3', '192.168.1.1', '0.0.0.0',
    '100.64.0.1', '198.19.1.1', '224.0.0.1', '192.0.2.1', '198.51.100.2', '203.0.113.1',
    '::1', '::', 'fc00::1', 'fe80::1', '::ffff:127.0.0.1', '::ffff:8.8.8.8', '64:ff9b::808:808',
    '2001:db8::1', '2002:0808:0808::1', '2001::1', '3fff::1'])('rejects special-use address %s', value => {
      expect(publicAddress(value)).toBe(false);
    });
  it.each(['8.8.8.8', '93.184.216.34', '2606:4700:4700::1111'])('allows global unicast %s', value => {
    expect(publicAddress(value)).toBe(true);
  });
  it.each(['file:///etc/passwd', 'http://localhost', 'http://metadata.internal/a', 'http://a.local',
    'http://user:pass@example.com', 'https://example.com:444/', 'http://2130706433',
    'http://0x7f000001', 'http://127.1', 'http://[::ffff:127.0.0.1]', 'http://example.com./'])('rejects unsafe URL %s', value => {
      expect(() => publicUrl(value)).toThrow();
    });
  it('rejects mixed public/private DNS answers before connecting', async () => {
    const deps = dependencies();
    deps.resolve = vi.fn(async () => [
      { address: '8.8.8.8', family: 4 }, { address: '127.0.0.1', family: 4 },
    ]);
    await expect(fetchPublicText('https://example.com', deps)).rejects.toThrow('UNSAFE_ADDRESS');
    expect(deps.hop).not.toHaveBeenCalled();
  });
  it('passes the validated address to the connector and keeps the original hostname', async () => {
    const deps = dependencies();
    await fetchPublicText('https://example.com/path', deps);
    expect(deps.hop).toHaveBeenCalledWith(new URL('https://example.com/path'), { address: '93.184.216.34', family: 4 }, expect.any(AbortSignal));
    expect(deps.resolve).toHaveBeenCalledTimes(1);
  });
  it('revalidates redirect DNS and refuses a private destination', async () => {
    const deps = dependencies();
    deps.resolve = vi.fn().mockResolvedValueOnce([{ address: '8.8.8.8', family: 4 }]).mockResolvedValueOnce([{ address: '10.0.0.1', family: 4 }]);
    deps.hop = vi.fn(async () => ({ ...ok, status: 302, location: 'https://redirect.example.com/path' }));
    await expect(fetchPublicText('https://example.com', deps)).rejects.toThrow('UNSAFE_ADDRESS');
    expect(deps.hop).toHaveBeenCalledTimes(1);
  });
  it('rejects private literal redirects without another connection', async () => {
    const deps = dependencies();
    deps.hop = vi.fn(async () => ({ ...ok, status: 302, location: 'http://169.254.169.254/' }));
    await expect(fetchPublicText('https://example.com', deps)).rejects.toThrow('UNSAFE_URL');
    expect(deps.hop).toHaveBeenCalledTimes(1);
  });
  it('limits redirects to three', async () => {
    const deps = dependencies();
    deps.hop = vi.fn(async () => ({ ...ok, status: 302, location: '/again' }));
    await expect(fetchPublicText('https://example.com', deps)).rejects.toThrow('SOURCE_REDIRECT_LIMIT');
    expect(deps.hop).toHaveBeenCalledTimes(4);
  });
  it('bounds the entire DNS wait', async () => {
    vi.useFakeTimers();
    try {
      const deps = dependencies();
      deps.resolve = () => new Promise(() => { });
      const assertion = expect(fetchPublicText('https://example.com', deps)).rejects.toThrow('SOURCE_TIMEOUT');
      await vi.advanceTimersByTimeAsync(10000);
      await assertion;
      expect(deps.hop).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
  it.each(['image/svg+xml', 'application/pdf', 'application/json'])('rejects non-reader MIME %s', async (contentType) => {
    const deps = dependencies();
    deps.hop = async () => ({ ...ok, contentType });
    await expect(fetchPublicText('https://example.com', deps)).rejects.toThrow('SOURCE_CONTENT_TYPE');
  });
  it('bounds compressed and expanded bytes', () => {
    const bomb = gzipSync(Buffer.alloc(2 * 1024 * 1024 + 1, 65));
    expect(() => decodeBody(bomb, 'gzip')).toThrow('SOURCE_DECODE_FAILED');
    expect(() => decodeBody(Buffer.alloc(2 * 1024 * 1024 + 1), '')).toThrow('SOURCE_TOO_LARGE');
    expect(decodeBody(brotliCompressSync(Buffer.from('hello')), 'br').toString()).toBe('hello');
    expect(() => decodeBody(Buffer.from('bad'), 'gzip')).toThrow();
  });
});
