'use client'

import { useEffect, useState } from 'react'
import type { DisplayState, DisplayChannelMessage } from '@/lib/display-types'

export function useDisplayReceiver(sessionId: string): DisplayState | null {
  const [state, setState] = useState<DisplayState | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ch = new BroadcastChannel(`lc-display-${sessionId}`)

    ch.onmessage = (e: MessageEvent<DisplayChannelMessage>) => {
      const msg = e.data
      if (msg?.kind === 'state') {
        setState(msg as unknown as DisplayState)
      }
    }

    // Announce to control tab that display is open
    ch.postMessage({ kind: 'ping' })

    return () => ch.close()
  }, [sessionId])

  return state
}
