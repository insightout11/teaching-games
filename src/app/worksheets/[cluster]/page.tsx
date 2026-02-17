import type { Metadata } from "next";
import Link from "next/link";
import {
  getClusterRegistry,
  clusterLabel,
  levelSlug,
} from "@/lib/worksheets";

export const dynamic = "force-dynamic";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://lessoncaptain.com";

export function generateMetadata({
  params,
}: {
  params: { cluster: string };
}): Metadata {
  const label = clusterLabel(params.cluster);
  return {
    title: `${label} Worksheets — LessonCaptain`,
    description: `Browse printable ESL worksheet packs for ${label}.`,
    alternates: { canonical: `${SITE_URL}/worksheets/${params.cluster}` },
    ...(process.env.WORKSHEETS_NOINDEX ? { robots: "noindex" } : {}),
  };
}

export default function ClusterPage({
  params,
}: {
  params: { cluster: string };
}) {
  const reg = getClusterRegistry(params.cluster);
  const label = clusterLabel(params.cluster);

  return (
    <>
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/worksheets" className="hover:underline">
          Worksheets
        </Link>{" "}
        / <span>{label}</span>
      </nav>

      <h1 className="text-3xl font-bold">{label} Worksheets</h1>
      <p className="mt-2 text-gray-600">
        {reg.packs.length} pack{reg.packs.length !== 1 && "s"} available.
      </p>

      <div className="mt-8 grid gap-6">
        {reg.packs.map((p) => (
          <Link
            key={p.path}
            href={`/worksheets/${params.cluster}/${p.slug}/${levelSlug(p.level)}`}
            className="rounded-lg border border-gray-200 p-6 transition hover:border-blue-400 hover:shadow"
          >
            <h2 className="text-xl font-semibold">{p.title}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {p.cefr} &middot; {p.counts.lessons} lessons &middot;{" "}
              {p.counts.handouts} handouts
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
