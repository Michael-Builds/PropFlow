import { Controller, Get, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrgId } from '../auth/decorators/org-id.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager', 'finance', 'vendor', 'tenant', 'platform_admin')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  summary(@OrgId() orgId: string) {
    return this.dashboardService.summary(orgId);
  }

  @Get('collections')
  collections(@OrgId() orgId: string) {
    return this.dashboardService.collections(orgId);
  }

  @Get('maintenance')
  maintenance(@OrgId() orgId: string) {
    return this.dashboardService.maintenance(orgId);
  }

  @Get('overview')
  overview(@CurrentUser() user: JwtUser) {
    if (user.role === 'platform_admin') {
      return this.dashboardService.platformOverview();
    }
    if (!user.orgId) {
      throw new BadRequestException('Organisation required.');
    }
    return this.dashboardService.overview(user.orgId);
  }
}
