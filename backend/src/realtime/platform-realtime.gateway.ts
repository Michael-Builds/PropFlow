import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AppLogger } from '../common/logger/app-logger.service';
import type { PlatformAvailabilityState } from '../platform/platform-availability.service';

export const PLATFORM_AVAILABILITY_EVENT = 'platform_availability';
export const MESSAGE_EVENT = 'message';

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: '/realtime',
})
export class PlatformRealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly logger: AppLogger) {}

  handleConnection(client: Socket): void {
    this.logger.debug(`Realtime client connected ${client.id}`, PlatformRealtimeGateway.name);
    client.emit('realtime_ready', { ok: true });
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket, @MessageBody() body?: unknown) {
    client.emit('pong', body ?? { t: Date.now() });
  }

  @SubscribeMessage('join_user')
  handleJoinUser(@ConnectedSocket() client: Socket, @MessageBody() body: { userId?: string }) {
    const userId = body?.userId?.trim();
    if (!userId) return { ok: false };
    void client.join(`user:${userId}`);
    return { ok: true };
  }

  broadcastAvailability(state: PlatformAvailabilityState): void {
    if (!this.server) return;
    this.server.emit(PLATFORM_AVAILABILITY_EVENT, state);
    this.logger.info(
      `Broadcast ${PLATFORM_AVAILABILITY_EVENT} mode=${state.mode}`,
      PlatformRealtimeGateway.name,
    );
  }

  broadcastMessage(
    message: {
      id: string;
      conversationId: string;
      body: string;
      senderUserId: string;
      createdAt: string;
    },
    participantUserIds: string[],
  ): void {
    if (!this.server) return;
    for (const userId of participantUserIds) {
      this.server.to(`user:${userId}`).emit(MESSAGE_EVENT, message);
    }
  }
}
