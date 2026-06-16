import { notFound } from 'next/navigation';
import { SoloLobbyScene } from '@/components/ui/lobby-airfield-scene-solo';

// Dev-only full-frame Launch Lobby scene for high-res / screenshot inspection:
//   /dev/lobby?city=tokyo&tod=dusk&weather=rain
// 404 in any non-development environment.
export const dynamic = 'force-static';

export default function LobbySceneSoloPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }
  return <SoloLobbyScene />;
}
