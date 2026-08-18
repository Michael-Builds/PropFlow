import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ListTenantsQueryDto } from './dto/list-tenants-query.dto';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @Roles('owner', 'manager')
  list(@CurrentUser() user: JwtUser, @Query() query: ListTenantsQueryDto) {
    return this.tenantsService.list(user.orgId, query);
  }

  @Post()
  @Roles('owner', 'manager')
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateTenantDto) {
    return this.tenantsService.create(user.orgId, dto);
  }

  @Get(':id')
  @Roles('owner', 'manager', 'finance', 'tenant')
  get(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    const scopedId = user.role === 'tenant' && user.tenantId ? user.tenantId : id;
    return this.tenantsService.getById(user.orgId, scopedId);
  }

  @Patch(':id')
  @Roles('owner', 'manager')
  update(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(user.orgId, id, dto);
  }
}
