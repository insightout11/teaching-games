'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ClassPlaneSprite } from '@/components/ui/class-plane-sprite';

export type GateScene = 'gate' | 'route' | 'preflight';

interface GateSceneOverlayProps {
  scene?: GateScene;
}

const LIGHT_COUNT = 13;

function TerminalSilhouette() {
  return (
    <svg
      width="340"
      height="168"
      viewBox="0 0 340 168"
      fill="none"
      aria-hidden
      style={{ display: 'block' }}
    >
      {/* Terminal wing */}
      <rect x="0" y="94" width="274" height="74" fill="#050b15" />
      {/* Central tower */}
      <rect x="128" y="52" width="74" height="116" fill="#050b15" />
      {/* Tower cab */}
      <rect x="114" y="28" width="102" height="36" fill="#060d1a" />
      {/* Control tower windows */}
      <rect x="124" y="35" width="16" height="11" fill="rgba(80,160,255,0.09)" />
      <rect x="148" y="35" width="16" height="11" fill="rgba(80,160,255,0.09)" />
      <rect x="172" y="35" width="16" height="11" fill="rgba(80,160,255,0.09)" />
      {/* Tower beacon */}
      <circle cx="165" cy="22" r="3" fill="rgba(255,80,30,0.35)" />
      {/* Jetway arm extending right */}
      <rect x="274" y="112" width="66" height="12" fill="#050b15" />
      <rect x="338" y="106" width="2" height="24" fill="#050b15" />
      {/* Terminal facade windows */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect
          key={i}
          x={10 + i * 36}
          y={104}
          width={18}
          height={12}
          fill="rgba(80,140,220,0.05)"
        />
      ))}
    </svg>
  );
}

export function GateSceneOverlay({ scene = 'gate' }: GateSceneOverlayProps) {
  const prefersReducedMotion = useReducedMotion();
  const isPreflight = scene === 'preflight';

  return (
    <>
      {/* Terminal building silhouette — behind plane, very faint */}
      <div
        className="absolute bottom-0 right-0 pointer-events-none select-none"
        style={{ opacity: isPreflight ? 0.16 : 0.10 }}
        aria-hidden
      >
        <TerminalSilhouette />
      </div>

      {/* Apron warmth glow beneath the plane */}
      <div
        className="absolute bottom-0 right-0 pointer-events-none"
        style={{
          width: 420,
          height: 150,
          background:
            'radial-gradient(ellipse at 55% 100%, rgba(200,85,15,0.20) 0%, transparent 68%)',
        }}
        aria-hidden
      />

      {/* Parked plane — idle engine vibration */}
      <motion.div
        className="absolute bottom-0 right-0 pointer-events-none select-none"
        style={{ opacity: isPreflight ? 0.52 : 0.40, marginRight: -20 }}
        animate={
          prefersReducedMotion
            ? undefined
            : { y: [0, -2, 0], rotate: [0, 0.18, 0, -0.18, 0] }
        }
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      >
        <ClassPlaneSprite size="xl" variant="parked" />
      </motion.div>

      {/* Apron edge lights — row at bottom of content area */}
      <div
        className="absolute bottom-2 pointer-events-none"
        style={{ left: '16rem', right: 0 }}
        aria-hidden
      >
        <div className="flex justify-between px-8">
          {Array.from({ length: LIGHT_COUNT }, (_, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              style={{
                width: 4,
                height: 4,
                background: 'rgba(255,162,38,0.90)',
                boxShadow: '0 0 5px 2px rgba(255,138,18,0.40)',
              }}
              animate={
                prefersReducedMotion
                  ? undefined
                  : {
                      opacity: [
                        isPreflight ? 0.55 : 0.32,
                        isPreflight ? 1.0  : 0.82,
                        isPreflight ? 0.55 : 0.32,
                      ],
                    }
              }
              transition={{
                duration: 2.1,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: (i * 0.17) % 2.1,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
