'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { TakeoffSpark } from '@/components/ui/takeoff-spark';
import { CrewAvatar } from '@/components/ui/crew-avatar';
import type { Team } from '@/lib/supabase/types';
import {
  getInputSpecRevision,
  inputSpecChannelName,
  INPUT_SPEC_REALTIME_EVENT,
  type InputSpec,
  type InputSpecRealtimePayload,
} from '@/lib/input-spec';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { DynamicInput } from './dynamic-input';
import { DebatePrepPanel } from './debate-prep-panel';
import { VALIDATION } from '@/lib/config/rate-limits';
import { DIFFICULTIES } from '@/lib/difficulty';
import type { Difficulty } from '@/lib/difficulty';
import { grammarReference } from '@/lib/grammar';
import { BookOpen, PencilLine, MessageSquare, HelpCircle, Plane, PlaneLanding, Flame, Send, Zap, Award, Wind, Radio, RadioTower, ClipboardCheck, Share2, Check } from 'lucide-react';
import { SIDE_CHANNEL_GAME_KEY, type SideChannelItem } from '@/lib/side-channel';
import { StudentSkyShell } from '@/components/student/student-sky-shell';
import { QRCodeSVG } from 'qrcode.react';
import { getGame } from '@/games/registry';
import { getActivity } from '@/activities/registry';
import { LatestRequestGate } from '@/lib/latest-request-gate';
import {
  effectiveRealtimeHealth as getEffectiveRealtimeHealth,
  logRealtimeDiagnostic,
  reconcileIntervalFor,
  startRealtimeChannelLifecycle,
  studentConnectionState,
  type RealtimeHealth,
} from '@/lib/realtime-health';

interface StudentSession {
  clientId: string;
  studentId: string | null;
  displayName: string;
  team: Team | null;
  avatarSeed?: string;
  /** Reigning Captain of the Day — wears the wings insignia this session. */
  captain?: boolean;
}

interface ActivePoll {
  pollId: string;
  question: string;
  options: string[];
  metadata?: Record<string, unknown> | null;
}

interface PublishedQuestion {
  id: string;
  content: string;
  publishedAt: string;
  voteCount: number;
}

interface WonderQuestion {
  id: string;
  starter: string;
  content: string;
  displayName: string;
  answeredAt: string | null;
  parentId: string | null;
  voteCount: number;
}

interface ClassBoardItem {
  id: string;
  content: string;
  displayName: string;
  category: string;
  zoneKey: string;
  pinned: boolean;
  position: number;
  createdAt: string;
  voteCount: number;
  answer: string | null;
  answeredAt: string | null;
  parentId: string | null;
}

interface VocabItem {
  word: string;
  definition: string;
}

interface ExpressionItem {
  phrase: string;
  example: string;
}

type ReferencePanel = 'vocab' | 'grammar' | 'expressions' | 'question' | null;

interface HeldCard {
  cardId: string;
  cardKey: string;
  moduleKey: string;
  activationsCount: number;
  status: 'held' | 'active';
}

interface OfferedCards {
  dealIndex: number;
  cards: Array<{ cardId: string }>;
}

interface StudentControllerProps {
  sessionId: string;
  studentSession: StudentSession;
  onLeave: () => void;
}

// ---------------------------------------------------------------------------
// localStorage helpers for persisting voted question IDs across page reloads
// ---------------------------------------------------------------------------
const VOTED_KEY = 'lc-voted-questions';

// Crew Radio seen/answered tracking (per session) so the badge doesn't relight
// on reload for an item the student already opened or answered.
const CREW_RADIO_KEY = 'lc-crew-radio';

