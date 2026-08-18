import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { LeasesService } from './leases.service';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';
import { ListLeasesQueryDto } from './dto/list-leases-query.dto';
import { RenewLeaseDto } from './dto/renew-lease.dto';
import { TerminateLeaseDto } from './dto/terminate-lease.dto';

@ApiTags('leases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leases')
export class LeasesController {
  constructor(private readonly leasesService: LeasesService) {}

  @Get()
  @Roles('owner', 'manager', 'finance', 'tenant')
  list(@CurrentUser() user: JwtUser, @Query() query: ListLeasesQueryDto) {
    const tenantId = user.role === 'tenant' ? user.tenantId ?? undefined : query.tenantId;
    return this.leasesService.list(user.orgId, { ...query, tenantId });
  }

  @Post()
  @Roles('owner', 'manager')
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateLeaseDto) {
    return this.leasesService.create(user.orgId, dto);
  }

  @Get(':id')
  @Roles('owner', 'manager', 'finance', 'tenant')
  get(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.leasesService.getById(user.orgId, id);
  }

  @Patch(':id')
  @Roles('owner', 'manager')
  update(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateLeaseDto) {
    return this.leasesService.update(user.orgId, id, dto);
  }

  @Post(':id/renew')
  @Roles('owner', 'manager')
  renew(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: RenewLeaseDto) {
    return this.leasesService.renew(user.orgId, id, dto);
  }

  @Post(':id/terminate')
  @Roles('owner', 'manager')
  terminate(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: TerminateLeaseDto) {
    return this.leasesService.terminate(user.orgId, id, dto);
  }
}
