import { Injectable, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { DataCollection } from '../../enums/data-collection.enum';
import { AppNotification } from '../../interfaces/user.interface';
import { formatRelativeTime } from '../../utils';
import { AuthService } from '../auth/auth.service';
import { RecordRow } from '../data/api-map';
import { CollectionsActions } from '../../../store/collections/collections.actions';
import { selectCollectionItems } from '../../../store/collections/collections.selectors';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly store = inject(Store);
  private readonly auth = inject(AuthService);
  private readonly rows = this.store.selectSignal(selectCollectionItems(DataCollection.Notifications));
  readonly items = computed(() => this.rows().map(toNotification));
  readonly unreadCount = computed(() => this.items().filter((item) => !item.read).length);
  readonly unreadItems = computed(() => this.items().filter((item) => !item.read));
  readonly recentItems = computed(() => this.items().slice(0, 6));

  constructor() {
    if (this.auth.authenticated()) this.refresh();
  }

  refresh(): void {
    if (!this.auth.authenticated()) return;
    this.store.dispatch(CollectionsActions.load({ name: DataCollection.Notifications }));
  }

  markRead(id: string): void {
    this.store.dispatch(CollectionsActions.markNotificationRead({ id }));
  }

  markAllRead(): void {
    this.items()
      .filter((item) => !item.read)
      .forEach((item) => this.markRead(item.id));
  }

  relativeTime(iso: string): string {
    return formatRelativeTime(iso);
  }
}

function toNotification(row: RecordRow): AppNotification {
  return {
    id: String(row['id'] ?? ''),
    title: String(row['title'] ?? ''),
    message: String(row['message'] ?? ''),
    type: String(row['type'] ?? 'info'),
    read: Boolean(row['read']),
    createdAt: String(row['createdAt'] ?? ''),
  };
}
