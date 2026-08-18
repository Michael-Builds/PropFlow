import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
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
  list(@CurrentUser() user: JwtUser, @Query() query: PaginationQueryDto) {
    return this.vendorsService.list(user.orgId, query);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateVendorDto) {
    return this.vendorsService.create(user.orgId, dto);
  }

  @Get(':id')
  get(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.vendorsService.getById(user.orgId, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateVendorDto) {
    return this.vendorsService.update(user.orgId, id, dto);
  }
}
