import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  getClusterRegistry,
  getPackMetadata,
  getAssetUrl,
  clusterLabel,
  levelSlug,
} from "@/lib/worksheets";

export const dynamic = "force-dynamic";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://lessoncaptain.com";

interface Params {
  cluster: string;
  slug: string;
  level: string;
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const reg = getClusterRegistry(params.cluster);
  const pack = reg.packs.find(
    (p) => p.slug === params.slug && levelSlug(p.level) === params.level,
  );
  if (!pack) return { title: "Not Found" };

  return {
    title: `${pack.title} — LessonCaptain`,
    description: `${pack.counts.lessons} lessons, ${pack.counts.handouts} handouts. CEFR ${pack.cefr}. Download the free sample or get the full pack.`,
    alternates: {
      canonical: `${SITE_URL}/worksheets/${params.cluster}/${params.slug}/${params.level}`,
    },
    ...(process.env.WORKSHEETS_NOINDEX ? { robots: "noindex" } : {}),
  };
}

export default function PackDetailPage({ params }: { params: Params }) {
  const reg = getClusterRegistry(params.cluster);
  const summary = reg.packs.find(
    (p) => p.slug === params.slug && levelSlug(p.level) === params.level,
  );
  if (!summary) return <p>Pack not found.</p>;

  const meta = getPackMetadata(summary.path);
  const pack = meta.pack;
  const counts = meta.counts;
  const artifacts = meta.artifacts;
  const totalItems = counts.lessons + counts.handouts + counts.extras;

  return (
    <>
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/worksheets" className="hover:underline">
          Worksheets
        </Link>{" "}
        /{" "}
        <Link
          href={`/worksheets/${params.cluster}`}
          className="hover:underline"
        >
          {clusterLabel(params.cluster)}
        </Link>{" "}
        / <span>{pack.slug}</span>
      </nav>

      <h1 className="text-3xl font-bold">{pack.title}</h1>
      <p className="mt-1 text-gray-500">
        CEFR {pack.cefr} &middot; {pack.timeMinutes} min per lesson
      </p>

      {/* 1 — What you get */}
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">What you get</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          <li className="rounded-md bg-blue-50 p-4 text-center">
            <span className="block text-2xl font-bold text-blue-600">
              {counts.lessons}
            </span>
            <span className="text-sm text-gray-600">Lessons</span>
          </li>
          <li className="rounded-md bg-blue-50 p-4 text-center">
            <span className="block text-2xl font-bold text-blue-600">
              {counts.handouts}
            </span>
            <span className="text-sm text-gray-600">Student Handouts</span>
          </li>
          <li className="rounded-md bg-blue-50 p-4 text-center">
            <span className="block text-2xl font-bold text-blue-600">
              {counts.extras}
            </span>
            <span className="text-sm text-gray-600">Bonus Extras</span>
          </li>
        </ul>
        <p className="mt-3 text-sm text-gray-500">
          {totalItems} printable PDFs in total.
        </p>
      </section>

      {/* 2 — How to use in class */}
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">How to use in class</h2>
        <ol className="mt-3 list-inside list-decimal space-y-2 text-gray-700">
          <li>Print the lesson PDF and matching student handout.</li>
          <li>
            Follow the lesson plan ({pack.timeMinutes} minutes) — warm-up,
            vocabulary, practice, role-play, wrap-up.
          </li>
          <li>
            Hand out the student sheet for pair/group work and take-home review.
          </li>
          <li>
            Use the bonus cheat-sheet as a quick reference poster or homework
            aid.
          </li>
        </ol>
      </section>

      {/* 3 — Preview gallery */}
      {artifacts.previews.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Preview</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {artifacts.previews.map((img, i) => (
              <Image
                key={i}
                src={getAssetUrl(summary.path, img)}
                alt={`Preview page ${i + 1}`}
                width={400}
                height={520}
                className="rounded-md border border-gray-200"
              />
            ))}
          </div>
        </section>
      )}

      {/* 4 — Downloads */}
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Downloads</h2>
        <div className="mt-4 flex flex-wrap gap-4">
          <a
            href={getAssetUrl(summary.path, artifacts.samplePdf)}
            download
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Free Sample (PDF)
          </a>
          <a
            href={getAssetUrl(summary.path, artifacts.fullPackZip)}
            download
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Full Pack (ZIP)
          </a>
        </div>
      </section>

      {/* 5 — Related */}
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Related packs</h2>
        <p className="mt-2 text-sm text-gray-500">
          More packs coming soon. Check back or{" "}
          <Link href="/worksheets" className="text-blue-600 hover:underline">
            browse all categories
          </Link>
          .
        </p>
      </section>

      {/* 6 — FAQ */}
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">FAQ</h2>
        <dl className="mt-4 space-y-4">
          {[
            {
              q: "Can I photocopy these for my class?",
              a: "Yes. The license allows unlimited photocopying for your own students.",
            },
            {
              q: "What level are these for?",
              a: `This pack targets CEFR ${pack.cefr} (${pack.level}).`,
            },
            {
              q: "How long does each lesson take?",
              a: `Each lesson is designed for a ${pack.timeMinutes}-minute class session.`,
            },
            {
              q: "Do I need any special equipment?",
              a: "Just a printer. All activities are paper-based — no tech required in the classroom.",
            },
          ].map(({ q, a }) => (
            <div key={q}>
              <dt className="font-medium text-gray-900">{q}</dt>
              <dd className="mt-1 text-gray-600">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
