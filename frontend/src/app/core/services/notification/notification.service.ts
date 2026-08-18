import { Injectable, computed, inject, signal } from '@angular/core';
import { AppNotification } from '../../interfaces/user.interface';
import { formatRelativeTime } from '../../utils';
import { AuthService } from '../auth/auth.service';
import { DataService } from '../data/data.service';
import { API_BASE } from '../data/api-map';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly data = inject(DataService);
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly _items = signal<AppNotification[]>([]);

  readonly items = this._items.asReadonly();
  readonly unreadCount = computed(() => this._items().filter((item) => !item.read).length);
  readonly unreadItems = computed(() => this._items().filter((item) => !item.read));
  readonly recentItems = computed(() => this._items().slice(0, 6));

  constructor() {
    if (this.auth.authenticated()) this.refresh();
  }

  refresh(): void {
    if (!this.auth.authenticated()) return;
    this.data.loadCollection<AppNotification>('notifications').subscribe({
      next: (items) => this._items.set(items),
      error: () => this._items.set([]),
    });
  }

  markRead(id: string): void {
    this._items.update((items) =>
      items.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
    this.http.patch(`${API_BASE}/notifications/${id}/read`, {}).subscribe({ error: () => undefined });
  }

  markAllRead(): void {
    this._items().filter((item) => !item.read).forEach((item) => this.markRead(item.id));
  }

  relativeTime(iso: string): string {
    return formatRelativeTime(iso);
  }
}
