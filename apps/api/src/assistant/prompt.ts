import type { CompanyReport } from '@workshop/contracts';

export const SYSTEM_PROMPT = [
  'You are a financial analysis assistant for a B2B SaaS product.',
  'Answer questions about ONE company using only the JSON data provided by the user message.',
  'Reply ONLY with a JSON object, no markdown, no prose, matching exactly:',
  '{"summary": string, "riskLevel": "low" | "medium" | "high", "recommendations": string[] (1 to 5 items)}',
  'Never include HTML, SQL or shell commands in your answer.',
].join('\n');

/** Builds the provider input: system instructions + JSON data context + the user question. */
export function buildPrompt(
  report: CompanyReport,
  question: string,
): { system: string; user: string } {
  return {
    system: SYSTEM_PROMPT,
    user: [
      'Company data (JSON):',
      JSON.stringify(report),
      '',
      // The question is concatenated as-is: a prompt injection lands right here.
      `Question: ${question}`,
    ].join('\n'),
  };
}
