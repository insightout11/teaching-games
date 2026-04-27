'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VideoLibraryModal } from '@/components/planner/video-library-modal';
import { usePlannerStore } from '@/stores/planner-store';
import type { SourceMaterial } from '@/types/source-material';

export default function LibraryPage() {
  const router = useRouter();
  const { setSourceMaterial, setTopic } = usePlannerStore();
  const [loading, setLoading] = useState(false);

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
      };
      setSourceMaterial(material);
      setTopic(data.title);
      router.push('/lesson-planner');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen relative">
      {loading && (
        <div className="absolute inset-0 z-10 bg-lc-bg/80 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-lc-amber border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-lc-text3">Loading video…</p>
          </div>
        </div>
      )}
      <VideoLibraryModal mode="page" onSelect={handleSelect} />
    </div>
  );
}
