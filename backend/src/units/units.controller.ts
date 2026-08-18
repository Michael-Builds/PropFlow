import { Body, Controller, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrgId } from '../auth/decorators/org-id.decorator';
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { ListUnitsQueryDto } from './dto/list-units-query.dto';
import { ImportUnitsDto } from './dto/import-units.dto';

@ApiTags('units')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager')
@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  list(@OrgId() orgId: string, @Query() query: ListUnitsQueryDto) {
    return this.unitsService.list(orgId, query);
  }

  @Post()
  create(@OrgId() orgId: string, @Body() dto: CreateUnitDto) {
    return this.unitsService.create(orgId, dto);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  importCsv(
    @OrgId() orgId: string,
    @Body() dto: ImportUnitsDto,
    @UploadedFile() file?: { buffer: Buffer },
  ) {
    const csv = dto.csv || file?.buffer.toString('utf8') || '';
    return this.unitsService.importCsv(orgId, csv);
  }

  @Get(':id')
  get(@OrgId() orgId: string, @Param('id') id: string) {
    return this.unitsService.getById(orgId, id);
  }

  @Patch(':id')
  update(@OrgId() orgId: string, @Param('id') id: string, @Body() dto: UpdateUnitDto) {
    return this.unitsService.update(orgId, id, dto);
  }
}
