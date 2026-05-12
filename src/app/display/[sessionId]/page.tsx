import { DisplayScreen } from '@/components/session/display-screen'

export default function DisplayPage({ params }: { params: { sessionId: string } }) {
  return <DisplayScreen sessionId={params.sessionId} />
}
