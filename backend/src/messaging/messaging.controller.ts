import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { MessagingService } from './messaging.service';
import { CreateConversationDto, SendMessageDto } from './dto/messaging.dto';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('messages')
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  @Get()
  @Roles('platform_admin', 'owner', 'manager', 'tenant')
  list(@CurrentUser() user: JwtUser) {
    return this.messaging.list(user);
  }

  @Post()
  @Roles('platform_admin', 'owner', 'manager', 'tenant')
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateConversationDto) {
    return this.messaging.create(user, dto);
  }

  @Get(':id')
  @Roles('platform_admin', 'owner', 'manager', 'tenant')
  get(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.messaging.get(user, id);
  }

  @Post(':id/messages')
  @Roles('platform_admin', 'owner', 'manager', 'tenant')
  send(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.messaging.send(user, id, dto);
  }

  @Patch(':id/close')
  @Roles('platform_admin', 'owner', 'manager')
  close(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.messaging.close(user, id);
  }
}
