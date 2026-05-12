'use client'

import { useEffect, useRef, useState } from 'react'
import type { DisplayState, DisplayChannelMessage } from '@/lib/display-types'

export function useDisplayBroadcast(
  sessionId: string,
  state: DisplayState,
): { displayConnected: boolean } {
  const channelRef = useRef<BroadcastChannel | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state
  const [displayConnected, setDisplayConnected] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ch = new BroadcastChannel(`lc-display-${sessionId}`)
    channelRef.current = ch

    ch.onmessage = (e: MessageEvent<DisplayChannelMessage>) => {
      if (e.data?.kind === 'ping') {
        setDisplayConnected(true)
        // Immediately send current state to the newly-opened display tab
        ch.postMessage({ kind: 'state', ...stateRef.current })
      }
    }

    return () => {
      ch.close()
      channelRef.current = null
    }
  }, [sessionId])

  useEffect(() => {
    channelRef.current?.postMessage({ kind: 'state', ...state })
  }, [state])

  return { displayConnected }
}
