import { describe, expect, it } from 'vitest';
import http from 'node:http';
import https from 'node:https';
import { extractArticle } from '@/lib/sources/extractor';
import { readSource } from '@/lib/sources/reader';
const paragraph = 'Mount Fuji is a mountain in Japan. Teachers can use this selected passage to discuss geography, travel, and how people describe natural places. ';
const html = `<html><head><title>Fuji lesson</title><meta property="og:site_name" content="Synthetic Publisher">
<meta property="article:published_time" content="2026-09-01T10:00:00Z"></head>
<body><article><h1>Fuji lesson</h1>${Array(8).fill(`<p>${paragraph}</p>`).join('')}</article></body></html>`;
describe('real installed article parser', () => {
  it('extracts plain text and supplied metadata through the production reader adapter', async () => {
    const result = await readSource('https://example.com/article', async () => ({ finalUrl: 'https://example.com/article', mime: 'text/html', text: html }));
    expect(result.status).toBe('extracted'); expect(result.text).toContain(paragraph.trim());
    expect(result.text).not.toContain('<p>'); expect(result.publishedAt).toBe('2026-09-01T10:00:00.000Z');
    expect(result.publisher).toBe('Synthetic Publisher');
  });
  it('does not execute scripts or load scripts, frames, styles and images', async () => {
    const originalHttp = http.request, originalHttps = https.request;
    let requests = 0;
    const deny = () => { requests++; throw new Error('Unexpected parser network call'); };
    http.request = deny as typeof http.request; https.request = deny as typeof https.request;
    try {
      const hostile = html.replace('<body>', `<body>
        <script>document.querySelector('article').textContent='SCRIPT_RAN';</script>
        <script src="http://127.0.0.1/script"></script><iframe src="http://127.0.0.1/frame"></iframe>
        <link rel="stylesheet" href="http://127.0.0.1/style"><img src="http://127.0.0.1/image">`);
      const result = await extractArticle(hostile, 'https://example.com/article');
      expect(result?.text).toContain(paragraph.trim()); expect(result?.text).not.toContain('SCRIPT_RAN');
      expect(requests).toBe(0);
    } finally { http.request = originalHttp; https.request = originalHttps; }
  });
  it('rejects excessive DOM density before parsing', async () => {
    await expect(extractArticle('<i>'.repeat(20_001), 'https://example.com')).rejects.toThrow('SOURCE_TOO_COMPLEX');
  });
  it('returns no article for an empty app shell', async () => {
    expect(await extractArticle('<html><body><div id="app"></div><script>run()</script></body></html>', 'https://example.com')).toBeNull();
  });
});
