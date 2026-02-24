'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSessionStore, getEffectiveTopic } from '@/stores/session-store';
import { useRealtimeLeaderboard } from '@/hooks/use-realtime-leaderboard';
import { GameShell } from './game-shell';
import { ActivityShell } from './activity-shell';
import { EndSessionSummary } from './end-session-summary';
import { SessionSettingsBar } from './session-settings-bar';
import { WidgetShell } from './widget-shell';
import { WidgetLauncher } from './widget-launcher';
import { WIDGET_REGISTRY } from './widget-registry';
import { getAllGames, getGamesGrouped, GAME_CATEGORY_INFO } from '@/games/registry';
import { getAllActivities, getActivitiesGrouped, CATEGORY_INFO } from '@/activities/registry';
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
  const [timerOverrides, setTimerOverrides] = useState<Record<string, number>>({});
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
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);
  const settingsPopoverRef = useRef<HTMLDivElement>(null);

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

  const getTimerForPlugin = useCallback((key: string, defaultTimer: number) => {
    return timerOverrides[key] ?? defaultTimer;
  }, [timerOverrides]);

  const handleTimerOverride = useCallback((key: string, seconds: number) => {
    setTimerOverrides((prev) => ({ ...prev, [key]: seconds }));
  }, []);

  const handleBackToSelection = () => {
    setViewMode('selection');
    setSelectedGame(null);
    setSelectedActivity(null);
    setActivityContent(null);
    setGameContent(null);
  };

  // Close settings popover on click outside
  useEffect(() => {
    if (!showSettingsPopover) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsPopoverRef.current && !settingsPopoverRef.current.contains(e.target as Node)) {
        setShowSettingsPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettingsPopover]);

  if (ended) {
    return <EndSessionSummary classId={cls.id} className={cls.name} />;
  }

  return (
    <div className="min-h-screen -m-6 lg:-m-8 p-6 lg:p-8 theme-Midnight">
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
            {/* Gear icon for settings during gameplay */}
            {viewMode !== 'selection' && (
              <div className="relative" ref={settingsPopoverRef}>
                <button
                  onClick={() => setShowSettingsPopover(!showSettingsPopover)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  title="Session settings"
                >
                  <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                {showSettingsPopover && (
                  <div className="absolute right-0 top-full mt-2 z-50 glass rounded-xl p-3 shadow-xl border border-white/10 min-w-[320px]">
                    <SessionSettingsBar />
                  </div>
                )}
              </div>
            )}
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

        {/* Selection / Game / Activity View */}
        {viewMode === 'selection' ? (
          <div className="space-y-8">
            {/* Settings on selection screen */}
            <div className="glass p-2 rounded-2xl shadow-lg">
              <SessionSettingsBar />
            </div>
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
              {(Object.entries(getActivitiesGrouped()) as [string, typeof activities][]).map(([category, categoryActivities]) => {
                if (categoryActivities.length === 0) return null;
                const info = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];
                const IconComponent = info.icon;
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
                      <IconComponent className={`w-4 h-4 ${info.color}`} />
                      <span className={`text-sm font-medium ${info.color} uppercase tracking-wider`}>{info.name}</span>
                      <div className="flex-1 h-px bg-lc-border-subtle" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryActivities.map((activity) => {
                        const hasContent = lessonPlanContent?.generatedContent[activity.key];
                        const ActivityIcon = activity.icon;
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
                              <ActivityIcon className={`w-5 h-5 ${info.color}`} />
                              <h3 className="font-semibold">{activity.name}</h3>
                            </div>
                            <p className="text-sm opacity-70 mt-2">{activity.description}</p>
                            <div className="flex flex-wrap gap-1 mt-3">
                              {activity.skills.map((skill) => (
                                <span key={skill} className="text-xs px-2 py-0.5 bg-white/10 rounded-full">
                                  {skill}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-xs opacity-50">~{activity.estimatedMinutes} min</span>
                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <select
                                  value={getTimerForPlugin(activity.key, activity.defaultTimerSeconds)}
                                  onChange={(e) => handleTimerOverride(activity.key, Number(e.target.value))}
                                  className="bg-transparent text-xs opacity-70 outline-none cursor-pointer"
                                >
                                  {[30, 45, 60, 90, 120, 180].map((s) => (
                                    <option key={s} value={s}>{s}s</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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
              {(Object.entries(getGamesGrouped()) as [string, typeof games][]).map(([category, categoryGames]) => {
                if (categoryGames.length === 0) return null;
                const info = GAME_CATEGORY_INFO[category as keyof typeof GAME_CATEGORY_INFO];
                const IconComponent = info.icon;
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
                      <IconComponent className={`w-4 h-4 ${info.color}`} />
                      <span className={`text-sm font-medium ${info.color} uppercase tracking-wider`}>{info.name}</span>
                      <div className="flex-1 h-px bg-lc-border-subtle" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryGames.map((game) => {
                        const hasContent = lessonPlanContent?.generatedGameContent?.[game.key];
                        const GameIcon = game.icon;
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
                            <div className="flex items-center gap-2 mb-1">
                              <GameIcon className={`w-5 h-5 ${info.color}`} />
                              <h3 className="font-semibold">{game.name}</h3>
                            </div>
                            <p className="text-sm opacity-70 mt-1">{game.description}</p>
                            <div className="flex flex-wrap gap-1 mt-3">
                              {game.skills.map((skill) => (
                                <span key={skill} className="text-xs px-2 py-0.5 bg-white/10 rounded-full">
                                  {skill}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-1.5 mt-3" onClick={(e) => e.stopPropagation()}>
                              <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <select
                                value={getTimerForPlugin(game.key, game.defaultTimerSeconds)}
                                onChange={(e) => handleTimerOverride(game.key, Number(e.target.value))}
                                className="bg-transparent text-xs opacity-70 outline-none cursor-pointer"
                              >
                                {[15, 20, 30, 45, 60, 90, 120].map((s) => (
                                  <option key={s} value={s}>{s}s</option>
                                ))}
                              </select>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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
            <GameShell game={selectedGame} config={{}} preGeneratedContent={gameContent} timerSeconds={getTimerForPlugin(selectedGame.key, selectedGame.defaultTimerSeconds)} />
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
              <ActivityShell activity={selectedActivity} generatedContent={activityContent} timerSeconds={getTimerForPlugin(selectedActivity.key, selectedActivity.defaultTimerSeconds)} />
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

      {/* Floating widget system */}
      {WIDGET_REGISTRY.map((widget) => (
        <WidgetShell
          key={widget.id}
          id={widget.id}
          label={widget.label}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={widget.iconPath} />
            </svg>
          }
        >
          <widget.component {...(widget.getProps?.({ sessionId: session.id, students }) ?? {})} />
        </WidgetShell>
      ))}
      <WidgetLauncher />
    </div>
  );
}
