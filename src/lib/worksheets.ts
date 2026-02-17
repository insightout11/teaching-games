import registryJson from "@/content/worksheets/registry.json";
import jobsJson from "@/content/worksheets/jobs.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RegistryItem {
  urlBase: string;
  cluster: string;
  slug: string;
  level: string;
  title: string;
  cefr: string | null;
  timeMinutes: string | null;
  keywords: string[];
  artifacts: {
    fullPackZip: string;
    samplePdf: string;
    licenseTxt: string;
    previews: string[];
  };
  counts: {
    lessons: number;
    handouts: number;
    extras: number;
  };
}

export interface Registry {
  schema: string;
  builtAt: string;
  count: number;
  items: RegistryItem[];
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const clusterMap: Record<string, Registry> = {
  jobs: jobsJson as Registry,
};

// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------

export function getRegistry(): Registry {
  return registryJson as Registry;
}

export function getClusterRegistry(cluster: string): Registry | undefined {
  return clusterMap[cluster];
}

/** Public URL for an asset inside a pack dir */
export function getAssetUrl(urlBase: string, filename: string): string {
  return `${urlBase}/${filename}`;
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

const CLUSTER_LABELS: Record<string, string> = {
  jobs: "Job English",
};

export function clusterLabel(cluster: string): string {
  return (
    CLUSTER_LABELS[cluster] ??
    cluster.charAt(0).toUpperCase() + cluster.slice(1)
  );
}

export function levelSlug(level: string): string {
  return level.toLowerCase().replace(/\s+/g, "-");
}

// ---------------------------------------------------------------------------
// Pro gate
// ---------------------------------------------------------------------------

export const PRO_ENABLED = true;
