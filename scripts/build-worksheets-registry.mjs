#!/usr/bin/env node
/**
 * Scans public/worksheets/ for packs (dirs containing metadata.json)
 * and writes registry.json files at the top level and per-cluster.
 *
 * Usage:  node scripts/build-worksheets-registry.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, relative } from "path";

const SCHEMA_VERSION = 1;
const ROOT = join(process.cwd(), "public", "worksheets");

/** Recursively find every metadata.json under root */
function findMetadataFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    const meta = join(full, "metadata.json");
    if (existsSync(meta)) {
      results.push(meta);
    } else {
      results.push(...findMetadataFiles(full));
    }
  }
  return results;
}

const metaFiles = findMetadataFiles(ROOT);
console.log(`Found ${metaFiles.length} pack(s)`);

// Build per-cluster and top-level registries
const clusterMap = new Map(); // cluster -> pack summaries[]

for (const file of metaFiles) {
  const raw = JSON.parse(readFileSync(file, "utf-8"));
  const pack = raw.pack;
  const dir = relative(ROOT, join(file, "..")).replace(/\\/g, "/"); // e.g. "jobs/caregiver/intermediate"

  const summary = {
    slug: pack.slug,
    level: pack.level,
    cefr: pack.cefr,
    title: pack.title,
    path: dir,
    counts: raw.counts,
  };

  const cluster = pack.cluster;
  if (!clusterMap.has(cluster)) clusterMap.set(cluster, []);
  clusterMap.get(cluster).push(summary);
}

// Write per-cluster registries
for (const [cluster, packs] of clusterMap) {
  const clusterDir = join(ROOT, cluster);
  const registry = { schemaVersion: SCHEMA_VERSION, cluster, packs };
  const out = join(clusterDir, "registry.json");
  writeFileSync(out, JSON.stringify(registry, null, 2) + "\n");
  console.log(`  wrote ${relative(process.cwd(), out)}`);
}

// Write top-level registry
const topLevel = {
  schemaVersion: SCHEMA_VERSION,
  clusters: [...clusterMap.keys()].map((c) => ({
    cluster: c,
    packCount: clusterMap.get(c).length,
  })),
};
const topOut = join(ROOT, "registry.json");
writeFileSync(topOut, JSON.stringify(topLevel, null, 2) + "\n");
console.log(`  wrote ${relative(process.cwd(), topOut)}`);
console.log("Done.");
