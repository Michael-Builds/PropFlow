import { Injectable, effect, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { MessagingApiService } from '../../api/messaging-api.service';
import {
  ConversationDetail,
  ConversationSummary,
  ConversationType,
  MessageItem,
} from '../../interfaces/messaging.interface';
import { AuthService } from '../auth/auth.service';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable({ providedIn: 'root' })
export class MessagingService {
  private readonly api = inject(MessagingApiService);
  private readonly auth = inject(AuthService);
  private readonly realtime = inject(RealtimeService);

  readonly conversations = signal<ConversationSummary[]>([]);
  readonly active = signal<ConversationDetail | null>(null);
  readonly loading = signal(false);
  private readonly listLoaded = signal(false);
  private readonly loadedDetails = signal(new Set<string>());

  constructor() {
    this.realtime.connect();
    this.realtime.messages$.subscribe((msg) => this.onRealtimeMessage(msg));

    effect(() => {
      const userId = this.auth.user()?.id;
      if (!userId) {
        this.clearCache();
        return;
      }
      this.realtime.joinUser(userId);
    });
  }

  refreshList(force = false): void {
    if (!force && this.listLoaded()) return;
    this.loading.set(true);
    this.api.list().subscribe({
      next: (rows) => {
        this.conversations.set(rows);
        this.listLoaded.set(true);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  open(id: string, force = false): void {
    const current = this.active();
    if (!force && current?.id === id && this.loadedDetails().has(id)) {
      return;
    }

    this.loading.set(true);
    this.api.get(id).subscribe({
      next: (detail) => {
        this.active.set(detail);
        this.loadedDetails.update((set) => new Set(set).add(id));
        this.loading.set(false);
        this.refreshList(true);
      },
      error: () => this.loading.set(false),
    });
  }

  start(type: ConversationType, body: string, subject?: string) {
    return this.api.create({ type, body, subject }).pipe(
      tap((detail) => {
        this.active.set(detail);
        this.loadedDetails.update((set) => new Set(set).add(detail.id));
        this.refreshList(true);
      }),
    );
  }

  send(body: string) {
    const id = this.active()?.id;
    if (!id) return;
    this.api.send(id, body).subscribe({
      next: (message) => {
        const current = this.active();
        if (!current) return;
        this.active.set({
          ...current,
          messages: [...current.messages, { ...message, senderName: this.auth.displayName() }],
        });
        this.refreshList(true);
      },
    });
  }

  closeActive() {
    const id = this.active()?.id;
    if (!id) return;
    this.api.close(id).subscribe({
      next: () => {
        const current = this.active();
        if (current) this.active.set({ ...current, status: 'closed' });
        this.refreshList(true);
      },
    });
  }

  clearCache(): void {
    this.conversations.set([]);
    this.active.set(null);
    this.listLoaded.set(false);
    this.loadedDetails.set(new Set());
  }

  private onRealtimeMessage(message: MessageItem & { conversationId: string }): void {
    const current = this.active();
    if (current?.id === message.conversationId) {
      if (current.messages.some((m) => m.id === message.id)) return;
      this.active.set({
        ...current,
        messages: [...current.messages, message],
      });
    }
    this.refreshList(true);
  }
}
