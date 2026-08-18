import { Controller, Get, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrgId } from '../auth/decorators/org-id.decorator';
import { isPlatformAdmin, jwtUserFromRequest } from '../auth/decorators/current-user.decorator';
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
  @Roles('owner', 'manager', 'finance', 'vendor', 'tenant')
  summary(@OrgId() orgId: string) {
    return this.dashboardService.summary(orgId);
  }

  @Get('collections')
  @Roles('owner', 'manager', 'finance', 'vendor', 'tenant')
  collections(@OrgId() orgId: string) {
    return this.dashboardService.collections(orgId);
  }

  @Get('maintenance')
  @Roles('owner', 'manager', 'finance', 'vendor', 'tenant')
  maintenance(@OrgId() orgId: string) {
    return this.dashboardService.maintenance(orgId);
  }

  @Get('platform')
  @Roles('platform_admin')
  platform() {
    return this.dashboardService.platformOverview();
  }

  @Get('overview')
  @Roles('owner', 'manager', 'finance', 'vendor', 'tenant', 'platform_admin')
  overview(@Req() req: { user?: JwtUser }) {
    const user = jwtUserFromRequest(req);
    if (isPlatformAdmin(user)) {
      return this.dashboardService.platformOverview();
    }
    if (!user.orgId) {
      throw new BadRequestException('Organisation required.');
    }
    return this.dashboardService.overview(user.orgId);
  }
}
