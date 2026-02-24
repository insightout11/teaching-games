import type { Class, Student, Session, Score, Round, LeaderboardEntry } from '@/lib/supabase/types';

// Mock user
export const MOCK_USER = {
  id: 'demo-teacher-1',
  email: 'demo@lessoncaptain.local',
  aud: 'authenticated',
  role: 'authenticated',
  email_confirmed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
};

// Initial seeded data
const INITIAL_CLASSES: Class[] = [
  {
    id: 'class-1',
    teacher_id: 'demo-teacher-1',
    name: 'Demo Class',
    theme: 'colorful',
    ai_scoring_config: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_STUDENTS: Student[] = [
  { id: 'student-1', class_id: 'class-1', name: 'Alice', avatar_seed: 'alice123', created_at: new Date().toISOString() },
  { id: 'student-2', class_id: 'class-1', name: 'Bob', avatar_seed: 'bob456', created_at: new Date().toISOString() },
  { id: 'student-3', class_id: 'class-1', name: 'Charlie', avatar_seed: 'charlie789', created_at: new Date().toISOString() },
  { id: 'student-4', class_id: 'class-1', name: 'Diana', avatar_seed: 'diana012', created_at: new Date().toISOString() },
  { id: 'student-5', class_id: 'class-1', name: 'Eve', avatar_seed: 'eve345', created_at: new Date().toISOString() },
];

// In-memory data store (singleton)
class MockDataStore {
  private static instance: MockDataStore;

  classes: Class[] = [...INITIAL_CLASSES];
  students: Student[] = [...INITIAL_STUDENTS];
  sessions: Session[] = [];
  scores: Score[] = [];
  rounds: Round[] = [];

  private constructor() {}

  static getInstance(): MockDataStore {
    if (!MockDataStore.instance) {
      MockDataStore.instance = new MockDataStore();
    }
    return MockDataStore.instance;
  }

  reset() {
    this.classes = [...INITIAL_CLASSES];
    this.students = [...INITIAL_STUDENTS];
    this.sessions = [];
    this.scores = [];
    this.rounds = [];
  }

  // Classes
  getClasses(teacherId: string): Class[] {
    return this.classes.filter(c => c.teacher_id === teacherId);
  }

  getClass(id: string): Class | undefined {
    return this.classes.find(c => c.id === id);
  }

  createClass(data: Partial<Class> & Pick<Class, 'teacher_id' | 'name'>): Class {
    const newClass: Class = {
      id: `class-${Date.now()}`,
      theme: 'colorful',
      ai_scoring_config: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data,
    };
    this.classes.push(newClass);
    return newClass;
  }

  updateClass(id: string, data: Partial<Class>): Class | undefined {
    const idx = this.classes.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    this.classes[idx] = { ...this.classes[idx], ...data, updated_at: new Date().toISOString() };
    return this.classes[idx];
  }

  deleteClass(id: string): boolean {
    const idx = this.classes.findIndex(c => c.id === id);
    if (idx === -1) return false;
    this.classes.splice(idx, 1);
    // Also delete associated students
    this.students = this.students.filter(s => s.class_id !== id);
    return true;
  }

  // Students
  getStudents(classId: string): Student[] {
    return this.students.filter(s => s.class_id === classId);
  }

  getStudent(id: string): Student | undefined {
    return this.students.find(s => s.id === id);
  }

  createStudent(data: Partial<Student> & Pick<Student, 'class_id' | 'name'>): Student {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newStudent: Student = {
      id: `student-${uniqueId}`,
      avatar_seed: `seed-${uniqueId}`,
      created_at: new Date().toISOString(),
      ...data,
    };
    this.students.push(newStudent);
    return newStudent;
  }

  updateStudent(id: string, data: Partial<Student>): Student | undefined {
    const idx = this.students.findIndex(s => s.id === id);
    if (idx === -1) return undefined;
    this.students[idx] = { ...this.students[idx], ...data };
    return this.students[idx];
  }

  deleteStudent(id: string): boolean {
    const idx = this.students.findIndex(s => s.id === id);
    if (idx === -1) return false;
    this.students.splice(idx, 1);
    return true;
  }

  // Sessions
  getSessions(classId: string): Session[] {
    return this.sessions.filter(s => s.class_id === classId);
  }

  getSession(id: string): Session | undefined {
    return this.sessions.find(s => s.id === id);
  }

  createSession(data: Partial<Session> & Pick<Session, 'class_id'>): Session {
    const newSession: Session = {
      id: `session-${Date.now()}`,
      status: 'active',
      started_at: new Date().toISOString(),
      ended_at: null,
      frozen: false,
      ...data,
    };
    this.sessions.push(newSession);
    return newSession;
  }

  updateSession(id: string, data: Partial<Session>): Session | undefined {
    const idx = this.sessions.findIndex(s => s.id === id);
    if (idx === -1) return undefined;
    this.sessions[idx] = { ...this.sessions[idx], ...data };
    return this.sessions[idx];
  }

  // Scores
  getScores(sessionId: string): Score[] {
    return this.scores.filter(s => s.session_id === sessionId);
  }

  createScore(data: Partial<Score> & Pick<Score, 'session_id' | 'student_id'>): Score {
    const newScore: Score = {
      id: `score-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      round_id: null,
      points: 0,
      streak_count: 0,
      streak_bonus: 0,
      is_correct: false,
      response_data: {},
      created_at: new Date().toISOString(),
      ...data,
    };
    this.scores.push(newScore);
    return newScore;
  }

  // Rounds
  getRounds(sessionId: string): Round[] {
    return this.rounds.filter(r => r.session_id === sessionId);
  }

  createRound(data: Partial<Round> & Pick<Round, 'session_id' | 'game_type' | 'round_number'>): Round {
    const newRound: Round = {
      id: `round-${Date.now()}`,
      game_config: {},
      created_at: new Date().toISOString(),
      ...data,
    };
    this.rounds.push(newRound);
    return newRound;
  }

  // Leaderboard
  getLeaderboard(sessionId: string): LeaderboardEntry[] {
    const sessionScores = this.getScores(sessionId);
    const studentScores = new Map<string, {
      total: number;
      correct: number;
      attempts: number;
      bestStreak: number;
      student: Student | undefined;
    }>();

    for (const score of sessionScores) {
      const key = score.student_id || score.client_id || '';
      if (!key) continue;
      const existing = studentScores.get(key) || {
        total: 0, correct: 0, attempts: 0, bestStreak: 0,
        student: score.student_id ? this.getStudent(score.student_id) : undefined
      };
      existing.total += score.points;
      existing.attempts += 1;
      if (score.is_correct) existing.correct += 1;
      if (score.streak_count > existing.bestStreak) existing.bestStreak = score.streak_count;
      studentScores.set(key, existing);
    }

    return Array.from(studentScores.entries()).map(([studentId, data]) => ({
      session_id: sessionId,
      student_id: studentId,
      student_name: data.student?.name || 'Unknown',
      avatar_seed: data.student?.avatar_seed || '',
      total_points: data.total,
      correct_count: data.correct,
      total_attempts: data.attempts,
      best_streak: data.bestStreak,
    })).sort((a, b) => b.total_points - a.total_points);
  }
}

export const mockStore = MockDataStore.getInstance();
