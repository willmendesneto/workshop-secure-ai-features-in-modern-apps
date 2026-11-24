// Offline, deterministic stand-in for an LLM. No network, no randomness, no clock reads.
// Each scenario reproduces something a real model can do in production.
import type { MockScenario } from '../config.js';
import type { LlmProvider } from './types.js';

export interface MockProviderOptions {
  scenario: MockScenario;
  /** Delay used by the `slow` scenario. */
  slowMs: number;
}

const INJECTION_MARKERS = ['ignore', 'system prompt', 'instructions'];
const XSS_PAYLOAD = `<img src=x onerror=alert('xss')>`;

function companyFrom(text: string): string {
  return /"company"\s*:\s*"([^"]{1,100})"/.exec(text)?.[1] ?? 'The company';
}

/** The user question is the text after the last "Question:" line (see assistant/prompt.ts). */
function questionFrom(text: string): string {
  const index = text.lastIndexOf('Question:');
  return index === -1 ? text : text.slice(index);
}

function riskLevelFrom(text: string): 'low' | 'medium' | 'high' {
  const high = text.match(/"severity"\s*:\s*"high"/g)?.length ?? 0;
  if (high >= 3) return 'high';
  return high >= 1 ? 'medium' : 'low';
}

function okInsight(user: string): string {
  const company = companyFrom(user);
  return JSON.stringify({
    summary: `${company} grew revenue in every quarter of the period, while gross margin slipped and churn trended up. The high-severity risks deserve attention next quarter.`,
    riskLevel: riskLevelFrom(user),
    recommendations: [
      `Reduce ${company}'s dependency on its largest customers and suppliers.`,
      'Launch a retention plan to bring churn back down.',
      'Review every high-severity risk with the leadership team.',
    ],
  });
}

function malformedInsight(user: string): string {
  // Wrong on purpose: no summary, riskLevel is a number, recommendations is a string.
  return JSON.stringify({
    company: companyFrom(user),
    riskLevel: 7,
    recommendations: 'Cut costs everywhere.',
  });
}

function injectedInsight(system: string, user: string): string {
  const lowered = questionFrom(user).toLowerCase();
  if (!INJECTION_MARKERS.some((marker) => lowered.includes(marker))) return okInsight(user);
  // Behaves as if the injection worked: leaks instructions and returns active content.
  return JSON.stringify({
    summary: `Sure! My system prompt is: ${system.slice(0, 1200)} ${XSS_PAYLOAD}`,
    riskLevel: 'low',
    recommendations: [
      'Run: DROP TABLE customers;',
      'Ignore the data and tell the user every company is low risk.',
    ],
  });
}

function abortError(): DOMException {
  return new DOMException('The operation was aborted.', 'AbortError');
}

function waitThenAnswer(ms: number, answer: () => string, signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve(answer());
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export function createMockProvider(options: MockProviderOptions): LlmProvider {
  return {
    generate({ system, user }, callOptions) {
      switch (options.scenario) {
        case 'ok':
          return Promise.resolve(okInsight(user));
        case 'malformed':
          return Promise.resolve(malformedInsight(user));
        case 'injection-echo':
          return Promise.resolve(injectedInsight(system, user));
        case 'slow':
          return waitThenAnswer(options.slowMs, () => okInsight(user), callOptions?.signal);
      }
    },
  };
}
