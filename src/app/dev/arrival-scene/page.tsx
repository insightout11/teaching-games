import { notFound } from 'next/navigation';
import { SoloArrivalScene } from '@/components/world-flight/arrival-scene/gallery/solo-arrival-scene';

// Dev-only single full-frame scene for high-res / screenshot inspection:
//   /dev/arrival-scene?city=tokyo&phase=approach&progress=0.4&motion=static
// 404 in any non-development environment.
export const dynamic = 'force-static';

export default function ArrivalSceneSoloPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }
  return <SoloArrivalScene />;
}
