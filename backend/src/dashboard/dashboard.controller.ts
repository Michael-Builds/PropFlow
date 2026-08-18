import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrgId } from '../auth/decorators/org-id.decorator';
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
  overview(@OrgId() orgId: string) {
    return this.dashboardService.overview(orgId);
  }
}
