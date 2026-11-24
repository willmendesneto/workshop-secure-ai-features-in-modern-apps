import express, { type ErrorRequestHandler, type Express } from 'express';
import { loadConfig, type Config } from './config.js';
import { logger } from './logger.js';
import { authRouter } from './routes/auth.js';

export interface AppOptions {
  /** Overrides on top of the environment config (handy in tests). */
  config?: Partial<Config>;
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
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter(config));

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  app.use(errorHandler);

  return app;
}
