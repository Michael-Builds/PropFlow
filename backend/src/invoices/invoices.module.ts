import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { ArrearsController } from './arrears.controller';
import { InvoicesService } from './invoices.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [InvoicesController, ArrearsController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
