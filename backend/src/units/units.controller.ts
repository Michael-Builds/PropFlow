import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { ListUnitsQueryDto } from './dto/list-units-query.dto';

@ApiTags('units')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager')
@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  list(@CurrentUser() user: JwtUser, @Query() query: ListUnitsQueryDto) {
    return this.unitsService.list(user.orgId, query);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateUnitDto) {
    return this.unitsService.create(user.orgId, dto);
  }

  @Get(':id')
  get(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.unitsService.getById(user.orgId, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateUnitDto) {
    return this.unitsService.update(user.orgId, id, dto);
  }
}
