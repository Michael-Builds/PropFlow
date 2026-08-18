import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager', 'finance')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  summary(@CurrentUser() user: JwtUser) {
    return this.dashboardService.summary(user.orgId);
  }

  @Get('collections')
  collections(@CurrentUser() user: JwtUser) {
    return this.dashboardService.collections(user.orgId);
  }

  @Get('maintenance')
  maintenance(@CurrentUser() user: JwtUser) {
    return this.dashboardService.maintenance(user.orgId);
  }
}
