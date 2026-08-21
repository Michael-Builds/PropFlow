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

  async process(
    job: Job<{ type: string; payload: { notificationId?: string; payload?: unknown } }>,
  ): Promise<void> {
    this.logger.info(
      `Processing notification job ${job.id}: ${job.name}`,
      NotificationsProcessor.name,
    );
    const notificationId = job.data?.payload?.notificationId;
    if (!notificationId) return;

    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) return;

    if (notification.channel !== 'email') {
      await this.notifications.markSent(notificationId);
      return;
    }

    if (!notification.userId) {
      await this.notifications.markFailed(notificationId, 'No recipient user on notification.');
      return;
    }

    const user = await this.prisma.user.findUnique({ where: { id: notification.userId } });
    if (!user?.email) {
      await this.notifications.markFailed(notificationId, 'Recipient has no email address.');
      return;
    }

    const payload = (notification.payloadJson ?? {}) as Record<string, unknown>;
    const { subject, text } = renderEmail(notification.type, payload);

    try {
      await this.mail.send(user.email, subject, text);
      await this.notifications.markSent(notificationId);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Mail transport failed';
      await this.notifications.markFailed(notificationId, reason);
      throw error;
    }
  }
}

function renderEmail(
  type: string,
  payload: Record<string, unknown>,
): { subject: string; text: string } {
  const title = type.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const message = String(payload.message ?? payload.docType ?? '');
  const lines = [
    `PropFlow notification`,
    ``,
    title,
    message ? message : null,
    payload.invoiceId ? `Invoice: ${payload.invoiceId}` : null,
    payload.amount != null ? `Amount: ${payload.amount}` : null,
    payload.orgName ? `Company: ${payload.orgName}` : null,
    ``,
    `Sign in to PropFlow for details.`,
  ].filter((line): line is string => line != null);

  return {
    subject: `PropFlow · ${title}`,
    text: lines.join('\n'),
  };
}
