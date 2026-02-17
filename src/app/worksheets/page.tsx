import type { Metadata } from "next";
import Link from "next/link";
import { getRegistry, clusterLabel } from "@/lib/worksheets";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://lessoncaptain.com";

export function generateMetadata(): Metadata {
  return {
    title: "Free ESL Worksheets — LessonCaptain",
    description:
      "Download printable ESL worksheet packs for adult learners. Job English, conversation starters, and more.",
    alternates: { canonical: `${SITE_URL}/worksheets` },
    ...(process.env.WORKSHEETS_NOINDEX ? { robots: "noindex" } : {}),
  };
}

export default function WorksheetsHub() {
  const registry = getRegistry();

  // Derive unique clusters with pack counts
  const clusterCounts = new Map<string, number>();
  for (const item of registry.items) {
    clusterCounts.set(item.cluster, (clusterCounts.get(item.cluster) ?? 0) + 1);
  }

  return (
    <>
      <h1 className="text-3xl font-bold">ESL Worksheet Packs</h1>
      <p className="mt-2 text-gray-600">
        Printable PDF packs designed for adult ESL classrooms. Pick a category
        to browse.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {Array.from(clusterCounts.entries()).map(([cluster, count]) => (
          <Link
            key={cluster}
            href={`/worksheets/${cluster}`}
            className="rounded-lg border border-gray-200 p-6 transition hover:border-blue-400 hover:shadow"
          >
            <h2 className="text-xl font-semibold">
              {clusterLabel(cluster)}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {count} pack{count !== 1 && "s"}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
