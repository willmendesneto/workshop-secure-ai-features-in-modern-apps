import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import type { SessionUser } from '@workshop/contracts';
import { firstValueFrom } from 'rxjs';

export interface Session {
  token: string;
  user: SessionUser;
}

const STORAGE_KEY = 'workshop.session';

function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<Session>;
  return (
    typeof candidate.token === 'string' &&
    typeof candidate.user === 'object' &&
    typeof candidate.user.email === 'string' &&
    typeof candidate.user.tenantId === 'string'
  );
}

function readStoredSession(): Session | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    return isSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Fake login: the API signs a token for a known email. Session lives in localStorage. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly current = signal<Session | null>(readStoredSession());

  readonly session = this.current.asReadonly();

  async login(email: string): Promise<void> {
    const session = await firstValueFrom(this.http.post<Session>('/api/auth/login', { email }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    this.current.set(session);
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.current.set(null);
  }
}
