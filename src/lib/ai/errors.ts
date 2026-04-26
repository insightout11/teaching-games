export type ErrorClass =
  | 'auth'
  | 'rate-limit'
  | 'bad-request'
  | 'content-filter'
  | 'timeout'
  | 'network'
  | 'server'
  | 'unknown';

export function classifyError(error: unknown): ErrorClass {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'timeout';
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'network';
  }

  // SDK errors from OpenAI/Groq/Gemini typically have status or code
  const err = error as Record<string, unknown>;

  const status =
    typeof err.status === 'number'
      ? err.status
      : typeof err.statusCode === 'number'
        ? err.statusCode
        : typeof err.code === 'number'
          ? err.code
          : null;

  // Check for content filtering before generic 400 — the message is the signal
  const rawMessage = typeof err.message === 'string' ? err.message : '';
  const lowerMessage = rawMessage.toLowerCase();
  if (
    lowerMessage.includes('output blocked') ||
    lowerMessage.includes('content filtering') ||
    lowerMessage.includes('content_filter') ||
    lowerMessage.includes('safety') && lowerMessage.includes('blocked')
  ) {
    return 'content-filter';
  }

  if (status !== null) {
    if (status === 401 || status === 403) return 'auth';
    if (status === 429) return 'rate-limit';
    if (status === 400) return 'bad-request';
    if (status >= 500) return 'server';
  }

  // Google API errors sometimes use error.code as string
  const code = typeof err.code === 'string' ? err.code : '';
  if (code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ETIMEDOUT') {
    return 'network';
  }

  const message =
    typeof err.message === 'string' ? err.message.toLowerCase() : '';
  if (message.includes('timeout') || message.includes('aborted')) {
    return 'timeout';
  }
  if (message.includes('econnrefused') || message.includes('enotfound')) {
    return 'network';
  }
  if (message.includes('401') || message.includes('403') || message.includes('unauthorized')) {
    return 'auth';
  }
  if (message.includes('429') || message.includes('rate limit')) {
    return 'rate-limit';
  }

  return 'unknown';
}
