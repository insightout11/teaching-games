export type ClassLaunchListState = 'loading' | 'auth-required' | 'error' | 'empty' | 'active-only' | 'ready';

export function resolveClassLaunchListState(options: {
  authChecked: boolean;
  isAuthenticated: boolean;
  classesLoading: boolean;
  classesError: string | null;
  classCount: number;
  hasActiveSession: boolean;
}): ClassLaunchListState {
  if (!options.authChecked || options.classesLoading) return 'loading';
  if (!options.isAuthenticated) return 'auth-required';
  if (options.classesError) return 'error';
  if (options.classCount > 0) return 'ready';
  return options.hasActiveSession ? 'active-only' : 'empty';
}
