import { BLEED_X, VIEWBOX, type ScenePalette } from '../types';
import type { DestinationScene } from '@/lib/world-flight/types';

// A local animal close to the camera, bottom left (Oct 2026, gallery first). With the framing branch top right it
// frames the landing on the diagonal. It pops up into view watching the plane, notices the camera after ~2 s (eyes snap to you,
// go wide, ears perk with a little hop), then pulls a cheeky face: a big grin, one eyebrow up, rosy cheeks. Then it
// stays, alive: blinks, flicks an ear, glances back at the plane now and then. Real animals of the place only, drawn
// head and shoulders, cut off by the bottom of the picture, in the scene's own light.

export type AnimalKind =
  | 'tanuki'
  | 'red-fox'
  | 'kangaroo'
  | 'fennec'
  | 'capybara'
  | 'sand-cat'
  | 'giraffe'
  | 'hedgehog'
  | 'giant-panda'
  | 'otter'
  | 'penguin'
  | 'raccoon'
  | 'monkey'
  | 'puffin'
  | 'heron'
  | 'elephant'
  | 'red-squirrel'
  | 'brown-bear'
  | 'street-cat'
  | 'wolf'
  | 'takhi'
  | 'snow-leopard'
  | 'gelada'
  | 'peacock';

// Oct 2026: done for Dubai's starter-plane range first (plus Tokyo, Paris, Sydney, Rio and Beijing). Hedgehog, puffin,
// penguin, otter and raccoon are drawn but not yet on-model, so their cities are left out until they are redrawn.
const BY_CITY: Record<string, AnimalKind> = {
  dubai: 'fennec',
  tokyo: 'tanuki',
  paris: 'red-fox',
  sydney: 'kangaroo',
  rio: 'capybara',
  cairo: 'sand-cat',
  nairobi: 'giraffe',
  mumbai: 'monkey',
  amsterdam: 'heron',
  bangkok: 'elephant',
  beijing: 'giant-panda',
  berlin: 'red-squirrel',
  moscow: 'brown-bear',
  istanbul: 'street-cat',
  rome: 'wolf',
  ulaanbaatar: 'takhi',
  almaty: 'snow-leopard',
  addisababa: 'gelada',
  delhi: 'peacock',
};

export const ANIMAL_NAME: Record<AnimalKind, string> = {
  'red-squirrel': 'Red squirrel',
  'brown-bear': 'Brown bear',
  'street-cat': 'Istanbul street cat',
  wolf: 'Italian wolf',
  takhi: 'Przewalski horse (takhi)',
  'snow-leopard': 'Snow leopard',
  gelada: 'Gelada',
  peacock: 'Indian peafowl (peacock)',
  tanuki: 'Tanuki (raccoon dog)',
  'red-fox': 'Red fox',
  kangaroo: 'Eastern grey kangaroo',
  fennec: 'Fennec fox',
  capybara: 'Capybara',
  'sand-cat': 'Sand cat',
  giraffe: 'Giraffe',
  hedgehog: 'European hedgehog',
  'giant-panda': 'Giant panda',
  otter: 'Smooth-coated otter',
  penguin: 'African penguin',
  raccoon: 'Raccoon',
  monkey: 'Bonnet macaque',
  puffin: 'Atlantic puffin',
  heron: 'Grey heron',
  elephant: 'Asian elephant',
};

export function animalFor(scene: DestinationScene): AnimalKind | null {
  return (scene.skylineVariant && BY_CITY[scene.skylineVariant]) || null;
}

