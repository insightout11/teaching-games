import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  getRegistry,
  getAssetUrl,
  clusterLabel,
  levelSlug,
  PRO_ENABLED,
  type RegistryItem,
} from "@/lib/worksheets";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://lessoncaptain.com";

interface Params {
  cluster: string;
  slug: string;
  level: string;
}

export function generateStaticParams() {
  const registry = getRegistry();
  return registry.items.map((item) => ({
    cluster: item.cluster,
    slug: item.slug,
    level: levelSlug(item.level),
  }));
}

function findItem(params: Params): RegistryItem | undefined {
  const registry = getRegistry();
  return registry.items.find(
    (i) =>
      i.cluster === params.cluster &&
      i.slug === params.slug &&
      levelSlug(i.level) === params.level,
  );
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const item = findItem(params);
  if (!item) return { title: "Not Found" };

  return {
    title: `${item.title} — LessonCaptain`,
    description: `${item.counts.lessons} lessons, ${item.counts.handouts} handouts.${item.cefr ? ` CEFR ${item.cefr}.` : ""} Download the free sample or get the full pack.`,
    alternates: {
      canonical: `${SITE_URL}/worksheets/${params.cluster}/${params.slug}/${params.level}`,
    },
    ...(process.env.WORKSHEETS_NOINDEX ? { robots: "noindex" } : {}),
  };
}

export default function PackDetailPage({ params }: { params: Params }) {
  const item = findItem(params);
  if (!item) return <p>Pack not found.</p>;

  const totalItems = item.counts.lessons + item.counts.handouts + item.counts.extras;

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
        / <span>{item.slug}</span>
      </nav>

      <h1 className="text-3xl font-bold">{item.title}</h1>
      <p className="mt-1 text-gray-500">
        {item.cefr && <>CEFR {item.cefr} &middot; </>}
        {item.timeMinutes} min per lesson
      </p>

      {/* 1 — What you get */}
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">What you get</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          <li className="rounded-md bg-blue-50 p-4 text-center">
            <span className="block text-2xl font-bold text-blue-600">
              {item.counts.lessons}
            </span>
            <span className="text-sm text-gray-600">Lessons</span>
          </li>
          <li className="rounded-md bg-blue-50 p-4 text-center">
            <span className="block text-2xl font-bold text-blue-600">
              {item.counts.handouts}
            </span>
            <span className="text-sm text-gray-600">Student Handouts</span>
          </li>
          <li className="rounded-md bg-blue-50 p-4 text-center">
            <span className="block text-2xl font-bold text-blue-600">
              {item.counts.extras}
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
            Follow the lesson plan ({item.timeMinutes} minutes) — warm-up,
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
      {item.artifacts.previews.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Preview</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {item.artifacts.previews.map((img, i) => (
              <Image
                key={i}
                src={getAssetUrl(item.urlBase, img)}
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
            href={getAssetUrl(item.urlBase, item.artifacts.samplePdf)}
            download
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Free Sample (PDF)
          </a>

          {PRO_ENABLED ? (
            <Link
              href="/pro"
              className="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-medium text-amber-800 transition hover:bg-amber-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z"
                  clipRule="evenodd"
                />
              </svg>
              Get Pro to download full pack
            </Link>
          ) : (
            <a
              href={getAssetUrl(item.urlBase, item.artifacts.fullPackZip)}
              download
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Full Pack (ZIP)
            </a>
          )}
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
              a: `This pack targets${item.cefr ? ` CEFR ${item.cefr}` : ""} ${item.level} level.`,
            },
            {
              q: "How long does each lesson take?",
              a: `Each lesson is designed for a ${item.timeMinutes}-minute class session.`,
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
