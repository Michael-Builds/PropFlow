import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PlatformService } from './platform.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

@ApiTags('platform')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('platform_admin')
@Controller('platform')
export class PlatformController {
  constructor(private readonly platform: PlatformService) {}

  @Get('organizations')
  list(@Query() query: PaginationQueryDto) {
    return this.platform.listOrganizations(query);
  }

  @Post('organizations')
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateOrganizationDto) {
    return this.platform.createOrganization(user, dto);
  }

  @Get('organizations/:id')
  get(@Param('id') id: string) {
    return this.platform.getOrganization(id);
  }

  @Patch('organizations/:id')
  update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.platform.updateOrganization(id, dto);
  }

  @Post('organizations/:id/users')
  addUser(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: CreateUserDto) {
    return this.platform.addOrgUser(user, id, dto);
  }
}
