import { Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { jwtUserFromRequest } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@Req() req: { user?: JwtUser }, @Query() query: PaginationQueryDto) {
    const user = jwtUserFromRequest(req);
    return this.notificationsService.list(user.orgId, user.sub, query);
  }

  @Patch(':id/read')
  markRead(@Req() req: { user?: JwtUser }, @Param('id') id: string) {
    const user = jwtUserFromRequest(req);
    return this.notificationsService.markRead(user.orgId, user.sub, id);
  }
}
