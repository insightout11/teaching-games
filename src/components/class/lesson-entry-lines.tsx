import { BookOpen, Compass, MessageCircle, PlaneTakeoff } from 'lucide-react';
import type { LessonEntry } from '@/lib/lesson-memory';

/**
 * Live memory step 2: what a lesson covered (topics, words, activities, material explored), from the room's lesson
 * record. Teacher-facing; no names, no individual answers, nothing about how the teacher did.
 */
export function LessonEntryLines({ entry, compact = false }: { entry: LessonEntry; compact?: boolean }) {
  const row = 'flex items-start gap-2 text-sm text-lc-text2';
  const icon = 'mt-0.5 h-3.5 w-3.5 shrink-0 text-lc-blue';
  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      {entry.topics.length > 0 && (
        <p className={row}><MessageCircle className={icon} aria-hidden /><span><span className="text-lc-text3">Talked about </span>{entry.topics.join(' → ')}</span></p>
      )}
      {entry.words.length > 0 && (
        <p className={row}><BookOpen className={icon} aria-hidden /><span><span className="text-lc-text3">Words </span>{entry.words.join(', ')}{entry.moreWords > 0 ? ` +${entry.moreWords} more` : ''}</span></p>
      )}
      {entry.activities.length > 0 && (
        <p className={row}><PlaneTakeoff className={icon} aria-hidden /><span><span className="text-lc-text3">Did </span>{entry.activities.join(', ')}</span></p>
      )}
      {!compact && entry.explored > 0 && (
        <p className={row}><Compass className={icon} aria-hidden /><span><span className="text-lc-text3">Explored </span>{entry.explored} item{entry.explored === 1 ? '' : 's'} from Sources</span></p>
      )}
    </div>
  );
}
