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
  Globe2,
  type LucideIcon,
} from 'lucide-react';

// Per-category color tones. Full static class strings (no interpolation) so Tailwind
// doesn't purge them. `border` tints the card outline, `tile` the icon chip, `icon` the glyph.
type Tone = { border: string; tile: string; icon: string };

const CATEGORIES: { name: string; icon: LucideIcon; tone: Tone; examples: string[] }[] = [
  {
    name: 'Vocabulary',
    icon: BookOpen,
    tone: { border: 'border-cyan-400/25', tile: 'border-cyan-300/30 bg-cyan-400/10', icon: 'text-cyan-200' },
    examples: ['Vocab Sprint', 'Synonym Showdown', 'Word Chain', 'Bluff Definition', 'Taboo Sprint'],
  },
  {
    name: 'Grammar & writing',
    icon: SpellCheck,
    tone: { border: 'border-violet-400/25', tile: 'border-violet-300/30 bg-violet-400/10', icon: 'text-violet-200' },
    examples: ['Grammar Boss', 'Error Hunter', 'Sentence Scramble'],
  },
  {
    name: 'Logic & puzzles',
    icon: Puzzle,
    tone: { border: 'border-emerald-400/25', tile: 'border-emerald-300/30 bg-emerald-400/10', icon: 'text-emerald-200' },
    examples: ['Connections', 'Brain Teasers', '20 Questions', 'Dialogue Detective'],
  },
  {
    name: 'Speed & competition',
    icon: Zap,
    tone: { border: 'border-amber-400/25', tile: 'border-amber-300/30 bg-amber-400/10', icon: 'text-amber-200' },
    examples: ['Flash Quiz', 'GridRush', 'Sector Strike'],
  },
  {
    name: 'Geography & places',
    icon: Globe2,
    tone: { border: 'border-indigo-400/25', tile: 'border-indigo-300/30 bg-indigo-400/10', icon: 'text-indigo-200' },
    examples: ['World Lens', 'Radar Fix'],
  },
  {
    name: 'Icebreakers',
    icon: Snowflake,
    tone: { border: 'border-sky-400/25', tile: 'border-sky-300/30 bg-sky-400/10', icon: 'text-sky-200' },
    examples: ['Imposter', 'Two Truths and a Lie', 'Password', 'Wonder Board', 'Character Cards'],
  },
  {
    name: 'Speaking & debate',
    icon: Mic,
    tone: { border: 'border-rose-400/25', tile: 'border-rose-300/30 bg-rose-400/10', icon: 'text-rose-200' },
    examples: ['Hot Take Arena', 'Would You Rather', 'Rank It', 'Expert Panel', 'Defend the Indefensible'],
  },
  {
    name: 'Video & listening',
    icon: Headphones,
    tone: { border: 'border-teal-400/25', tile: 'border-teal-300/30 bg-teal-400/10', icon: 'text-teal-200' },
    examples: ['Listening Gap Fill', 'Scenario Simulator', 'Read Aloud'],
  },
  {
    name: 'Storytelling',
    icon: Feather,
    tone: { border: 'border-fuchsia-400/25', tile: 'border-fuchsia-300/30 bg-fuchsia-400/10', icon: 'text-fuchsia-200' },
    examples: ['Story Sprint', 'Scene Igniter', 'Conversation Rounds'],
  },
  {
    name: 'Check-ins & warm-up',
    icon: Activity,
    tone: { border: 'border-lime-400/25', tile: 'border-lime-300/30 bg-lime-400/10', icon: 'text-lime-200' },
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
                className={`flex flex-col gap-2 rounded-xl border bg-lc-card p-4 ${cat.tone.border}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border ${cat.tone.tile}`}>
                    <Icon className={`h-4 w-4 ${cat.tone.icon}`} aria-hidden />
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
