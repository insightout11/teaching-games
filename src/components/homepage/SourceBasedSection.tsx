'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function SourceBasedSection() {
  return (
    <section className="py-20 px-6 border-t border-lc-border">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center flex flex-col gap-5"
        >
          <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: 'white' }}>
            Teach from the material you already have
          </h2>
          <p className="text-lc-text2 leading-relaxed">
            Build a lesson around a YouTube video, article, pasted text, PDF, image, or a curated
            item from the LessonCaptain library. The lesson plan and activities generate automatically.
          </p>
          <div className="flex flex-col items-center gap-3">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/login"
                className="inline-block px-6 py-3 rounded-lg bg-lc-blue text-[#070B14] font-semibold text-base hover:bg-lc-blue-hover transition-colors"
              >
                Start a Test Flight →
              </Link>
            </motion.div>
            <p className="text-xs text-lc-text3">
              Source-based lesson planning is available on Test Flight and Pro.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
