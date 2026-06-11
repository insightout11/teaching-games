'use client';

import { motion } from 'framer-motion';
import {
  BookOpen,
  SpellCheck,
  Puzzle,
  Zap,
  Snowflake,
  Mic,
  Headphones,
  Feather,
  Activity,
  type LucideIcon,
} from 'lucide-react';

const CATEGORIES: { name: string; icon: LucideIcon; examples: string[] }[] = [
  {
    name: 'Vocabulary',
    icon: BookOpen,
    examples: ['Vocab Sprint', 'Synonym Showdown', 'Word Chain', 'Bluff Definition', 'Taboo Sprint'],
  },
  {
    name: 'Grammar & writing',
    icon: SpellCheck,
    examples: ['Grammar Boss', 'Error Hunter', 'Sentence Scramble'],
  },
  {
    name: 'Logic & puzzles',
    icon: Puzzle,
    examples: ['Connections', 'Brain Teasers', '20 Questions', 'Dialogue Detective'],
  },
  {
    name: 'Speed & competition',
    icon: Zap,
    examples: ['Flash Quiz', 'GridRush', 'Sector Strike', 'Zone Board'],
  },
  {
    name: 'Icebreakers',
    icon: Snowflake,
    examples: ['Imposter', 'Two Truths and a Lie', 'Password', 'Wonder Board', 'Character Cards'],
  },
  {
    name: 'Speaking & debate',
    icon: Mic,
    examples: ['Hot Take Arena', 'Would You Rather', 'Rank It', 'Expert Panel', 'Defend the Indefensible'],
  },
  {
    name: 'Video & listening',
    icon: Headphones,
    examples: ['Listening Gap Fill', 'Scenario Simulator', 'Read Aloud'],
  },
  {
    name: 'Storytelling',
    icon: Feather,
    examples: ['Story Sprint', 'Scene Igniter', 'Conversation Rounds'],
  },
  {
    name: 'Check-ins & warm-up',
    icon: Activity,
    examples: ['Quick Pulse', 'Vocab Radar', 'Prediction Round', 'Fact Detective'],
  },
];

const TOTAL_MODULES = CATEGORIES.reduce((sum, c) => sum + c.examples.length, 0);

export function ProductDetailStrip() {
  return (
    <section id="games" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-12 text-center"
        >
          <h2
            className="text-2xl font-bold sm:text-3xl"
            style={{ color: 'white', textShadow: '0 1px 24px rgba(0,0,0,0.65)' }}
          >
            What you can run live
          </h2>
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-lc-text3">
            <span className="font-semibold text-lc-amber">{TOTAL_MODULES} games &amp; activities</span>
            <span className="h-1 w-1 rounded-full bg-lc-text3" />
            <span>{CATEGORIES.length} live-ready categories</span>
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="flex flex-col gap-2 rounded-xl border border-lc-border bg-lc-card p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-300/10">
                    <Icon className="h-4 w-4 text-cyan-200" aria-hidden />
                  </span>
                  <h3 className="text-sm font-semibold leading-snug text-lc-text">{cat.name}</h3>
                </div>
                <ul className="flex flex-col gap-0.5">
                  {cat.examples.map((ex) => (
                    <li key={ex} className="text-xs leading-relaxed text-lc-text3">
                      {ex}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
