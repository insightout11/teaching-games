'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Youtube,
  Newspaper,
  Type,
  FileText,
  Image as ImageIcon,
  Library,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

// The source types a lesson can be built from — the visual makes the breadth concrete
// (the copy used to just list them). PDF + image included per product scope.
const SOURCES = [
  { icon: Youtube, label: 'YouTube', tint: 'text-red-300' },
  { icon: Newspaper, label: 'Article', tint: 'text-cyan-200' },
  { icon: Type, label: 'Pasted text', tint: 'text-emerald-200' },
  { icon: FileText, label: 'PDF', tint: 'text-amber-200' },
  { icon: ImageIcon, label: 'Image', tint: 'text-violet-200' },
  { icon: Library, label: 'Library', tint: 'text-sky-200' },
];

const LESSON_PARTS = ['Vocabulary', 'Comprehension', 'Discussion', 'Review game'];

export function SourceBasedSection() {
  return (
    <section className="border-t border-lc-border px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <h2
            className="text-shadow-hero text-3xl font-bold sm:text-4xl text-white"
          >
            Teach from the material you already have
          </h2>
          <p className="mt-4 leading-relaxed text-lc-text2">
            Drop in a YouTube video, article, pasted text, PDF, image, or a curated item from the
            LessonCaptain library. The lesson plan and activities generate automatically.
          </p>
        </motion.div>

        {/* Visual: any source → a built lesson */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="grid items-center gap-6 rounded-2xl border border-lc-border bg-lc-card/60 p-6 shadow-[0_30px_70px_-34px_rgba(0,0,0,0.9)] lg:grid-cols-[1fr_auto_0.9fr] sm:p-8"
        >
          {/* Source tiles */}
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-lc-text3">
              Start from anything
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {SOURCES.map(({ icon: Icon, label, tint }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: 0.1 + i * 0.06 }}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-lc-border bg-lc-surface/70 px-2 py-3 text-center"
                >
                  <Icon className={`h-5 w-5 ${tint}`} aria-hidden />
                  <span className="text-[11px] font-medium leading-none text-lc-text2">{label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Connector */}
          <div className="flex items-center justify-center" aria-hidden>
            <div className="hidden h-px w-10 bg-gradient-to-r from-transparent to-cyan-300/50 lg:block" />
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 lg:mx-1">
              <ArrowRight className="h-4 w-4 rotate-90 text-cyan-200 lg:rotate-0" />
            </div>
            <div className="hidden h-px w-10 bg-gradient-to-r from-cyan-300/50 to-transparent lg:block" />
          </div>

          {/* Result: a built lesson */}
          <div className="rounded-xl border border-cyan-300/25 bg-gradient-to-br from-[#0b1c38]/80 to-[#060f1f]/85 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-lc-amber" aria-hidden />
              <span className="text-sm font-semibold text-lc-text">A live lesson, ready to fly</span>
            </div>
            <ul className="flex flex-col gap-2">
              {LESSON_PARTS.map((part, i) => (
                <motion.li
                  key={part}
                  initial={{ opacity: 0, x: 8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.35 + i * 0.08 }}
                  className="flex items-center gap-2 rounded-lg border border-lc-border bg-lc-surface/50 px-3 py-2 text-xs font-medium text-lc-text2"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                  {part}
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-lc-blue px-6 py-3 text-base font-semibold text-[#070B14] transition-colors hover:bg-lc-blue-hover"
            >
              Start a Test Flight
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </motion.div>
          <p className="text-xs text-lc-text3">
            Source-based lesson planning is available on Test Flight and Pro.
          </p>
          <Link
            href="/video-lesson"
            className="text-sm font-semibold text-lc-blue transition-colors hover:text-lc-blue-hover"
          >
            Try it with your own video →
          </Link>
        </div>
      </div>
    </section>
  );
}