function loadCrewRadioState(sessionId: string): { seen: string | null; done: string[] } {
  try {
    const raw = localStorage.getItem(CREW_RADIO_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const entry = parsed[sessionId];
    return { seen: entry?.seen ?? null, done: Array.isArray(entry?.done) ? entry.done : [] };
  } catch {
    return { seen: null, done: [] };
  }
}

function persistCrewRadioState(sessionId: string, state: { seen: string | null; done: string[] }) {
  try {
    const raw = localStorage.getItem(CREW_RADIO_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[sessionId] = { seen: state.seen, done: state.done.slice(-20) };
    localStorage.setItem(CREW_RADIO_KEY, JSON.stringify(parsed));
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// English Spotlight tips — shown while waiting for an activity to start
// minLevel = minimum difficulty at which this tip is shown
// ---------------------------------------------------------------------------
const WAITING_TIPS: { category: string; color: string; text: string; minLevel: string }[] = [
  { category: 'Grammar Tip', color: 'blue', minLevel: 'Beginner', text: "Use 'a' before consonant sounds and 'an' before vowel sounds — it's about the sound, not the letter. 'An hour' is correct because 'hour' starts with a vowel sound." },
  { category: 'Did you know?', color: 'purple', minLevel: 'Beginner', text: "English borrows words from over 350 languages. 'Café' comes from French, 'yoga' from Sanskrit, 'robot' from Czech, and 'ketchup' from Malay." },
  { category: 'Idiom', color: 'amber', minLevel: 'Easy', text: "'Break a leg' means 'good luck'. It comes from theatre tradition — wishing someone bad luck was thought to bring good luck instead." },
  { category: 'Vocab Boost', color: 'teal', minLevel: 'Easy', text: "Three useful prefixes: 'un-' means not (unhappy), 're-' means again (rewrite), 'pre-' means before (preview). Spot them and you can guess thousands of new words." },
  { category: 'Grammar Tip', color: 'blue', minLevel: 'Easy', text: "'I' vs 'me': remove the other person to test it. 'She gave it to I' sounds wrong — so say 'She gave it to me'. 'I' is for subjects; 'me' is for objects." },
  { category: 'Did you know?', color: 'purple', minLevel: 'Intermediate', text: "The word 'nice' originally meant 'foolish' or 'ignorant' in the 14th century. Word meanings shift dramatically over hundreds of years — this is called semantic change." },
  { category: 'Idiom', color: 'amber', minLevel: 'Easy', text: "'Hit the nail on the head' means to be exactly right. 'Cost an arm and a leg' means something is very expensive. Idioms say one thing but mean another." },
  { category: 'Vocab Boost', color: 'teal', minLevel: 'Intermediate', text: "The suffix '-tion' turns verbs into nouns: communicate → communication, educate → education, inform → information. It's one of the most common noun endings in English." },
  { category: 'Grammar Tip', color: 'blue', minLevel: 'Easy', text: "Commas join two sentences when paired with 'and', 'but', or 'so'. Without a conjunction, use a semicolon or a full stop instead of a comma alone." },
  { category: 'Did you know?', color: 'purple', minLevel: 'Beginner', text: "Shakespeare invented over 1,700 words still used today — including 'bedroom', 'lonely', 'generous', and 'obscene'. He simply made them up when he needed them." },
  { category: 'Idiom', color: 'amber', minLevel: 'Easy', text: "'Under the weather' means feeling unwell. 'Once in a blue moon' means very rarely. Learning idioms helps you sound natural in everyday English." },
  { category: 'Vocab Boost', color: 'teal', minLevel: 'Intermediate', text: "Adjectives describe nouns; adverbs modify verbs, adjectives, or other adverbs. Many adverbs end in '-ly': quickly, carefully, honestly — but not always (fast, hard, well)." },
  { category: 'Grammar Tip', color: 'blue', minLevel: 'Beginner', text: "'There', 'their', and 'they're' sound identical but mean different things. There = place, Their = belonging to them, They're = they are. Context is the key." },
  { category: 'Did you know?', color: 'purple', minLevel: 'Beginner', text: "The longest word in a standard English dictionary is 'pneumonoultramicroscopicsilicovolcanoconiosis' — a lung disease. The most commonly used word is 'the'." },
  { category: 'Idiom', color: 'amber', minLevel: 'Intermediate', text: "'Spill the beans' means to accidentally reveal a secret. 'Let the cat out of the bag' means the same thing — idioms often have quirky origin stories." },
  { category: 'Vocab Boost', color: 'teal', minLevel: 'Intermediate', text: "Synonyms add variety to your writing. Instead of always using 'said', try: whispered, announced, argued, replied, admitted. Word choice shapes the reader's feeling." },
  { category: 'Grammar Tip', color: 'blue', minLevel: 'Intermediate', text: "Active voice is usually clearer than passive. 'The dog bit the man' (active) is more direct than 'The man was bitten by the dog' (passive)." },
  { category: 'Did you know?', color: 'purple', minLevel: 'Intermediate', text: "English has around 170,000 words in current use, with another 47,000 obsolete words. A well-educated adult uses about 20,000–35,000 words in daily life." },
  { category: 'Idiom', color: 'amber', minLevel: 'Intermediate', text: "'Bite the bullet' means to endure a painful situation with courage. 'Bite off more than you can chew' means to take on more than you can handle." },
  { category: 'Vocab Boost', color: 'teal', minLevel: 'Easy', text: "Collocations are words that naturally go together. We say 'make a mistake' (not 'do a mistake'), 'do homework' (not 'make homework'). Learning them sounds more natural." },
  { category: 'Grammar Tip', color: 'blue', minLevel: 'Beginner', text: "Questions with 'who', 'what', 'where', 'when', 'why', and 'how' need full answers. Yes/no questions only need 'yes' or 'no' — but a full answer is always better." },
  { category: 'Did you know?', color: 'purple', minLevel: 'Easy', text: "'Goodbye' is a contraction of 'God be with ye', shortened over centuries. 'Hello' only became a standard greeting after the telephone was invented in the 1870s." },
  { category: 'Idiom', color: 'amber', minLevel: 'Intermediate', text: "'The ball is in your court' means it's your turn to take action. 'Get the ball rolling' means to start something. Many English idioms come from sport." },
  { category: 'Vocab Boost', color: 'teal', minLevel: 'Easy', text: "Antonyms are opposites: hot/cold, love/hate, succeed/fail. Using contrast in writing creates emphasis and helps readers feel the difference between two ideas." },
  { category: 'Grammar Tip', color: 'blue', minLevel: 'Intermediate', text: "First conditional: 'If it rains, I will stay inside.' Second conditional: 'If I were rich, I would travel.' The tense shift signals whether something is real or hypothetical." },
  { category: 'Did you know?', color: 'purple', minLevel: 'Beginner', text: "The sentence 'The quick brown fox jumps over the lazy dog' contains every letter of the alphabet. This kind of sentence is called a pangram." },
  { category: 'Idiom', color: 'amber', minLevel: 'Advanced', text: "'Burn the midnight oil' means to work late into the night. It comes from the days when people used oil lamps — and staying up late literally meant burning oil." },
  { category: 'Vocab Boost', color: 'teal', minLevel: 'Intermediate', text: "Abstract nouns name ideas or feelings you can't touch: freedom, justice, happiness, courage. Concrete nouns name physical things: table, rain, book, city." },
];

const CARD_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
  'takeoff':       { name: 'Takeoff',       description: '+1 on your next genuine-or-better response.' },
  'clear-skies':   { name: 'Clear Skies',   description: '+1 if your next response is on task.' },
  'afterburner':   { name: 'Afterburner',   description: '+2 if your next response is on task.' },
  'full-throttle': { name: 'Full Throttle', description: '+3 only for a Standout response.' },
  'contrail':      { name: 'Contrail',      description: '+1 per submitted response next activity, up to 3.' },
};

const CARD_ICONS: Record<string, React.ElementType> = {
  'takeoff':       Plane,
  'clear-skies':   Send,
  'afterburner':   Zap,
  'full-throttle': Award,
  'contrail':      Wind,
};

// Deterministic starter assignment from clientId (no server coordination needed)
const WONDER_STARTERS = ['Why', 'How', 'What', 'When', 'Where', 'Should', 'What if'];
function getAssignedStarter(clientId: string): string {
  let hash = 0;
  for (let i = 0; i < clientId.length; i++) {
    hash = (hash * 31 + clientId.charCodeAt(i)) >>> 0;
  }
  return WONDER_STARTERS[hash % WONDER_STARTERS.length];
}

function loadVotedIds(sessionId: string): Set<string> {
  try {
    const raw = localStorage.getItem(VOTED_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return new Set<string>(parsed[sessionId] ?? []);
  } catch {
    return new Set<string>();
  }
}

function persistVotedIds(sessionId: string, ids: string[]) {
  try {
    const raw = localStorage.getItem(VOTED_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[sessionId] = ids;
    localStorage.setItem(VOTED_KEY, JSON.stringify(parsed));
  } catch { /* ignore */ }
}

const OUTCOME_LABELS: Record<string, string> = {
  'standout': 'Standout',
  'on-task': 'On task',
  'genuine': 'Submitted',
  'invalid': 'Not counted',
};

function getInputActionLabel(spec: InputSpec): string {
  if (spec.gameKey === 'wonder-board') return 'Wonder Board';
  if (spec.gameKey === 'language-toolkit') return 'Use a Term';
  if (spec.type === 'board') return spec.boardTitle ?? 'Class Board';
  if (spec.type === 'binary') return 'Cast Vote';
  if (spec.type === 'choice') return 'Choose';
  if (spec.type === 'multi-select') return 'Select';
  if (spec.type === 'sequence') return 'Build Signal';
  if (spec.type === 'ranking') return 'Rank';
  if (spec.type === 'error-correction') return 'Fix Signal';
  if (spec.type === 'confirm') return 'Confirm';
  if (spec.type === 'read-aloud') return 'Reading Queue';
  if (spec.type === 'geo-point') return 'Plot Position';
  if (spec.type === 'text' || spec.type === 'textarea') return 'Send Signal';
  return 'Respond';
}

function getSignalName(gameKey: string | null | undefined): string {
  if (!gameKey) return 'Crew Signal';
  return getGame(gameKey)?.name ?? getActivity(gameKey)?.name ?? gameKey;
}

export function StudentController({ sessionId, studentSession, onLeave }: StudentControllerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'rate_limited'>('idle');
  const [waitSeconds, setWaitSeconds] = useState(0);
  const [activePoll, setActivePoll] = useState<ActivePoll | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [sessionActive, setSessionActive] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'checking' | 'disconnected'>('checking');
  const [realtimeHealth, setRealtimeHealth] = useState<RealtimeHealth>('connecting');
  const [canonicalReady, setCanonicalReady] = useState(false);
  const [lastCanonicalSuccessAt, setLastCanonicalSuccessAt] = useState<number | null>(null);
  const [lastParticipationSuccessAt, setLastParticipationSuccessAt] = useState<number | null>(null);
  const [degradedSince, setDegradedSince] = useState<number | null>(Date.now());
  const [connectionNow, setConnectionNow] = useState(Date.now());
  const [inputSpec, setInputSpec] = useState<InputSpec | null>(null);
  const [publishedQuestions, setPublishedQuestions] = useState<PublishedQuestion[]>([]);
  const [wonderQuestions, setWonderQuestions] = useState<WonderQuestion[]>([]);
  const [wonderVotedIds, setWonderVotedIds] = useState<Set<string>>(new Set());
  const [wonderLocalCounts, setWonderLocalCounts] = useState<Record<string, number>>({});
  const [classBoardItems, setClassBoardItems] = useState<ClassBoardItem[]>([]);
  const [classBoardVotedIds, setClassBoardVotedIds] = useState<Set<string>>(new Set());
  const [classBoardLocalCounts, setClassBoardLocalCounts] = useState<Record<string, number>>({});
  const [classBoardReplyTo, setClassBoardReplyTo] = useState<string | null>(null);
  const [classBoardReplyText, setClassBoardReplyText] = useState('');
  const [classBoardReplyBusy, setClassBoardReplyBusy] = useState(false);
  const [personalMission, setPersonalMission] = useState<string | null>(null);
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * WAITING_TIPS.length));
  const [sessionTopic, setSessionTopic] = useState<string | null>(null);
  const [sessionDifficulty, setSessionDifficulty] = useState<string>('Intermediate');
  const [topicTips, setTopicTips] = useState<{ category: string; color: string; text: string }[]>([]);
  const [topicTipsLoaded, setTopicTipsLoaded] = useState(false);

  // Reference panel state
  const [grammarTarget, setGrammarTarget] = useState<string | null>(null);
  const [referenceVocab, setReferenceVocab] = useState<VocabItem[] | null>(null);
  const [referenceExpressions, setReferenceExpressions] = useState<ExpressionItem[] | null>(null);
  const [openPanel, setOpenPanel] = useState<ReferencePanel>(null);

  // Wonder Board follow-up picker state
  const [selectedFollowUpId, setSelectedFollowUpId] = useState<string | null>(null);
  const [followUpText, setFollowUpText] = useState('');

  // Ask a Question section state
  const [questionText, setQuestionText] = useState('');
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [questionStatus, setQuestionStatus] = useState<'idle' | 'sent' | 'error' | 'rate_limited'>('idle');
  const [questionWait, setQuestionWait] = useState(0);

  // Flight card state
  const [offeredCards, setOfferedCards] = useState<OfferedCards | null>(null);
  const [heldCard, setHeldCard] = useState<HeldCard | null>(null);
  const [dismissedDealIndices, setDismissedDealIndices] = useState<Set<number>>(new Set());
  const [isPickingCard, setIsPickingCard] = useState(false);
  const [cardConflict, setCardConflict] = useState<{ pendingCardId: string; heldCard: { cardId: string; cardKey: string; moduleKey: string } } | null>(null);

  // Crew Radio (side channel) state — optional prompts that never replace the main task
  const [sideChannel, setSideChannel] = useState<SideChannelItem | null>(null);
  const [radioOpen, setRadioOpen] = useState(false);
  const [radioSeenId, setRadioSeenId] = useState<string | null>(null);
  const [radioDoneIds, setRadioDoneIds] = useState<Set<string>>(new Set());
  const [radioText, setRadioText] = useState('');
  const [radioBusy, setRadioBusy] = useState(false);
  const [radioStatus, setRadioStatus] = useState<'idle' | 'sent' | 'error'>('idle');

  // My Flight Deck state
  const [flightDeckOpen, setFlightDeckOpen] = useState(false);
  const [scoreVisible, setScoreVisible] = useState(true);
  const [spotlightNamed, setSpotlightNamed] = useState(true);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  // AI feedback state
  const [latestFeedback, setLatestFeedback] = useState<{ feedback: string; points: number; submissionId: string } | null>(null);
  const [seenFeedbackId, setSeenFeedbackId] = useState<string | null>(null);

  // Scored result card state
  const [lastResult, setLastResult] = useState<{ scoreId: string; outcome: string; points: number; accuracyStatus: string | null } | null>(null);
  const [seenResultId, setSeenResultId] = useState<string | null>(null);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [responseCount, setResponseCount] = useState(0);
  const [sessionAccuracy, setSessionAccuracy] = useState<number | null>(null);

  // End-of-session personal results
  const [personalResults, setPersonalResults] = useState<{
    totalPoints: number;
    accuracy: number | null;
    bestStreak: number;
    rank: number | null;
    totalParticipants: number | null;
  } | null>(null);
  const [debriefToken, setDebriefToken] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  // "Get ready" transition when inputSpec first arrives
  const [transitionActivityName, setTransitionActivityName] = useState<string | null>(null);
  const prevInputSpecRef = useRef<InputSpec | null>(null);
  // Auto-clear timer for the splash. Held in a ref (not the effect cleanup) so a follow-up
  // inputSpec delivery can't cancel it and strand the device on "Stand by...".
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const awaitingInitialHydrationRef = useRef(true);
  const suppressNextTransitionRef = useRef(false);
  // Tracks the last timed round we logged delivery-latency instrumentation for.
  const loggedRoundRef = useRef<string | null>(null);

  // Server clock offset (serverNow − local Date.now() at response receipt). Countdown
  // timers add this to the local clock so device skew never eats answer time.
  const [clockOffsetMs, setClockOffsetMs] = useState(0);
  const inputSpecRevisionRef = useRef<string | null>(null);
  const lastFullSessionPollAtRef = useRef(0);
  const sessionRequestGateRef = useRef(new LatestRequestGate());
  const submissionRequestGateRef = useRef(new LatestRequestGate());

  // Poll hide tracking (voted or dismissed)
  const [hiddenPollIds, setHiddenPollIds] = useState<Set<string>>(new Set());
  const [submittedPollIds, setSubmittedPollIds] = useState<Set<string>>(new Set());

  // Optimistic voting state
  const [localVoteCounts, setLocalVoteCounts] = useState<Record<string, number>>({});
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  // Load voted IDs from localStorage on mount
  useEffect(() => {
    setVotedIds(loadVotedIds(sessionId));
    const radioState = loadCrewRadioState(sessionId);
    setRadioSeenId(radioState.seen);
    setRadioDoneIds(new Set(radioState.done));
  }, [sessionId]);

  // Fire "Get ready" splash when inputSpec transitions null → set. The clear timer lives in a
  // ref rather than the effect cleanup: on phones, realtime and the poll fallback often both
  // deliver the first spec within the splash window, and a cleanup-based timer would be cancelled
  // by the second delivery — leaving the device stuck on "Stand by..." until a manual refresh.
  useEffect(() => {
    const previousSpec = prevInputSpecRef.current;
    const hadSpec = previousSpec !== null;
    const changedSpec = inputSpec !== null
      && getInputSpecRevision(previousSpec) !== getInputSpecRevision(inputSpec);
    prevInputSpecRef.current = inputSpec;
    if (changedSpec) {
      submissionRequestGateRef.current.invalidate();
      setRadioOpen(false);
      setFlightDeckOpen(false);
      setIsSubmitting(false);
      setSubmitStatus('idle');
      setWaitSeconds(0);
    }
    const suppressTransition = suppressNextTransitionRef.current;
    suppressNextTransitionRef.current = false;
    if (inputSpec && !hadSpec && !suppressTransition) {
      const name = getGame(inputSpec.gameKey)?.name ?? getActivity(inputSpec.gameKey)?.name;
      if (name) {
        setTransitionActivityName(name);
        if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = setTimeout(() => setTransitionActivityName(null), 1500);
      }
    }
  }, [inputSpec]);

  useEffect(() => {
    setSelectedChoice(null);
  }, [activePoll?.pollId]);

  // Clear the splash timer on unmount.
  useEffect(() => () => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
  }, []);

  // Poll for session status, active polls, and input spec
  const checkSession = useCallback(async (options?: {
    forceFull?: boolean;
    source?: 'mount' | 'subscribed' | 'database-change' | 'degraded-fallback' | 'safety-fallback';
  }) => {
    const requestSequence = sessionRequestGateRef.current.begin();
    const requestStartedAt = Date.now();
    const source = options?.source ?? 'safety-fallback';
    try {
      const params = new URLSearchParams({
        sessionId,
        clientId: studentSession.clientId,
      });
      const allowUnchanged = !options?.forceFull && Date.now() - lastFullSessionPollAtRef.current < 60_000;
      if (allowUnchanged && inputSpecRevisionRef.current) {
        params.set('inputSpecRevision', inputSpecRevisionRef.current);
      }

      const res = await fetch(`/api/student/session?${params.toString()}`);
      if (!sessionRequestGateRef.current.isCurrent(requestSequence)) return;
      if (!res.ok) {
        setSessionActive(false);
        setConnectionStatus('disconnected');
        setCanonicalReady(false);
        logRealtimeDiagnostic('student-input-spec', 'canonical_reconcile_failed', {
          source,
          status: res.status,
          elapsed_ms: Date.now() - requestStartedAt,
        });
        return false;
      }

      const data = await res.json();
      if (!sessionRequestGateRef.current.isCurrent(requestSequence)) return;
      // Sync clock offset before the spec lands so a freshly mounted timer reads it.
      const offset = typeof data.serverNow === 'number' ? data.serverNow - Date.now() : 0;
      if (typeof data.serverNow === 'number') {
        setClockOffsetMs(offset);
      }
      if (data.inputSpecUnchanged === true) {
        if (typeof data.inputSpecRevision === 'string') {
          inputSpecRevisionRef.current = data.inputSpecRevision;
        }
        setSessionActive(data.isActive);
        setActivePoll(data.activePoll ?? null);
        setSideChannel(data.sideChannel ?? null);
        setConnectionStatus('connected');
        setCanonicalReady(true);
        const reconciledAt = Date.now();
        setLastCanonicalSuccessAt(reconciledAt);
        setConnectionNow(reconciledAt);
        logRealtimeDiagnostic('student-input-spec', 'canonical_reconcile', {
          source,
          revision: data.inputSpecRevision ?? inputSpecRevisionRef.current,
          unchanged: true,
          elapsed_ms: Date.now() - requestStartedAt,
        });
        return true;
      }
      // Instrumentation: on a freshly arrived timed round, measure how much of the
      // answer window was lost to delivery. The grace window (answersOpenAt − startedAt)
      // absorbs delivery up to its length; only delivery BEYOND grace eats answer time.
      // That residual is what A2 (realtime push) closes.
      const spec = data.inputSpec as InputSpec | null;
      lastFullSessionPollAtRef.current = Date.now();
      inputSpecRevisionRef.current = typeof data.inputSpecRevision === 'string'
        ? data.inputSpecRevision
        : getInputSpecRevision(spec);
      if (spec?.timerSeconds && typeof spec.answersOpenAt === 'number' && spec.startedAt) {
        const roundKey = `${spec.gameKey}:${spec.startedAt}`;
        if (loggedRoundRef.current !== roundKey) {
          loggedRoundRef.current = roundKey;
          const serverNow = Date.now() + offset;
          const deliveryMs = serverNow - spec.startedAt;
          const graceMs = spec.answersOpenAt - spec.startedAt;
          const lostS = Math.max(0, Math.round((deliveryMs - graceMs) / 1000));
          const effectiveStart = Math.min(spec.timerSeconds, Math.max(0, Math.ceil((spec.answersOpenAt + spec.timerSeconds * 1000 - serverNow) / 1000)));
          console.debug(
            `[timer] round arrived · delivery=${Math.round(deliveryMs)}ms grace=${graceMs}ms ` +
            `→ answer window opens at ${effectiveStart}/${spec.timerSeconds}s (lost ${lostS}s to delivery past grace)`,
          );
        }
      }
      setSessionActive(data.isActive);
      setActivePoll(data.activePoll);
      if (awaitingInitialHydrationRef.current) {
        suppressNextTransitionRef.current = data.inputSpec != null;
        awaitingInitialHydrationRef.current = false;
      }
      setInputSpec(data.inputSpec);
      setSideChannel(data.sideChannel ?? null);
      if (!data.inputSpec?.wonderFollowUpMode) {
        setSelectedFollowUpId(null);
        setFollowUpText('');
      }
      setPublishedQuestions(data.publishedQuestions ?? []);
      setWonderQuestions(data.wonderQuestions ?? []);
      setClassBoardItems(data.classBoardItems ?? []);
      setPersonalMission(data.personalMission ?? null);
      if (data.topic) setSessionTopic(data.topic);
      if (data.difficulty) setSessionDifficulty(data.difficulty);
      setGrammarTarget(data.grammarTarget ?? null);
      setReferenceVocab(Array.isArray(data.referenceVocab) ? data.referenceVocab : null);
      setReferenceExpressions(Array.isArray(data.referenceExpressions) ? data.referenceExpressions : null);
      setLatestFeedback(data.latestFeedback ?? null);
      setPersonalResults(data.personalResults ?? null);
      setDebriefToken(data.debriefToken ?? null);
      setLastResult(data.lastResult ?? null);
      if (typeof data.sessionPoints === 'number') setSessionPoints(data.sessionPoints);
      if (typeof data.responseCount === 'number') setResponseCount(data.responseCount);
      if ('sessionAccuracy' in data) setSessionAccuracy((data.sessionAccuracy as number | null) ?? null);
      setOfferedCards(data.offeredCards ?? null);
      setHeldCard(data.heldCard ?? null);
      setConnectionStatus('connected');
      setCanonicalReady(true);
      const reconciledAt = Date.now();
      setLastCanonicalSuccessAt(reconciledAt);
      setConnectionNow(reconciledAt);
      logRealtimeDiagnostic('student-input-spec', 'canonical_reconcile', {
        source,
        revision: inputSpecRevisionRef.current,
        unchanged: false,
        elapsed_ms: Date.now() - requestStartedAt,
      });
      return true;
    } catch {
      if (!sessionRequestGateRef.current.isCurrent(requestSequence)) return;
      setConnectionStatus('disconnected');
      setCanonicalReady(false);
      logRealtimeDiagnostic('student-input-spec', 'canonical_reconcile_failed', {
        source,
        elapsed_ms: Date.now() - requestStartedAt,
      });
      return false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    const supabase = createClient();
    return startRealtimeChannelLifecycle<RealtimeChannel>({
      scope: 'student-input-spec',
      createChannel: () => supabase
        .channel(inputSpecChannelName(sessionId))
        .on('broadcast', { event: INPUT_SPEC_REALTIME_EVENT }, ({ payload }: { payload: unknown }) => {
        // Invalidate any older API response before applying this realtime task.
        sessionRequestGateRef.current.invalidate();
        const data = payload as Partial<InputSpecRealtimePayload>;
        const spec = (data.spec ?? null) as InputSpec | null;
        const serverNow = typeof data.serverNow === 'number' ? data.serverNow : Date.now();
        const offset = serverNow - Date.now();
        const revision = typeof data.inputSpecRevision === 'string'
          ? data.inputSpecRevision
          : getInputSpecRevision(spec);
        logRealtimeDiagnostic('student-input-spec', 'broadcast_received', {
          revision,
          delivery_ms: spec?.startedAt ? serverNow - spec.startedAt : undefined,
        });
        setClockOffsetMs(offset);
        inputSpecRevisionRef.current = revision;

        if (spec?.timerSeconds && typeof spec.answersOpenAt === 'number' && spec.startedAt) {
          const roundKey = `${spec.gameKey}:${spec.startedAt}`;
          if (loggedRoundRef.current !== roundKey) {
            loggedRoundRef.current = roundKey;
            const deliveryMs = serverNow - spec.startedAt;
            const graceMs = spec.answersOpenAt - spec.startedAt;
            const lostS = Math.max(0, Math.round((deliveryMs - graceMs) / 1000));
            const effectiveStart = Math.min(spec.timerSeconds, Math.max(0, Math.ceil((spec.answersOpenAt + spec.timerSeconds * 1000 - serverNow) / 1000)));
            console.debug(
              `[timer] realtime round arrived · delivery=${Math.round(deliveryMs)}ms grace=${graceMs}ms ` +
              `→ answer window opens at ${effectiveStart}/${spec.timerSeconds}s (lost ${lostS}s to delivery past grace)`,
            );
          }
        }

        if (awaitingInitialHydrationRef.current) {
          suppressNextTransitionRef.current = spec != null;
          awaitingInitialHydrationRef.current = false;
        }
        setInputSpec(spec);
        if (!spec?.wonderFollowUpMode) {
          setSelectedFollowUpId(null);
          setFollowUpText('');
        }
        setConnectionStatus('connected');
          logRealtimeDiagnostic('student-input-spec', 'ui_apply', { revision });
        })
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'sessions',
            filter: `id=eq.${sessionId}`,
          },
          () => {
            logRealtimeDiagnostic('student-input-spec', 'database_change_received');
            void checkSession({ forceFull: true, source: 'database-change' });
          },
        ),
      removeChannel: (channel) => supabase.removeChannel(channel),
      reconcile: async () => {
        const reconciled = await checkSession({ forceFull: true, source: 'subscribed' });
        if (reconciled === false) throw new Error('Student canonical reconciliation failed');
      },
      onHealth: setRealtimeHealth,
    });
  }, [sessionId, checkSession]);

  const effectiveRealtimeHealth = getEffectiveRealtimeHealth(realtimeHealth, canonicalReady);

  useEffect(() => {
    if (effectiveRealtimeHealth === 'subscribed') {
      setDegradedSince(null);
      setConnectionNow(Date.now());
      return;
    }
    setDegradedSince((current) => current ?? Date.now());
  }, [effectiveRealtimeHealth]);

  useEffect(() => {
    if (effectiveRealtimeHealth === 'subscribed') return;
    const interval = setInterval(() => setConnectionNow(Date.now()), 1_000);
    return () => clearInterval(interval);
  }, [effectiveRealtimeHealth]);

  useEffect(() => {
    void checkSession({
      forceFull: effectiveRealtimeHealth !== 'subscribed',
      source: canonicalReady
        ? effectiveRealtimeHealth === 'subscribed' ? 'safety-fallback' : 'degraded-fallback'
        : 'mount',
    });
    const interval = setInterval(
      () => void checkSession({
        forceFull: effectiveRealtimeHealth !== 'subscribed',
        source: effectiveRealtimeHealth === 'subscribed' ? 'safety-fallback' : 'degraded-fallback',
      }),
      reconcileIntervalFor(effectiveRealtimeHealth),
    );
    return () => clearInterval(interval);
  }, [canonicalReady, checkSession, effectiveRealtimeHealth]);

  // Load flight deck prefs once on mount
  useEffect(() => {
    fetch(`/api/student/prefs?sessionId=${sessionId}&clientId=${studentSession.clientId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setScoreVisible(data.score_visible ?? true);
          setSpotlightNamed(data.spotlight_named ?? true);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Countdown timer for game submission rate limiting
  useEffect(() => {
    if (waitSeconds > 0) {
      const timer = setTimeout(() => setWaitSeconds(waitSeconds - 1), 1000);
      return () => clearTimeout(timer);
    } else if (submitStatus === 'rate_limited') {
      setSubmitStatus('idle');
    }
  }, [waitSeconds, submitStatus]);

  // Countdown timer for question rate limiting
  useEffect(() => {
    if (questionWait > 0) {
      const timer = setTimeout(() => setQuestionWait(questionWait - 1), 1000);
      return () => clearTimeout(timer);
    } else if (questionStatus === 'rate_limited') {
      setQuestionStatus('idle');
    }
  }, [questionWait, questionStatus]);

  // Auto-dismiss result card after 4 seconds
  useEffect(() => {
    if (!lastResult || lastResult.scoreId === seenResultId) return;
    const t = setTimeout(() => setSeenResultId(lastResult.scoreId), 4000);
    return () => clearTimeout(t);
  }, [lastResult, seenResultId]);

  // Cycle through English spotlight tips while waiting for an activity
  const difficultyRank = DIFFICULTIES.indexOf(sessionDifficulty as Difficulty);
  const filteredStaticTips = WAITING_TIPS.filter(
    (t) => DIFFICULTIES.indexOf(t.minLevel as Difficulty) <= difficultyRank
  );
  const allTips = [...topicTips, ...filteredStaticTips];
  useEffect(() => {
    if (inputSpec) return;
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % allTips.length);
    }, 10000);
    return () => clearInterval(interval);
  // allTips.length changes when topicTips load — restarting the interval is fine
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputSpec, allTips.length]);

  // Fetch topic-aware tips once when topic becomes available
  useEffect(() => {
    if (!sessionTopic || topicTipsLoaded) return;
    setTopicTipsLoaded(true);
    fetch('/api/waiting-tips/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then((r) => r.json())
      .then((data: { tips?: { category: string; text: string }[] }) => {
        if (data.tips && data.tips.length > 0) {
          const mapped = data.tips.map((t) => ({
            ...t,
            color: t.category.toLowerCase().includes('vocab') ? 'teal'
              : t.category === 'Did you know?' ? 'purple'
              : t.category === 'Grammar Tip' ? 'blue'
              : 'amber',
          }));
          setTopicTips(mapped);
          setTipIndex(0); // start from first topic tip
        }
      })
      .catch(() => {}); // silent fail — static tips remain
  }, [sessionTopic, topicTipsLoaded, sessionId]);

  const handleSubmit = useCallback(async (content: string) => {
    if (!content.trim() || isSubmitting) return;
    const submissionSequence = submissionRequestGateRef.current.begin();

    // Optimistic Mission Brief: show immediately before DB confirms
    if (inputSpec?.gameKey === 'mission-selector') {
      setPersonalMission(content.trim());
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Wonder Board questions go to a dedicated endpoint
      const isWonderBoard = inputSpec?.gameKey === 'wonder-board';
      const isClassBoard = inputSpec?.type === 'board';
      const effectiveParentId = inputSpec?.wonderFollowUpMode
        ? selectedFollowUpId
        : (inputSpec?.wonderParentId ?? null);
      let boardContent = content.trim();
      let boardCategory = inputSpec?.boardDefaultCategory ?? inputSpec?.boardCategories?.[0]?.key ?? 'idea';
      let boardZoneKey = inputSpec?.boardDefaultZone ?? inputSpec?.boardZones?.[0]?.key ?? 'main';
      if (isClassBoard) {
        try {
          const parsed = JSON.parse(content) as { content?: string; category?: string; zoneKey?: string };
          if (typeof parsed.content === 'string') boardContent = parsed.content.trim();
          if (typeof parsed.category === 'string') boardCategory = parsed.category;
          if (typeof parsed.zoneKey === 'string') boardZoneKey = parsed.zoneKey;
        } catch {
          boardContent = content.trim();
        }
      }

      const endpoint = isClassBoard ? '/api/class-board/submit' : isWonderBoard ? '/api/wonder-board/submit' : '/api/student/submit';
      const body = isClassBoard
        ? {
            sessionId,
            boardKey: inputSpec?.boardKey,
            authorType: 'student',
            clientId: studentSession.clientId,
            displayName: studentSession.displayName,
            content: boardContent,
            category: boardCategory,
            zoneKey: boardZoneKey,
            wordCloud: inputSpec?.boardWordCloud,
          }
        : isWonderBoard
        ? {
            sessionId,
            clientId: studentSession.clientId,
            displayName: studentSession.displayName,
            content: content.trim(),
            starter: effectiveParentId ? 'Follow-up' : getAssignedStarter(studentSession.clientId),
            parentId: effectiveParentId,
          }
        : {
            sessionId,
            clientId: studentSession.clientId,
            displayName: studentSession.displayName,
            content: content.trim(),
            team: studentSession.team,
            gameKey: inputSpec?.gameKey,
            inputType: inputSpec?.type,
            roundId: inputSpec?.roundId,
            studentId: studentSession.studentId,
            allowMultiple: inputSpec?.allowMultiple,
            reviewMode: inputSpec?.reviewMode,
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!submissionRequestGateRef.current.isCurrent(submissionSequence)) return;

      if (res.status === 429) {
        setSubmitStatus('rate_limited');
        setWaitSeconds(data.waitSeconds || 15);
      } else if (!res.ok) {
        setSubmitStatus('error');
      } else {
        setSubmitStatus('success');
        setLastParticipationSuccessAt(Date.now());
        setTimeout(() => {
          if (submissionRequestGateRef.current.isCurrent(submissionSequence)) setSubmitStatus('idle');
        }, 2000);
        // Clear follow-up selection after successful submit
        if (inputSpec?.wonderFollowUpMode) {
          setSelectedFollowUpId(null);
          setFollowUpText('');
        }
        // Re-poll quickly so per-student state (e.g. found words, lives) updates without waiting the fallback interval.
        setTimeout(() => void checkSession({ forceFull: true }), 1500);
      }
    } catch {
      if (!submissionRequestGateRef.current.isCurrent(submissionSequence)) return;
      setSubmitStatus('error');
    } finally {
      if (submissionRequestGateRef.current.isCurrent(submissionSequence)) setIsSubmitting(false);
    }
  }, [sessionId, studentSession, inputSpec, isSubmitting, checkSession, selectedFollowUpId]);

  const handleVote = async (choice: string) => {
    if (!activePoll || isVoting) return;

    setIsVoting(true);
    setSelectedChoice(choice);

    try {
      const res = await fetch('/api/student/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: activePoll.pollId,
          sessionId,
          clientId: studentSession.clientId,
          displayName: studentSession.displayName,
          choice,
          team: studentSession.team,
        }),
      });

      if (res.ok) {
        setLastParticipationSuccessAt(Date.now());
        setSubmittedPollIds(prev => new Set(prev).add(activePoll.pollId));
      } else {
        const data = await res.json();
        if (res.status !== 429) {
          setSelectedChoice(null);
        } else {
          console.log(`Vote rate limited, wait ${data.waitSeconds}s`);
          setHiddenPollIds(prev => new Set(prev).add(activePoll.pollId));
        }
      }
    } catch {
      setSelectedChoice(null);
    } finally {
      setIsVoting(false);
    }
  };

  const handleAskQuestion = async () => {
    const trimmed = questionText.trim();
    if (!trimmed || isAskingQuestion) return;
    if (trimmed.length > VALIDATION.QUESTION_MAX) return;

    setIsAskingQuestion(true);
    setQuestionStatus('idle');

    try {
      const res = await fetch('/api/student/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          clientId: studentSession.clientId,
          displayName: studentSession.displayName,
          content: trimmed,
          team: studentSession.team,
          gameKey: null,
          inputType: 'textarea',
          studentId: studentSession.studentId,
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setQuestionStatus('rate_limited');
        setQuestionWait(data.waitSeconds || 15);
      } else if (!res.ok) {
        setQuestionStatus('error');
      } else {
        setQuestionStatus('sent');
        setQuestionText('');
        setTimeout(() => setQuestionStatus('idle'), 3000);
      }
    } catch {
      setQuestionStatus('error');
    } finally {
      setIsAskingQuestion(false);
    }
  };

  const markRadioDone = (itemId: string) => {
    setRadioDoneIds((prev) => {
      const next = new Set(prev);
      next.add(itemId);
      persistCrewRadioState(sessionId, { seen: itemId, done: Array.from(next) });
      return next;
    });
  };

  const handleRadioToggle = () => {
    setRadioOpen((open) => {
      const next = !open;
      if (next && sideChannel && sideChannel.id !== radioSeenId) {
        setRadioSeenId(sideChannel.id);
        persistCrewRadioState(sessionId, { seen: sideChannel.id, done: Array.from(radioDoneIds) });
      }
      return next;
    });
  };

  const handleRadioWrite = async () => {
    if (!sideChannel || !radioText.trim() || radioBusy) return;
    setRadioBusy(true);
    setRadioStatus('idle');
    try {
      const res = await fetch('/api/student/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          clientId: studentSession.clientId,
          displayName: studentSession.displayName,
          content: radioText.trim(),
          team: studentSession.team,
          gameKey: SIDE_CHANNEL_GAME_KEY,
          inputType: 'textarea',
          studentId: studentSession.studentId,
          allowMultiple: true,
          reviewMode: 'approval',
        }),
      });
      if (res.ok) {
        setRadioStatus('sent');
        setRadioText('');
        markRadioDone(sideChannel.id);
      } else {
        setRadioStatus('error');
      }
    } catch {
      setRadioStatus('error');
    } finally {
      setRadioBusy(false);
    }
  };

  const handleRadioVote = async (choice: string) => {
    if (!sideChannel?.pollId || radioBusy) return;
    setRadioBusy(true);
    setRadioStatus('idle');
    try {
      const res = await fetch('/api/student/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: sideChannel.pollId,
          sessionId,
          clientId: studentSession.clientId,
          displayName: studentSession.displayName,
          choice,
          team: studentSession.team,
        }),
      });
      if (res.ok || res.status === 429) {
        setRadioStatus('sent');
        markRadioDone(sideChannel.id);
      } else {
        setRadioStatus('error');
      }
    } catch {
      setRadioStatus('error');
    } finally {
      setRadioBusy(false);
    }
  };

  const savePrefs = async (overrides?: { score_visible?: boolean; spotlight_named?: boolean }) => {
    const payload = {
      sessionId,
      clientId: studentSession.clientId,
      score_visible: overrides?.score_visible ?? scoreVisible,
      spotlight_named: overrides?.spotlight_named ?? spotlightNamed,
    };
    await fetch('/api/student/prefs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  };

  const handlePickCard = useCallback(async (cardId: string, forceReplace = false) => {
    setIsPickingCard(true);
    try {
      const res = await fetch('/api/student/flight-cards/pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, clientId: studentSession.clientId, cardId, replace: forceReplace || undefined }),
      });
      const data = await res.json();
      if (data.conflict) {
        setCardConflict({ pendingCardId: cardId, heldCard: data.heldCard });
      } else if (data.held) {
        setCardConflict(null);
        setOfferedCards(null);
        setHeldCard({ cardId: data.card.cardId, cardKey: data.card.cardKey, moduleKey: data.card.moduleKey, activationsCount: 0, status: 'held' });
      }
    } catch { /* silent — poll will correct */ }
    finally { setIsPickingCard(false); }
  }, [sessionId, studentSession.clientId]);

  const handleActivateCard = useCallback(async (active: boolean) => {
    if (!heldCard || heldCard.cardKey === 'contrail') return;
    try {
      const res = await fetch('/api/student/flight-cards/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, clientId: studentSession.clientId, cardId: heldCard.cardId, active }),
      });
      const data = await res.json();
      if (data.status) {
        setHeldCard(prev => prev ? { ...prev, status: data.status } : null);
      }
    } catch { /* silent */ }
  }, [sessionId, studentSession.clientId, heldCard]);

  const handleToggleStealth = async () => {
    const next = !scoreVisible;
    setScoreVisible(next);
    await savePrefs({ score_visible: next });
  };

  const handleSavePrefs = async () => {
    setIsSavingPrefs(true);
    try {
      await savePrefs();
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2500);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleUpvote = async (question: PublishedQuestion) => {
    if (votedIds.has(question.id)) return;

    // Optimistic update
    const newVotedIds = new Set(votedIds).add(question.id);
    setVotedIds(newVotedIds);
    setLocalVoteCounts((prev) => ({
      ...prev,
      [question.id]: Math.max(prev[question.id] ?? 0, question.voteCount) + 1,
    }));
    persistVotedIds(sessionId, Array.from(newVotedIds));

    // Fire-and-forget
    try {
      await fetch('/api/class-questions/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: question.id,
          clientId: studentSession.clientId,
        }),
      });
    } catch { /* optimistic update stays */ }
  };

  const handleWonderVote = async (question: WonderQuestion) => {
    if (wonderVotedIds.has(question.id)) return;

    const newVotedIds = new Set(wonderVotedIds).add(question.id);
    setWonderVotedIds(newVotedIds);
    setWonderLocalCounts((prev) => ({
      ...prev,
      [question.id]: Math.max(prev[question.id] ?? 0, question.voteCount) + 1,
    }));

    try {
      await fetch('/api/wonder-board/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: question.id,
          clientId: studentSession.clientId,
        }),
      });
    } catch { /* optimistic update stays */ }
  };

  const handleClassBoardVote = async (item: ClassBoardItem) => {
    if (classBoardVotedIds.has(item.id)) return;

    const newVotedIds = new Set(classBoardVotedIds).add(item.id);
    setClassBoardVotedIds(newVotedIds);
    setClassBoardLocalCounts((prev) => ({
      ...prev,
      [item.id]: Math.max(prev[item.id] ?? 0, item.voteCount) + 1,
    }));

    try {
      await fetch('/api/class-board/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          itemId: item.id,
          clientId: studentSession.clientId,
        }),
      });
    } catch { /* optimistic update stays */ }
  };

  const handleClassBoardReply = async (parent: ClassBoardItem) => {
    const content = classBoardReplyText.trim();
    if (!content || classBoardReplyBusy) return;
    setClassBoardReplyBusy(true);
    try {
      const res = await fetch('/api/class-board/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          boardKey: inputSpec?.boardKey,
          authorType: 'student',
          clientId: studentSession.clientId,
          displayName: studentSession.displayName,
          content,
          category: parent.category,
          zoneKey: parent.zoneKey,
          parentId: parent.id,
        }),
      });
      if (res.ok) {
        setClassBoardReplyTo(null);
        setClassBoardReplyText('');
      }
    } finally {
      setClassBoardReplyBusy(false);
    }
  };

  const currentSignalName = inputSpec ? getSignalName(inputSpec.gameKey) : null;
  const effectiveConnectionState = studentConnectionState({
    channelHealth: realtimeHealth,
    canonicalReady,
    lastCanonicalSuccessAt,
    lastParticipationSuccessAt,
    degradedSince,
    now: connectionNow,
  });
  const connectionLabel = {
    checking: connectionStatus === 'disconnected' ? 'Reconnecting…' : 'Checking',
    connected: 'Connected',
    syncing: 'Connected · syncing',
    reconnecting: 'Reconnecting…',
    offline: 'Offline',
  }[effectiveConnectionState];
  const connectionClass = {
    checking: 'bg-amber-400 shadow-amber-400/40 animate-pulse',
    connected: 'bg-emerald-400 shadow-emerald-400/40',
    syncing: 'bg-cyan-400 shadow-cyan-400/40',
    reconnecting: 'bg-amber-400 shadow-amber-400/40 animate-pulse',
    offline: 'bg-red-400 shadow-red-400/40',
  }[effectiveConnectionState];
  const lastResultLabel = lastResult ? (OUTCOME_LABELS[lastResult.outcome] ?? lastResult.outcome) : null;

  // Capture & share: the debrief link is the durable artifact. Pasting it unfurls
  // into the boarding-pass card (opengraph-image). Native share sheet first, copy
  // as fallback — never a public-social funnel.
  const debriefUrl = debriefToken && typeof window !== 'undefined'
    ? `${window.location.origin}/debrief/${debriefToken}`
    : null;
  const handleShare = async () => {
    if (!debriefUrl) return;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'My lesson results', text: 'I just landed a live lesson ✈️', url: debriefUrl });
        return;
      } catch { /* cancelled or unsupported — fall through to copy */ }
    }
    try {
      await navigator.clipboard.writeText(debriefUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch { /* ignore */ }
  };

  if (!sessionActive) {
    return (
      <StudentSkyShell weather="landing" center>
        <div className="glass rounded-3xl p-8 w-full max-w-md text-center space-y-6">
          <div>
            <PlaneLanding className="mx-auto mb-3 h-10 w-10 text-cyan-300" strokeWidth={1.5} aria-hidden />
            <h1 className="text-2xl font-bold text-white">You&apos;ve landed!</h1>
            <p className="font-instrument mt-1 text-[11px] uppercase tracking-[0.2em] text-amber-300/70">Flight complete · great work today</p>
          </div>

          {personalResults ? (
            <>
              {/* Stat tiles */}
              <div className={`grid gap-3 ${
                personalResults.accuracy !== null && personalResults.bestStreak >= 2
                  ? 'grid-cols-3'
                  : personalResults.accuracy !== null || personalResults.bestStreak >= 2
                  ? 'grid-cols-2'
                  : 'grid-cols-1'
              }`}>
                <div
                  className="bg-white/5 rounded-2xl p-4 animate-passport-stamp"
                  style={{ '--stamp-rotation': '-1.6deg', animationDelay: '0.25s' } as React.CSSProperties}
                >
                  <p className="text-2xl font-bold text-cyan-400">{personalResults.totalPoints}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Points</p>
                </div>
                {personalResults.accuracy !== null && (
                  <div
                    className="bg-white/5 rounded-2xl p-4 animate-passport-stamp"
                    style={{ '--stamp-rotation': '1.4deg', animationDelay: '0.41s' } as React.CSSProperties}
                  >
                    <p className={`text-2xl font-bold ${
                      personalResults.accuracy >= 80 ? 'text-emerald-400'
                      : personalResults.accuracy >= 50 ? 'text-amber-400'
                      : 'text-red-400'
                    }`}>{personalResults.accuracy}%</p>
                    <p className="text-xs text-gray-400 mt-0.5">Accuracy</p>
                  </div>
                )}
                {personalResults.bestStreak >= 2 && (
                  <div
                    className="bg-white/5 rounded-2xl p-4 animate-passport-stamp"
                    style={{ '--stamp-rotation': '-1.2deg', animationDelay: '0.57s' } as React.CSSProperties}
                  >
                    <p className="flex items-center justify-center gap-1 text-2xl font-bold text-orange-400">
                      <Flame className="h-5 w-5" aria-hidden />
                      {personalResults.bestStreak}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Best Streak</p>
                  </div>
                )}
              </div>

              {/* Rank — suppressed when the student is the only participant ("#1 of 1" is hollow) */}
              {personalResults.rank !== null &&
                personalResults.totalParticipants !== null &&
                personalResults.totalParticipants > 1 && (
                <p className="text-sm text-gray-300">
                  You ranked <span className="font-bold text-white">#{personalResults.rank}</span> of {personalResults.totalParticipants} students
                </p>
              )}

              {/* Words from this lesson — review on the device, not just the take-home page */}
              {referenceVocab && referenceVocab.length > 0 && (
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Words from this lesson</p>
                  <div className="space-y-1.5">
                    {referenceVocab.map((item) => (
                      <div key={item.word} className="rounded-lg bg-white/5 px-3 py-2">
                        <span className="text-sm font-semibold text-cyan-400">{item.word}</span>
                        <span className="text-gray-400 text-xs"> — {item.definition}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Capture & share — the link is the durable save; QR makes it portable */}
              {debriefUrl && (
                <div className="space-y-3 pt-1">
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-5 py-2 text-sm font-medium text-cyan-200 transition-colors hover:bg-cyan-400/20"
                  >
                    {shareCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                    {shareCopied ? 'Link copied' : 'Share my results'}
                  </button>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="rounded-xl bg-white p-2.5">
                      <QRCodeSVG value={debriefUrl} size={108} bgColor="#ffffff" fgColor="#0a1f3a" />
                    </div>
                    <p className="text-[11px] text-gray-500">Scan or bookmark to reopen later</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-400 text-sm">This session is no longer active.</p>
          )}

          <Button onClick={onLeave} variant="ghost">
            Back
          </Button>
        </div>
      </StudentSkyShell>
    );
  }

  return (
    <StudentSkyShell weather="cruising">
      {/* Header */}
      <div className="relative mb-3 overflow-hidden rounded-2xl border border-cyan-400/15 bg-slate-950/65 p-3 shadow-[0_0_28px_rgba(34,211,238,0.08)] sm:mb-4 sm:p-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
        <Image
          src="/lessoncaptain-mark-on-dark.svg"
          alt="LessonCaptain"
          width={32}
          height={32}
          className="pointer-events-none absolute left-1/2 top-4 hidden h-8 w-auto -translate-x-1/2 opacity-30 sm:block"
        />
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full shadow-lg ${connectionClass}`} />
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300/70">Student Console</p>
            </div>
            <p className="mt-1 truncate text-lg font-bold text-white">{studentSession.displayName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
              <span>{connectionLabel}</span>
              {studentSession.team && (
                <>
                  <span className="text-slate-600">/</span>
                  <span className={studentSession.team === 'red' ? 'text-red-300' : 'text-blue-300'}>
                    {studentSession.team === 'red' ? 'Red Team' : 'Blue Team'}
                  </span>
                </>
              )}
              {currentSignalName && (
                <>
                  <span className="text-slate-600">/</span>
                  <span className="truncate text-cyan-200/80">{currentSignalName}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            {studentSession.captain && (
              <CrewAvatar seed={studentSession.avatarSeed} name={studentSession.displayName} captain size={40} />
            )}
            <button
              onClick={onLeave}
              className="min-h-10 shrink-0 rounded-xl border border-white/10 px-3 text-sm text-slate-300 transition-colors hover:border-white/25 hover:text-white"
            >
              Leave
            </button>
          </div>
        </div>
      </div>

      {/* Active Poll — side-channel polls render inside Crew Radio instead */}
      {activePoll && !hiddenPollIds.has(activePoll.pollId) && activePoll.metadata?.channel !== 'side' && (
        <div className={`glass mb-3 rounded-2xl p-4 sm:mb-4 sm:p-6 ${activePoll.metadata?.poll_type === 'bonus_vote' ? 'border border-cyan-500/30' : ''}`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-white">
              {activePoll.metadata?.poll_type === 'bonus_vote' ? 'Bonus Round! Vote for your game:' : 'Poll'}
            </h2>
            {activePoll.metadata?.poll_type !== 'bonus_vote' && (
              <button
                onClick={() => setHiddenPollIds(prev => new Set(prev).add(activePoll.pollId))}
                className="text-gray-400 hover:text-white text-xl leading-none"
                aria-label="Dismiss poll"
              >
                ×
              </button>
            )}
          </div>
          {activePoll.metadata?.poll_type !== 'bonus_vote' && (
            <p className="mb-3 text-base text-cyan-400 sm:mb-4 sm:text-lg">{activePoll.question}</p>
          )}
          <div className="space-y-2">
            {activePoll.options.map((option) => (
              <button
                key={option}
                onClick={() => handleVote(option)}
                disabled={isVoting || submittedPollIds.has(activePoll.pollId)}
                className={`w-full rounded-xl p-3 text-left font-medium transition-all sm:p-4 ${
                  selectedChoice === option
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                    : activePoll.metadata?.poll_type === 'bonus_vote'
                      ? 'bg-white/10 text-gray-200 hover:bg-white/20 text-center'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                } disabled:opacity-50`}
              >
                {option}
              </button>
            ))}
          </div>
          {selectedChoice && submittedPollIds.has(activePoll.pollId) && (
            <p className="text-xs text-cyan-400 text-center mt-3">
              {activePoll.metadata?.poll_type === 'bonus_vote'
                ? `Voted for ${selectedChoice} ✓`
                : `Vote submitted: ${selectedChoice} ✓`}
            </p>
          )}
        </div>
      )}

      {/* Mission Brief — persists throughout the lesson once set */}
      {personalMission && (
        <div className="glass rounded-2xl px-5 py-3 mb-4 border border-violet-500/30">
          <p className="text-xs text-violet-400 uppercase tracking-widest mb-1">Your Mission</p>
          <p className="text-sm text-white leading-snug">{personalMission}</p>
        </div>
      )}

      {/* AI Feedback card — shown after auto-evaluated submission */}
      {latestFeedback && latestFeedback.submissionId !== seenFeedbackId && (
        <div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/8 p-4 mb-4 shadow-[0_0_24px_rgba(34,211,238,0.08)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-cyan-300 uppercase tracking-widest">Flight Note</span>
            <div className="flex items-center gap-2">
              {latestFeedback.points > 0 && (
                <span className="text-sm font-bold text-yellow-400">{latestFeedback.points} pts</span>
              )}
              <button
                onClick={() => setSeenFeedbackId(latestFeedback.submissionId)}
                className="text-gray-500 hover:text-white text-lg leading-none"
              >×</button>
            </div>
          </div>
          <p className="text-sm text-gray-200 leading-relaxed">{latestFeedback.feedback}</p>
        </div>
      )}

      {/* Scored result card — shown after each V2 score is recorded, auto-dismisses */}
      {lastResult && lastResult.scoreId !== seenResultId && (() => {
        const outcomeColor: Record<string, string> = {
          'standout': 'text-yellow-400',
          'on-task': 'text-cyan-400',
          'genuine': 'text-gray-300',
          'invalid': 'text-gray-500',
        };
        const label = OUTCOME_LABELS[lastResult.outcome] ?? lastResult.outcome;
        const color = outcomeColor[lastResult.outcome] ?? 'text-gray-300';
        const showAccuracy = lastResult.accuracyStatus === 'correct' || lastResult.accuracyStatus === 'incorrect';
        return (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-4 py-3 mb-4 flex items-center justify-between shadow-[0_0_24px_rgba(52,211,153,0.08)]">
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-game ${color}`}>
                {lastResult.points > 0 ? `+${lastResult.points}` : '0'}
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300/70">Signal logged</p>
                <p className={`text-sm font-semibold ${color}`}>{label}</p>
                {showAccuracy && (
                  <p className={`text-xs ${lastResult.accuracyStatus === 'correct' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {lastResult.accuracyStatus === 'correct' ? 'Correct' : 'Not quite'}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setSeenResultId(lastResult.scoreId)}
              className="text-gray-500 hover:text-white text-lg leading-none"
              aria-label="Dismiss"
            >×</button>
          </div>
        );
      })()}

      {/* Current Signal */}
      <div className={`mb-3 rounded-2xl border p-4 transition-all sm:mb-4 sm:p-5 ${
        inputSpec
          ? 'bg-slate-950/70 border-cyan-400/25 shadow-[0_0_32px_rgba(34,211,238,0.09)]'
          : 'bg-white/5 border-white/10'
      }`}>
        {inputSpec ? (
          transitionActivityName ? (
            <div
              className="flex flex-col items-center justify-center py-10 gap-3"
              style={{ animation: 'lc-fade-in 0.35s ease-out' }}
            >
              <p className="text-[10px] uppercase tracking-widest text-cyan-300/60">Signal incoming</p>
              <p className="text-xl font-bold text-white">{transitionActivityName}</p>
              <p className="text-xs text-gray-400">Stand by...</p>
            </div>
          ) : inputSpec.wonderFollowUpMode ? (
            /* Wonder Board — student picks which answered question to follow up on */
            <>
              <h2 className="font-bold text-white mb-3">Wonder Board — Follow-up</h2>
              {!selectedFollowUpId ? (
                /* Step 1: pick a question */
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 mb-2">Tap a question to follow up on:</p>
                  {wonderQuestions.filter((q) => !q.parentId && !!q.answeredAt).length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No answered questions yet.</p>
                  ) : (
                    wonderQuestions
                      .filter((q) => !q.parentId && !!q.answeredAt)
                      .map((q) => (
                        <button
                          key={q.id}
                          onClick={() => setSelectedFollowUpId(q.id)}
                          className="w-full text-left rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 px-4 py-3 text-sm text-gray-200 transition-colors"
                        >
                          {q.content}
                        </button>
                      ))
                  )}
                </div>
              ) : (
                /* Step 2: write and submit the follow-up */
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => { setSelectedFollowUpId(null); setFollowUpText(''); }}
                      className="text-gray-500 hover:text-white text-lg leading-none mt-0.5"
                    >←</button>
                    <p className="text-xs text-emerald-400 italic leading-relaxed">
                      {wonderQuestions.find((q) => q.id === selectedFollowUpId)?.content}
                    </p>
                  </div>
                  <textarea
                    className="w-full bg-white/10 rounded-xl p-3 text-sm resize-none border border-white/20 focus:outline-none focus:border-white/40 text-white placeholder-gray-500"
                    rows={3}
                    maxLength={200}
                    placeholder="Ask your follow-up question..."
                    value={followUpText}
                    onChange={(e) => setFollowUpText(e.target.value)}
                    autoFocus
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{followUpText.length}/200</span>
                    <button
                      onClick={() => { if (followUpText.trim()) handleSubmit(followUpText); }}
                      disabled={!followUpText.trim() || isSubmitting}
                      className="px-5 py-2 bg-emerald-500/80 hover:bg-emerald-500 disabled:opacity-40 rounded-xl text-sm font-semibold text-white transition-colors"
                    >
                      {isSubmitting ? 'Sending...' : submitStatus === 'success' ? 'Sent ✓' : 'Submit Follow-up'}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : inputSpec.type === 'debate-prep' ? (
            /* Team Debate — students add points to their own team's board */
            <>
              <h2 className="font-bold text-white mb-3">Team Debate — Prep</h2>
              <DebatePrepPanel
                sessionId={sessionId}
                spec={inputSpec}
                clientId={studentSession.clientId}
                studentId={studentSession.studentId}
                displayName={studentSession.displayName}
              />
            </>
          ) : (
            <>
              <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-cyan-300" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300/70">Current Signal</p>
                  </div>
                  <h2 className="mt-1 text-xl font-bold text-white">{getInputActionLabel(inputSpec)}</h2>
                  {currentSignalName && (
                    <p className="mt-0.5 truncate text-xs text-slate-400">{currentSignalName}</p>
                  )}
                </div>
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-200">
                  Live
                </span>
              </div>
              {inputSpec.gameKey === 'wonder-board' && !inputSpec.wonderParentId && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-gray-400">Your question word:</span>
                  <span className="text-sm font-bold text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full">
                    {getAssignedStarter(studentSession.clientId)}
                  </span>
                </div>
              )}
              {inputSpec.gameKey === 'language-toolkit' && inputSpec.toolkitItems && inputSpec.toolkitItems.length > 0 && (
                <div className="space-y-2 mb-4">
                  {inputSpec.toolkitItems.map((item) => (
                    <div key={item.term} className="p-3 rounded-xl border border-white/10 bg-white/5 space-y-1">
                      <p className="font-bold text-sky-300 text-sm">{item.term}</p>
                      <p className="text-xs opacity-70 leading-snug">{item.meaning}</p>
                      <p className="text-xs italic opacity-50 leading-snug">&ldquo;{item.example}&rdquo;</p>
                      {item.prompt && <p className="text-xs font-medium text-amber-300 leading-snug pt-1">{item.prompt}</p>}
                    </div>
                  ))}
                </div>
              )}
              <DynamicInput
                key={inputSpecRevisionRef.current ?? getInputSpecRevision(inputSpec)}
                spec={inputSpec}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submitStatus={submitStatus}
                waitSeconds={waitSeconds}
                clientId={studentSession.clientId}
                displayName={studentSession.displayName}
                studentId={studentSession.studentId}
                clockOffsetMs={clockOffsetMs}
              />
            </>
          )
        ) : (
          <div className="space-y-4">
            {/* Flight Card Offer */}
            {offeredCards && !dismissedDealIndices.has(offeredCards.dealIndex) && !cardConflict && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3">Draw a card</p>
                <div className="grid grid-cols-3 gap-2">
                  {offeredCards.cards.map((card, index) => (
                    <button
                      key={card.cardId}
                      onClick={() => handlePickCard(card.cardId)}
                      disabled={isPickingCard}
                      className="flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 hover:border-amber-400/40 p-3 transition-all text-center disabled:opacity-40"
                    >
                      <Plane className="w-5 h-5 text-amber-300" />
                      <span className="text-xs font-bold text-white leading-tight">Card {index + 1}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conflict — student has existing card and was dealt a new offer */}
            {cardConflict && (
              <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4">
                <p className="text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">You already have a card</p>
                <p className="text-xs text-gray-400 mb-3">
                  Keep your <span className="text-white font-semibold">{CARD_DESCRIPTIONS[cardConflict.heldCard.cardKey]?.name ?? cardConflict.heldCard.cardKey}</span>, or replace it with the new one?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setCardConflict(null); setDismissedDealIndices(prev => { const next = new Set(Array.from(prev)); next.add(offeredCards?.dealIndex ?? -1); return next; }); }}
                    className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all"
                  >
                    Keep Current
                  </button>
                  <button
                    onClick={() => handlePickCard(cardConflict.pendingCardId, true)}
                    disabled={isPickingCard}
                    className="flex-1 py-2 rounded-xl bg-violet-500/30 hover:bg-violet-500/50 border border-violet-500/40 text-xs font-semibold text-violet-200 transition-all disabled:opacity-40"
                  >
                    Replace
                  </button>
                </div>
              </div>
            )}

            {/* Topic + difficulty context label */}
            {sessionTopic && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-cyan-300/50 uppercase tracking-widest">Flight topic</span>
                <span className="text-[10px] font-bold text-gray-300">{sessionTopic}</span>
                <span className="text-gray-700">·</span>
                <span className="text-[10px] text-gray-400">{sessionDifficulty}</span>
              </div>
            )}
            {/* English Spotlight tip card */}
            {(() => {
              const tip = allTips[tipIndex % allTips.length];
              return (
                <div
                  key={tipIndex}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                  style={{ animation: 'lc-fade-in 0.5s ease-out' }}
                >
                  {/* Category badge */}
                  <span className={`inline-block text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 ${
                    tip.color === 'blue'   ? 'bg-blue-500/20 text-blue-300' :
                    tip.color === 'teal'   ? 'bg-teal-500/20 text-teal-300' :
                    tip.color === 'amber'  ? 'bg-amber-500/20 text-amber-300' :
                    'bg-purple-500/20 text-purple-300'
                  }`}>
                    {tip.category}
                  </span>
                  <p className="text-gray-200 text-sm leading-relaxed">{tip.text}</p>
                  {/* Progress dots */}
                  <div className="flex gap-1.5 mt-4 flex-wrap">
                    {allTips.map((_, i) => (
                      <span
                        key={i}
                        className={`inline-block rounded-full transition-all duration-300 ${
                          i === tipIndex % allTips.length ? 'w-3 h-1.5 bg-white/60' : 'w-1.5 h-1.5 bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })()}
            {/* Waiting label */}
            <div className="flex flex-col items-center gap-2 py-2">
              <TakeoffSpark size={40} loading />
              <p className="text-gray-500 text-xs uppercase tracking-widest">Standing by for captain signal...</p>
            </div>
          </div>
        )}
      </div>

      {/* Crew Radio — optional side-channel prompt; never replaces the main task */}
      {sideChannel && (() => {
        const isDone = radioDoneIds.has(sideChannel.id);
        const isNew = sideChannel.id !== radioSeenId && !isDone;
        return (
          <div className="mb-4">
            <button
              onClick={handleRadioToggle}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left transition-all ${
                radioOpen ? 'bg-white/15 border border-amber-400/25' : 'glass border border-transparent hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="relative">
                  <RadioTower className={`w-3.5 h-3.5 ${isNew ? 'text-amber-300' : 'text-gray-400'}`} />
                  {isNew && (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </span>
                <span className="text-xs font-semibold text-white">Crew Radio</span>
                {isNew && (
                  <span className="rounded-full bg-amber-500/15 border border-amber-400/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    New
                  </span>
                )}
                {isDone && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${radioOpen ? '' : '-rotate-90'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {radioOpen && (
              <div className="glass rounded-2xl p-4 mt-2 space-y-3 border border-amber-400/15">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300/70">{sideChannel.title}</p>
                  {sideChannel.quote && (
                    <div className="mt-2 rounded-xl border border-amber-400/20 bg-amber-500/8 px-3 py-2">
                      <p className="text-sm italic text-amber-100/90 leading-snug">&ldquo;{sideChannel.quote.text}&rdquo;</p>
                      <p className="mt-1 text-[10px] text-amber-200/50">{sideChannel.quote.name}</p>
                    </div>
                  )}
                  <p className="mt-2 text-sm text-white leading-snug">{sideChannel.prompt}</p>
                  <p className="mt-1 text-[10px] text-gray-500">Answer when you have a spare moment — this is optional.</p>
                </div>

                {isDone ? (
                  <p className="text-xs text-emerald-400 text-center py-1">Sent to the captain ✓</p>
                ) : sideChannel.kind === 'choice' && sideChannel.options ? (
                  <div className="space-y-2">
                    {sideChannel.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleRadioVote(option)}
                        disabled={radioBusy}
                        className="w-full p-3 rounded-xl text-left text-sm font-medium bg-white/10 text-gray-200 hover:bg-white/20 transition-all disabled:opacity-50"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <textarea
                      value={radioText}
                      onChange={(e) => setRadioText(e.target.value.slice(0, sideChannel.maxLength ?? 280))}
                      placeholder="Your answer — one or two sentences..."
                      rows={2}
                      className="w-full bg-white/10 text-white rounded-xl p-3 text-sm resize-none placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{radioText.length}/{sideChannel.maxLength ?? 280}</span>
                      <button
                        onClick={handleRadioWrite}
                        disabled={!radioText.trim() || radioBusy}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all disabled:opacity-40"
                      >
                        {radioBusy ? 'Sending…' : 'Send'}
                      </button>
                    </div>
                  </>
                )}
                {radioStatus === 'error' && (
                  <p className="text-xs text-red-400">Something went wrong — try again.</p>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Held card chip */}
      {heldCard && (() => {
        const HeldIcon = CARD_ICONS[heldCard.cardKey] ?? Plane;
        return (
          <div className="glass rounded-2xl px-4 py-3 mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <HeldIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{CARD_DESCRIPTIONS[heldCard.cardKey]?.name ?? heldCard.cardKey}</p>
                <p className="text-[10px] text-gray-500">
                  {heldCard.cardKey === 'contrail'
                    ? `Auto-activates · ${heldCard.activationsCount}/3 used`
                    : heldCard.status === 'active' ? 'Active' : 'Held'}
                </p>
              </div>
            </div>
            {heldCard.cardKey !== 'contrail' && (
              <button
                onClick={() => handleActivateCard(heldCard.status === 'held')}
                className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  heldCard.status === 'active'
                    ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {heldCard.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            )}
          </div>
        );
      })()}

      {/* Wonder Board — upvote section shown when wonder-board is active */}
      {inputSpec?.gameKey === 'wonder-board' && wonderQuestions.filter((q) => !q.parentId).length > 0 && (
        <div className="glass rounded-2xl p-6 mb-4">
          <h2 className="font-bold text-white mb-1">Wonder Board</h2>
          <p className="text-xs text-gray-400 mb-3">Upvote questions you want answered</p>
          <div className="space-y-2">
            {wonderQuestions
              .filter((q) => !q.parentId)
              .map((q) => {
                const displayCount = Math.max(wonderLocalCounts[q.id] ?? 0, q.voteCount);
                const hasVoted = wonderVotedIds.has(q.id);
                const isAnswered = !!q.answeredAt;
                return (
                  <div
                    key={q.id}
                    className={`flex items-start gap-3 rounded-xl p-3 ${isAnswered ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/5'}`}
                  >
                    {!isAnswered && (
                      <button
                        onClick={() => handleWonderVote(q)}
                        disabled={hasVoted}
                        className={`flex-shrink-0 flex flex-col items-center gap-0.5 transition-colors ${
                          hasVoted ? 'text-violet-400' : 'text-gray-500 hover:text-violet-400'
                        } disabled:cursor-default`}
                      >
                        <svg className="w-4 h-4" fill={hasVoted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                        </svg>
                        <span className="text-xs font-bold">{displayCount}</span>
                      </button>
                    )}
                    {isAnswered && (
                      <span className="flex-shrink-0 text-emerald-400 text-xs font-bold mt-1">✓</span>
                    )}
                    <p className="text-gray-200 text-sm leading-relaxed">{q.content}</p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Class Board — approved items shown while a board prompt is active, with upvoting.
          Word-cloud boards skip this list (students just submit; the cloud is on the screen). */}
      {inputSpec?.type === 'board' && !inputSpec.boardWordCloud && classBoardItems.some((item) => !item.parentId) && (
        <div className="glass rounded-2xl p-6 mb-4">
          <h2 className="font-bold text-white mb-1">{inputSpec.boardTitle ?? 'Class Board'}</h2>
          <p className="text-xs text-gray-400 mb-3">
            {inputSpec.boardAllowVotes === false ? 'Ideas shared by your class.' : 'Upvote the ideas you think are best.'}
          </p>
          <div className="space-y-2">
            {classBoardItems.filter((item) => !item.parentId).map((item) => {
              const displayCount = Math.max(classBoardLocalCounts[item.id] ?? 0, item.voteCount);
              const hasVoted = classBoardVotedIds.has(item.id);
              const categoryLabel = inputSpec.boardCategories?.find((category) => category.key === item.category)?.label ?? item.category;
              const zoneLabel = inputSpec.boardZones?.find((zone) => zone.key === item.zoneKey)?.label;
              const isReplying = classBoardReplyTo === item.id;
              return (
                <div key={item.id} className="flex items-start gap-3 rounded-xl bg-white/5 p-3">
                  {inputSpec.boardAllowVotes !== false && (
                    <button
                      onClick={() => handleClassBoardVote(item)}
                      disabled={hasVoted}
                      className={`flex-shrink-0 flex flex-col items-center gap-0.5 transition-colors ${
                        hasVoted ? 'text-emerald-400' : 'text-gray-500 hover:text-emerald-400'
                      } disabled:cursor-default`}
                    >
                      <svg className="w-4 h-4" fill={hasVoted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                      </svg>
                      <span className="text-xs font-bold">{displayCount}</span>
                    </button>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">{categoryLabel}</span>
                      {zoneLabel ? <span className="text-[10px] text-gray-500">{zoneLabel}</span> : null}
                      {item.pinned ? <span className="text-[10px] text-amber-300">Pinned</span> : null}
                    </div>
                    <p className="text-sm leading-relaxed text-gray-200">{item.content}</p>
                    <p className="mt-1 text-[10px] text-gray-500">{item.displayName}</p>
                    {item.answer && (
                      <div className="mt-2 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/80">Answer</p>
                        <p className="mt-0.5 text-xs leading-snug text-emerald-50">{item.answer}</p>
                      </div>
                    )}
                    {inputSpec.boardQuestionWall && item.answer && (
                      isReplying ? (
                        <div className="mt-2">
                          <textarea
                            value={classBoardReplyText}
                            onChange={(e) => setClassBoardReplyText(e.target.value.slice(0, 200))}
                            rows={2}
                            autoFocus
                            placeholder="Your follow-up..."
                            className="w-full resize-none rounded-lg border border-white/15 bg-lc-surface px-3 py-2 text-sm text-lc-text placeholder:text-lc-text3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                          />
                          <div className="mt-1.5 flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setClassBoardReplyTo(null); setClassBoardReplyText(''); }}
                              className="text-xs text-gray-400 hover:text-gray-200"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleClassBoardReply(item)}
                              disabled={!classBoardReplyText.trim() || classBoardReplyBusy}
                              className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
                            >
                              {classBoardReplyBusy ? 'Sending...' : 'Send'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setClassBoardReplyTo(item.id); setClassBoardReplyText(''); }}
                          className="mt-2 text-[11px] font-semibold text-cyan-300 hover:text-cyan-200"
                        >
                          Follow up
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Class Questions — visible only when there are published questions */}
      {publishedQuestions.length > 0 && (
        <div className="glass rounded-2xl p-6 mb-4">
          <h2 className="font-bold text-white mb-3">Class Questions</h2>
          <div className="space-y-3">
            {publishedQuestions.map((q) => {
              const displayCount = Math.max(localVoteCounts[q.id] ?? 0, q.voteCount);
              const hasVoted = votedIds.has(q.id);
              return (
                <div key={q.id} className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                  <button
                    onClick={() => handleUpvote(q)}
                    disabled={hasVoted}
                    className={`flex-shrink-0 flex flex-col items-center gap-0.5 transition-colors ${
                      hasVoted ? 'text-cyan-400' : 'text-gray-500 hover:text-cyan-400'
                    } disabled:cursor-default`}
                  >
                    <svg className="w-4 h-4" fill={hasVoted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                    </svg>
                    <span className="text-xs font-bold">{displayCount}</span>
                  </button>
                  <p className="text-gray-200 text-sm leading-relaxed">{q.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reference panel — 2×2 grid of collapsible tiles */}
      {(() => {
        const grammarEntry = grammarTarget ? grammarReference[grammarTarget as keyof typeof grammarReference] : null;
        const tiles = [
          referenceVocab ? 'vocab' : null,
          grammarEntry ? 'grammar' : null,
          referenceExpressions ? 'expressions' : null,
          'question',
        ].filter(Boolean) as ReferencePanel[];

        const togglePanel = (panel: ReferencePanel) =>
          setOpenPanel((p) => (p === panel ? null : panel));

        const tileClass = (panel: ReferencePanel) =>
          `flex items-center justify-between px-4 py-3 rounded-2xl text-left transition-all ${
            openPanel === panel
              ? 'bg-white/15 border border-white/20'
              : 'glass border border-transparent hover:border-white/10'
          }`;

        return (
          <div className="space-y-2 mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Student tools</p>
            <div className="grid grid-cols-2 gap-2">
              {tiles.map((panel) => {
                const labels: Record<string, string> = {
                  vocab: 'Vocabulary',
                  grammar: 'Grammar Check',
                  expressions: 'Phrases',
                  question: 'Ask Captain',
                };
                const icons: Record<string, JSX.Element> = {
                  vocab: <BookOpen className="w-3.5 h-3.5" />,
                  grammar: <PencilLine className="w-3.5 h-3.5" />,
                  expressions: <MessageSquare className="w-3.5 h-3.5" />,
                  question: <HelpCircle className="w-3.5 h-3.5" />,
                };
                return (
                  <button
                    key={panel!}
                    onClick={() => togglePanel(panel)}
                    className={tileClass(panel)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{icons[panel!]}</span>
                      <span className="text-xs font-semibold text-white">{labels[panel!]}</span>
                    </div>
                    <svg
                      className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${openPanel === panel ? '' : '-rotate-90'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                );
              })}
            </div>

            {/* Expanded panel content — full width below grid */}
            {openPanel === 'vocab' && referenceVocab && (
              <div className="glass rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">Key Vocabulary</p>
                <div className="space-y-2.5">
                  {referenceVocab.map((item) => (
                    <div key={item.word}>
                      <span className="text-sm font-semibold text-cyan-400">{item.word}</span>
                      <span className="text-gray-400 text-xs"> — {item.definition}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {openPanel === 'grammar' && grammarEntry && (
              <div className="glass rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Grammar Focus</p>
                <p className="text-xs font-semibold text-violet-400 mb-2 capitalize">{grammarTarget}</p>
                <p className="text-sm text-gray-200 leading-relaxed mb-3">{grammarEntry.rule}</p>
                <div className="space-y-1.5">
                  {grammarEntry.examples.map((ex) => (
                    <p key={ex} className="text-xs text-gray-400 italic">&ldquo;{ex}&rdquo;</p>
                  ))}
                </div>
              </div>
            )}

            {openPanel === 'expressions' && referenceExpressions && (
              <div className="glass rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">Useful Expressions</p>
                <div className="space-y-3">
                  {referenceExpressions.map((item) => (
                    <div key={item.phrase}>
                      <p className="text-sm font-semibold text-emerald-400">{item.phrase}</p>
                      <p className="text-xs text-gray-400 mt-0.5 italic">{item.example}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {openPanel === 'question' && (
              <div className="glass rounded-2xl p-4 space-y-3">
                {questionStatus === 'sent' ? (
                  <p className="text-green-400 text-sm text-center py-2">
                    Question sent! The teacher will review it.
                  </p>
                ) : (
                  <>
                    <textarea
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value.slice(0, VALIDATION.QUESTION_MAX))}
                      placeholder="Type your question for the teacher…"
                      rows={3}
                      className="w-full bg-white/10 text-white rounded-xl p-3 text-sm resize-none placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {questionText.length}/{VALIDATION.QUESTION_MAX}
                      </span>
                      {questionStatus === 'error' && (
                        <span className="text-xs text-red-400">Something went wrong, try again.</span>
                      )}
                      {questionStatus === 'rate_limited' && (
                        <span className="text-xs text-yellow-400">Wait {questionWait}s before asking again.</span>
                      )}
                    </div>
                    <button
                      onClick={handleAskQuestion}
                      disabled={!questionText.trim() || isAskingQuestion || questionStatus === 'rate_limited'}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isAskingQuestion ? 'Sending…' : 'Send Question'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Your Flight — personal session progress */}
      <div className="glass rounded-2xl px-4 py-3 mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-wider">
              <ClipboardCheck className="h-3 w-3" />
              Flight Log
            </p>
            {lastResultLabel && (
              <p className="text-[10px] text-gray-400">
                Last: {lastResultLabel}
              </p>
            )}
          </div>
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span>
              <span className="text-sm font-game text-cyan-400">{sessionPoints}</span>
              <span className="text-[10px] text-gray-500 ml-0.5">pts</span>
            </span>
            <span className="text-gray-600 text-[10px]">·</span>
            <span>
              <span className="text-sm font-game text-white">{responseCount}</span>
              <span className="text-[10px] text-gray-500 ml-0.5">responses</span>
            </span>
            {sessionAccuracy !== null && (
              <>
                <span className="text-gray-600 text-[10px]">·</span>
                <span>
                  <span className={`text-sm font-game ${
                    sessionAccuracy >= 80 ? 'text-emerald-400' :
                    sessionAccuracy >= 50 ? 'text-amber-400' :
                    'text-red-400'
                  }`}>{sessionAccuracy}%</span>
                  <span className="text-[10px] text-gray-500 ml-0.5">accuracy</span>
                </span>
              </>
            )}
          </div>
        </div>

      {/* Flight Deck */}
      <div className="mt-2">
        <button
          onClick={() => setFlightDeckOpen((o) => !o)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left transition-all ${
            flightDeckOpen ? 'bg-white/15 border border-white/20' : 'glass border border-transparent hover:border-white/10'
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span className="text-xs font-semibold text-white">Flight Deck</span>
          </div>
          <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${flightDeckOpen ? '' : '-rotate-90'}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {flightDeckOpen && (
          <div className="glass rounded-2xl p-4 mt-2 space-y-4">
            <div>
              <button
                onClick={handleToggleStealth}
                className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
              >
                <span className="text-xs text-gray-300">Don&apos;t share my answers with the class</span>
                <span className={`w-8 h-4 rounded-full transition-all flex-shrink-0 ${!scoreVisible ? 'bg-violet-500' : 'bg-white/20'}`}>
                  <span className={`block w-3 h-3 rounded-full bg-white mt-0.5 transition-all ${!scoreVisible ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </span>
              </button>
            </div>
            <div>
              <button
                onClick={async () => {
                  const next = !spotlightNamed;
                  setSpotlightNamed(next);
                  await savePrefs({ spotlight_named: next });
                }}
                className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
              >
                <span className="text-xs text-gray-300">Hide my name if I&apos;m spotlighted</span>
                <span className={`w-8 h-4 rounded-full transition-all flex-shrink-0 ${!spotlightNamed ? 'bg-amber-500' : 'bg-white/20'}`}>
                  <span className={`block w-3 h-3 rounded-full bg-white mt-0.5 transition-all ${!spotlightNamed ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </span>
              </button>
              <p className="mt-1 px-3 text-[10px] text-gray-500">
                When the captain shares your answer on the big screen, it will say &ldquo;A classmate&rdquo; instead of your name.
              </p>
            </div>
            <button
              onClick={handleSavePrefs}
              disabled={isSavingPrefs}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-500/20 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-50"
            >
              {isSavingPrefs ? 'Saving…' : prefsSaved ? 'Confirmed!' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-gray-500 text-sm">
        <p>Your signals are private unless your teacher spotlights them.</p>
      </div>
    </StudentSkyShell>
  );
}
