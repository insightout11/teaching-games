# Kahoot-Style PIN System - Future Implementation

## Overview

Implement a PIN-based join system where students can join sessions from their own devices and input answers in real-time, similar to Kahoot.

## Current Infrastructure Assessment

### What Already Exists

| Component | Status | Location |
|-----------|--------|----------|
| Supabase Realtime | Configured & working | `src/hooks/use-realtime-leaderboard.ts` |
| Session model | Clean, extensible | `src/lib/supabase/types.ts` |
| Zustand store | Ready for live state | `src/stores/session-store.ts` |
| API route patterns | Established | `src/app/api/` |
| Score recording | Working with realtime | `supabase/migrations/` |

### What's Missing

- No `pin` field in sessions table
- No public student join pages
- No student authentication/identification
- No multi-device real-time sync for game state
- No student-facing UI for answering questions

## Estimated Effort

**Total: 2-3 days of focused work**

| Component | Effort | Details |
|-----------|--------|---------|
| Database Changes | Low (2-3 hrs) | Add `pin` field, generation logic |
| Student Join Flow | Medium (4-6 hrs) | Public `/join` page, PIN validation, name entry |
| Real-time Presence | Medium (4-6 hrs) | Track connected students, teacher dashboard |
| Student Game UI | Medium-High (6-8 hrs) | Mobile-friendly answer input, sync with teacher |
| Teacher Control Panel | Medium (4-6 hrs) | Show students, control flow, see live answers |
| Multi-device Sync | Medium (4-6 hrs) | Broadcast questions, collect answers, show results |

## Technical Architecture

### Option 1: Supabase Realtime Only (Recommended to Start)

**Pros:**
- No additional dependencies
- Already configured in project
- Free tier available

**Cons:**
- ~500ms latency (acceptable for most use cases)

**Implementation:**
```typescript
// New channels needed
const sessionChannel = supabase.channel(`session:${sessionId}`)
const presenceChannel = supabase.channel(`presence:${sessionId}`)

// Broadcast game state changes
sessionChannel.send({
  type: 'broadcast',
  event: 'question',
  payload: { questionId, sentence, weakWord }
})

// Track student presence
presenceChannel.track({
  studentId,
  studentName,
  joinedAt: new Date().toISOString()
})
```

### Option 2: Add Pusher/Ably (For "Kahoot Feel")

**Pros:**
- Sub-100ms latency
- Built for this exact use case
- Better presence features

**Cons:**
- Additional cost (~$25/mo for 500 concurrent)
- Another dependency to manage

## Database Schema Changes

```sql
-- Add to sessions table
ALTER TABLE sessions ADD COLUMN pin VARCHAR(6);
ALTER TABLE sessions ADD COLUMN is_joinable BOOLEAN DEFAULT false;

-- Create student_connections table for presence
CREATE TABLE student_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  student_name VARCHAR(50) NOT NULL,
  device_id VARCHAR(100),
  connected_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create student_responses table
CREATE TABLE student_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES student_connections(id),
  round_number INTEGER NOT NULL,
  response TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE student_connections;
ALTER PUBLICATION supabase_realtime ADD TABLE student_responses;
```

## New Routes Required

```
/join                    - Public page to enter PIN
/join/[pin]              - Session lobby (enter name)
/play/[sessionId]        - Student game interface
/api/sessions/generate-pin
/api/sessions/validate-pin
/api/sessions/[id]/connect
/api/sessions/[id]/respond
```

## UI Components Needed

### Student Side
- `JoinPage` - PIN entry with large number pad
- `LobbyPage` - Enter name, see other students, wait for start
- `PlayPage` - See question, input answer, see results
- `LeaderboardPage` - Final standings

### Teacher Side (Additions)
- `SessionPinDisplay` - Show PIN and QR code
- `ConnectedStudentsList` - Live list of who's joined
- `StudentResponsesPanel` - See answers coming in live
- `RevealAnswersButton` - Control when scores show

## Game Flow

```
TEACHER                          STUDENTS
   |                                |
   | 1. Start session               |
   | 2. Generate PIN (e.g. 847293)  |
   | 3. Display PIN + QR code       |
   |                                |
   |                    <-- 4. Enter PIN on phone
   |                    <-- 5. Enter name
   |                    <-- 6. Appear in lobby
   |                                |
   | 7. See students joining        |
   | 8. Click "Start Game"          |
   |                                |
   | 9. Show question        -->    | 10. See question
   |                         <--    | 11. Type answer
   |                         <--    | 12. Submit
   |                                |
   | 13. See all responses          |
   | 14. Click "Reveal Scores"      |
   |                                |
   | 15. Show leaderboard    -->    | 16. See standings
   |                                |
   | 17. Next question...           |
```

## Quick Win Alternative: Spectator Mode

If full implementation is too much initially, implement **spectator mode** first:

- Students scan QR to view live leaderboard on their phones
- Teacher still controls all answers
- ~4 hours of work
- Builds the real-time presence foundation

### Spectator Mode Implementation

```typescript
// New route: /spectate/[sessionId]
// Shows real-time leaderboard using existing hook

export default function SpectatePage({ params }) {
  const { scores } = useRealtimeLeaderboard(params.sessionId);
  return <LeaderboardDisplay scores={scores} />;
}
```

## Security Considerations

- PINs should expire after session ends
- Rate limit PIN attempts (prevent brute force)
- Student names should be sanitized
- Consider profanity filter for student names
- Don't expose teacher email to students
- Sessions should auto-close after inactivity

## Files to Modify/Create

### New Files
- `src/app/(public)/join/page.tsx`
- `src/app/(public)/join/[pin]/page.tsx`
- `src/app/(public)/play/[sessionId]/page.tsx`
- `src/components/session/pin-display.tsx`
- `src/components/session/connected-students.tsx`
- `src/components/student/answer-input.tsx`
- `src/hooks/use-session-presence.ts`
- `src/hooks/use-game-sync.ts`
- `src/app/api/sessions/pin/route.ts`
- `supabase/migrations/XXX_add_pin_system.sql`

### Modified Files
- `src/lib/supabase/types.ts` - Add new types
- `src/stores/session-store.ts` - Add presence state
- `src/components/session/session-view.tsx` - Add PIN display
- `src/middleware.ts` - Allow public routes

## Dependencies to Consider

```bash
# QR code generation
pnpm add qrcode.react

# Optional: Better realtime (if Supabase latency is issue)
pnpm add pusher-js  # or @ably/ably
```

## Testing Checklist

- [ ] Generate unique 6-digit PIN
- [ ] PIN validation works
- [ ] Student can join with PIN
- [ ] Student appears in teacher's lobby
- [ ] Multiple students can join simultaneously
- [ ] Question broadcasts to all students
- [ ] Student can submit answer
- [ ] Teacher sees all responses
- [ ] Scores calculate correctly
- [ ] Leaderboard updates in real-time
- [ ] Session cleanup on end
- [ ] Works on mobile browsers
- [ ] Handles disconnection/reconnection
