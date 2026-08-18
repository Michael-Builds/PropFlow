import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AuditLogsService } from './audit-logs.service';

@ApiTags('audit-logs')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.auditLogsService.list('org_demo', query.page, query.pageSize);
  }
}
