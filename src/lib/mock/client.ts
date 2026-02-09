import { mockStore, MOCK_USER } from './data';
import type { Class, Student, Session, Score, Round } from '@/lib/supabase/types';

type TableName = 'classes' | 'students' | 'sessions' | 'scores' | 'rounds' | 'session_leaderboard';

interface QueryResult<T> {
  data: T | null;
  error: Error | null;
}

// Chainable query builder
class MockQueryBuilder<T> {
  private tableName: TableName;
  private filters: { column: string; value: unknown }[] = [];
  private orderConfig: { column: string; ascending: boolean } | null = null;
  private isSingle = false;
  private insertData: Partial<T> | Partial<T>[] | null = null;
  private isArrayInsert = false;
  private updateData: Partial<T> | null = null;
  private isDelete = false;
  private selectColumns: string | null = null;
  private limitCount: number | null = null;

  constructor(tableName: TableName) {
    this.tableName = tableName;
  }

  select(columns: string = '*'): this {
    this.selectColumns = columns;
    return this;
  }

  insert(data: Partial<T> | Partial<T>[]): this {
    this.insertData = data as Partial<T>;
    this.isArrayInsert = Array.isArray(data);
    return this;
  }

  update(data: Partial<T>): this {
    this.updateData = data;
    return this;
  }

  delete(): this {
    this.isDelete = true;
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orderConfig = { column, ascending: options?.ascending ?? true };
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  single(): this {
    this.isSingle = true;
    return this;
  }

  maybeSingle(): this {
    this.isSingle = true;
    return this;
  }

  async then<TResult1 = QueryResult<T | T[]>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T | T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    const result = this.execute();
    if (onfulfilled) {
      return onfulfilled(result);
    }
    return result as TResult1;
  }

  private execute(): QueryResult<T | T[]> {
    try {
      // Handle inserts
      if (this.insertData !== null) {
        const created = this.handleInsert();
        if (this.isSingle) {
          return { data: Array.isArray(created) ? created[0] : created, error: null };
        }
        return { data: Array.isArray(created) ? created : [created] as T[], error: null };
      }

      // Handle updates
      if (this.updateData !== null) {
        const updated = this.handleUpdate();
        return { data: updated, error: null };
      }

      // Handle deletes
      if (this.isDelete) {
        this.handleDelete();
        return { data: null, error: null };
      }

      // Handle selects
      let results = this.getTableData();
      results = this.applyFilters(results);
      results = this.applyOrder(results);
      results = this.applyLimit(results);

      if (this.isSingle) {
        return { data: results[0] || null, error: null };
      }
      return { data: results, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  private getTableData(): T[] {
    switch (this.tableName) {
      case 'classes':
        return mockStore.classes as unknown as T[];
      case 'students':
        return mockStore.students as unknown as T[];
      case 'sessions':
        return mockStore.sessions as unknown as T[];
      case 'scores':
        return mockStore.scores as unknown as T[];
      case 'rounds':
        return mockStore.rounds as unknown as T[];
      case 'session_leaderboard':
        // Get session_id from filters
        const sessionFilter = this.filters.find(f => f.column === 'session_id');
        if (sessionFilter) {
          return mockStore.getLeaderboard(sessionFilter.value as string) as unknown as T[];
        }
        return [];
      default:
        return [];
    }
  }

  private applyFilters(data: T[]): T[] {
    return data.filter(item => {
      return this.filters.every(({ column, value }) => {
        return (item as Record<string, unknown>)[column] === value;
      });
    });
  }

  private applyOrder(data: T[]): T[] {
    if (!this.orderConfig) return data;
    const { column, ascending } = this.orderConfig;
    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[column] as string | number;
      const bVal = (b as Record<string, unknown>)[column] as string | number;
      if (aVal < bVal) return ascending ? -1 : 1;
      if (aVal > bVal) return ascending ? 1 : -1;
      return 0;
    });
  }

  private applyLimit(data: T[]): T[] {
    if (this.limitCount === null) return data;
    return data.slice(0, this.limitCount);
  }

  private handleInsert(): T | T[] {
    const dataItems = this.isArrayInsert
      ? (this.insertData as Partial<T>[])
      : [this.insertData as Partial<T>];

    const results: T[] = [];

    for (const data of dataItems) {
      let created: T;
      switch (this.tableName) {
        case 'classes':
          created = mockStore.createClass(data as unknown as Partial<Class> & Pick<Class, 'teacher_id' | 'name'>) as unknown as T;
          break;
        case 'students':
          created = mockStore.createStudent(data as unknown as Partial<Student> & Pick<Student, 'class_id' | 'name'>) as unknown as T;
          break;
        case 'sessions':
          created = mockStore.createSession(data as unknown as Partial<Session> & Pick<Session, 'class_id'>) as unknown as T;
          break;
        case 'scores':
          created = mockStore.createScore(data as unknown as Partial<Score> & Pick<Score, 'session_id' | 'student_id'>) as unknown as T;
          break;
        case 'rounds':
          created = mockStore.createRound(data as unknown as Partial<Round> & Pick<Round, 'session_id' | 'game_type' | 'round_number'>) as unknown as T;
          break;
        default:
          throw new Error(`Insert not supported for table: ${this.tableName}`);
      }
      results.push(created);
    }

    return this.isArrayInsert ? results : results[0];
  }

  private handleUpdate(): T | null {
    const idFilter = this.filters.find(f => f.column === 'id');
    if (!idFilter) return null;
    const id = idFilter.value as string;

    switch (this.tableName) {
      case 'classes':
        return mockStore.updateClass(id, this.updateData as Partial<Class>) as unknown as T;
      case 'students':
        return mockStore.updateStudent(id, this.updateData as Partial<Student>) as unknown as T;
      case 'sessions':
        return mockStore.updateSession(id, this.updateData as Partial<Session>) as unknown as T;
      default:
        return null;
    }
  }

  private handleDelete(): void {
    const idFilter = this.filters.find(f => f.column === 'id');
    if (!idFilter) return;
    const id = idFilter.value as string;

    switch (this.tableName) {
      case 'classes':
        mockStore.deleteClass(id);
        break;
      case 'students':
        mockStore.deleteStudent(id);
        break;
    }
  }
}

// Mock auth object
const mockAuth = {
  getUser: async () => ({
    data: { user: MOCK_USER },
    error: null,
  }),
  getSession: async () => ({
    data: { session: { user: MOCK_USER } },
    error: null,
  }),
  signOut: async () => ({ error: null }),
  signInWithOAuth: async () => ({ data: { url: '/classes', provider: 'google' }, error: null }),
  onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
    // Immediately call with signed in state
    callback('SIGNED_IN', { user: MOCK_USER });
    return {
      data: { subscription: { unsubscribe: () => {} } },
    };
  },
};

// Mock channel for realtime
class MockChannel {
  on() { return this; }
  subscribe() { return this; }
}

// Main mock client
export function createMockClient() {
  return {
    from: <T>(table: TableName) => new MockQueryBuilder<T>(table),
    auth: mockAuth,
    channel: () => new MockChannel(),
    removeChannel: () => {},
  };
}

export type MockSupabaseClient = ReturnType<typeof createMockClient>;
