import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrgId, withOrg } from '../auth/decorators/org-id.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { ResolveTicketDto } from './dto/resolve-ticket.dto';
import { AddTicketAttachmentDto } from './dto/add-ticket-attachment.dto';

@ApiTags('tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @Roles('owner', 'manager', 'vendor', 'tenant')
  list(@CurrentUser() user: JwtUser, @OrgId() orgId: string, @Query() query: ListTicketsQueryDto) {
    return this.ticketsService.list(withOrg(user, orgId), query);
  }

  @Post()
  @Roles('owner', 'manager', 'tenant')
  create(@CurrentUser() user: JwtUser, @OrgId() orgId: string, @Body() dto: CreateTicketDto) {
    return this.ticketsService.create(withOrg(user, orgId), dto);
  }

  @Get(':id')
  @Roles('owner', 'manager', 'vendor', 'tenant')
  get(@CurrentUser() user: JwtUser, @OrgId() orgId: string, @Param('id') id: string) {
    return this.ticketsService.getById(withOrg(user, orgId), id);
  }

  @Patch(':id')
  @Roles('owner', 'manager', 'vendor')
  update(@CurrentUser() user: JwtUser, @OrgId() orgId: string, @Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.ticketsService.update(withOrg(user, orgId), id, dto);
  }

  @Post(':id/assign')
  @Roles('owner', 'manager')
  assign(@CurrentUser() user: JwtUser, @OrgId() orgId: string, @Param('id') id: string, @Body() dto: AssignTicketDto) {
    return this.ticketsService.assign(withOrg(user, orgId), id, dto);
  }

  @Post(':id/resolve')
  @Roles('owner', 'manager', 'vendor')
  resolve(@CurrentUser() user: JwtUser, @OrgId() orgId: string, @Param('id') id: string, @Body() dto: ResolveTicketDto) {
    return this.ticketsService.resolve(withOrg(user, orgId), id, dto);
  }

  @Post(':id/close')
  @Roles('owner', 'manager')
  close(@CurrentUser() user: JwtUser, @OrgId() orgId: string, @Param('id') id: string) {
    return this.ticketsService.close(withOrg(user, orgId), id);
  }

  @Get(':id/attachments')
  @Roles('owner', 'manager', 'vendor', 'tenant')
  listAttachments(@CurrentUser() user: JwtUser, @OrgId() orgId: string, @Param('id') id: string) {
    return this.ticketsService.listAttachments(withOrg(user, orgId), id);
  }

  @Post(':id/attachments')
  @Roles('owner', 'manager', 'vendor', 'tenant')
  addAttachment(
    @CurrentUser() user: JwtUser,
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: AddTicketAttachmentDto,
  ) {
    return this.ticketsService.addAttachment(withOrg(user, orgId), id, dto);
  }
}
