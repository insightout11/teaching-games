'use client';

// The Live Room and what grew around it (Oct 2026 accuracy pass): Focus (any topic becomes the lesson), the flights,
// reading courses from teachers' own books, and lesson memory. Illustrative content only (hardcoded examples, no
// student names on the teacher screen).

import { motion } from 'framer-motion';
import { BookOpen, BookText, Globe2, Headphones, History, MessageCircle, Mic, PlaneTakeoff, Scale, Search, Sparkles, SpellCheck } from 'lucide-react';

const STEPS = [
  {
    icon: Search,
    label: 'A student brings something up',
    title: '“I saw a volcano erupt on TV!”',
    body: 'Type it, or search the web from inside the room. One tap makes it the class topic.',
  },
  {
    icon: Sparkles,
    label: 'The room gets ready',
    title: 'Volcanoes',
    body: 'A short briefing for you, discussion questions, and the key words on every student’s phone: magma, crater, erupt.',
  },
  {
    icon: PlaneTakeoff,
    label: 'You choose what happens',
    title: 'Fact Detective · Would You Rather · a debate',
    body: 'Activities built on that topic are ready to launch. AI suggests; you decide.',
  },
];

const FLIGHTS = [
  { icon: Mic, name: 'Speak', line: 'One real conversation, three tries. See how much better the class got.' },
  { icon: Globe2, name: 'Travel', line: 'A whole trip through one of 50 cities, speaking at every stop.' },
  { icon: Scale, name: 'Debate', line: 'One motion, real evidence, tag-team turns, and see how the room moved.' },
  { icon: Headphones, name: 'Listening', line: 'Hear a real clip, catch the details, then hear how much more you catch.' },
  { icon: BookText, name: 'Reading', line: 'One chapter: predict, read aloud in turns, talk, retell.' },
  { icon: SpellCheck, name: 'Grammar', line: 'Learn the rule, spot errors, rebuild sentences, prove it.' },
];

export function LiveRoomSection() {
  return (
    <section className="border-t border-lc-border px-6 py-20">
      <div className="mx-auto max-w-6xl space-y-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-lc-blue">The Live Room</p>
          <h2 className="text-shadow-hero text-3xl font-bold text-lc-text sm:text-4xl">Talk about anything. It becomes the lesson.</h2>
          <p className="mt-4 text-lc-text2">
            Every class starts in the Live Room. Plan ahead when you want to, or follow the conversation when it goes
            somewhere better. LessonCaptain keeps up.
          </p>
        </motion.div>

        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex flex-col gap-3 rounded-2xl border border-lc-border bg-lc-card/80 p-5"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lc-text3">
                <s.icon className="h-4 w-4 text-lc-blue" aria-hidden />
                <span>{i + 1} · {s.label}</span>
              </div>
              <p className="text-lg font-semibold text-lc-text">{s.title}</p>
              <p className="text-sm text-lc-text2">{s.body}</p>
            </motion.li>
          ))}
        </ol>

        <div>
          <div className="mb-6 text-center">
            <h3 className="text-2xl font-bold text-lc-text">Or fly a full lesson</h3>
            <p className="mt-2 text-sm text-lc-text2">Each flight is about 60 minutes and shows the class how much it improved by the end.</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FLIGHTS.map((f) => (
              <li key={f.name} className="flex gap-3 rounded-xl border border-lc-border bg-lc-surface/70 p-4">
                <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-lc-amber" aria-hidden />
                <div className="min-w-0">
                  <p className="font-semibold text-lc-text">{f.name}</p>
                  <p className="text-sm text-lc-text2">{f.line}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex gap-4 rounded-2xl border border-lc-border bg-lc-card/80 p-6">
            <BookOpen className="mt-1 h-6 w-6 shrink-0 text-lc-blue" aria-hidden />
            <div>
              <h3 className="text-lg font-bold text-lc-text">Reading courses from your own books</h3>
              <p className="mt-2 text-sm text-lc-text2">
                Upload a PDF, a Word file, a scan or photos of the pages. It becomes a course of lessons at your class
                level, read aloud in turns in class, with the pictures kept for picture books. Or choose one of our
                library reading courses.
              </p>
            </div>
          </div>
          <div className="flex gap-4 rounded-2xl border border-lc-border bg-lc-card/80 p-6">
            <History className="mt-1 h-6 w-6 shrink-0 text-lc-blue" aria-hidden />
            <div>
              <h3 className="text-lg font-bold text-lc-text">Every lesson picks up where the last one left off</h3>
              <p className="mt-2 text-sm text-lc-text2">
                The room remembers the topics, words and activities of each lesson. Next time you board, it offers to
                pick up the last topic or warm up with last lesson&apos;s words.
              </p>
            </div>
          </div>
        </div>

        <p className="flex items-center justify-center gap-2 text-center text-sm text-lc-text3">
          <MessageCircle className="h-4 w-4" aria-hidden />
          AI is your co-pilot, never your evaluator. You&apos;re still the Captain.
        </p>
      </div>
    </section>
  );
}
