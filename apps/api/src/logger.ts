// Minimal structured logger: one JSON object per line on stdout.
// Never pass secrets, tokens or raw prompts as fields. Redaction below is only a safety net.
type Level = 'info' | 'error';

/** Field names whose values are never written, even if someone logs them by mistake. */
const SENSITIVE_KEY = /authorization|cookie|token|api[-_]?key|^key$|secret|password/i;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** Copies `value`, replacing sensitive keys with "[REDACTED]" in plain objects and arrays. */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 8) return '[TRUNCATED]';
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_KEY.test(key) ? '[REDACTED]' : redact(item, depth + 1),
    ]),
  );
}

function write(level: Level, msg: string, fields: Record<string, unknown> = {}): void {
  const safe = redact(fields) as Record<string, unknown>;
  const line = JSON.stringify({ time: new Date().toISOString(), level, msg, ...safe });
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
