import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobsService } from '../jobs/jobs.service';
import { AppLogger } from '../common/logger/app-logger.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobsService: JobsService,
    private readonly logger: AppLogger,
  ) {}

  async queueEmail(orgId: string, userId: string, type: string, payload: unknown) {
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
}
