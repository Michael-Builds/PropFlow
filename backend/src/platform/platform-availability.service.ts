import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppLogger } from '../common/logger/app-logger.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PlatformRealtimeGateway } from '../realtime/platform-realtime.gateway';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import {
  PLATFORM_AVAILABILITY_MODES,
  PlatformAvailabilityMode,
  type UpdatePlatformAvailabilityDto,
} from './dto/update-platform-availability.dto';

const DEFAULTS: Record<
  Exclude<PlatformAvailabilityMode, typeof PlatformAvailabilityMode.live>,
  { title: string; message: string }
> = {
  [PlatformAvailabilityMode.maintenance]: {
    title: 'PropFlow is under maintenance',
    message:
      'We are making improvements to keep property operations running smoothly. Please try again shortly.',
  },
  [PlatformAvailabilityMode.coming_soon]: {
    title: 'PropFlow is coming soon',
    message: 'We are putting the finishing touches on PropFlow. Check back shortly.',
  },
};

export type PlatformAvailabilityState = {
  mode: PlatformAvailabilityMode;
  title: string;
  message: string;
  supportEmail: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
};

@Injectable()
export class PlatformAvailabilityService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
    private readonly notifications: NotificationsService,
    private readonly realtime: PlatformRealtimeGateway,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureRow();
  }

  async get(): Promise<PlatformAvailabilityState> {
    const row = await this.ensureRow();
    return this.present(row);
  }

  async update(
    actor: JwtUser,
    dto: UpdatePlatformAvailabilityDto,
  ): Promise<PlatformAvailabilityState & { notificationsQueued?: number }> {
    const previous = await this.get();
    const mode = dto.mode;
    const defaults = mode === PlatformAvailabilityMode.live ? null : DEFAULTS[mode];
    const title = mode === PlatformAvailabilityMode.live ? '' : (dto.title?.trim() || defaults!.title);
    const message = mode === PlatformAvailabilityMode.live ? '' : (dto.message?.trim() || defaults!.message);
    const supportEmail =
      dto.supportEmail?.trim() ||
      (await this.ensureRow()).supportEmail ||
      'support@propflow.app';

    const row = await this.prisma.platformAvailability.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        mode,
        title,
        message,
        supportEmail,
        updatedBy: actor.sub,
      },
      update: {
        mode,
        title,
        message,
        supportEmail,
        updatedBy: actor.sub,
      },
    });

    const state = this.present(row);
    this.realtime.broadcastAvailability(state);

    let notificationsQueued = 0;
    const notifyUsers = dto.notifyUsers !== false;
    const enteringGate =
      (mode === PlatformAvailabilityMode.maintenance || mode === PlatformAvailabilityMode.coming_soon) &&
      previous.mode !== mode;
    if (notifyUsers && enteringGate) {
      notificationsQueued = await this.notifyCompanyUsers(title, message, mode);
    }

    this.logger.success(
      `Platform availability set to ${mode} by ${actor.sub}`,
      PlatformAvailabilityService.name,
    );
    return { ...state, notificationsQueued };
  }

  private async notifyCompanyUsers(
    title: string,
    message: string,
    mode: PlatformAvailabilityMode,
  ): Promise<number> {
    const users = await this.prisma.user.findMany({
      where: {
        status: 'active',
        role: { not: 'platform_admin' },
        email: { not: '' },
      },
      select: { id: true, orgId: true },
      take: 500,
    });

    let queued = 0;
    for (const user of users) {
      if (!user.orgId) continue;
      try {
        await this.notifications.queueEmail(user.orgId, user.id, `platform_${mode}`, {
          message: `${title}\n\n${message}`,
          title,
        });
        queued += 1;
      } catch {
        // continue — availability update should not fail on notify errors
      }
    }
    return queued;
  }

  private async ensureRow() {
    const existing = await this.prisma.platformAvailability.findUnique({
      where: { id: 'default' },
    });
    if (existing) return existing;
    return this.prisma.platformAvailability.create({
      data: {
        id: 'default',
        mode: PlatformAvailabilityMode.live,
        title: '',
        message: '',
        supportEmail: 'support@propflow.app',
      },
    });
  }

  private present(row: {
    mode: PlatformAvailabilityMode;
    title: string;
    message: string;
    supportEmail: string | null;
    updatedAt: Date;
    updatedBy: string | null;
  }): PlatformAvailabilityState {
    const mode = PLATFORM_AVAILABILITY_MODES.includes(row.mode) ? row.mode : PlatformAvailabilityMode.live;
    if (mode === PlatformAvailabilityMode.live) {
      return {
        mode: PlatformAvailabilityMode.live,
        title: '',
        message: '',
        supportEmail: row.supportEmail,
        updatedAt: row.updatedAt.toISOString(),
        updatedBy: row.updatedBy,
      };
    }
    const defaults = DEFAULTS[mode];
    return {
      mode,
      title: row.title.trim() || defaults.title,
      message: row.message.trim() || defaults.message,
      supportEmail: row.supportEmail,
      updatedAt: row.updatedAt.toISOString(),
      updatedBy: row.updatedBy,
    };
  }
}
