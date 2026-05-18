'use client';

import { motion } from 'framer-motion';

const CATEGORIES = [
  {
    name: 'Vocabulary games',
    examples: ['Vocab Sprint', 'Synonym Showdown', 'Word Chain'],
  },
  {
    name: 'Grammar & writing games',
    examples: ['Grammar Boss', 'Error Hunter', 'Sentence Scramble'],
  },
  {
    name: 'Logic & puzzle games',
    examples: ['Connections', 'Dialogue Detective'],
  },
  {
    name: 'Speaking activities',
    examples: ['Hot Take Arena', 'Expert Panel', 'Would You Rather'],
  },
  {
    name: 'Debate prompts',
    examples: ['Rank It', 'Problem Solvers'],
  },
  {
    name: 'Video & text-based lessons',
    examples: ['Scenario Simulator', 'Scene Igniter'],
  },
  {
    name: 'Closing reflections',
    examples: ['Quick Pulse', 'Prediction Round'],
  },
];

export function ProductDetailStrip() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-2xl sm:text-3xl font-bold text-lc-text text-center mb-12"
          style={{ textShadow: '0 1px 24px rgba(0,0,0,0.65)' }}
        >
          What you can run live
        </motion.h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="rounded-xl border border-lc-border bg-lc-card p-4 flex flex-col gap-2"
            >
              <h3 className="text-sm font-semibold text-lc-text leading-snug">{cat.name}</h3>
              <ul className="flex flex-col gap-0.5">
                {cat.examples.map((ex) => (
                  <li key={ex} className="text-xs text-lc-text3 leading-relaxed">
                    {ex}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
