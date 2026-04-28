'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VideoLibraryModal } from '@/components/planner/video-library-modal';
import { TextLibraryModal } from '@/components/planner/text-library-modal';
import { usePlannerStore } from '@/stores/planner-store';
import type { SourceMaterial } from '@/types/source-material';
import { BookOpen, Video, Map, GraduationCap, type LucideIcon } from 'lucide-react';

type LibraryTab = 'videos' | 'texts' | 'flight-plans' | 'courses';

const LIBRARY_TABS: { key: LibraryTab; label: string; icon: LucideIcon }[] = [
  { key: 'videos',       label: 'Videos',       icon: Video        },
  { key: 'texts',        label: 'Texts',         icon: BookOpen     },
  { key: 'flight-plans', label: 'Flight Plans',  icon: Map          },
  { key: 'courses',      label: 'Courses',       icon: GraduationCap },
];

function ComingSoonState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-4">
      <p className="text-4xl">🚀</p>
      <h3 className="text-lg font-semibold text-lc-text">{title}</h3>
      <p className="text-sm text-lc-text3 max-w-md">{description}</p>
    </div>
  );
}

export default function LibraryPage() {
  const router = useRouter();
  const { setSourceMaterial, setTopic } = usePlannerStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<LibraryTab>('videos');

  async function handleSelect(talkId: string, source: string) {
    setLoading(true);
    try {
      const res = await fetch('/api/source/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: source, payload: talkId }),
      });
      const data = await res.json();
      if (!res.ok) return;
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Top-level type tabs */}
      <div className="shrink-0 border-b border-lc-border bg-lc-card px-6 py-2 flex items-center gap-1">
        {LIBRARY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-lc-text text-lc-bg'
                  : 'text-lc-text3 hover:text-lc-text hover:bg-lc-surface'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-lc-bg/80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-lc-amber border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-lc-text3">Loading…</p>
            </div>
          </div>
        )}

        {activeTab === 'videos' && (
          <VideoLibraryModal mode="page" onSelect={handleSelect} />
        )}
        {activeTab === 'texts' && (
          <TextLibraryModal mode="page" onSelect={handleSelect} />
        )}
        {activeTab === 'flight-plans' && (
          <ComingSoonState
            title="Flight Plans coming soon"
            description="Curated, ready-to-run lesson plans — pick one and you're off. Hand-crafted by LessonCaptain for quality from day one."
          />
        )}
        {activeTab === 'courses' && (
          <ComingSoonState
            title="Courses coming soon"
            description="Multi-lesson sequences around a theme or skill — browse, start from where you left off, and customise as you go."
          />
        )}
      </div>
    </div>
  );
}
