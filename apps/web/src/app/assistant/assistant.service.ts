import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Insight } from '@workshop/contracts';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '../session/session.service';

/** The API owns the prompt, the data and the provider key. The browser only sends the question. */
@Injectable({ providedIn: 'root' })
export class AssistantService {
  private readonly http = inject(HttpClient);
  private readonly sessions = inject(SessionService);

  async ask(question: string): Promise<Insight> {
    const session = this.sessions.session();
    if (!session) throw new Error('Session expired, log in again.');

    let raw: string;
    try {
      const response = await firstValueFrom(
        this.http.post<{ raw: string }>(
          '/api/assistant',
          // WORKSHOP(C): the browser chooses the tenant; any tenantId in this body is trusted by the API.
          { question, tenantId: session.user.tenantId },
          { headers: { Authorization: `Bearer ${session.token}` } },
        ),
      );
      raw = response.raw;
    } catch (error) {
      throw new Error(this.messageFor(error), { cause: error });
    }

    // WORKSHOP(B): no schema validation; parse with InsightSchema and show an error state instead.
    return JSON.parse(raw) as Insight;
  }

  private messageFor(error: unknown): string {
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    switch (status) {
      case 401:
        this.sessions.logout();
        return 'Session expired, log in again.';
      case 429:
        return 'Too many requests, wait a minute.';
      case 504:
        return 'The assistant took too long.';
      default:
        return 'The assistant could not answer. Try again.';
    }
  }
}
