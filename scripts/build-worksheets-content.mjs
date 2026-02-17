#!/usr/bin/env node
/**
 * Scans public/worksheets/ for packs (dirs containing metadata.json)
 * and writes flat registry JSON files to src/content/worksheets/.
 *
 * Output:
 *   registry.json — all items across all clusters
 *   <cluster>.json — items filtered to that cluster
 *
 * Usage:  node scripts/build-worksheets-content.mjs
 */

import fs from "node:fs/promises";
import path from "node:path";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const WORKSHEETS_ROOT = path.join(PUBLIC_DIR, "worksheets");
const OUT_DIR = path.join(process.cwd(), "src", "content", "worksheets");

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const allFiles = await walk(WORKSHEETS_ROOT);
const metaFiles = allFiles.filter(
  (p) => p.endsWith(path.sep + "metadata.json") || p.endsWith("/metadata.json"),
);

console.log(`Found ${metaFiles.length} pack(s)`);

const items = [];

for (const fp of metaFiles) {
  try {
    const raw = await fs.readFile(fp, "utf8");
    const j = JSON.parse(raw);
    const pack = j.pack ?? {};
    const cluster = pack.cluster ?? null;
    const slug = pack.slug ?? null;
    const level = pack.level ? String(pack.level).toLowerCase() : null;

    if (!cluster || !slug || !level) continue;

    items.push({
      urlBase: `/worksheets/${cluster}/${slug}/${level}`,
      cluster,
      slug,
      level,
      title: pack.title ?? "",
      cefr: pack.cefr ?? null,
      timeMinutes: pack.timeMinutes ?? null,
      keywords: pack.keywords ?? [],
      artifacts: j.artifacts ?? {},
      counts: j.counts ?? {},
    });
  } catch {
    // skip malformed metadata
  }
}

items.sort((a, b) => `${a.cluster}/${a.slug}/${a.level}`.localeCompare(`${b.cluster}/${b.slug}/${b.level}`));

const builtAt = new Date().toISOString();

// Build per-cluster maps
const clusterMap = new Map();
for (const item of items) {
  if (!clusterMap.has(item.cluster)) clusterMap.set(item.cluster, []);
  clusterMap.get(item.cluster).push(item);
}

await fs.mkdir(OUT_DIR, { recursive: true });

// registry.json — all items
const registry = {
  schema: "worksheets/registry-v1",
  builtAt,
  count: items.length,
  items,
};
await fs.writeFile(path.join(OUT_DIR, "registry.json"), JSON.stringify(registry, null, 2) + "\n");
console.log(`  wrote registry.json (${items.length} items)`);

// <cluster>.json — per-cluster
for (const [cluster, clusterItems] of clusterMap) {
  const payload = {
    schema: "worksheets/registry-v1",
    builtAt,
    count: clusterItems.length,
    items: clusterItems,
  };
  await fs.writeFile(path.join(OUT_DIR, `${cluster}.json`), JSON.stringify(payload, null, 2) + "\n");
  console.log(`  wrote ${cluster}.json (${clusterItems.length} items)`);
}

console.log("Done.");
