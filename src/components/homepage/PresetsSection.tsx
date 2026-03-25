'use client';

import { motion } from 'framer-motion';

const PRESETS = [
  {
    name: 'Game Day',
    description: '45 minutes of high-energy classroom games.',
  },
  {
    name: 'Talk More',
    description: 'A speaking-focused lesson that gets students using English more.',
  },
  {
    name: 'Last 15 Minutes',
    description: 'Strong closing activities when time is short.',
  },
  {
    name: 'No One Hides',
    description: 'Participation structures that bring every student into the lesson.',
  },
  {
    name: 'Review That Sticks',
    description: 'Active review activities that reinforce learning.',
  },
  {
    name: 'Wake-Up Mode',
    description: 'Fast starters and energizers that get everyone involved early.',
  },
];

export function PresetsSection() {
  return (
    <section className="py-20 px-6 border-t border-lc-border">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-3xl sm:text-4xl font-bold text-lc-text text-center mb-3"
        >
          Start with a preset. Customize as you go.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.06 }}
          className="text-lc-text2 text-center max-w-xl mx-auto mb-12"
        >
          Pre-built Flight Plans for common lesson goals — ready to launch in seconds.
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRESETS.map((preset, i) => (
            <motion.div
              key={preset.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              whileHover={{ y: -3, boxShadow: '0 8px 30px rgba(77,163,255,0.08)' }}
              className="rounded-xl border border-lc-border bg-lc-card p-5 flex flex-col gap-3"
            >
              <h3 className="text-base font-bold text-lc-text">{preset.name}</h3>
              <p className="text-sm text-lc-text2 leading-relaxed">{preset.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="text-sm text-lc-text3 text-center mt-8"
        >
          Or build your own Flight Plan from scratch — drag in any combination of games and activities.
        </motion.p>
      </div>
    </section>
  );
}
