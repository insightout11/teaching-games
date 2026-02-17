import { readFileSync } from "fs";
import { join } from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TopRegistry {
  schemaVersion: number;
  clusters: { cluster: string; packCount: number }[];
}

export interface ClusterRegistry {
  schemaVersion: number;
  cluster: string;
  packs: PackSummary[];
}

export interface PackSummary {
  slug: string;
  level: string;
  cefr: string;
  title: string;
  path: string; // relative to public/worksheets, e.g. "jobs/caregiver/intermediate"
  counts: PackCounts;
}

export interface PackCounts {
  lessons: number;
  handouts: number;
  extras: number;
}

export interface PackMetadata {
  schema: string;
  builtAt: string;
  pack: {
    title: string;
    slug: string;
    level: string;
    cefr: string;
    cluster: string;
    timeMinutes: string;
    keywords: string[];
  };
  artifacts: {
    fullPackZip: string;
    samplePdf: string;
    licenseTxt: string;
    previews: string[];
  };
  counts: PackCounts;
  sourceFiles: {
    lessons: string[];
    handouts: string[];
    extras: string[];
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WORKSHEETS_DIR = join(process.cwd(), "public", "worksheets");

export function getTopRegistry(): TopRegistry {
  const raw = readFileSync(join(WORKSHEETS_DIR, "registry.json"), "utf-8");
  return JSON.parse(raw);
}

export function getClusterRegistry(cluster: string): ClusterRegistry {
  const raw = readFileSync(
    join(WORKSHEETS_DIR, cluster, "registry.json"),
    "utf-8",
  );
  return JSON.parse(raw);
}

export function getPackMetadata(packPath: string): PackMetadata {
  const raw = readFileSync(
    join(WORKSHEETS_DIR, packPath, "metadata.json"),
    "utf-8",
  );
  return JSON.parse(raw);
}

/** Public URL for an asset inside a pack dir */
export function getAssetUrl(packPath: string, filename: string): string {
  return `/worksheets/${packPath}/${filename}`;
}

// Display helpers
const CLUSTER_LABELS: Record<string, string> = {
  jobs: "Job English",
};

export function clusterLabel(cluster: string): string {
  return CLUSTER_LABELS[cluster] ?? cluster.charAt(0).toUpperCase() + cluster.slice(1);
}

export function levelSlug(level: string): string {
  return level.toLowerCase().replace(/\s+/g, "-");
}
