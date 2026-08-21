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
    const rendered = renderNotification(notification.type, payload, this.mail.frontendUrl());

    try {
      await this.mail.sendTemplate(
        user.email,
        'notification',
        rendered.subject,
        {
          preheader: rendered.preheader,
          title: rendered.title,
          message: rendered.message,
          invoiceId: payload.invoiceId ?? null,
          amount: payload.amount ?? null,
          orgName: payload.orgName ?? null,
          docType: payload.docType ?? null,
          mode: payload.mode ?? null,
          actionUrl: rendered.actionUrl,
          actionLabel: rendered.actionLabel,
        },
        rendered.text,
      );
      await this.notifications.markSent(notificationId);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Mail transport failed';
      await this.notifications.markFailed(notificationId, reason);
      throw error;
    }
  }
}

function renderNotification(
  type: string,
  payload: Record<string, unknown>,
  frontendUrl: string,
): {
  subject: string;
  title: string;
  message: string;
  preheader: string;
  text: string;
  actionUrl: string;
  actionLabel: string;
} {
  const title =
    String(payload.title ?? '').trim() ||
    type.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const message = String(payload.message ?? payload.docType ?? '').trim();
  const actionUrl = String(payload.actionUrl ?? frontendUrl);
  const actionLabel = String(payload.actionLabel ?? 'Open PropFlow');
  const lines = [
    'PropFlow notification',
    '',
    title,
    message || null,
    payload.invoiceId ? `Invoice: ${payload.invoiceId}` : null,
    payload.amount != null ? `Amount: ${payload.amount}` : null,
    payload.orgName ? `Company: ${payload.orgName}` : null,
    '',
    `Open PropFlow: ${actionUrl}`,
  ].filter((line): line is string => line != null);

  return {
    subject: `PropFlow · ${title}`,
    title,
    message,
    preheader: message || title,
    text: lines.join('\n'),
    actionUrl,
    actionLabel,
  };
}
