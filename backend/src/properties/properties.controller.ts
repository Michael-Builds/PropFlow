import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto';

@ApiTags('properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  list(@CurrentUser() user: JwtUser, @Query() query: ListPropertiesQueryDto) {
    return this.propertiesService.list(user.orgId, query);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(user.orgId, dto);
  }

  @Get(':id')
  get(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.propertiesService.getById(user.orgId, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdatePropertyDto) {
    return this.propertiesService.update(user.orgId, id, dto);
  }
}
