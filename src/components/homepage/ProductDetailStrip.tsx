'use client';

import { motion } from 'framer-motion';
import { Route, LayoutGrid, BarChart2, RefreshCw } from 'lucide-react';

const FEATURES = [
  {
    icon: Route,
    name: 'Flight Plan',
    description: 'Sequence games and activities into a complete lesson with pacing built in.',
  },
  {
    icon: LayoutGrid,
    name: 'Built-in activities',
    description: 'Polls, discussions, vocab checks, and creative tasks — no third-party tools needed.',
  },
  {
    icon: BarChart2,
    name: 'Live scoring + leaderboard',
    description: 'Students see results in real time. Keeps energy high and gives you clear class data.',
  },
  {
    icon: RefreshCw,
    name: 'Switch Activity',
    description: 'Jump to any game mid-lesson without breaking the session. The class stays live.',
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
        >
          Built for live classrooms, not just lesson generation
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.09 }}
                className="flex gap-4 items-start p-5 rounded-xl border border-lc-border bg-lc-card"
              >
                <div className="w-9 h-9 rounded-lg bg-lc-blue/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4.5 h-4.5 text-lc-blue" style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-lc-text mb-1">{feature.name}</h3>
                  <p className="text-sm text-lc-text2 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
