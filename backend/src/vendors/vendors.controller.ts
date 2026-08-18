import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrgId } from '../auth/decorators/org-id.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

@ApiTags('vendors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager')
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  list(@OrgId() orgId: string, @Query() query: PaginationQueryDto) {
    return this.vendorsService.list(orgId, query);
  }

  @Post()
  create(@OrgId() orgId: string, @Body() dto: CreateVendorDto) {
    return this.vendorsService.create(orgId, dto);
  }

  @Get(':id')
  get(@OrgId() orgId: string, @Param('id') id: string) {
    return this.vendorsService.getById(orgId, id);
  }

  @Patch(':id')
  update(@OrgId() orgId: string, @Param('id') id: string, @Body() dto: UpdateVendorDto) {
    return this.vendorsService.update(orgId, id, dto);
  }
}
