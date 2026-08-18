import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { ResolveTicketDto } from './dto/resolve-ticket.dto';

@ApiTags('tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @Roles('owner', 'manager', 'vendor', 'tenant')
  list(@CurrentUser() user: JwtUser, @Query() query: ListTicketsQueryDto) {
    return this.ticketsService.list(user, query);
  }

  @Post()
  @Roles('owner', 'manager', 'tenant')
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateTicketDto) {
    return this.ticketsService.create(user, dto);
  }

  @Get(':id')
  @Roles('owner', 'manager', 'vendor', 'tenant')
  get(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.ticketsService.getById(user, id);
  }

  @Patch(':id')
  @Roles('owner', 'manager', 'vendor')
  update(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.ticketsService.update(user, id, dto);
  }

  @Post(':id/assign')
  @Roles('owner', 'manager')
  assign(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: AssignTicketDto) {
    return this.ticketsService.assign(user, id, dto);
  }

  @Post(':id/resolve')
  @Roles('owner', 'manager', 'vendor')
  resolve(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: ResolveTicketDto) {
    return this.ticketsService.resolve(user, id, dto);
  }

  @Post(':id/close')
  @Roles('owner', 'manager')
  close(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.ticketsService.close(user, id);
  }
}
