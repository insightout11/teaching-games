import { LibraryHome } from '@/components/library/library-home';
import { libraryShelves } from '@/lib/library-shelves';

// Library: one search over everything, rows of picks, and the full browsers behind "All videos" / "All texts".
export default function LibraryPage() {
  return <LibraryHome shelves={libraryShelves()} />;
}
