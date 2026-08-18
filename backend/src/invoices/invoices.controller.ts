import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
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
  list(@CurrentUser() user: JwtUser, @Query() query: ListInvoicesQueryDto) {
    const tenantId = user.role === 'tenant' ? user.tenantId ?? 'none' : query.tenantId;
    return this.invoicesService.list(user.orgId, { ...query, tenantId });
  }

  @Get('arrears')
  @Roles('owner', 'manager', 'finance')
  arrears(@CurrentUser() user: JwtUser) {
    return this.invoicesService.arrears(user.orgId);
  }

  @Post('generate')
  @Roles('owner', 'manager', 'finance')
  generate(@CurrentUser() user: JwtUser, @Body() dto: GenerateInvoiceDto) {
    return this.invoicesService.generate(user.orgId, dto);
  }

  @Post('generate-due')
  @Roles('owner', 'manager', 'finance')
  generateDue(@CurrentUser() user: JwtUser) {
    return this.invoicesService.generateDue(user.orgId);
  }

  @Get(':id')
  @Roles('owner', 'manager', 'finance', 'tenant')
  get(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.invoicesService.getById(
      user.orgId,
      id,
      user.role === 'tenant' ? user.tenantId : undefined,
    );
  }

  @Patch(':id')
  @Roles('owner', 'manager', 'finance')
  update(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoicesService.update(user.orgId, id, dto);
  }
}
