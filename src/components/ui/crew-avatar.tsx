import { avatarUrl } from '@/lib/avatar-options';

const WINGS_INSIGNIA_URL = '/avatars/insignia-captain-wings.png';

interface CrewAvatarProps {
  /** Avatar seed (helmet or captain cap). */
  seed?: string | null;
  /** Student name — used to derive a deterministic avatar when seed is missing. */
  name?: string;
  /** Render the Captain-of-the-Day wings insignia over the avatar. */
  captain?: boolean;
  /** Rendered square size in px. */
  size?: number;
  /** Extra classes on the avatar image (e.g. rounding). */
  className?: string;
}

/**
 * A student's avatar with an optional Captain-of-the-Day wings overlay. Single source of truth
 * for rendering crew avatars so the insignia looks the same everywhere it appears.
 */
export function CrewAvatar({ seed, name = '', captain = false, size = 40, className = 'rounded-lg' }: CrewAvatarProps) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatarUrl(seed, name)}
        alt=""
        width={size}
        height={size}
        className={`h-full w-full ${className}`}
      />
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
