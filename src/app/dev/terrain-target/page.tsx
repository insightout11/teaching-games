import { notFound } from 'next/navigation';

// Dev-only: the target look for the poster terrain style (a hand-drawn reference for Terra), 1280x720.
export const dynamic = 'force-dynamic';

const SKY = ['#5b86c4', '#9bbbe0', '#f2d6c0'];
// palette (day): lit faces warm, shade blue-violet, snow cream/lavender, haze sky-tinted
const C = { far: '#b9b4d6', farSnow: '#e9e3f2', midShade: '#7b7bb0', midLit: '#d9a99a', snowLit: '#fbf1df', snowShade: '#c3bde0', nearShade: '#4e5a92', nearLit: '#b98b86', ridge: '#3b4478', haze: '#f3e2d8' };

export default function TerrainTargetPage() {
  if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PUBLIC_DEV_ROUTES !== '1') notFound();
  return (
    <main style={{ background: '#0b1220', minHeight: '100vh', padding: 16 }}>
      <svg id="target" viewBox="0 0 1280 720" width="1280" height="720" style={{ maxWidth: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={SKY[0]} /><stop offset=".55" stopColor={SKY[1]} /><stop offset="1" stopColor={SKY[2]} /></linearGradient>
          <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.haze} stopOpacity="0" /><stop offset=".6" stopColor={C.haze} stopOpacity=".75" /><stop offset="1" stopColor={C.haze} stopOpacity="0" /></linearGradient>
          <radialGradient id="sun"><stop offset="0" stopColor="#fff6dc" /><stop offset=".4" stopColor="#ffe9b8" stopOpacity=".8" /><stop offset="1" stopColor="#ffe9b8" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="1280" height="720" fill="url(#sky)" />
        <circle cx="1010" cy="170" r="150" fill="url(#sun)" />
        <circle cx="1010" cy="170" r="34" fill="#fff4d6" />
        {/* far range: one flat pale layer, simple silhouette */}
        <path d="M0 430 L70 395 L120 410 L190 360 L250 395 L320 350 L390 388 L470 340 L540 380 L600 362 L690 398 L760 352 L840 390 L910 345 L990 382 L1060 356 L1150 392 L1220 366 L1280 380 L1280 470 L0 470Z" fill={C.far} />
        <path d="M190 360 L212 373 L198 378Z M320 350 L344 366 L330 368Z M470 340 L497 357 L480 360Z M760 352 L784 366 L770 369Z M910 345 L936 361 L922 363Z" fill={C.farSnow} />
        <rect y="380" width="1280" height="110" fill="url(#haze)" />
        {/* mid range: two bands of light, cream snow on the lit side, lavender in shade */}
        <path d="M0 520 L90 450 L150 478 L230 420 L300 470 L370 430 L430 466 L470 452 L520 500 L0 560Z" fill={C.midShade} />
        <path d="M90 450 L150 478 L120 500 L60 490Z M230 420 L300 470 L250 486 L205 455Z M370 430 L430 466 L392 480 L352 458Z" fill={C.midLit} />
        <path d="M230 420 L252 436 L238 444 L222 432Z M370 430 L388 442 L374 448 L360 440Z" fill={C.snowLit} />
        <path d="M820 500 L880 446 L940 474 L1010 424 L1080 468 L1150 438 L1230 474 L1280 460 L1280 560 L800 560Z" fill={C.midShade} />
        <path d="M880 446 L940 474 L905 490 L862 470Z M1010 424 L1080 468 L1040 482 L992 452Z M1150 438 L1230 474 L1190 486 L1132 460Z" fill={C.midLit} />
        <path d="M1010 424 L1030 438 L1016 446 L1000 436Z" fill={C.snowLit} />
        {/* EVEREST: the crispest, biggest shape; three clear faces, banded light, snow, a wind plume */}
        <path d="M640 228 C700 232 760 230 840 214 C780 236 720 244 660 240Z" fill="#ffffff" opacity=".7" />
        <path d="M640 228 L520 470 L780 470Z" fill={C.midShade} />
        <path d="M640 228 L700 300 L780 470 L690 470 L660 360Z" fill={C.nearShade} />
        <path d="M640 228 L560 390 L600 400 L650 330Z" fill={C.midLit} />
        <path d="M640 228 L598 312 L622 318 L648 268Z" fill={C.snowLit} />
        <path d="M640 228 L668 282 L652 300 L644 262Z" fill={C.snowShade} />
        <path d="M560 390 L540 430 L575 436 L600 400Z M610 410 L590 452 L630 460 L645 420Z" fill={C.snowLit} opacity=".9" />
        <path d="M640 228 L700 300 M640 228 L560 390" stroke={C.ridge} strokeWidth="2.2" fill="none" strokeLinejoin="round" />
        {/* Lhotse and Nuptse beside it, smaller, softer */}
        <path d="M760 300 L700 470 L860 470Z" fill={C.midShade} /><path d="M760 300 L728 390 L752 396 L770 330Z" fill={C.midLit} /><path d="M760 300 L744 344 L758 348 L766 318Z" fill={C.snowLit} />
        <path d="M500 330 L430 470 L580 470Z" fill={C.midShade} /><path d="M500 330 L462 410 L486 414 L506 360Z" fill={C.midLit} /><path d="M500 330 L482 368 L496 372 L506 348Z" fill={C.snowLit} />
        {/* foothills under the massif, filling the centre */}
        <path d="M420 560 L470 500 L540 520 L610 486 L690 518 L760 490 L840 524 L880 560Z" fill={C.midShade} />
        <path d="M470 500 L540 520 L505 532 L455 518Z M610 486 L690 518 L650 530 L598 504Z M760 490 L840 524 L800 534 L752 508Z" fill={C.midLit} />
        <rect y="440" width="1280" height="80" fill="url(#haze)" opacity=".8" />
        {/* near ridges: darkest, simple, warm rim light, snow streaks */}
        <path d="M0 720 L0 560 L120 500 L230 548 L330 506 L460 566 L560 530 L700 590 L820 540 L950 588 L1060 532 L1180 570 L1280 540 L1280 720Z" fill={C.nearShade} />
        <path d="M120 500 L230 548 L190 556 L110 520Z M330 506 L460 566 L410 572 L320 530Z M820 540 L950 588 L900 594 L810 560Z M1060 532 L1180 570 L1130 578 L1050 552Z" fill={C.nearLit} />
        <path d="M120 500 L148 514 L132 520Z M330 506 L360 520 L342 526Z M1060 532 L1088 546 L1072 551Z" fill={C.snowLit} />
        <path d="M0 560 L120 500 L230 548 L330 506 L460 566 L560 530 L700 590 L820 540 L950 588 L1060 532 L1180 570 L1280 540" stroke={C.ridge} strokeWidth="2" fill="none" strokeLinejoin="round" />
        {/* valley mist */}
        <ellipse cx="380" cy="600" rx="260" ry="18" fill="#ffffff" opacity=".35" /><ellipse cx="930" cy="630" rx="300" ry="16" fill="#ffffff" opacity=".3" />
      </svg>
    </main>
  );
}
