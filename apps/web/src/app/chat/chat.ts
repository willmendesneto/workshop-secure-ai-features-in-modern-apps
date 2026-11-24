import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { type Insight, MAX_QUESTION_LENGTH } from '@workshop/contracts';
import { AssistantService } from '../assistant/assistant.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.html',
  styleUrl: './chat.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Chat {
  private readonly assistant = inject(AssistantService);

  protected readonly question = signal(
    "Summarize Acme's performance this quarter and highlight key risks.",
  );
  protected readonly maxLength = MAX_QUESTION_LENGTH;
  /** UX hint only: the API enforces the limit. */
  protected readonly tooLong = computed(() => this.question().trim().length > MAX_QUESTION_LENGTH);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly insight = signal<Insight | null>(null);

  protected onInput(event: Event): void {
    this.question.set((event.target as HTMLTextAreaElement).value);
  }

  protected async ask(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.insight.set(null);
    try {
      this.insight.set(await this.assistant.ask(this.question()));
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'The assistant could not answer. Try again.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
