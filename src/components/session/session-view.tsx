'use client';

import { useEffect, useRef, useState } from 'react';
import { useSessionStore, getEffectiveTopic } from '@/stores/session-store';
import { useRealtimeLeaderboard } from '@/hooks/use-realtime-leaderboard';
import { GameShell } from './game-shell';
import { ActivityShell } from './activity-shell';
import { EndSessionSummary } from './end-session-summary';
import { SessionSettingsBar } from './session-settings-bar';
import { PollManager } from './poll-manager';
import { getAllGames } from '@/games/registry';
import { getAllActivities, CATEGORY_INFO } from '@/activities/registry';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import type { Session, Class, Student, Score } from '@/lib/supabase/types';
import type { GamePlugin } from '@/games/types';
import type { ActivityPlugin, ActivityGeneratedContent, GameGeneratedContent } from '@/activities/types';

const isMockMode = () => process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

// Load students from localStorage in mock mode
function getLocalStorageStudents(classId: string, fallback: Student[]): Student[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(`mock-students-${classId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load mock students:', e);
  }
  return fallback;
}

// Lesson slot type (matches lesson-planner)
type LessonSlot = {
  type: 'activity' | 'game';
  key: string;
  name: string;
};

// Load lesson plan content from sessionStorage
function getLessonPlanContent(): {
  customTopic: string;
  slots: LessonSlot[];
  generatedContent: Record<string, ActivityGeneratedContent>;
  generatedGameContent: Record<string, GameGeneratedContent>;
} | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = sessionStorage.getItem('lessonPlanContent');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        customTopic: parsed.customTopic,
        slots: parsed.slots || [],
        generatedContent: parsed.generatedContent || {},
        generatedGameContent: parsed.generatedGameContent || {},
      };
    }
  } catch (e) {
    console.error('Failed to load lesson plan content:', e);
  }
  return null;
}

type ViewMode = 'selection' | 'game' | 'activity';

interface SessionViewProps {
  session: Session;
  cls: Class;
  students: Student[];
  existingScores: Score[];
}

export function SessionView({ session, cls, students: serverStudents, existingScores }: SessionViewProps) {
  const { initSession, settings, setCustomTopic, addStudent } = useSessionStore();
  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const [selectedGame, setSelectedGame] = useState<GamePlugin | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityPlugin | null>(null);
  const [activityContent, setActivityContent] = useState<ActivityGeneratedContent | null>(null);
  const [gameContent, setGameContent] = useState<GameGeneratedContent | null>(null);
  const [ended, setEnded] = useState(session.status === 'ended');
  const [students, setStudents] = useState(serverStudents);
  const [lessonPlanLoaded, setLessonPlanLoaded] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const supabase = createClient();
  const games = getAllGames();
  const activities = getAllActivities();

  // Load lesson plan content from sessionStorage on mount
  const [lessonPlanContent, setLessonPlanContent] = useState<{
    customTopic: string;
    slots: LessonSlot[];
    generatedContent: Record<string, ActivityGeneratedContent>;
    generatedGameContent: Record<string, GameGeneratedContent>;
  } | null>(null);

  // Lesson mode state
  const [lessonMode, setLessonMode] = useState(false);
  const [lessonSlots, setLessonSlots] = useState<LessonSlot[]>([]);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [joinLinkCopied, setJoinLinkCopied] = useState(false);

  useEffect(() => {
    const content = getLessonPlanContent();
    if (content) {
      setLessonPlanContent(content);
      setCustomTopic(content.customTopic);
      setLessonPlanLoaded(true);

      // Enable lesson mode if we have slots
      if (content.slots && content.slots.length > 0) {
        setLessonMode(true);
        setLessonSlots(content.slots);
      }
    }
  }, [setCustomTopic]);

  // Auto-start first slot when lesson mode is enabled
  useEffect(() => {
    if (lessonMode && lessonSlots.length > 0 && viewMode === 'selection' && !selectedGame && !selectedActivity) {
      autoStartSlot(0);
    }
    // Only run on initial lesson mode setup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonMode]);

  const autoStartSlot = (index: number) => {
    if (index >= lessonSlots.length) return;

    const slot = lessonSlots[index];
    setCurrentSlotIndex(index);

    if (slot.type === 'activity') {
      const activity = activities.find((a) => a.key === slot.key);
      if (activity) {
        handleSelectActivity(activity);
      }
    } else if (slot.type === 'game') {
      const game = games.find((g) => g.key === slot.key);
      if (game) {
        handleSelectGame(game);
      }
    }
  };

  const handleNextSlot = () => {
    const nextIndex = currentSlotIndex + 1;
    if (nextIndex < lessonSlots.length) {
      autoStartSlot(nextIndex);
    } else {
      // Lesson complete - return to selection
      setLessonMode(false);
      handleBackToSelection();
    }
  };

  const handleExitLessonMode = () => {
    setLessonMode(false);
    handleBackToSelection();
  };

  // In mock mode, load students from localStorage
  useEffect(() => {
    if (isMockMode()) {
      const localStudents = getLocalStorageStudents(cls.id, serverStudents);
      setStudents(localStudents);
    }
  }, [cls.id, serverStudents]);

  // Initialize session store once (session/class identity only)
  const initDone = useRef(false);
  useEffect(() => {
    if (!initDone.current) {
      initSession(session.id, cls.id, students);
      existingScores.forEach((s) => useSessionStore.getState().addRealtimeScore(s));
      initDone.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id, cls.id]);

  // Sync new students into the store without resetting state
  useEffect(() => {
    if (!initDone.current) return; // Skip until init is done
    students.forEach((s) => addStudent(s));
  }, [students, addStudent]);

  // Realtime subscription for leaderboard
  useRealtimeLeaderboard(session.id);

  // Realtime subscription for new students joining
  useEffect(() => {
    const channel = supabase
      .channel(`students-${cls.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'students',
          filter: `class_id=eq.${cls.id}`,
        },
        (payload: { new: Student }) => {
          const newStudent = payload.new;
          setStudents((prev) => {
            if (prev.some((s) => s.id === newStudent.id)) return prev;
            return [...prev, newStudent];
          });
          addStudent(newStudent);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cls.id, supabase, addStudent]);

  const handleEndSession = async () => {
    await supabase.from('sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', session.id);
    // Clear lesson plan content from sessionStorage
    sessionStorage.removeItem('lessonPlanContent');
    setEnded(true);
  };

  const handleCopyJoinLink = () => {
    const joinUrl = `${window.location.origin}/join/${session.id}`;
    navigator.clipboard.writeText(joinUrl);
    setJoinLinkCopied(true);
    setTimeout(() => setJoinLinkCopied(false), 2000);
  };

  const handleSelectGame = (game: GamePlugin) => {
    setSelectedGame(game);
    setSelectedActivity(null);
    setActivityContent(null);

    // Check if we have pre-generated content from lesson planner
    if (lessonPlanContent?.generatedGameContent?.[game.key]) {
      setGameContent(lessonPlanContent.generatedGameContent[game.key]);
    } else {
      setGameContent(null);
    }

    setViewMode('game');
  };

  const handleSelectActivity = async (activity: ActivityPlugin) => {
    setSelectedActivity(activity);
    setSelectedGame(null);
    setViewMode('activity');

    // Check if we have pre-generated content from lesson planner
    if (lessonPlanContent?.generatedContent[activity.key]) {
      setActivityContent(lessonPlanContent.generatedContent[activity.key]);
      return;
    }

    // Generate content on-the-fly if not pre-generated
    setIsGeneratingContent(true);
    try {
      const effectiveTopic = getEffectiveTopic(settings);
      const response = await fetch('/api/lesson-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customTopic: effectiveTopic,
          difficulty: settings.difficulty,
          activities: [activity.key],
        }),
      });

      const data = await response.json();
      if (data.success && data.content[activity.key]) {
        setActivityContent(data.content[activity.key]);
      } else {
        throw new Error('Failed to generate activity content');
      }
    } catch (error) {
      console.error('Failed to generate activity content:', error);
      // Provide fallback empty content
      setActivityContent({
        activityKey: activity.key,
        topicContext: getEffectiveTopic(settings),
      });
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleBackToSelection = () => {
    setViewMode('selection');
    setSelectedGame(null);
    setSelectedActivity(null);
    setActivityContent(null);
    setGameContent(null);
  };

  if (ended) {
    return <EndSessionSummary classId={cls.id} className={cls.name} />;
  }

  return (
    <div className={`min-h-screen -m-6 lg:-m-8 p-6 lg:p-8 theme-${settings.theme} transition-all duration-500`}>
      <div className="space-y-4">
        {/* Session header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{cls.name} — Live Session</h1>
            <p className="text-sm opacity-70">
              {students.length} students
              {lessonPlanLoaded && (
                <span className="ml-2 text-cyan-400">• Lesson Plan Loaded</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyJoinLink}
              className="text-cyan-400 hover:text-cyan-300"
            >
              {joinLinkCopied ? 'Copied!' : 'Copy Join Link'}
            </Button>
            <Button variant="danger" size="sm" onClick={handleEndSession}>
              End Session
            </Button>
          </div>
        </div>

        {/* Session Settings Bar */}
        <SessionSettingsBar />

        {/* Poll Manager - available on selection screen */}
        {viewMode === 'selection' && (
          <div className="max-w-md">
            <PollManager sessionId={session.id} />
          </div>
        )}

        {/* Selection / Game / Activity View */}
        {viewMode === 'selection' ? (
          <div className="space-y-8">
            {/* Activities Section */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                Discussion Activities
                {lessonPlanLoaded && (
                  <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full">
                    Content Ready
                  </span>
                )}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activities.map((activity) => {
                  const hasContent = lessonPlanContent?.generatedContent[activity.key];
                  const categoryInfo = CATEGORY_INFO[activity.category];
                  return (
                    <button
                      key={activity.key}
                      onClick={() => handleSelectActivity(activity)}
                      className={`glass rounded-2xl p-6 text-left hover:bg-white/10 transition-all relative ${
                        hasContent ? 'border border-cyan-500/30' : ''
                      }`}
                    >
                      {hasContent && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-cyan-400 rounded-full" />
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        {activity.icon && <span className="text-lg">{activity.icon}</span>}
                        <h3 className="font-semibold">{activity.name}</h3>
                      </div>
                      <span className="text-xs text-cyan-400 uppercase tracking-wider">
                        {categoryInfo.name}
                      </span>
                      <p className="text-sm opacity-70 mt-2">{activity.description}</p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {activity.skills.map((skill) => (
                          <span key={skill} className="text-xs px-2 py-0.5 bg-white/10 rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs opacity-50 mt-2">~{activity.estimatedMinutes} min</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Skill Games Section */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                Skill Games
                {lessonPlanContent?.generatedGameContent && Object.keys(lessonPlanContent.generatedGameContent).length > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-lc-blue/15 text-lc-blue rounded-full">
                    Content Ready
                  </span>
                )}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {games.map((game) => {
                  const hasContent = lessonPlanContent?.generatedGameContent?.[game.key];
                  return (
                    <button
                      key={game.key}
                      onClick={() => handleSelectGame(game)}
                      className={`glass rounded-2xl p-6 text-left hover:bg-white/10 transition-all relative ${
                        hasContent ? 'border border-lc-blue/25' : ''
                      }`}
                    >
                      {hasContent && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-lc-blue rounded-full" />
                      )}
                      <h3 className="font-semibold">{game.name}</h3>
                      <p className="text-sm opacity-70 mt-1">{game.description}</p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {game.skills.map((skill) => (
                          <span key={skill} className="text-xs px-2 py-0.5 bg-white/10 rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : viewMode === 'game' && selectedGame ? (
          <div>
            {/* Lesson Mode Progress Bar */}
            {lessonMode && (
              <div className="glass rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-cyan-400">
                    Lesson Progress: Step {currentSlotIndex + 1} of {lessonSlots.length}
                  </span>
                  <button
                    onClick={handleExitLessonMode}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Exit Lesson Mode
                  </button>
                </div>
                <div className="flex gap-1">
                  {lessonSlots.map((slot, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 h-2 rounded-full transition-all ${
                        idx < currentSlotIndex
                          ? 'bg-green-500'
                          : idx === currentSlotIndex
                            ? 'bg-cyan-500'
                            : 'bg-white/20'
                      }`}
                      title={slot.name}
                    />
                  ))}
                </div>
                <div className="flex justify-center mt-2">
                  <span className="text-xs opacity-60">
                    {lessonSlots[currentSlotIndex]?.name}
                  </span>
                </div>
              </div>
            )}

            <div className="mb-4 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={lessonMode ? handleExitLessonMode : handleBackToSelection}>
                ← {lessonMode ? 'Exit Lesson' : 'Back to selection'}
              </Button>
              {lessonMode && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleNextSlot}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600"
                >
                  {currentSlotIndex + 1 < lessonSlots.length ? 'Next Item →' : 'Complete Lesson'}
                </Button>
              )}
            </div>
            <GameShell game={selectedGame} config={{}} preGeneratedContent={gameContent} />
          </div>
        ) : viewMode === 'activity' && selectedActivity ? (
          <div>
            {/* Lesson Mode Progress Bar */}
            {lessonMode && (
              <div className="glass rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-cyan-400">
                    Lesson Progress: Step {currentSlotIndex + 1} of {lessonSlots.length}
                  </span>
                  <button
                    onClick={handleExitLessonMode}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Exit Lesson Mode
                  </button>
                </div>
                <div className="flex gap-1">
                  {lessonSlots.map((slot, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 h-2 rounded-full transition-all ${
                        idx < currentSlotIndex
                          ? 'bg-green-500'
                          : idx === currentSlotIndex
                            ? 'bg-cyan-500'
                            : 'bg-white/20'
                      }`}
                      title={slot.name}
                    />
                  ))}
                </div>
                <div className="flex justify-center mt-2">
                  <span className="text-xs opacity-60">
                    {lessonSlots[currentSlotIndex]?.name}
                  </span>
                </div>
              </div>
            )}

            <div className="mb-4 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={lessonMode ? handleExitLessonMode : handleBackToSelection}>
                ← {lessonMode ? 'Exit Lesson' : 'Back to selection'}
              </Button>
              {lessonMode && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleNextSlot}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600"
                >
                  {currentSlotIndex + 1 < lessonSlots.length ? 'Next Item →' : 'Complete Lesson'}
                </Button>
              )}
            </div>
            {isGeneratingContent ? (
              <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin mb-4" />
                <p className="text-lg font-game text-cyan-400 animate-pulse">
                  Generating Activity Content...
                </p>
                <p className="text-sm opacity-60 mt-2">
                  Creating content for: {getEffectiveTopic(settings)}
                </p>
              </div>
            ) : activityContent ? (
              <ActivityShell activity={selectedActivity} generatedContent={activityContent} />
            ) : (
              <div className="glass rounded-2xl p-12 text-center">
                <p className="text-red-400">Failed to load activity content</p>
                <Button variant="ghost" size="sm" onClick={handleBackToSelection} className="mt-4">
                  Go back
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
