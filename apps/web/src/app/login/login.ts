import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SessionService } from '../session/session.service';

interface DemoUser {
  email: string;
  description: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly sessions = inject(SessionService);

  protected readonly users: readonly DemoUser[] = [
    { email: 'alice@acme', description: 'Analyst at Acme' },
    { email: 'bob@globex', description: 'Analyst at Globex' },
    { email: 'carol@acme', description: 'Viewer at Acme (no risk reports)' },
  ];
  protected readonly pending = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected async signIn(email: string): Promise<void> {
    this.pending.set(email);
    this.error.set(null);
    try {
      await this.sessions.login(email);
    } catch {
      this.error.set('Sign-in failed. Is the API running on port 3000?');
    } finally {
      this.pending.set(null);
    }
  }
}
