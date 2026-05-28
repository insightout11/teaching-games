// Shared visual tokens for the FlightEnvironment animation system.
// Extracted from existing sky-background, flight-plan, flight-transition-overlay,
// runway-plane-scene, and takeoff-spark components.
// Do NOT add scene-specific or component-local geometry here — these are only
// tokens that cross-component narrative work will reference.

// ─── Sky palette ──────────────────────────────────────────────────────────────

export const SKY_COLORS = {
  navyDeep:    '#02060E',  // sky top, idle
  navyMid:     '#07142A',  // sky mid, idle
  navyBase:    '#0D2242',  // sky bottom, idle
  cruiseDeep:  '#010306',  // sky top, cruising
  panelBg:     '#0a1a2e',  // glassy panel background
  panelBgDark: '#07111f',  // darker panel variant (flight-plan, transition card)
} as const;

// ─── Route / navigation ───────────────────────────────────────────────────────

export const ROUTE_COLORS = {
  cyanPrimary: '#54F3FF',          // route gradient mid, node dots
  cyanGlow:    'rgba(95, 226, 255, 0.20)',
  cyanTrail:   '#4DA3FF',          // TakeoffSpark trail start
  trailHigh:   '#8FE8FF',          // TakeoffSpark trail peak
  routeStart:  '#76FFD0',          // route gradient left anchor
  routeEnd:    '#C38BFF',          // route gradient right anchor
} as const;

// ─── Runway / takeoff ─────────────────────────────────────────────────────────

export const RUNWAY_COLORS = {
  amberLight:  '#FFE8A0',              // runway edge lights (takeoff)
  amberGlow:   'rgba(255,162,38,0.92)',
  amberStripe: 'rgba(205,170,55,0.45)',
  beaconRed:   '#FF6020',              // control tower beacon
} as const;

// ─── Arrival / success ────────────────────────────────────────────────────────

export const ARRIVAL_COLORS = {
  landGreen:    '#2a7040',               // landmass (flight-plan globe)
  successGlow:  'rgba(52,235,170,0.14)', // hover glow (flight-plan panel)
} as const;

// ─── Opacity ranges ───────────────────────────────────────────────────────────

export const OPACITY = {
  cloudFar:    0.38,  // idle far-cloud
  cloudMid:    0.54,  // idle mid-cloud
  cloudNear:   0.70,  // idle near-cloud
  panelBorder: 0.11,  // glassy panel border white alpha
  panelBg:     0.70,  // translucent panel background alpha
} as const;

// ─── Easing curves ────────────────────────────────────────────────────────────

export const EASE = {
  snappy:     [0.22, 1, 0.36, 1] as const,  // used throughout flight-plan.tsx
  atmosphere: 'easeInOut' as const,           // sky/cloud state transitions
  travel:     'linear' as const,              // constant-speed plane flight
  spark:      'easeOut' as const,             // burst / spark reveals
} as const;

// ─── Glow / blur ──────────────────────────────────────────────────────────────

export const GLOW = {
  routeBloom:   14,                       // feGaussianBlur — route bloom
  routeGlow:     6,                       // feGaussianBlur — route glow
  nodeGlow:      5,                       // feGaussianBlur — node pulse
  planeGlow:     8,                       // feGaussianBlur — plane icon
  sparkGlow:     4,                       // feGaussianBlur — TakeoffSpark
  runwayAmber:  'rgba(255,138,18,0.5)',   // runway light box-shadow color
} as const;

// ─── Parallax speed ratios ────────────────────────────────────────────────────
// All values are px-shift at altitude=1.0. Earth slowest, near-clouds fastest.
// Source: SkyBackground altitude multipliers.

export const PARALLAX = {
  earthShift:       80,   // earth layer px at altitude 1.0
  farCloudShift:    70,
  midCloudShift:   130,
  nearCloudShift:  200,
  defaultDuration:   4,   // seconds for parallax transitions
  travelDuration:  2.8,   // seconds for module-transition plane travel
} as const;

// ─── z-index layer conventions ────────────────────────────────────────────────
// Mirrors SkyBackground's internal stacking plus overlay and transition layers.

export const Z = {
  skyGradient:     0,
  horizonGlow:     1,
  stars:           2,
  moon:            2,
  earth:           3,
  cloudsFar:       4,
  cloudsMid:       5,
  cloudsNear:      6,
  sceneOverlay:    8,   // FlightEnvironment children overlay slot
  transitionMist:  7,
  transitionPlane: 10,
  transitionCard:  20,
  transitionRoot:  60,
} as const;
