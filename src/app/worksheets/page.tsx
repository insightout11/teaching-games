import type { Metadata } from "next";
import Link from "next/link";
import { getTopRegistry, clusterLabel } from "@/lib/worksheets";

export const dynamic = "force-dynamic";

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
  const registry = getTopRegistry();

  return (
    <>
      <h1 className="text-3xl font-bold">ESL Worksheet Packs</h1>
      <p className="mt-2 text-gray-600">
        Printable PDF packs designed for adult ESL classrooms. Pick a category
        to browse.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {registry.clusters.map((c) => (
          <Link
            key={c.cluster}
            href={`/worksheets/${c.cluster}`}
            className="rounded-lg border border-gray-200 p-6 transition hover:border-blue-400 hover:shadow"
          >
            <h2 className="text-xl font-semibold">{clusterLabel(c.cluster)}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {c.packCount} pack{c.packCount !== 1 && "s"}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
