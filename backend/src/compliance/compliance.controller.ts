import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrgId } from '../auth/decorators/org-id.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EntityType } from '../generated/prisma/client';
import { ComplianceService } from './compliance.service';
import { UpsertComplianceRuleDto } from './dto/upsert-compliance-rule.dto';

@ApiTags('compliance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly compliance: ComplianceService) {}

  @Get('rules')
  @Roles('owner', 'manager')
  listRules(@OrgId() orgId: string) {
    return this.compliance.listRules(orgId);
  }

  @Post('rules')
  @Roles('owner', 'manager')
  upsert(@OrgId() orgId: string, @Body() dto: UpsertComplianceRuleDto) {
    return this.compliance.upsert(orgId, dto);
  }

  @Delete('rules/:id')
  @Roles('owner', 'manager')
  remove(@OrgId() orgId: string, @Param('id') id: string) {
    return this.compliance.remove(orgId, id);
  }

  @Get('score')
  @Roles('owner', 'manager', 'finance')
  score(@OrgId() orgId: string) {
    return this.compliance.orgScore(orgId);
  }

  @Get('gaps/:entityType/:entityId')
  @Roles('owner', 'manager')
  gaps(
    @OrgId() orgId: string,
    @Param('entityType') entityType: EntityType,
    @Param('entityId') entityId: string,
  ) {
    return this.compliance.evaluateEntity(orgId, entityType, entityId);
  }
}
