'use client';

import { motion } from 'framer-motion';

const CATEGORIES = [
  {
    name: 'Vocabulary',
    examples: ['Vocab Sprint', 'Synonym Showdown', 'Word Chain', 'Bluff Definition', 'Taboo Sprint'],
  },
  {
    name: 'Grammar & writing',
    examples: ['Grammar Boss', 'Error Hunter', 'Sentence Scramble'],
  },
  {
    name: 'Logic & puzzles',
    examples: ['Connections', 'Brain Teasers', 'Twenty Questions', 'Dialogue Detective'],
  },
  {
    name: 'Speed & competition',
    examples: ['Flash Quiz', 'Grid Rush', 'Sector Strike', 'Zone Board'],
  },
  {
    name: 'Icebreakers',
    examples: ['Imposter', 'Two Truths and a Lie', 'Password', 'Wonder Board', 'Character Cards'],
  },
  {
    name: 'Speaking & debate',
    examples: ['Hot Take Arena', 'Would You Rather', 'Rank It', 'Expert Panel', 'Defend It'],
  },
  {
    name: 'Video & listening',
    examples: ['Listening Gap Fill', 'Scenario Simulator', 'Read Aloud'],
  },
  {
    name: 'Storytelling',
    examples: ['Story Sprint', 'Scene Igniter', 'Conversation Rounds'],
  },
  {
    name: 'Check-ins & warm-up',
    examples: ['Quick Pulse', 'Vocab Radar', 'Prediction Round', 'Fact Detective'],
  },
];

export function ProductDetailStrip() {
  return (
    <section id="games" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-2xl sm:text-3xl font-bold text-center mb-12"
          style={{ color: 'white', textShadow: '0 1px 24px rgba(0,0,0,0.65)' }}
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
