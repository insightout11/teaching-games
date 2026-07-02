import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { BookOpen, Globe2 } from 'lucide-react';

type ShareTab = 'journey' | 'logbook';

export function PublicShareHeader({
  activeTab,
  journeyHref,
  logbookHref,
  label,
}: {
  activeTab: ShareTab;
  journeyHref?: string | null;
  logbookHref?: string | null;
  label: string;
}) {
  return (
    <header className="border-b border-cyan-200/15 bg-[#071522]/92 px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.26)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="inline-flex w-fit items-center">
          <Image
            src="/lessoncaptain-logo-on-dark-v2.svg"
            alt="LessonCaptain"
            width={170}
            height={28}
            className="h-7 w-auto"
            priority
            unoptimized
          />
        </Link>

        <div className="flex flex-col gap-3 sm:items-end">
          <span className="font-instrument text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100/60">
            {label}
          </span>
          <nav className="grid w-full grid-cols-2 overflow-hidden rounded-md border border-cyan-200/18 bg-slate-950/55 p-1 sm:w-auto" aria-label="Public class share pages">
            <ShareTabLink
              active={activeTab === 'journey'}
              href={journeyHref}
              icon={<Globe2 className="h-3.5 w-3.5" aria-hidden />}
              label="Journey"
            />
            <ShareTabLink
              active={activeTab === 'logbook'}
              href={logbookHref}
              icon={<BookOpen className="h-3.5 w-3.5" aria-hidden />}
              label="Logbook"
            />
          </nav>
        </div>
      </div>
    </header>
  );
}

function ShareTabLink({
  active,
  href,
  icon,
  label,
}: {
  active: boolean;
  href?: string | null;
  icon: ReactNode;
  label: string;
}) {
  const classes = [
    'inline-flex min-h-9 items-center justify-center gap-1.5 rounded px-3 text-xs font-bold transition-colors',
    active ? 'bg-lc-blue text-[#07111f]' : 'text-cyan-100/74',
    href && !active ? 'hover:bg-cyan-300/[0.1] hover:text-cyan-50' : '',
    !href && !active ? 'cursor-not-allowed opacity-45' : '',
  ].join(' ');

  if (!href || active) {
    return (
      <span className={classes} aria-current={active ? 'page' : undefined} aria-disabled={!href && !active}>
        {icon}
        {label}
      </span>
    );
  }

  return (
    <Link href={href} className={classes}>
      {icon}
      {label}
    </Link>
  );
}
