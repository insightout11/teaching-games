import { getProviderApiKey, type ProviderName } from './config';
import { GeminiProvider } from './providers/gemini';
import { OpenAIProvider } from './providers/openai';
import { GroqProvider } from './providers/groq';
import { resolveTaskClass, TASK_CLASS_CONFIG } from './routing';
import { classifyError, type ErrorClass } from './errors';
import type { AIProvider, AISchema, GenerateJSONOptions } from './types';

// --- Provider cache (singleton per provider) ---

const providerCache = new Map<string, AIProvider>();

function getProvider(name: ProviderName): AIProvider | null {
  const key = getProviderApiKey(name);
  if (!key) return null;

  const cacheKey = `${name}:${key}`;
  const cached = providerCache.get(cacheKey);
  if (cached) return cached;

  let provider: AIProvider;
  switch (name) {
    case 'openai':
      provider = new OpenAIProvider(key);
      break;
    case 'groq':
      provider = new GroqProvider(key);
      break;
    default:
      provider = new GeminiProvider(key);
      break;
  }

  providerCache.set(cacheKey, provider);
  return provider;
}

// --- Circuit breaker ---

interface CircuitState {
  failures: number;
  openUntil: number;
  firstFailureAt: number;
}

const circuitBreakers = new Map<ProviderName, CircuitState>();

const CB_FAILURE_THRESHOLD = 3;
const CB_WINDOW_MS = 60_000;
const CB_OPEN_DURATION_MS = 60_000;

function isCircuitOpen(name: ProviderName): boolean {
  const state = circuitBreakers.get(name);
  if (!state) return false;
  if (Date.now() >= state.openUntil) {
    // Auto-heal: reset after open duration
    circuitBreakers.delete(name);
    return false;
  }
  return true;
}

function recordFailure(name: ProviderName): void {
  const now = Date.now();
  const state = circuitBreakers.get(name);

  if (!state || now - state.firstFailureAt > CB_WINDOW_MS) {
    circuitBreakers.set(name, { failures: 1, openUntil: 0, firstFailureAt: now });
    return;
  }

  state.failures++;
  if (state.failures >= CB_FAILURE_THRESHOLD) {
    state.openUntil = now + CB_OPEN_DURATION_MS;
  }
}

function recordSuccess(name: ProviderName): void {
  circuitBreakers.delete(name);
}

function circuitBreak(name: ProviderName): void {
  const now = Date.now();
  circuitBreakers.set(name, {
    failures: CB_FAILURE_THRESHOLD,
    openUntil: now + CB_OPEN_DURATION_MS,
    firstFailureAt: now,
  });
}

// --- Structured logging ---

function logAttempt(fields: Record<string, unknown>): void {
  console.log(JSON.stringify({ event: 'ai_call', ...fields }));
}

// --- Core orchestrator ---

export async function reliableGenerateJSON<T>(
  prompt: string,
  schema: AISchema,
  options: GenerateJSONOptions = {},
): Promise<T> {
  const taskClass = resolveTaskClass(options.taskClass);
  const config = TASK_CLASS_CONFIG[taskClass];
  const requestId = crypto.randomUUID();
  const errors: Array<{ provider: ProviderName; errorClass: ErrorClass; message: string }> = [];

  // Determine available providers (skip circuit-broken)
  const availableProviders = config.providers.filter((p) => !isCircuitOpen(p));

  // If ALL are circuit-broken, still try the first one (last-ditch)
  const providersToTry =
    availableProviders.length > 0 ? availableProviders : [config.providers[0]];

  for (const providerName of providersToTry) {
    const provider = getProvider(providerName);
    if (!provider) {
      errors.push({ provider: providerName, errorClass: 'auth', message: 'No API key configured' });
      continue;
    }

    // Attempt 1
    const attempt1Result = await attempt<T>(
      provider,
      providerName,
      prompt,
      schema,
      { ...options, temperature: options.temperature },
      config.timeoutMs,
      { requestId, taskClass, route: options._route, attempt: 1 },
    );

    if (attempt1Result.success) {
      recordSuccess(providerName);
      return attempt1Result.data;
    }

    const errorClass = attempt1Result.errorClass;
    errors.push({ provider: providerName, errorClass, message: attempt1Result.message });

    // Decide what to do based on error class
    if (errorClass === 'auth') {
      circuitBreak(providerName);
      continue; // try next provider
    }
    if (errorClass === 'rate-limit') {
      continue; // skip to next, no circuit-break
    }
    if (errorClass === 'bad-request') {
      continue; // our fault, try next provider
    }

    // timeout / network / server / unknown → retry once with strict settings
    const retryPrompt =
      config.retryPromptVariant === 'strict'
        ? prompt + '\n\nYou MUST respond with valid JSON only.'
        : prompt;

    const attempt2Result = await attempt<T>(
      provider,
      providerName,
      retryPrompt,
      schema,
      { ...options, temperature: config.retryTemperature },
      config.timeoutMs,
      { requestId, taskClass, route: options._route, attempt: 2 },
    );

    if (attempt2Result.success) {
      recordSuccess(providerName);
      return attempt2Result.data;
    }

    errors.push({ provider: providerName, errorClass: attempt2Result.errorClass, message: attempt2Result.message });
    recordFailure(providerName);
    // try next provider
  }

  // All providers failed
  const errorSummary = errors
    .map((e) => `${e.provider}[${e.errorClass}]: ${e.message}`)
    .join('; ');
  throw new Error(`All AI providers failed for ${taskClass}: ${errorSummary}`);
}

// --- Single attempt helper ---

type AttemptResult<T> =
  | { success: true; data: T }
  | { success: false; errorClass: ErrorClass; message: string };

async function attempt<T>(
  provider: AIProvider,
  providerName: ProviderName,
  prompt: string,
  schema: AISchema,
  options: GenerateJSONOptions,
  timeoutMs: number,
  logContext: { requestId: string; taskClass: string; route?: string; attempt: number },
): Promise<AttemptResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();

  try {
    const result = await provider.generateJSON<T>(prompt, schema, {
      ...options,
      signal: controller.signal,
    });

    const latencyMs = Date.now() - start;
    logAttempt({
      requestId: logContext.requestId,
      route: logContext.route,
      taskClass: logContext.taskClass,
      provider: providerName,
      attempt: logContext.attempt,
      latencyMs,
      outcome: 'success',
      promptChars: prompt.length,
    });

    return { success: true, data: result };
  } catch (error) {
    const latencyMs = Date.now() - start;
    const errorClass = classifyError(error);
    const message = error instanceof Error ? error.message : String(error);

    logAttempt({
      requestId: logContext.requestId,
      route: logContext.route,
      taskClass: logContext.taskClass,
      provider: providerName,
      attempt: logContext.attempt,
      latencyMs,
      outcome: 'fail',
      errorClass,
      errorMessage: message.slice(0, 200),
      promptChars: prompt.length,
    });

    return { success: false, errorClass, message };
  } finally {
    clearTimeout(timer);
  }
}
