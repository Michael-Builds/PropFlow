import { Module } from '@nestjs/common';
import { JobsSchedulerService } from '../jobs/jobs-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [PrismaModule, InvoicesModule, DocumentsModule],
  providers: [JobsSchedulerService],
})
export class ScheduledJobsModule {}
