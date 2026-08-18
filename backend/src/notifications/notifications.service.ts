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

  async list(orgId: string | null, userId: string, query: PaginationQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query.page, query.pageSize);
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(orgId ? { orgId } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where }),
    ]);
    return pageResult(page, pageSize, total, rows.map((row) => this.present(row)));
  }

  async markRead(orgId: string | null, userId: string, id: string) {
    const row = await this.prisma.notification.findFirst({
      where: { id, userId, ...(orgId ? { orgId } : {}) },
    });
    if (!row) throw new NotFoundException('Notification not found.');
    const updated = await this.prisma.notification.update({
      where: { id },
      data: { readAt: row.readAt ?? new Date() },
    });
    return this.present(updated);
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

  present(row: {
    id: string;
    orgId: string;
    userId: string | null;
    channel: string;
    type: string;
    payloadJson: unknown;
    status: string;
    readAt: Date | null;
    sentAt: Date | null;
    createdAt: Date;
  }) {
    const payload = (row.payloadJson ?? {}) as Record<string, unknown>;
    return {
      id: row.id,
      title: prettyTitle(row.type),
      message: String(payload.message ?? payload.docType ?? row.type),
      type: row.type,
      read: !!row.readAt,
      createdAt: row.createdAt.toISOString(),
    };
  }
}

function prettyTitle(type: string): string {
  return type.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
