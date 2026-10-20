import type { TabooRound } from '@/activities/types';
import type { TabooPhoneCard } from '@/components/student/taboo-sprint-panel';
import type { HotSeatCard } from '@/components/student/hot-seat-panel';
import type { FreePicture } from '@/lib/sources/wikimedia-images';

// These builders are used only inside the permitted student's private entry.
export function tabooDescriberCard(card: TabooRound, picture: FreePicture | null): TabooPhoneCard {
  return { role: 'describer', word: card.word, forbidden: card.forbiddenWords, picture };
}
export function hotSeatClueCard(card: TabooRound, picture: FreePicture | null, yourTurn: boolean): HotSeatCard {
  return { role: 'clue', word: card.word, hint: card.description, picture, yourTurn };
}
