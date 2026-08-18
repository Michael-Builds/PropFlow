import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AppLogger } from '../common/logger/app-logger.service';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
    private readonly logger: AppLogger,
  ) {}

  enqueueNotification(type: string, payload: unknown) {
    this.logger.info(`Queued notification job: ${type}`, JobsService.name);
    return this.notificationsQueue.add(type, { type, payload });
  }
}
