import express, { type ErrorRequestHandler, type Express } from 'express';
import { loadConfig, type Config } from './config.js';
import { logger } from './logger.js';
import { createProvider } from './providers/index.js';
import type { LlmProvider } from './providers/types.js';
import { assistantRouter } from './routes/assistant.js';
import { authRouter } from './routes/auth.js';
import { dataRouter } from './routes/data.js';
import { fakeProviderRouter } from './routes/fake-provider.js';

export interface AppOptions {
  /** Overrides on top of the environment config (handy in tests). */
  config?: Partial<Config>;
  /** Replaces the configured LLM provider (tests use it to inspect prompts). */
  provider?: LlmProvider;
}

function clientErrorStatus(err: unknown): number | undefined {
  if (typeof err !== 'object' || err === null || !('status' in err)) return undefined;
  const { status } = err;
  return typeof status === 'number' && status >= 400 && status < 500 ? status : undefined;
}

// JSON errors only. Never send stack traces or internal messages to the client.
const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  const status = clientErrorStatus(err);
  if (status !== undefined) {
    res.status(status).json({ error: status === 400 ? 'Invalid request' : 'Request error' });
    return;
  }
  logger.error('unhandled error', {
    name: err instanceof Error ? err.name : typeof err,
    message: err instanceof Error ? err.message : 'non-error thrown',
  });
  res.status(500).json({ error: 'Internal server error' });
};

export function createApp(options: AppOptions = {}): Express {
  const config: Config = { ...loadConfig(), ...options.config };
  const provider = options.provider ?? createProvider(config);
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter(config));
  app.use('/api/data', dataRouter());
  app.use('/api/assistant', assistantRouter(provider));

  // Not part of the app: a simulated third-party LLM API so the workshop runs offline.
  app.use('/fake-provider', fakeProviderRouter(config));

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  app.use(errorHandler);

  return app;
}
