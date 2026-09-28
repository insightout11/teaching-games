export class SourceError extends Error {
  constructor(public code: string, public status = 400) { super(code); }
}
export function assertSource(value: unknown, code = 'INVALID_REQUEST', status = 400): asserts value {
  if (!value) throw new SourceError(code,status);
}
export function object(value: unknown): asserts value is Record<string,unknown> {
  assertSource(value !== null && typeof value === 'object' && !Array.isArray(value));
}
