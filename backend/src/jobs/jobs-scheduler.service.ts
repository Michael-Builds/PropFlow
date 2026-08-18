import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentsService } from '../documents/documents.service';
import { InvoicesService } from '../invoices/invoices.service';
import { AppLogger } from '../common/logger/app-logger.service';

@Injectable()
export class JobsSchedulerService implements OnModuleInit {
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly documents: DocumentsService,
    private readonly invoices: InvoicesService,
    private readonly logger: AppLogger,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.runDailyJobs();
    }, 24 * 60 * 60 * 1000);
  }

  async runDailyJobs() {
    const orgs = await this.prisma.organization.findMany({
      where: { status: 'active' },
      select: { id: true },
    });
    for (const org of orgs) {
      try {
        await this.documents.runExpiryAlerts(org.id);
        await this.invoices.runReminders(org.id);
        await this.invoices.snapshotArrears(org.id);
      } catch (error) {
        this.logger.warning(
          `Scheduled job failed for org ${org.id}: ${error instanceof Error ? error.message : 'unknown'}`,
          JobsSchedulerService.name,
        );
      }
    }
  }
}
