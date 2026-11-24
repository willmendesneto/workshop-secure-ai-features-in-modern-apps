// Minimal structured logger: one JSON object per line on stdout.
// Never pass secrets, tokens or raw prompts as fields.
type Level = 'info' | 'error';

function write(level: Level, msg: string, fields: Record<string, unknown> = {}): void {
  const line = JSON.stringify({ time: new Date().toISOString(), level, msg, ...fields });
  process.stdout.write(`${line}\n`);
}

export const logger = {
  info: (msg: string, fields?: Record<string, unknown>): void => {
    write('info', msg, fields);
  },
  error: (msg: string, fields?: Record<string, unknown>): void => {
    write('error', msg, fields);
  },
};
