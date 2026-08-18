import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AppLogger } from '../../common/logger/app-logger.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  constructor(
    private readonly logger: AppLogger,
    private readonly notifications: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<{ type: string; payload: { notificationId?: string } }>): Promise<void> {
    this.logger.info(
      `Processing notification job ${job.id}: ${job.name}`,
      NotificationsProcessor.name,
    );
    const notificationId = job.data?.payload?.notificationId;
    if (notificationId) {
      await this.notifications.markSent(notificationId);
    }
  }
}
