import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrgId } from '../auth/decorators/org-id.decorator';
import { InvoicesService } from './invoices.service';
import { PromiseToPayDto } from './dto/promise-to-pay.dto';
import { EscalateArrearsDto } from './dto/escalate-arrears.dto';

@ApiTags('arrears')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager', 'finance')
@Controller('arrears')
export class ArrearsController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  list(@OrgId() orgId: string) {
    return this.invoicesService.arrears(orgId);
  }

  @Post('reminders/run')
  runReminders(@OrgId() orgId: string) {
    return this.invoicesService.runReminders(orgId);
  }

  @Post('snapshots/run')
  snapshot(@OrgId() orgId: string) {
    return this.invoicesService.snapshotArrears(orgId);
  }

  @Post(':invoiceId/promise-to-pay')
  promiseToPay(@OrgId() orgId: string, @Param('invoiceId') invoiceId: string, @Body() dto: PromiseToPayDto) {
    return this.invoicesService.promiseToPay(orgId, invoiceId, dto);
  }

  @Post(':invoiceId/escalate')
  escalate(@OrgId() orgId: string, @Param('invoiceId') invoiceId: string, @Body() dto: EscalateArrearsDto) {
    return this.invoicesService.escalate(orgId, invoiceId, dto);
  }
}
