'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useDisplayReceiver } from '@/hooks/use-display-receiver'
import { CaptainPickCard } from '@/components/session/captain-pick-card'
import type { DisplayInputSpec } from '@/lib/display-types'

const MEDALS = ['🥇', '🥈', '🥉']

function TimerBadge({ timerSeconds, startedAt }: { timerSeconds: number; startedAt: number }) {
  const [remaining, setRemaining] = useState(timerSeconds)

  useEffect(() => {
    const update = () => {
      const ms = startedAt + timerSeconds * 1000 - Date.now()
      setRemaining(Math.max(0, Math.ceil(ms / 1000)))
    }
    update()
    const id = setInterval(update, 250)
    return () => clearInterval(id)
  }, [timerSeconds, startedAt])

  const pct = remaining / timerSeconds
  const color =
    pct > 0.5 ? 'text-emerald-400' : pct > 0.25 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className={`text-5xl font-bold tabular-nums ${color}`}>{remaining}s</div>
  )
}

function SpecContent({ spec }: { spec: DisplayInputSpec }) {
  const hasOptions = Array.isArray(spec.options) && spec.options.length > 0
  const isChoice = ['choice', 'binary', 'multi-select'].includes(spec.type)
  const isOrdered = ['sequence', 'ranking'].includes(spec.type)
  const isReadAloud = spec.type === 'read-aloud'

  const activeReader = isReadAloud
    ? spec.readAloudQueue?.find((e) => e.status === 'active')
    : undefined

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto px-4">
      {spec.instruction && (
        <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
          {spec.instruction}
        </p>
      )}

      {spec.prompt && (
        <p className="text-4xl md:text-5xl font-bold text-white text-center leading-snug">
          {spec.prompt}
        </p>
      )}

      {activeReader && (
        <div className="text-center space-y-2">
          <p className="text-gray-400 text-sm">{activeReader.studentName} is reading</p>
          <p className="text-2xl text-gray-300 leading-relaxed max-w-2xl">{activeReader.text}</p>
        </div>
      )}

      {isChoice && hasOptions && (
        <div className={`grid gap-4 w-full max-w-3xl ${spec.options!.length <= 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
          {spec.options!.map((opt, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white/10 border border-white/20 px-6 py-5 text-center"
            >
              <span className="text-xs text-gray-400 uppercase font-semibold block mb-1">
                {spec.optionLabels?.[i] ?? String.fromCharCode(65 + i)}
              </span>
              <span className="text-xl text-white font-medium">{opt}</span>
            </div>
          ))}
        </div>
      )}

      {isOrdered && hasOptions && (
        <div className="flex flex-col gap-3 w-full max-w-lg">
          {spec.options!.map((opt, i) => (
            <div
              key={i}
              className="rounded-xl bg-white/10 border border-white/20 px-5 py-3 flex items-center gap-3"
            >
              <span className="text-gray-500 text-sm font-mono w-5">{i + 1}</span>
              <span className="text-white">{opt}</span>
            </div>
          ))}
        </div>
      )}

      {spec.keywords && spec.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {spec.keywords.map((kw, i) => (
            <span
              key={i}
              className="rounded-full bg-cyan-500/20 border border-cyan-500/40 px-3 py-1 text-cyan-300 text-sm"
            >
              {kw}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function DisplayScreen({ sessionId }: { sessionId: string }) {
  const state = useDisplayReceiver(sessionId)
  const [joinUrl, setJoinUrl] = useState('')

  useEffect(() => {
    setJoinUrl(`${window.location.origin}/join/${sessionId}`)
  }, [sessionId])

  const topScores = state?.topScores ?? []
  const joinCode = joinUrl.replace(/^https?:\/\//, '')

  return (
    <div className="fixed inset-0 bg-gray-950 text-white flex flex-col select-none overflow-hidden">
      {/* Top bar */}
      <div className="px-6 py-3 flex items-center justify-between border-b border-white/10 shrink-0">
        <span className="text-sm text-gray-400 font-medium">
          {state?.topic ?? 'LessonCaptain'}
        </span>
        {state && (
          <span className="text-sm text-gray-600">
            {state.studentCount} student{state.studentCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 min-h-0">
        {!state ? (
          <div className="flex flex-col items-center gap-6">
            <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
            <p className="text-gray-500 text-sm">Waiting for teacher control tab…</p>
            {joinUrl && (
              <div className="flex flex-col items-center gap-3 mt-4">
                <QRCodeSVG value={joinUrl} size={160} bgColor="transparent" fgColor="#6b7280" />
                <p className="text-gray-600 text-xs font-mono">{joinCode}</p>
              </div>
            )}
          </div>
        ) : state.phase === 'lobby' ? (
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-3xl font-bold text-white">Join the class</h1>
            {joinUrl && (
              <div className="p-4 bg-white rounded-2xl">
                <QRCodeSVG value={joinUrl} size={200} bgColor="#ffffff" fgColor="#111827" />
              </div>
            )}
            <div className="text-center space-y-1">
              <p className="text-gray-500 text-sm">Go to</p>
              <p className="text-lg font-mono text-cyan-400">{joinCode}</p>
            </div>
            {state.studentCount > 0 && (
              <p className="text-gray-500 text-sm">{state.studentCount} joined</p>
            )}
          </div>
        ) : state.phase === 'ended' ? (
          <div className="flex flex-col items-center gap-6">
            <p className="text-2xl font-bold text-white">Class complete!</p>
            {topScores.length > 0 && (
              <div className="flex flex-col gap-3 mt-2">
                {topScores.slice(0, 3).map((s, i) => (
                  <div key={s.clientId} className="flex items-center gap-3 text-lg">
                    <span>{MEDALS[i]}</span>
                    <span className="font-medium text-white">{s.name}</span>
                    <span className="text-gray-500">{s.points} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-6">
            <div className="flex items-center gap-4">
              {state.moduleLabel && (
                <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/30">
                  {state.moduleLabel}
                </span>
              )}
              {state.displayInputSpec?.timerSeconds && state.displayInputSpec?.startedAt && (
                <TimerBadge
                  timerSeconds={state.displayInputSpec.timerSeconds}
                  startedAt={state.displayInputSpec.startedAt}
                />
              )}
            </div>

            {state.displayInputSpec ? (
              <SpecContent spec={state.displayInputSpec} />
            ) : (
              <p className="text-gray-500 text-lg">Activity in progress…</p>
            )}
          </div>
        )}
      </div>

      {/* Leaderboard bottom strip */}
      {topScores.length > 0 && state?.phase !== 'lobby' && (
        <div className="px-6 py-3 border-t border-white/10 flex items-center justify-center gap-8 shrink-0">
          {topScores.slice(0, 3).map((s, i) => (
            <div key={s.clientId} className="flex items-center gap-2 text-sm">
              <span>{MEDALS[i]}</span>
              <span className="text-gray-300 font-medium">{s.name}</span>
              <span className="text-gray-600 tabular-nums">{s.points}</span>
            </div>
          ))}
        </div>
      )}

      {/* Fixed join code in corner */}
      {joinUrl && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-black/70 rounded-xl px-3 py-2 border border-white/10 backdrop-blur">
          <div className="p-0.5 bg-white rounded">
            <QRCodeSVG value={joinUrl} size={28} bgColor="#ffffff" fgColor="#111827" />
          </div>
          <span className="text-xs text-gray-400 font-mono">{joinCode}</span>
        </div>
      )}

      <CaptainPickCard sessionId={sessionId} />
    </div>
  )
}