const hex = (c: string) => {
  const m = c.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
function mix(a: string, b: string, t: number) {
  const x = hex(a), y = hex(b);
  if (!x || !y) return a;
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

/** Fur colours per animal: main, shade, light (cheeks, muzzle, inner ear), dark (mask, nose, ear backs). */
const FUR: Record<AnimalKind, [string, string, string, string]> = {
  'red-squirrel': ['#c0602f', '#8f4120', '#f4e6d2', '#3a2216'],
  'brown-bear': ['#7a5537', '#553a24', '#c9a27c', '#24170e'],
  'street-cat': ['#b08a5e', '#7d5f3d', '#f1e3cc', '#3b2a1c'],
  wolf: ['#8d8579', '#625b52', '#ece5d8', '#25211d'],
  takhi: ['#c7a171', '#97744a', '#f1e2c6', '#2f2418'],
  'snow-leopard': ['#d9d3c6', '#aaa294', '#f6f3ec', '#4a443c'],
  gelada: ['#9b7b58', '#6d5438', '#d9bd98', '#2a1d14'],
  peacock: ['#2a5fa8', '#1d4377', '#e9eef6', '#14243d'],
  tanuki: ['#8a7660', '#62523f', '#e2d4b8', '#2e2620'],
  'red-fox': ['#d4743a', '#a5512a', '#f6ece0', '#3a2a22'],
  kangaroo: ['#ad9174', '#806850', '#eadcc6', '#3d3128'],
  fennec: ['#e5cb9e', '#c2a072', '#faf2e2', '#4a3a2c'],
  capybara: ['#96724d', '#6e5033', '#cbaf8a', '#302217'],
  'sand-cat': ['#d4b080', '#a78354', '#f7f0e1', '#4a3322'],
  giraffe: ['#dea143', '#ad7024', '#faeed4', '#5c2e14'],
  hedgehog: ['#826954', '#5c4635', '#ebdcc4', '#261b14'],
  'giant-panda': ['#f0ece1', '#cfc7b4', '#faf7f0', '#1e1c1f'],
  otter: ['#634b35', '#443121', '#ebdcc7', '#241a12'],
  penguin: ['#24262c', '#17191d', '#f2f0eb', '#111214'],
  raccoon: ['#767571', '#4f4e4b', '#f2eee4', '#1a1918'],
  monkey: ['#947f60', '#68543a', '#dfc2a6', '#2b1f15'],
  puffin: ['#24262c', '#17181c', '#ea632d', '#121316'],
  heron: ['#8e9ba6', '#64727d', '#e8a735', '#1a1d22'],
  elephant: ['#767982', '#50535b', '#dfb8b0', '#24262a'],
};

/** Face layout per animal (all drawn facing the camera, head centre at 0,0, body below). */
interface Face {
  head: string; // head outline path
  ears: [string, string]; // left, right outer ear
  inner: [string, string]; // inner ears
  muzzle: string;
  eyeY: number;
  eyeDX: number;
  eyeR: number;
  noseY: number;
  mask?: string; // tanuki's dark eye mask
  shoulders: string;
  /** Extra shapes that ears and a muzzle can't make: a trunk, a beak, a crest, spots, a mane. `line` draws strokes. */
  extra?: Array<{ d: string; tone: string; behind?: boolean; line?: boolean }>;
  /** No nose dot (beaks, trunks). */
  noNose?: boolean;
  /** No mouth (a beak or trunk is in the way); the cheeky face is then the eyes, brow and cheeks. */
  noMouth?: boolean;
}

const FACES = {
  tanuki: {
    head: 'M -78 -6 C -84 -60 -46 -96 0 -96 C 46 -96 84 -60 78 -6 C 72 40 34 58 0 58 C -34 58 -72 40 -78 -6 Z',
    ears: ['M -66 -62 C -76 -96 -52 -112 -34 -92 Z', 'M 66 -62 C 76 -96 52 -112 34 -92 Z'],
    inner: ['M -60 -70 C -64 -90 -52 -98 -42 -88 Z', 'M 60 -70 C 64 -90 52 -98 42 -88 Z'],
    muzzle: 'M -34 18 C -36 -6 36 -6 34 18 C 30 46 -30 46 -34 18 Z',
    eyeY: -20, eyeDX: 32, eyeR: 9, noseY: 6,
    mask: 'M -70 -18 C -66 -46 -30 -46 -12 -16 C -6 -2 -24 14 -44 10 C -60 6 -72 -2 -70 -18 Z M 70 -18 C 66 -46 30 -46 12 -16 C 6 -2 24 14 44 10 C 60 6 72 -2 70 -18 Z',
    shoulders: 'M -120 200 C -120 90 -80 40 0 40 C 80 40 120 90 120 200 Z',
  },
  'red-fox': {
    head: 'M -82 -30 C -72 -70 -36 -90 0 -90 C 36 -90 72 -70 82 -30 C 70 6 30 54 0 70 C -30 54 -70 6 -82 -30 Z',
    ears: ['M -70 -56 L -60 -150 L -18 -84 Z', 'M 70 -56 L 60 -150 L 18 -84 Z'],
    inner: ['M -60 -66 L -55 -126 L -30 -86 Z', 'M 60 -66 L 55 -126 L 30 -86 Z'],
    muzzle: 'M -82 -28 C -50 -16 -26 4 0 4 C 26 4 50 -16 82 -28 C 70 8 30 56 0 72 C -30 56 -70 8 -82 -28 Z',
    eyeY: -36, eyeDX: 30, eyeR: 8, noseY: 36,
    shoulders: 'M -112 200 C -112 100 -70 52 0 52 C 70 52 112 100 112 200 Z',
  },
  kangaroo: {
    head: 'M -56 -40 C -56 -86 -28 -104 0 -104 C 28 -104 56 -86 56 -40 C 56 6 34 60 0 72 C -34 60 -56 6 -56 -40 Z',
    ears: ['M -44 -80 C -66 -150 -44 -186 -24 -170 C -20 -130 -22 -104 -26 -92 Z', 'M 44 -80 C 66 -150 44 -186 24 -170 C 20 -130 22 -104 26 -92 Z'],
    inner: ['M -40 -96 C -54 -140 -42 -166 -32 -158 C -30 -128 -30 -110 -32 -100 Z', 'M 40 -96 C 54 -140 42 -166 32 -158 C 30 -128 30 -110 32 -100 Z'],
    muzzle: 'M -30 20 C -32 -4 32 -4 30 20 C 28 56 -28 56 -30 20 Z',
    eyeY: -40, eyeDX: 26, eyeR: 8.5, noseY: 36,
    shoulders: 'M -96 200 C -100 110 -60 56 0 56 C 60 56 100 110 96 200 Z',
  },
  fennec: {
    head: 'M -58 -20 C -58 -62 -30 -78 0 -78 C 30 -78 58 -62 58 -20 C 52 18 26 50 0 58 C -26 50 -52 18 -58 -20 Z',
    // the huge ears that let a fennec lose heat in the desert
    ears: ['M -46 -48 C -112 -110 -110 -196 -82 -204 C -50 -160 -26 -100 -20 -70 Z', 'M 46 -48 C 112 -110 110 -196 82 -204 C 50 -160 26 -100 20 -70 Z'],
    inner: ['M -44 -62 C -92 -112 -94 -170 -80 -180 C -58 -146 -40 -102 -32 -76 Z', 'M 44 -62 C 92 -112 94 -170 80 -180 C 58 -146 40 -102 32 -76 Z'],
    muzzle: 'M -26 14 C -28 -8 28 -8 26 14 C 24 42 -24 42 -26 14 Z',
    eyeY: -22, eyeDX: 24, eyeR: 9.5, noseY: 26,
    shoulders: 'M -92 200 C -92 104 -56 46 0 46 C 56 46 92 104 92 200 Z',
  },
  capybara: {
    head: 'M -64 -20 C -64 -68 -38 -86 0 -86 C 38 -86 64 -68 64 -20 C 64 24 52 64 0 64 C -52 64 -64 24 -64 -20 Z',
    ears: ['M -48 -74 C -60 -106 -36 -112 -28 -84 Z', 'M 48 -74 C 60 -106 36 -112 28 -84 Z'],
    inner: ['M -44 -78 C -52 -100 -36 -104 -32 -84 Z', 'M 44 -78 C 52 -100 36 -104 32 -84 Z'],
    muzzle: 'M -38 6 C -40 -12 40 -12 38 6 C 36 48 -36 48 -38 6 Z',
    eyeY: -24, eyeDX: 34, eyeR: 7.5, noseY: 18,
    shoulders: 'M -126 200 C -126 96 -86 48 0 48 C 86 48 126 96 126 200 Z',
  },
  'sand-cat': {
    head: 'M -74 -10 C -72 -54 -36 -74 0 -74 C 36 -74 72 -54 74 -10 C 72 32 40 56 0 62 C -40 56 -72 32 -74 -10 Z',
    ears: ['M -46 -48 C -104 -52 -112 -104 -88 -112 C -62 -96 -40 -76 -26 -62 Z', 'M 46 -48 C 104 -52 112 -104 88 -112 C 62 -96 40 -76 26 -62 Z'],
    inner: ['M -48 -56 C -92 -60 -98 -96 -84 -102 C -64 -90 -46 -74 -34 -64 Z', 'M 48 -56 C 92 -60 98 -96 84 -102 C 64 -90 46 -74 34 -64 Z'],
    mask: 'M -42 -8 C -54 2 -64 16 -68 28 C -64 28 -50 14 -38 2 Z M 42 -8 C 54 2 64 16 68 28 C 64 28 50 14 38 2 Z',
    muzzle: 'M -30 16 C -32 -4 32 -4 30 16 C 26 44 -26 44 -30 16 Z',
    eyeY: -18, eyeDX: 28, eyeR: 9.5, noseY: 16,
    shoulders: 'M -102 200 C -102 104 -64 54 0 54 C 64 54 102 104 102 200 Z',
  },
  giraffe: {
    head: 'M -40 -16 C -44 -64 -32 -88 -20 -88 C -24 -106 -12 -118 -16 -118 C -20 -118 -8 -118 -2 -94 C -1 -94 1 -94 2 -94 C 8 -118 20 -118 16 -118 C 12 -118 24 -106 20 -88 C 32 -88 44 -64 40 -16 C 36 24 26 62 0 68 C -26 62 -36 24 -40 -16 Z',
    ears: ['M -30 -64 C -84 -88 -96 -126 -64 -114 C -42 -100 -32 -80 -26 -72 Z', 'M 30 -64 C 84 -88 96 -126 64 -114 C 42 -100 32 -80 26 -72 Z'],
    inner: ['M -34 -68 C -72 -86 -82 -114 -60 -106 C -44 -94 -36 -80 -30 -74 Z', 'M 34 -68 C 72 -86 82 -114 60 -106 C 44 -94 36 -80 30 -74 Z'],
    mask: 'M -20 -120 C -22 -126 -10 -126 -12 -120 Z M 12 -120 C 10 -126 22 -126 20 -120 Z M -16 -60 C -16 -76 16 -76 16 -60 C 16 -44 -16 -44 -16 -60 Z M -32 -10 C -34 -26 -14 -26 -16 -10 C -18 6 -30 6 -32 -10 Z M 32 -10 C 34 -26 14 -26 16 -10 C 18 6 30 6 32 -10 Z',
    muzzle: 'M -24 26 C -26 6 26 6 24 26 C 22 52 -22 52 -24 26 Z',
    eyeY: -32, eyeDX: 28, eyeR: 8.5, noseY: 36,
    shoulders: 'M -44 200 L -36 44 C -36 30 -20 20 0 20 C 20 20 36 30 36 44 L 44 200 Z',
  },
  hedgehog: {
    head: 'M -72 -14 C -82 -48 -58 -88 0 -88 C 58 -88 82 -48 72 -14 C 64 36 36 60 0 60 C -36 60 -64 36 -72 -14 Z',
    ears: ['M -52 -54 C -68 -78 -46 -94 -34 -74 Z', 'M 52 -54 C 68 -78 46 -94 34 -74 Z'],
    inner: ['M -48 -60 C -58 -74 -44 -84 -38 -72 Z', 'M 48 -60 C 58 -74 44 -84 38 -72 Z'],
    mask: 'M -68 -16 C -74 -52 -50 -84 0 -84 C 50 -84 74 -52 68 -16 C 54 -30 30 -44 0 -44 C -30 -44 -54 -30 -68 -16 Z',
    muzzle: 'M -32 10 C -34 -10 34 -10 32 10 C 28 42 -28 42 -32 10 Z',
    eyeY: -20, eyeDX: 26, eyeR: 8.5, noseY: 16,
    shoulders: 'M -118 200 C -118 94 -76 46 0 46 C 76 46 118 94 118 200 Z',
  },
  'giant-panda': {
    head: 'M -76 -10 C -82 -60 -46 -92 0 -92 C 46 -92 82 -60 76 -10 C 70 42 36 62 0 62 C -36 62 -70 42 -76 -10 Z',
    ears: ['M -68 -54 C -84 -96 -46 -118 -28 -90 Z', 'M 68 -54 C 84 -96 46 -118 28 -90 Z'],
    inner: ['M 0 0 Z', 'M 0 0 Z'],
    mask: 'M -14 -22 C -12 -42 -34 -48 -46 -36 C -56 -24 -56 -4 -42 4 C -28 10 -16 -4 -14 -22 Z M 14 -22 C 12 -42 34 -48 46 -36 C 56 -24 56 -4 42 4 C 28 10 16 -4 14 -22 Z',
    muzzle: 'M -34 14 C -36 -8 36 -8 34 14 C 30 46 -30 46 -34 14 Z',
    eyeY: -20, eyeDX: 32, eyeR: 8.5, noseY: 10,
    shoulders: 'M -124 200 C -124 92 -80 44 0 44 C 80 44 124 92 124 200 Z',
  },
  otter: {
    head: 'M -70 -12 C -72 -54 -38 -76 0 -76 C 38 -76 72 -54 70 -12 C 68 34 36 56 0 56 C -36 56 -68 34 -70 -12 Z',
    ears: ['M -64 -26 C -82 -44 -64 -66 -48 -50 Z', 'M 64 -26 C 82 -44 64 -66 48 -50 Z'],
    inner: ['M -60 -30 C -72 -42 -60 -56 -50 -46 Z', 'M 60 -30 C 72 -42 60 -56 50 -46 Z'],
    mask: 'M -60 -24 C -56 -46 -28 -56 0 -56 C 28 -56 56 -46 60 -24 C 42 -36 18 -42 0 -42 C -18 -42 -42 -36 -60 -24 Z',
    muzzle: 'M -36 12 C -38 -8 38 -8 36 12 C 32 44 -32 44 -36 12 Z',
    eyeY: -18, eyeDX: 30, eyeR: 8.5, noseY: 12,
    shoulders: 'M -112 200 C -112 100 -70 48 0 48 C 70 48 112 100 112 200 Z',
  },
  penguin: {
    head: 'M -58 -16 C -60 -64 -34 -88 0 -88 C 34 -88 60 -64 58 -16 C 56 30 32 58 0 62 C -32 58 -56 30 -58 -16 Z',
    ears: ['M -38 -74 C -48 -88 -28 -96 -20 -82 Z', 'M 38 -74 C 48 -88 28 -96 20 -82 Z'],
    inner: ['M 0 0 Z', 'M 0 0 Z'],
    mask: 'M -46 -42 C -54 -24 -52 14 -32 30 C -26 34 -30 20 -38 10 C -44 0 -42 -22 -36 -36 Z M 46 -42 C 54 -24 52 14 32 30 C 26 34 30 20 38 10 C 44 0 42 -22 36 -36 Z',
    muzzle: 'M -16 16 C -18 6 18 6 16 16 C 12 50 -12 50 -16 16 Z',
    eyeY: -24, eyeDX: 26, eyeR: 8, noseY: 20,
    shoulders: 'M -106 200 C -106 100 -66 52 0 52 C 66 52 106 100 106 200 Z',
  },
  raccoon: {
    head: 'M -78 -16 C -82 -58 -44 -86 0 -86 C 44 -86 82 -58 78 -16 C 74 36 38 58 0 58 C -38 58 -74 36 -78 -16 Z',
    ears: ['M -60 -56 C -74 -96 -46 -112 -30 -86 Z', 'M 60 -56 C 74 -96 46 -112 30 -86 Z'],
    inner: ['M -54 -64 C -64 -88 -44 -100 -36 -82 Z', 'M 54 -64 C 64 -88 44 -100 36 -82 Z'],
    mask: 'M -72 -18 C -70 -42 -30 -44 -10 -22 C -6 -18 -4 -16 0 -16 C 4 -16 6 -18 10 -22 C 30 -44 70 -42 72 -18 C 66 6 42 12 18 2 C 10 -2 6 -2 0 -2 C -6 -2 -10 -2 -18 2 C -42 12 -66 6 -72 -18 Z',
    muzzle: 'M -28 12 C -30 -8 30 -8 28 12 C 24 44 -24 44 -28 12 Z',
    eyeY: -20, eyeDX: 32, eyeR: 8.5, noseY: 14,
    shoulders: 'M -118 200 C -118 96 -76 46 0 46 C 76 46 118 96 118 200 Z',
  },
  monkey: {
    head: 'M -72 -10 C -76 -56 -42 -84 0 -84 C 42 -84 76 -56 72 -10 C 66 38 34 58 0 58 C -34 58 -66 38 -72 -10 Z',
    ears: ['M -66 -28 C -94 -42 -96 -4 -70 12 Z', 'M 66 -28 C 94 -42 96 -4 70 12 Z'],
    inner: ['M -68 -22 C -86 -34 -88 -4 -70 6 Z', 'M 68 -22 C 86 -34 88 -4 70 6 Z'],
    mask: 'M -58 -32 C -60 -68 -32 -82 0 -82 C 32 -82 60 -68 58 -32 C 40 -50 16 -58 0 -58 C -16 -58 -40 -50 -58 -32 Z',
    muzzle: 'M -32 14 C -34 -8 34 -8 32 14 C 28 46 -28 46 -32 14 Z',
    eyeY: -20, eyeDX: 26, eyeR: 8.5, noseY: 14,
    shoulders: 'M -108 200 C -108 102 -68 50 0 50 C 68 50 108 102 108 200 Z',
  },
  puffin: {
    head: 'M -62 -14 C -64 -60 -36 -84 0 -84 C 36 -84 64 -60 62 -14 C 60 32 34 58 0 60 C -34 58 -60 32 -62 -14 Z',
    ears: ['M -42 -70 C -52 -86 -30 -94 -22 -80 Z', 'M 42 -70 C 52 -86 30 -94 22 -80 Z'],
    inner: ['M 0 0 Z', 'M 0 0 Z'],
    mask: 'M -62 -14 C -64 -60 -36 -84 0 -84 C 36 -84 64 -60 62 -14 C 44 -36 20 -44 0 -44 C -20 -44 -44 -36 -62 -14 Z',
    muzzle: 'M -24 6 C -28 -6 28 -6 24 6 C 20 54 0 68 0 68 C 0 68 -20 54 -24 6 Z',
    eyeY: -22, eyeDX: 30, eyeR: 8.5, noseY: 16,
    shoulders: 'M -110 200 C -110 102 -68 52 0 52 C 68 52 110 102 110 200 Z',
  },
  heron: {
    noNose: true,
    noMouth: true,
    extra: [
      // the long yellow dagger beak
      { d: 'M -14 -6 L 14 -6 L 2 120 Z', tone: '#e3a63a' },
      { d: 'M -2 -6 L 14 -6 L 2 120 Z', tone: '#c4862a' },
    ],
    head: 'M -44 -16 C -48 -58 -30 -82 0 -82 C 30 -82 48 -58 44 -16 C 40 26 26 56 0 60 C -26 56 -40 26 -44 -16 Z',
    ears: ['M -6 -78 C -40 -110 -96 -118 -128 -106 C -90 -100 -50 -90 -12 -68 Z', 'M 2 -80 C -26 -120 -70 -140 -108 -136 C -72 -124 -40 -104 -4 -72 Z'],
    inner: ['M 0 0 Z', 'M 0 0 Z'],
    mask: 'M -44 -18 C -44 -38 -20 -44 0 -44 C 20 -44 44 -38 44 -18 C 36 -26 18 -32 0 -32 C -18 -32 -36 -26 -44 -18 Z',
    muzzle: 'M -30 -2 C -32 -14 32 -14 30 -2 C 26 18 -26 18 -30 -2 Z',
    eyeY: -24, eyeDX: 24, eyeR: 8, noseY: 18,
    shoulders: 'M -56 200 L -38 52 C -38 42 -22 36 0 36 C 22 36 38 42 38 52 L 56 200 Z',
  },
  elephant: {
    noNose: true,
    noMouth: true,
    extra: [
      // the trunk, hanging down and curling up at the tip, with soft wrinkles
      { d: 'M -20 0 C -26 46 -22 92 -12 122 C -4 142 24 140 24 122 C 18 112 8 118 6 108 C 10 76 16 42 20 0 Z', tone: 'main' },
      { d: 'M -18 30 q 18 6 36 0 M -16 56 q 16 6 32 0 M -12 82 q 14 5 26 0', tone: 'shade', line: true },
      // small tusks
      { d: 'M -22 30 C -34 44 -36 58 -30 64 C -28 52 -24 42 -18 36 Z M 22 30 C 34 44 36 58 30 64 C 28 52 24 42 18 36 Z', tone: '#f4ecdc' },
    ],
    head: 'M -60 -10 C -64 -54 -44 -78 -20 -78 C -8 -78 0 -72 0 -72 C 0 -72 8 -78 20 -78 C 44 -78 64 -54 60 -10 C 56 30 32 54 0 56 C -32 54 -56 30 -60 -10 Z',
    ears: ['M -48 -50 C -170 -110 -188 60 -70 64 C -56 50 -50 20 -46 -10 Z', 'M 48 -50 C 170 -110 188 60 70 64 C 56 50 50 20 46 -10 Z'],
    inner: ['M -54 -38 C -150 -86 -160 46 -76 50 C -62 38 -56 16 -52 -6 Z', 'M 54 -38 C 150 -86 160 46 76 50 C 62 38 56 16 52 -6 Z'],
    mask: 'M -28 -48 C -14 -54 14 -54 28 -48 C 18 -52 -18 -52 -28 -48 Z M -20 -32 C -10 -36 10 -36 20 -32 C 12 -35 -12 -35 -20 -32 Z',
    muzzle: 'M 0 0 Z',
    eyeY: -22, eyeDX: 32, eyeR: 8.5, noseY: 14,
    shoulders: 'M -122 200 C -122 96 -78 48 0 48 C 78 48 122 96 122 200 Z',
  },
} as Record<string, Face>;


// Built from the faces that already read well, with their own markings
FACES['red-squirrel'] = {
  ...FACES['sand-cat'],
  mask: undefined,
  // short rounded ears topped by the red squirrel's long dark ear tufts
  ears: ['M -52 -46 C -74 -70 -68 -104 -48 -108 C -36 -92 -28 -70 -24 -56 Z', 'M 52 -46 C 74 -70 68 -104 48 -108 C 36 -92 28 -70 24 -56 Z'],
  inner: ['M -50 -56 C -64 -74 -60 -96 -48 -98 C -40 -86 -34 -70 -30 -60 Z', 'M 50 -56 C 64 -74 60 -96 48 -98 C 40 -86 34 -70 30 -60 Z'],
  extra: [{ d: 'M -52 -104 C -70 -132 -66 -160 -56 -168 C -54 -148 -44 -130 -42 -110 Z M -48 -106 C -50 -134 -40 -156 -34 -160 C -38 -138 -38 -122 -40 -106 Z M 52 -104 C 70 -132 66 -160 56 -168 C 54 -148 44 -130 42 -110 Z M 48 -106 C 50 -134 40 -156 34 -160 C 38 -138 38 -122 40 -106 Z', tone: 'shade', behind: true }],
};
FACES['brown-bear'] = {
  ...FACES.tanuki,
  mask: undefined,
  ears: ['M -70 -58 C -96 -82 -74 -120 -44 -96 Z', 'M 70 -58 C 96 -82 74 -120 44 -96 Z'],
  inner: ['M -66 -66 C -80 -84 -68 -104 -50 -92 Z', 'M 66 -66 C 80 -84 68 -104 50 -92 Z'],
  muzzle: 'M -38 18 C -40 -10 40 -10 38 18 C 34 50 -34 50 -38 18 Z',
};
FACES['street-cat'] = {
  ...FACES['sand-cat'],
  ears: ['M -64 -30 L -66 -112 L -18 -70 Z', 'M 64 -30 L 66 -112 L 18 -70 Z'],
  inner: ['M -56 -40 L -58 -94 L -28 -70 Z', 'M 56 -40 L 58 -94 L 28 -70 Z'],
  // tabby stripes on the forehead and cheeks
  mask: 'M -6 -72 l 3 26 l 6 0 l 3 -26 Z M -26 -68 l 8 22 l 5 -2 l -4 -22 Z M 26 -68 l -8 22 l -5 -2 l 4 -22 Z M -70 -6 l 24 4 l 0 5 l -24 0 Z M 70 -6 l -24 4 l 0 5 l 24 0 Z',
};
FACES.wolf = {
  ...FACES['red-fox'],
  ears: ['M -70 -52 L -64 -128 L -22 -82 Z', 'M 70 -52 L 64 -128 L 22 -82 Z'],
  inner: ['M -62 -62 L -58 -110 L -32 -84 Z', 'M 62 -62 L 58 -110 L 32 -84 Z'],
};
FACES.takhi = {
  ...FACES.kangaroo,
  ears: ['M -40 -86 C -56 -122 -44 -140 -30 -130 C -28 -112 -28 -100 -30 -92 Z', 'M 40 -86 C 56 -122 44 -140 30 -130 C 28 -112 28 -100 30 -92 Z'],
  inner: ['M -38 -96 C -46 -118 -40 -128 -34 -122 C -32 -110 -32 -102 -34 -98 Z', 'M 38 -96 C 46 -118 40 -128 34 -122 C 32 -110 32 -102 34 -98 Z'],
  // the takhi's short, upright dark mane
  extra: [{ d: 'M -14 -102 C -10 -126 10 -126 14 -102 C 12 -90 6 -82 0 -80 C -6 -82 -12 -90 -14 -102 Z', tone: 'dark' }],
};
FACES['snow-leopard'] = {
  ...FACES['sand-cat'],
  ears: ['M -58 -40 C -84 -66 -70 -96 -40 -76 Z', 'M 58 -40 C 84 -66 70 -96 40 -76 Z'],
  inner: ['M -54 -48 C -70 -64 -62 -82 -44 -72 Z', 'M 54 -48 C 70 -64 62 -82 44 -72 Z'],
  // rosettes
  mask: 'M -40 -58 a 7 6 0 1 0 0.1 0 Z M 0 -66 a 6 5 0 1 0 0.1 0 Z M 40 -58 a 7 6 0 1 0 0.1 0 Z M -58 -26 a 5 5 0 1 0 0.1 0 Z M 58 -26 a 5 5 0 1 0 0.1 0 Z M -20 -50 a 4 4 0 1 0 0.1 0 Z M 20 -50 a 4 4 0 1 0 0.1 0 Z',
};
FACES.gelada = {
  ...FACES.monkey,
  // the gelada's bare red chest patch
  extra: [{ d: 'M -30 96 C -30 76 -14 66 0 66 C 14 66 30 76 30 96 C 30 120 14 132 0 132 C -14 132 -30 120 -30 96 Z', tone: '#d8545a' }],
};
FACES.peacock = {
  head: 'M -40 -10 C -42 -46 -24 -64 0 -64 C 24 -64 42 -46 40 -10 C 38 22 22 42 0 44 C -22 42 -38 22 -40 -10 Z',
  ears: ['M 0 0 Z', 'M 0 0 Z'],
  inner: ['M 0 0 Z', 'M 0 0 Z'],
  // the white patches around the eyes
  muzzle: 'M -18 -30 C -26 -14 -22 4 -12 6 C -16 -6 -16 -20 -10 -30 Z M 18 -30 C 26 -14 22 4 12 6 C 16 -6 16 -20 10 -30 Z',
  eyeY: -18, eyeDX: 18, eyeR: 7, noseY: 10,
  shoulders: 'M -70 200 C -70 110 -40 40 0 40 C 40 40 70 110 70 200 Z',
  noNose: true,
  noMouth: true,
  extra: [
    // the crest: a little fan of feathers on wire-thin stems
    { d: 'M -2 -62 L -26 -112 M -1 -62 L -10 -120 M 0 -62 L 6 -122 M 1 -62 L 22 -114 M 2 -62 L 34 -100', tone: 'dark', behind: true, line: true },
    { d: 'M -32 -116 a 7 9 -25 1 0 12 2 Z M -14 -126 a 6 8 -10 1 0 9 1 Z M 2 -128 a 6 8 10 1 0 9 -1 Z M 18 -120 a 7 9 25 1 0 11 -3 Z M 30 -104 a 7 8 40 1 0 10 -5 Z', tone: 'main', behind: true },
    { d: 'M -10 6 L 10 6 L 0 26 Z', tone: '#c9b79a' },
  ],
};

const FACE_OF = FACES as Record<AnimalKind, Face>;

export function AnimalLayer({ kind, palette, idPrefix, ambient }: {
  kind: AnimalKind;
  palette: ScenePalette;
  idPrefix: string;
  ambient: boolean;
}) {
  const night = palette.light === 'moon';
  // Lit by the scene: at night mostly moonlit, by day a touch of the sun's colour
  const tone = (c: string) => (night ? mix(c, palette.skyTop, 0.45) : mix(c, palette.lightColor, 0.08));
  const [main, shade, light, dark] = FUR[kind].map(tone);
  const toneOf = (t: string) => (t === 'main' ? main : t === 'shade' ? shade : t === 'light' ? light : t === 'dark' ? dark : tone(t));
  const extraPath = (e: { d: string; tone: string; line?: boolean }, k: string) => e.line
    ? <path key={k} d={e.d} fill="none" stroke={toneOf(e.tone)} strokeWidth={3} strokeLinecap="round" />
    : <path key={k} d={e.d} fill={toneOf(e.tone)} />;
  const f = FACE_OF[kind];
  const id = `${idPrefix}-animal`;
  const ink = night ? '#14101a' : '#1d1712';
  // Close to the camera, bottom left of the 16:9 view; the picture's bottom edge cuts off the body
  const x = BLEED_X + 200, y = VIEWBOX.h - 185;
  const L = -f.eyeDX, R = f.eyeDX;

  // The eyes: white, a pupil that first watches the plane (to the right), then snaps to the camera
  const eye = (cx: number, side: 'l' | 'r') => (
    <g className="lc-an-blink" style={{ transformOrigin: `${cx}px ${f.eyeY}px` }}>
      <ellipse className="lc-an-wide" cx={cx} cy={f.eyeY} rx={f.eyeR * 1.15} ry={f.eyeR * 1.25} fill="#fbf6ea" style={{ transformOrigin: `${cx}px ${f.eyeY}px` }} />
      <g className={ambient ? 'lc-an-pupil' : undefined}>
        <circle cx={cx} cy={f.eyeY + 1} r={f.eyeR * 0.72} fill={ink} />
        <circle cx={cx + f.eyeR * 0.28} cy={f.eyeY - f.eyeR * 0.3} r={f.eyeR * 0.26} fill="#ffffff" />
      </g>
      {/* eyebrow: the left one shoots up in the cheeky face */}
      <path className={side === 'l' && ambient ? 'lc-an-brow' : undefined} transform={side === 'l' && !ambient ? 'translate(0 -7) rotate(-10)' : undefined} d={`M ${cx - f.eyeR * 1.2} ${f.eyeY - f.eyeR * 1.8} q ${f.eyeR * 1.2} ${-f.eyeR * 0.7} ${f.eyeR * 2.4} 0`}
        stroke={dark} strokeWidth={4} strokeLinecap="round" fill="none" style={{ transformOrigin: `${cx}px ${f.eyeY}px` }} />
    </g>
  );

  const mouthY = f.noseY + 16;
  const chestColor = kind === 'puffin' || kind === 'heron' ? (night ? mix('#f2f0eb', palette.skyTop, 0.45) : mix('#f2f0eb', palette.lightColor, 0.08)) : light;

  return (
    <g aria-hidden transform={`translate(${x} ${y}) scale(1.25)`}>
      {ambient && (
        <style>{`
          @keyframes lc-an-in{0%{transform:translateY(260px)}60%{transform:translateY(-6px)}100%{transform:translateY(0)}}
          @keyframes lc-an-hop{0%,100%{transform:translateY(0)}40%{transform:translateY(-16px)}70%{transform:translateY(2px)}}
          @keyframes lc-an-pupil{0%,12%{transform:translate(5px,-2px)}15%,82%{transform:translate(0,0)}86%,93%{transform:translate(6px,-2px)}96%,100%{transform:translate(0,0)}}
          @keyframes lc-an-wide{0%,12%{transform:scale(1)}16%{transform:scale(1.4)}22%,74%{transform:scale(1.08)}80%,100%{transform:scale(1)}}
          @keyframes lc-an-blink{0%,93%,100%{transform:scaleY(1)}95.5%{transform:scaleY(0.1)}}
          @keyframes lc-an-grin{0%,19%{opacity:0}22%,72%{opacity:1}76%,100%{opacity:0}}
          @keyframes lc-an-flat{0%,19%{opacity:1}22%,72%{opacity:0}76%,100%{opacity:1}}
          @keyframes lc-an-brow{0%,19%{transform:translateY(0) rotate(0)}24%,70%{transform:translateY(-7px) rotate(-10deg)}76%,100%{transform:translateY(0) rotate(0)}}
          @keyframes lc-an-ear{0%,12%{transform:rotate(0)}15%{transform:rotate(-8deg) scale(1.08)}20%,86%{transform:rotate(0)}90%{transform:rotate(-7deg)}94%,100%{transform:rotate(0)}}
          @keyframes lc-an-tilt{0%,20%{transform:rotate(0)}26%,70%{transform:rotate(-5deg)}78%,100%{transform:rotate(0)}}
          .${id} .lc-an-rise{animation:lc-an-in 1.5s cubic-bezier(.2,.8,.3,1) both}
          .${id} .lc-an-hopper{animation:lc-an-hop .55s ease-out 2.2s both}
          .${id} .lc-an-pupil{animation:lc-an-pupil 14s ease-in-out .4s infinite}
          .${id} .lc-an-wide{animation:lc-an-wide 14s ease-out .4s infinite}
          .${id} .lc-an-blink{animation:lc-an-blink 5.4s 6s infinite}
          .${id} .lc-an-grin{animation:lc-an-grin 14s .4s infinite}
          .${id} .lc-an-flat{animation:lc-an-flat 14s .4s infinite}
          .${id} .lc-an-brow{animation:lc-an-brow 14s .4s infinite}
          .${id} .lc-an-ear{transform-box:fill-box;transform-origin:50% 100%;animation:lc-an-ear 14s .4s infinite}
          .${id} .lc-an-head{transform-box:fill-box;transform-origin:50% 90%;animation:lc-an-tilt 14s ease-in-out .4s infinite}
        `}</style>
      )}
      <g className={id}>
        <g className="lc-an-rise">
          <g className="lc-an-hopper">
            <path d={f.shoulders} fill={kind === 'giant-panda' ? dark : main} />
            <path d={`M -40 200 C -40 120 -24 70 0 64 C 24 70 40 120 40 200 Z`} fill={chestColor} opacity={0.85} />
            <g className="lc-an-head">
              {f.extra?.filter((e) => e.behind).map((e, i) => extraPath(e, `b${i}`))}
              <path className="lc-an-ear" d={f.ears[0]} fill={kind === 'red-fox' || kind === 'giant-panda' || kind === 'heron' ? dark : main} />
              <path className="lc-an-ear" d={f.ears[1]} fill={kind === 'red-fox' || kind === 'giant-panda' || kind === 'heron' ? dark : main} />
              <path d={f.inner[0]} fill={kind === 'tanuki' ? dark : light} opacity={0.9} />
              <path d={f.inner[1]} fill={kind === 'tanuki' ? dark : light} opacity={0.9} />
              <path d={f.head} fill={main} />
              {/* a soft shade under the chin side away from the light */}
              <path d={f.head} fill={shade} opacity={0.35} transform="translate(10 8) scale(0.94)" />
              <path d={f.head} fill={main} transform="translate(-4 -4) scale(0.92)" />
              {f.mask && <path d={f.mask} fill={kind === 'penguin' ? light : dark} />}
              {f.extra?.filter((e) => !e.behind).map((e, i) => extraPath(e, `x${i}`))}
              <path d={f.muzzle} fill={kind === 'elephant' ? main : kind === 'penguin' ? dark : light} />
              {/* rosy cheeks in the cheeky face */}
              <g className={ambient ? 'lc-an-grin' : undefined}>
                <ellipse cx={L - f.eyeR * 1.4} cy={f.noseY + 4} rx={f.eyeR * 1.2} ry={f.eyeR * 0.7} fill="#f08a8a" opacity={0.45} />
                <ellipse cx={R + f.eyeR * 1.4} cy={f.noseY + 4} rx={f.eyeR * 1.2} ry={f.eyeR * 0.7} fill="#f08a8a" opacity={0.45} />
              </g>
              {eye(L, 'l')}
              {eye(R, 'r')}
              {!f.noNose && (
                <>
                <ellipse cx={0} cy={f.noseY} rx={f.eyeR * 1.1} ry={f.eyeR * 0.75} fill={dark} />
                <ellipse cx={-2} cy={f.noseY - 2} rx={f.eyeR * 0.35} ry={f.eyeR * 0.2} fill="#ffffff" opacity={0.5} />
                </>
              )}
              {!f.noMouth && (
                <>
                {/* the mouth: a small calm line first, then a big cheeky grin */}
                <path className={ambient ? 'lc-an-flat' : undefined} d={`M -10 ${mouthY} q 10 6 20 0`} stroke={dark} strokeWidth={3.5} fill="none" strokeLinecap="round" opacity={ambient ? 1 : 0} />
                <g className={ambient ? 'lc-an-grin' : undefined}>
                  <path d={`M -26 ${mouthY - 6} q 26 34 52 0 q -26 10 -52 0 Z`} fill="#5a2630" stroke={dark} strokeWidth={3} strokeLinejoin="round" />
                  <path d={`M -11 ${mouthY + 10} q 11 10 22 0 q -11 -5 -22 0 Z`} fill="#e07b84" />
                </g>
                </>
              )}
            </g>
          </g>
        </g>
      </g>
    </g>
  );
}
