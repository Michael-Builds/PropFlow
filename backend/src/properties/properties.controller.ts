import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrgId } from '../auth/decorators/org-id.decorator';
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
  list(@OrgId() orgId: string, @Query() query: ListPropertiesQueryDto) {
    return this.propertiesService.list(orgId, query);
  }

  @Post()
  create(@OrgId() orgId: string, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(orgId, dto);
  }

  @Get(':id')
  get(@OrgId() orgId: string, @Param('id') id: string) {
    return this.propertiesService.getById(orgId, id);
  }

  @Patch(':id')
  update(@OrgId() orgId: string, @Param('id') id: string, @Body() dto: UpdatePropertyDto) {
    return this.propertiesService.update(orgId, id, dto);
  }
}
