import { CrewCharacter } from '@/components/ui/crew-character';
import { resolveLook } from '@/lib/crew-look';

const WINGS_INSIGNIA_URL = '/avatars/insignia-captain-wings.png';

interface CrewAvatarProps {
  /** Avatar seed: a crew look code ("c1-…") or an older helmet / captain-cap seed. */
  seed?: string | null;
  /** Student name — used to derive a deterministic look when seed is missing. */
  name?: string;
  /** Render the Captain-of-the-Day wings insignia over the avatar. */
  captain?: boolean;
  /** Rendered square size in px. */
  size?: number;
  /** Extra classes on the avatar (kept for callers; characters carry their own sticker outline). */
  className?: string;
}

/**
 * A student's crew character with an optional Captain-of-the-Day wings overlay. Single source
 * of truth for rendering crew avatars so the look is the same everywhere it appears. Old seeds
 * (flight helmets, captain caps) render as a character wearing that headgear.
 */
export function CrewAvatar({ seed, name = '', captain = false, size = 40, className }: CrewAvatarProps) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <CrewCharacter look={resolveLook(seed, name)} size={size} className={className?.replace(/\brounded\S*/g, '').trim() || undefined} title={name || undefined} />
      {captain && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={WINGS_INSIGNIA_URL}
          alt="Captain of the Day"
          className="pointer-events-none absolute left-1/2 -bottom-[15%] w-[70%] -translate-x-1/2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
        />
      )}
    </span>
  );
}
