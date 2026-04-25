// scripts/check-transcripts.ts
// Verify YouTube transcript availability before adding IDs to the library.
//
// Usage:
//   npx tsx scripts/check-transcripts.ts --ids "id1,id2,id3"
//   npx tsx scripts/check-transcripts.ts --file candidate-ids.txt  (one ID per line)

import * as fs from 'fs';
import * as path from 'path';
import { YoutubeTranscript } from 'youtube-transcript';

// ── Load .env.local ────────────────────────────────────────────────────────────
(function loadEnvLocal() {
  const envFile = path.join(path.resolve('.'), '.env.local');
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    const raw = t.slice(eq + 1).trim();
    const val = raw.replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
})();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkId(videoId: string): Promise<{ ok: boolean; segments?: number; lang?: string; error?: string }> {
  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId);
    const plainText = segments.map((s) => s.text).join(' ').trim();
    if (!plainText) return { ok: false, error: 'Empty transcript' };
    const lang = (segments[0] as { lang?: string })?.lang ?? 'en';
    return { ok: true, segments: segments.length, lang };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

async function main() {
  const args = process.argv.slice(2);
  let ids: string[] = [];

  const idsFlag = args.indexOf('--ids');
  const fileFlag = args.indexOf('--file');

  if (idsFlag !== -1 && args[idsFlag + 1]) {
    ids = args[idsFlag + 1].split(',').map((s) => s.trim()).filter(Boolean);
  } else if (fileFlag !== -1 && args[fileFlag + 1]) {
    const filePath = path.resolve(args[fileFlag + 1]);
    ids = fs.readFileSync(filePath, 'utf-8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
  } else {
    console.error('Usage: npx tsx scripts/check-transcripts.ts --ids "id1,id2" | --file ids.txt');
    process.exit(1);
  }

  if (ids.length === 0) {
    console.log('No IDs provided.');
    process.exit(0);
  }

  console.log(`\nChecking ${ids.length} YouTube ID(s)...\n`);

  const results = { ok: 0, fail: 0 };

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    process.stdout.write(`[${i + 1}/${ids.length}] ${id.padEnd(12)} `);
    const result = await checkId(id);
    if (result.ok) {
      console.log(`✓  ${result.segments} segments  lang:${result.lang}`);
      results.ok++;
    } else {
      console.log(`✗  ${result.error}`);
      results.fail++;
    }
    if (i < ids.length - 1) await sleep(1000);
  }

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Available: ${results.ok}  Unavailable: ${results.fail}`);
  console.log(`${'─'.repeat(40)}\n`);

  if (results.fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
