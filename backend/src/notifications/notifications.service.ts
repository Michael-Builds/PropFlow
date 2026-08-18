import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JobsService } from '../jobs/jobs.service';
import { AppLogger } from '../common/logger/app-logger.service';
import { pageArgs, pageResult } from '../common/pagination';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobsService: JobsService,
    private readonly logger: AppLogger,
  ) {}

  async list(orgId: string, userId: string, query: PaginationQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query.page, query.pageSize);
    const where: Prisma.NotificationWhereInput = { orgId, userId };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where }),
    ]);
    return pageResult(page, pageSize, total, rows);
  }

  async markRead(orgId: string, userId: string, id: string) {
    const row = await this.prisma.notification.findFirst({ where: { id, orgId, userId } });
    if (!row) throw new NotFoundException('Notification not found.');
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: row.readAt ?? new Date() },
    });
  }

  async queueEmail(orgId: string, userId: string | null, type: string, payload: unknown) {
    const notification = await this.prisma.notification.create({
      data: {
        orgId,
        userId,
        channel: 'email',
        type,
        payloadJson: payload as object,
        status: 'queued',
      },
    });

    await this.jobsService.enqueueNotification(type, {
      notificationId: notification.id,
      payload,
    });
    this.logger.success(
      `Queued email notification ${notification.id} (${type})`,
      NotificationsService.name,
    );
    return notification;
  }

  async markSent(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'sent', sentAt: new Date() },
    });
  }
}
