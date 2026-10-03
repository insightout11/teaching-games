/** Rate-limited, resumable YouTube oEmbed check for curated library entries. */
import fs from 'node:fs';
import path from 'node:path';

type LibraryItem = {
  id?: unknown;
  title?: unknown;
  youtubeId?: unknown;
  url?: unknown;
  series?: { id?: unknown; order?: unknown };
};

type CheckResult = {
  key: string;
  file: string;
  itemId: string;
  title: string;
  youtubeId: string;
  status: 'ok' | 'gone' | 'not_embeddable' | 'error';
  httpStatus: number;
  checkedAt: string;
  note?: string;
  resolution?: 'removed' | 'replaced';
};

const dataDir = path.resolve('src/data');
const reportPath = path.resolve('docs/library-link-report.md');
const checkpointPath = path.resolve('docs/library-link-checkpoint.json');
const journalPath = path.resolve('docs/library-link-checkpoint.jsonl');
const delayMs = 300;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function listLibraryFiles(directory: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...listLibraryFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith('-library.json')) results.push(fullPath);
  }
  return results.sort();
}

function readCheckpoint(): Record<string, CheckResult> {
  const results: Record<string, CheckResult> = {};
  if (fs.existsSync(checkpointPath)) {
    try {
      Object.assign(results, JSON.parse(fs.readFileSync(checkpointPath, 'utf8')) as Record<string, CheckResult>);
    } catch (_error) {
      throw new Error(`Cannot parse resume checkpoint at ${checkpointPath}`);
    }
  }
  if (fs.existsSync(journalPath)) {
    const lines = fs.readFileSync(journalPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      if (!line.trim()) continue;
      const result = JSON.parse(line) as CheckResult;
      results[result.key] = result;
    }
  }
  return results;
}

function writeReport(results: Record<string, CheckResult>, total: number): void {
  const values = Object.keys(results).map((key) => results[key]);
  const ok = values.filter((result) => result.status === 'ok').length;
  const removed = values.filter((result) => result.resolution === 'removed').length;
  const replaced = values.filter((result) => result.resolution === 'replaced').length;
  const notEmbeddable = values.filter((result) => result.status === 'not_embeddable').length;
  const errors = values.filter((result) => result.status === 'error').length;
  const lines = [
    '# Library YouTube link health report',
    '',
    `Updated: ${new Date().toISOString()}`,
    '',
    '| Checked | OK | Gone | Not embeddable | Replaced | Removed | Pending/errors | Total |',
    '| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    `| ${values.length} | ${ok} | ${values.filter((result) => result.status === 'gone').length} | ${notEmbeddable} | ${replaced} | ${removed} | ${Math.max(0, total - values.length) + errors} | ${Math.max(total, values.length)} |`,
    '',
    'Checks use the public YouTube oEmbed endpoint. “Gone” is HTTP 404; “Not embeddable” is HTTP 401/403. Failed transient requests remain resumable.',
    '',
  ];
  const failures = values.filter((result) => result.status !== 'ok');
  if (failures.length) {
    lines.push('| File | Item | Title | YouTube ID | Result | HTTP | Note |', '| --- | --- | --- | --- | --- | ---: | --- |');
    for (const result of failures) {
      lines.push(`| ${result.file} | ${result.itemId} | ${result.title.replace(/\|/g, '\\|')} | ${result.youtubeId} | ${result.status} | ${result.httpStatus} | ${(result.note || '').replace(/\|/g, '\\|')} |`);
    }
    lines.push('');
  }
  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');
}

async function main(): Promise<void> {
  const candidates: Array<Omit<CheckResult, 'status' | 'httpStatus' | 'checkedAt'>> = [];
  for (const filePath of listLibraryFiles(dataDir)) {
    const file = path.relative(dataDir, filePath).replace(/\\/g, '/');
    const items = JSON.parse(fs.readFileSync(filePath, 'utf8')) as LibraryItem[];
    for (const item of items) {
      if (typeof item.youtubeId !== 'string' || !item.youtubeId.trim()) continue;
      const itemId = String(item.id || 'unknown');
      candidates.push({
        key: `${file}#${itemId}`,
        file,
        itemId,
        title: String(item.title || itemId),
        youtubeId: item.youtubeId,
      });
    }
  }

  const results = readCheckpoint();
  let completedThisRun = 0;
  for (const item of candidates) {
    const previous = results[item.key];
    if (previous && (previous.status === 'ok' || previous.status === 'gone' || previous.status === 'not_embeddable')) continue;
    if (completedThisRun > 0) await wait(delayMs);
    const checkedAt = new Date().toISOString();
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${item.youtubeId}`)}&format=json`;
    let result: CheckResult;
    try {
      const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
      let status: CheckResult['status'] = 'error';
      if (response.ok) status = 'ok';
      else if (response.status === 404) status = 'gone';
      else if (response.status === 401 || response.status === 403) status = 'not_embeddable';
      result = {
        ...item,
        status,
        httpStatus: response.status,
        checkedAt,
        note: status === 'error' ? `Transient or unexpected HTTP ${response.status}` : undefined,
      };
    } catch (error) {
      result = { ...item, status: 'error', httpStatus: 0, checkedAt, note: String(error) };
    }
    results[item.key] = result;
    fs.appendFileSync(journalPath, `${JSON.stringify(result)}\n`, 'utf8');
    completedThisRun += 1;
    writeReport(results, candidates.length);
    if (completedThisRun % 50 === 0) {
      console.log(`Checked ${Object.keys(results).length}/${candidates.length}; ${completedThisRun} new checks this run.`);
    }
  }
  writeReport(results, Math.max(candidates.length, Object.keys(results).length));
  const errors = Object.keys(results).map((key) => results[key]).filter((result) => result.status === 'error');
  console.log(`Link audit checkpoint: ${Object.keys(results).length}/${Math.max(candidates.length, Object.keys(results).length)} checked; ${errors.length} errors. Re-run to resume.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
