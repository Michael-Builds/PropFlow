import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator';
import { InvoicesService } from './invoices.service';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @Roles('owner', 'manager', 'finance')
  list(@CurrentUser() user: JwtUser, @Query() query: ListInvoicesQueryDto) {
    return this.invoicesService.list(user.orgId, query);
  }

  @Get('arrears')
  @Roles('owner', 'manager', 'finance')
  arrears(@CurrentUser() user: JwtUser) {
    return this.invoicesService.arrears(user.orgId);
  }

  @Get(':id')
  @Roles('owner', 'manager', 'finance', 'tenant')
  get(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.invoicesService.getById(user.orgId, id);
  }

  @Post('generate')
  @Roles('owner', 'manager', 'finance')
  generate(@CurrentUser() user: JwtUser, @Body() dto: GenerateInvoiceDto) {
    return this.invoicesService.generate(user.orgId, dto);
  }
}
