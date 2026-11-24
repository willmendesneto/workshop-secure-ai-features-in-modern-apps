import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { CompanyReport, Insight, SessionUser } from '@workshop/contracts';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt';

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

/** Step 1 flow: everything happens in the browser. Works in the demo, insecure in production. */
@Injectable({ providedIn: 'root' })
export class AssistantService {
  private readonly http = inject(HttpClient);

  async ask(question: string, user: SessionUser): Promise<Insight> {
    // 1. Fetch the full company report (risks included).
    // WORKSHOP(C): the browser chooses the tenant; any tenantId in this body is trusted by the API.
    const report = await firstValueFrom(
      this.http.post<CompanyReport>('/api/data/report', { tenantId: user.tenantId }),
    );

    // 2. Build the prompt.
    // WORKSHOP(A): prompt built in the browser; the API should own the prompt and the data context.
    const body = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: buildUserPrompt(report, question) }] }],
    };

    // 3. Call the LLM provider directly.
    // WORKSHOP(A): direct provider call with the API key in the URL; call POST /api/assistant instead.
    const url = `${environment.providerBaseUrl}/v1beta/models/${environment.providerModel}:generateContent?key=${environment.providerApiKey}`;
    const response = await firstValueFrom(this.http.post<GeminiResponse>(url, body));

    // 4. Trust whatever the model said.
    // WORKSHOP(B): no schema validation; parse with InsightSchema and show an error state instead.
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return JSON.parse(text) as Insight;
  }
}
