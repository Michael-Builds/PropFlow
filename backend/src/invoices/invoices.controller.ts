import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrgId } from '../auth/decorators/org-id.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { InvoicesService } from './invoices.service';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @Roles('owner', 'manager', 'finance', 'tenant')
  list(@OrgId() orgId: string, @CurrentUser() user: JwtUser, @Query() query: ListInvoicesQueryDto) {
    const tenantId = user.role === 'tenant' ? user.tenantId ?? 'none' : query.tenantId;
    return this.invoicesService.list(orgId, { ...query, tenantId });
  }

  @Get('arrears')
  @Roles('owner', 'manager', 'finance')
  arrears(@OrgId() orgId: string) {
    return this.invoicesService.arrears(orgId);
  }

  @Post('generate')
  @Roles('owner', 'manager', 'finance')
  generate(@OrgId() orgId: string, @Body() dto: GenerateInvoiceDto) {
    return this.invoicesService.generate(orgId, dto);
  }

  @Post('generate-due')
  @Roles('owner', 'manager', 'finance')
  generateDue(@OrgId() orgId: string) {
    return this.invoicesService.generateDue(orgId);
  }

  @Get(':id')
  @Roles('owner', 'manager', 'finance', 'tenant')
  get(@OrgId() orgId: string, @CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.invoicesService.getById(
      orgId,
      id,
      user.role === 'tenant' ? user.tenantId : undefined,
    );
  }

  @Patch(':id')
  @Roles('owner', 'manager', 'finance')
  update(@OrgId() orgId: string, @Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoicesService.update(orgId, id, dto);
  }
}
