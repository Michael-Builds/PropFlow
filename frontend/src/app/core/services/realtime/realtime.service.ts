import { Injectable, OnDestroy, inject } from '@angular/core';
import { io, type Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PlatformAvailabilityState } from '../../interfaces/platform-availability.interface';
import { MessageItem } from '../../interfaces/messaging.interface';

const AVAILABILITY_EVENT = 'platform_availability';
const MESSAGE_EVENT = 'message';

@Injectable({ providedIn: 'root' })
export class RealtimeService implements OnDestroy {
  private socket: Socket | null = null;
  private readonly availability$ = new Subject<PlatformAvailabilityState>();
  private readonly message$ = new Subject<MessageItem & { conversationId: string }>();
  private joinedUserId: string | null = null;

  readonly platformAvailability$ = this.availability$.asObservable();
  readonly messages$ = this.message$.asObservable();

  connect(): void {
    if (this.socket?.connected) {
      if (this.joinedUserId) this.joinUser(this.joinedUserId);
      return;
    }
    this.socket = io(`${environment.apiOrigin}/realtime`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      withCredentials: false,
      transportOptions: {
        polling: {
          extraHeaders: {
            'ngrok-skip-browser-warning': 'true',
          },
        },
      },
    });
    this.socket.on(AVAILABILITY_EVENT, (payload: PlatformAvailabilityState) => {
      this.availability$.next(payload);
    });
    this.socket.on(MESSAGE_EVENT, (payload: MessageItem & { conversationId: string }) => {
      this.message$.next(payload);
    });
    this.socket.on('connect', () => {
      if (this.joinedUserId) this.joinUser(this.joinedUserId);
    });
  }

  joinUser(userId: string): void {
    this.joinedUserId = userId;
    this.socket?.emit('join_user', { userId });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
