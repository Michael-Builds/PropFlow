import { Injectable, computed, inject, signal } from '@angular/core';
import { AppNotification } from '../../interfaces/user.interface';
import { formatRelativeTime } from '../../utils';
import { DataService } from '../data/data.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly data = inject(DataService);
  private readonly _items = signal<AppNotification[]>([]);

  readonly items = this._items.asReadonly();
  readonly unreadCount = computed(() => this._items().filter((item) => !item.read).length);
  readonly unreadItems = computed(() => this._items().filter((item) => !item.read));
  readonly recentItems = computed(() => this._items().slice(0, 6));

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.data.loadCollection<AppNotification>('notifications').subscribe({
      next: (items) => this._items.set(items),
    });
  }

  markRead(id: string): void {
    this._items.update((items) =>
      items.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }

  markAllRead(): void {
    this._items.update((items) => items.map((item) => ({ ...item, read: true })));
  }

  relativeTime(iso: string): string {
    return formatRelativeTime(iso);
  }
}
