import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AppLogger } from '../../common/logger/app-logger.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { MailService } from '../../common/mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  constructor(
    private readonly logger: AppLogger,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<{ type: string; payload: { notificationId?: string; payload?: unknown } }>): Promise<void> {
    this.logger.info(
      `Processing notification job ${job.id}: ${job.name}`,
      NotificationsProcessor.name,
    );
    const notificationId = job.data?.payload?.notificationId;
    if (!notificationId) return;

    const notification = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) return;

    if (notification.channel === 'email' && notification.userId) {
      const user = await this.prisma.user.findUnique({ where: { id: notification.userId } });
      if (user?.email) {
        await this.mail.send(
          user.email,
          `PropFlow · ${notification.type}`,
          JSON.stringify(notification.payloadJson, null, 2),
        );
      }
    }

    await this.notifications.markSent(notificationId);
  }
}
