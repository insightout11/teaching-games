'use client';

import { motion } from 'framer-motion';

const PRESETS = [
  {
    name: 'Vocab Blitz',
    description: 'Vocabulary-first with game-based reinforcement',
    bestFor: 'Lexical classes, review days',
    duration: '45 min',
  },
  {
    name: 'Grammar Clinic',
    description: 'Sentence-level accuracy with writing-heavy games',
    bestFor: 'Grammar focus, error correction',
    duration: '45 min',
  },
  {
    name: 'Speaking Circle',
    description: 'High speaking load, confidence-building sequence',
    bestFor: 'Conversation classes, fluency work',
    duration: '60 min',
  },
  {
    name: 'Debate Ready',
    description: 'Opinion formation, structured argument, vote-and-discuss',
    bestFor: 'Advanced classes, discussion practice',
    duration: '60 min',
  },
  {
    name: 'Creative Sprint',
    description: 'Open-ended expression with story-driven production',
    bestFor: 'Writing focus, creative output',
    duration: '60 min',
  },
  {
    name: 'Game Day',
    description: 'Pure competitive fun — 5 back-to-back games, running scoreboard',
    bestFor: 'Review sessions, engagement days',
    duration: '60 min',
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
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold text-lc-text">{preset.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-lc-surface text-lc-text3 font-medium flex-shrink-0">
                  {preset.duration}
                </span>
              </div>
              <p className="text-sm text-lc-text2 leading-relaxed">{preset.description}</p>
              <p className="text-xs text-lc-text3">
                <span className="font-semibold text-lc-text3">Best for:</span>{' '}
                {preset.bestFor}
              </p>
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
