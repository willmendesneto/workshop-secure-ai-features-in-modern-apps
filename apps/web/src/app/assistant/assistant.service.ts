import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AssistantFailureSchema, type AssistantSuccess, type Insight } from '@workshop/contracts';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '../session/session.service';

/** The API owns the prompt, the data, the provider key and the output validation. */
@Injectable({ providedIn: 'root' })
export class AssistantService {
  private readonly http = inject(HttpClient);
  private readonly sessions = inject(SessionService);

  async ask(question: string): Promise<Insight> {
    const session = this.sessions.session();
    if (!session) throw new Error('Session expired, log in again.');

    try {
      const response = await firstValueFrom(
        this.http.post<AssistantSuccess>(
          '/api/assistant',
          // WORKSHOP(C): the browser chooses the tenant; any tenantId in this body is trusted by the API.
          { question, tenantId: session.user.tenantId },
          { headers: { Authorization: `Bearer ${session.token}` } },
        ),
      );
      return response.insight;
    } catch (error) {
      throw new Error(this.messageFor(error), { cause: error });
    }
  }

  private messageFor(error: unknown): string {
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    switch (status) {
      case 400:
        return 'Your question must be 1–2,000 characters.';
      case 401:
        this.sessions.logout();
        return 'Session expired, log in again.';
      case 429:
        return 'Too many requests, wait a minute.';
      case 502: {
        const body = AssistantFailureSchema.safeParse((error as HttpErrorResponse).error);
        return body.success && body.data.fallback
          ? body.data.fallback.message
          : 'The assistant could not answer. Try again.';
      }
      case 504:
        return 'The assistant took too long.';
      default:
        return 'The assistant could not answer. Try again.';
    }
  }
}
