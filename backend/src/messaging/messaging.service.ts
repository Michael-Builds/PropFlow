import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConversationType,
  UserRole,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppLogger } from '../common/logger/app-logger.service';
import { PlatformRealtimeGateway } from '../realtime/platform-realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { OperationalMailService } from '../common/mail/operational-mail.service';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { CreateConversationDto, SendMessageDto } from './dto/messaging.dto';

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
    private readonly realtime: PlatformRealtimeGateway,
    private readonly operationalMail: OperationalMailService,
  ) {}

  async list(user: JwtUser) {
    const rows = await this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId: user.sub } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      include: {
        participants: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    const userIds = [...new Set(rows.flatMap((r) => r.participants.map((p) => p.userId)))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true, email: true, role: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));

    return rows.map((row) => {
      const mine = row.participants.find((p) => p.userId === user.sub);
      const last = row.messages[0] ?? null;
      const unread =
        !!last &&
        last.senderUserId !== user.sub &&
        (!mine?.lastReadAt || last.createdAt > mine.lastReadAt);
      return {
        id: row.id,
        orgId: row.orgId,
        type: row.type,
        subject: row.subject,
        status: row.status,
        updatedAt: row.updatedAt.toISOString(),
        unread,
        lastMessage: last
          ? {
              id: last.id,
              body: last.body,
              senderUserId: last.senderUserId,
              createdAt: last.createdAt.toISOString(),
            }
          : null,
        participants: row.participants.map((p) => {
          const u = byId.get(p.userId);
          return {
            userId: p.userId,
            role: p.role,
            fullName: u?.fullName ?? null,
            email: u?.email ?? null,
          };
        }),
      };
    });
  }

  async get(user: JwtUser, id: string) {
    const row = await this.requireParticipant(user.sub, id);
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId: id, userId: user.sub },
      data: { lastReadAt: new Date() },
    });

    const messages = await this.prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });
    const userIds = [
      ...new Set([
        ...row.participants.map((p) => p.userId),
        ...messages.map((m) => m.senderUserId),
      ]),
    ];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true, email: true, role: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));

    return {
      id: row.id,
      orgId: row.orgId,
      type: row.type,
      subject: row.subject,
      status: row.status,
      updatedAt: row.updatedAt.toISOString(),
      participants: row.participants.map((p) => {
        const u = byId.get(p.userId);
        return {
          userId: p.userId,
          role: p.role,
          fullName: u?.fullName ?? null,
          email: u?.email ?? null,
        };
      }),
      messages: messages.map((m) => ({
        id: m.id,
        body: m.body,
        senderUserId: m.senderUserId,
        senderName: byId.get(m.senderUserId)?.fullName ?? byId.get(m.senderUserId)?.email ?? null,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  async create(user: JwtUser, dto: CreateConversationDto) {
    this.assertCanStart(user, dto.type);

    const counterpartIds = await this.resolveCounterparts(user, dto.type);
    if (counterpartIds.length === 0) {
      throw new BadRequestException(
        dto.type === 'tenant_ops'
          ? 'No owner or manager is available in your organization.'
          : 'No platform admin is available.',
      );
    }

    const orgId = dto.type === 'owner_platform' ? user.orgId ?? null : user.orgId;
    if (dto.type === 'tenant_ops' && !orgId) {
      throw new BadRequestException('Organization context is required.');
    }

    const participantRows: Array<{ userId: string; role: UserRole }> = [
      { userId: user.sub, role: user.role as UserRole },
    ];
    for (const id of counterpartIds) {
      if (id === user.sub) continue;
      const u = await this.prisma.user.findUnique({ where: { id } });
      if (u) participantRows.push({ userId: u.id, role: u.role });
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        orgId,
        type: dto.type,
        subject: dto.subject?.trim() || this.defaultSubject(dto.type),
        createdBy: user.sub,
        participants: {
          create: participantRows.map((p) => ({
            userId: p.userId,
            role: p.role,
            lastReadAt: p.userId === user.sub ? new Date() : null,
          })),
        },
        messages: {
          create: {
            senderUserId: user.sub,
            body: dto.body.trim(),
          },
        },
      },
      include: { messages: true, participants: true },
    });

    const message = conversation.messages[0];
    await this.notifyAndBroadcast(conversation.id, participantRows.map((p) => p.userId), {
      id: message.id,
      conversationId: conversation.id,
      body: message.body,
      senderUserId: user.sub,
      createdAt: message.createdAt.toISOString(),
    });

    this.logger.success(`Conversation ${conversation.id} opened by ${user.sub}`, MessagingService.name);
    return this.get(user, conversation.id);
  }

  async send(user: JwtUser, conversationId: string, dto: SendMessageDto) {
    const conversation = await this.requireParticipant(user.sub, conversationId);
    if (conversation.status === 'closed') {
      throw new BadRequestException('Conversation is closed.');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderUserId: user.sub,
        body: dto.body.trim(),
      },
    });
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId: user.sub },
      data: { lastReadAt: new Date() },
    });

    const participantIds = conversation.participants.map((p) => p.userId);
    await this.notifyAndBroadcast(conversationId, participantIds, {
      id: message.id,
      conversationId,
      body: message.body,
      senderUserId: user.sub,
      createdAt: message.createdAt.toISOString(),
    });

    return {
      id: message.id,
      body: message.body,
      senderUserId: message.senderUserId,
      createdAt: message.createdAt.toISOString(),
    };
  }

  async close(user: JwtUser, conversationId: string) {
    await this.requireParticipant(user.sub, conversationId);
    if (user.role === 'tenant') {
      throw new ForbiddenException('Tenants cannot close conversations.');
    }
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'closed' },
    });
    return { ok: true };
  }

  private assertCanStart(user: JwtUser, type: ConversationType) {
    if (type === 'tenant_ops') {
      if (!['tenant', 'owner', 'manager'].includes(user.role)) {
        throw new ForbiddenException('Only tenants, owners, or managers can open ops threads.');
      }
      return;
    }
    if (type === 'owner_platform') {
      if (!['owner', 'platform_admin'].includes(user.role)) {
        throw new ForbiddenException('Only owners or platform admins can open platform support threads.');
      }
      return;
    }
    throw new BadRequestException('Unsupported conversation type.');
  }

  private async resolveCounterparts(user: JwtUser, type: ConversationType): Promise<string[]> {
    if (type === 'tenant_ops') {
      if (!user.orgId) return [];
      if (user.role === 'tenant') {
        const ops = await this.prisma.user.findMany({
          where: {
            orgId: user.orgId,
            status: 'active',
            role: { in: ['owner', 'manager'] },
          },
          select: { id: true },
          take: 20,
        });
        return ops.map((u) => u.id);
      }
      // owner/manager starting a thread — leave open without auto tenant; they should use type with subject only for ops team? 
      // Hierarchy: tenants message owners. Owners starting tenant_ops without a tenant is internal — attach other owners/managers.
      const peers = await this.prisma.user.findMany({
        where: {
          orgId: user.orgId,
          status: 'active',
          role: { in: ['owner', 'manager'] },
          id: { not: user.sub },
        },
        select: { id: true },
        take: 20,
      });
      return peers.map((u) => u.id);
    }

    if (user.role === 'owner') {
      const admins = await this.prisma.user.findMany({
        where: { role: 'platform_admin', status: 'active' },
        select: { id: true },
        take: 20,
      });
      return admins.map((u) => u.id);
    }
    // platform_admin opening support toward an org — need orgId on user (none). Require existing list or skip create from admin without target.
    // For admin→owner, they reply in existing threads. Creating new: attach owners of... we need org. Use first org from query? Better: require user.orgId null and find recent owners — skip.
    // Allow platform_admin to create only if they pass — for now find all owners is too broad.
    // Resolve: platform admin creates by messaging any owner who already exists in org from JWT? They don't have orgId.
    // So platform_admin starts conversations by responding; owners initiate.
    if (user.role === 'platform_admin') {
      throw new BadRequestException(
        'Platform admins join owner-initiated support threads. Ask an owner to message platform support.',
      );
    }
    return [];
  }

  private defaultSubject(type: ConversationType): string {
    return type === 'tenant_ops' ? 'Property support' : 'Platform support';
  }

  private async requireParticipant(userId: string, conversationId: string) {
    const row = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: { some: { userId } },
      },
      include: { participants: true },
    });
    if (!row) throw new NotFoundException('Conversation not found.');
    return row;
  }

  private async notifyAndBroadcast(
    conversationId: string,
    participantIds: string[],
    message: {
      id: string;
      conversationId: string;
      body: string;
      senderUserId: string;
      createdAt: string;
    },
  ) {
    this.realtime.broadcastMessage(message, participantIds);

    const recipients = participantIds.filter((id) => id !== message.senderUserId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: recipients } },
      select: { id: true, orgId: true, email: true, fullName: true },
    });
    for (const u of users) {
      const orgId = u.orgId ?? 'platform';
      try {
        await this.operationalMail.newMessage({
          orgId,
          userId: u.id,
          email: u.email,
          fullName: u.fullName,
          conversationId,
          preview: message.body.slice(0, 120),
        });
      } catch {
        // non-fatal
      }
    }
  }
}
