import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { InvoicesService } from './invoices.service';

@ApiTags('arrears')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager', 'finance')
@Controller('arrears')
export class ArrearsController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  list(@CurrentUser() user: JwtUser) {
    return this.invoicesService.arrears(user.orgId);
  }

  @Post('reminders/run')
  runReminders(@CurrentUser() user: JwtUser) {
    return this.invoicesService.runReminders(user.orgId);
  }
}
