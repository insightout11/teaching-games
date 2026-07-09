'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { VideoLibraryModal } from '@/components/planner/video-library-modal';
import { TextLibraryModal } from '@/components/planner/text-library-modal';
import { COURSE_PRESETS } from '@/lib/course-presets';
import { usePlannerStore } from '@/stores/planner-store';
import type { SourceMaterial } from '@/types/source-material';
import { BookOpen, Video, Map, GraduationCap, X, Layers, type LucideIcon } from 'lucide-react';

type LibraryTab = 'videos' | 'texts' | 'flight-plans' | 'courses';

const LIBRARY_TABS: { key: LibraryTab; label: string; icon: LucideIcon }[] = [
  { key: 'videos', label: 'Videos', icon: Video },
  { key: 'texts', label: 'Texts', icon: BookOpen },
  { key: 'flight-plans', label: 'Flight Plans', icon: Map },
  { key: 'courses', label: 'Courses', icon: GraduationCap },
];

function ComingSoonState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-4">
      <p className="text-4xl">Soon</p>
      <h3 className="text-lg font-semibold text-lc-text">{title}</h3>
      <p className="text-sm text-lc-text3 max-w-md">{description}</p>
    </div>
  );
}

function CoursePresetLibrary() {
  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="max-w-6xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-lc-text">Course presets</h2>
          <p className="text-sm text-lc-text3 mt-1">
            Ready-made six-lesson arcs with grounded source recommendations. Pick one, then edit before saving.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {COURSE_PRESETS.map((preset) => (
            <Link
              key={preset.id}
              href={`/courses/new?preset=${encodeURIComponent(preset.id)}`}
              className="block bg-lc-card rounded-xl border border-lc-border p-5 hover:border-lc-blue/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-lc-blue shrink-0" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-lc-blue bg-lc-blue/10 px-1.5 py-0.5 rounded">
                    6 lessons
                  </span>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-lc-text3">
                  {preset.level}
                </span>
              </div>
              <h3 className="font-semibold text-lc-text leading-snug">{preset.title}</h3>
              <p className="text-xs text-lc-text3 mt-2 line-clamp-3">{preset.blurb}</p>
              <div className="mt-4 text-xs font-semibold text-lc-blue">Use preset</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const router = useRouter();
  const { setSourceMaterial, setTopic } = usePlannerStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LibraryTab>('videos');

  async function handleSelect(talkId: string, source: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/source/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: source, payload: talkId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setError(
          (data && typeof data.error === 'string' && data.error) ||
            "Couldn't load that material. It may be temporarily unavailable - please try another or try again.",
        );
        return;
      }
      const material: SourceMaterial = {
        sourceType: data.sourceType,
        sourceKey: data.sourceKey,
        title: data.title,
        summary: data.summary,
        duration: data.duration,
        ...(data.rawText ? { rawText: data.rawText } : {}),
        ...(data.slides ? { slides: data.slides } : {}),
      };
      setSourceMaterial(material);
      setTopic(data.title);
      router.push('/lesson-planner');
    } catch {
      setError("Couldn't load that material. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="shrink-0 border-b border-lc-border bg-lc-card px-6 py-2 flex items-center gap-1">
        {LIBRARY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                isActive ? 'bg-lc-text text-lc-bg' : 'text-lc-text3 hover:text-lc-text hover:bg-lc-surface'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="shrink-0 flex items-center gap-3 px-6 py-2.5 bg-red-950/40 border-b border-red-800/40 text-sm text-red-300">
          <span className="grow">{error}</span>
          <button
            onClick={() => setError(null)}
            className="shrink-0 p-1 rounded-md text-red-300/70 hover:text-red-200 hover:bg-red-900/40 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-lc-bg/80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-lc-amber border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-lc-text3">Loading...</p>
            </div>
          </div>
        )}

        {activeTab === 'videos' && <VideoLibraryModal mode="page" onSelect={handleSelect} />}
        {activeTab === 'texts' && <TextLibraryModal mode="page" onSelect={handleSelect} />}
        {activeTab === 'flight-plans' && (
          <ComingSoonState
            title="Flight Plans coming soon"
            description="Curated, ready-to-run lesson plans - pick one and you're off. Hand-crafted by LessonCaptain for quality from day one."
          />
        )}
        {activeTab === 'courses' && <CoursePresetLibrary />}
      </div>
    </div>
  );
}
