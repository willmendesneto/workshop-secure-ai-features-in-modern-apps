import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Chat } from './chat/chat';
import { Login } from './login/login';
import { SessionService } from './session/session.service';

@Component({
  selector: 'app-root',
  imports: [Chat, Login],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly title = 'Company Insights Assistant';
  protected readonly sessions = inject(SessionService);
}
