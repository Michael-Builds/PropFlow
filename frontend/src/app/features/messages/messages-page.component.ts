import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CONVERSATION_TYPE_LABELS,
  ConversationType,
} from '../../core/interfaces/messaging.interface';
import { MessagingService } from '../../core/services/messaging/messaging.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { RealtimeService } from '../../core/services/realtime/realtime.service';
import { ToastService } from '../../core/services/toast/toast.service';
import { UserRole } from '../../core/enums/user-role.enum';
import { formatDisplayDate } from '../../core/utils';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { CardComponent } from '../../shared/ui/card/card.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { InputComponent } from '../../shared/ui/input/input.component';
import { TextareaComponent } from '../../shared/ui/textarea/textarea.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-messages-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageHeaderComponent,
    CardComponent,
    ButtonComponent,
    InputComponent,
    TextareaComponent,
    EmptyStateComponent,
  ],
  templateUrl: './messages-page.component.html',
  styleUrl: './messages-page.component.css',
  host: { class: 'block space-y-4' },
})
export class MessagesPageComponent implements OnInit {
  private readonly messaging = inject(MessagingService);
  private readonly auth = inject(AuthService);
  private readonly realtime = inject(RealtimeService);
  private readonly toast = inject(ToastService);

  readonly conversations = this.messaging.conversations;
  readonly active = this.messaging.active;
  readonly loading = this.messaging.loading;
  readonly draft = signal('');
  readonly composeOpen = signal(false);
  readonly composeBody = signal('');
  readonly composeSubject = signal('');

  readonly me = computed(() => this.auth.user()?.id ?? '');
  readonly role = computed(() => this.auth.role());

  readonly canStartTenantOps = computed(() => {
    const role = this.role();
    return role === UserRole.Tenant || role === UserRole.Owner || role === UserRole.Manager;
  });
  readonly canStartPlatform = computed(() => this.role() === UserRole.Owner);
  readonly canClose = computed(() => {
    const role = this.role();
    return (
      role === UserRole.Owner ||
      role === UserRole.Manager ||
      role === UserRole.PlatformAdmin
    );
  });

  readonly composeType = signal<ConversationType>(ConversationType.TenantOps);

  readonly typeLabel = CONVERSATION_TYPE_LABELS;
  readonly tenantOpsType = ConversationType.TenantOps;
  readonly ownerPlatformType = ConversationType.OwnerPlatform;

  ngOnInit(): void {
    const userId = this.auth.user()?.id;
    if (userId) this.realtime.joinUser(userId);
    this.messaging.refreshList();
  }

  select(id: string): void {
    this.messaging.open(id);
  }

  openCompose(type: ConversationType): void {
    this.composeType.set(type);
    this.composeSubject.set(CONVERSATION_TYPE_LABELS[type]);
    this.composeBody.set('');
    this.composeOpen.set(true);
  }

  sendCompose(): void {
    const body = this.composeBody().trim();
    if (!body) return;
    this.messaging.start(this.composeType(), body, this.composeSubject().trim() || undefined).subscribe({
      next: () => {
        this.composeOpen.set(false);
        this.toast.success('Conversation started');
      },
      error: (err) => {
        this.toast.error(err?.error?.message ?? 'Could not start conversation');
      },
    });
  }

  sendReply(): void {
    const body = this.draft().trim();
    if (!body) return;
    this.messaging.send(body);
    this.draft.set('');
  }

  closeThread(): void {
    this.messaging.closeActive();
  }

  formatDate(value: string | null | undefined): string {
    return formatDisplayDate(value);
  }
}
