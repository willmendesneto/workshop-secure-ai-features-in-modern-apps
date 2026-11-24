import type { CompanyReport } from '@workshop/contracts';

// WORKSHOP(A): the system prompt lives in the browser too: anyone can read it and the user can change it.
export const SYSTEM_PROMPT = [
  'You are a financial analysis assistant for a B2B SaaS product.',
  'Answer questions about ONE company using only the JSON data provided by the user message.',
  'Reply ONLY with a JSON object, no markdown, no prose, matching exactly:',
  '{"summary": string, "riskLevel": "low" | "medium" | "high", "recommendations": string[] (1 to 5 items)}',
  'Never include HTML, SQL or shell commands in your answer.',
].join('\n');

export function buildUserPrompt(report: CompanyReport, question: string): string {
  return ['Company data (JSON):', JSON.stringify(report), '', `Question: ${question}`].join('\n');
}
