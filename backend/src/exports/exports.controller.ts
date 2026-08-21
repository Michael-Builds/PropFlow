import { Controller, Get, Header, Param, Res, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrgId } from '../auth/decorators/org-id.decorator';
import { ExportsService } from './exports.service';

@ApiTags('exports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager', 'finance')
@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('csv/:resource')
  @Header('Content-Type', 'text/csv')
  async csv(@OrgId() orgId: string, @Param('resource') resource: string) {
    const file = await this.exportsService.csv(orgId, resource);
    return file.body;
  }

  @Get('pdf/:resource')
  async pdf(
    @OrgId() orgId: string,
    @Param('resource') resource: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.exportsService.pdf(orgId, resource);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${file.filename}"`,
    });
    return new StreamableFile(file.body);
  }
}
