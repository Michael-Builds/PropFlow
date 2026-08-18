import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { OrgId } from '../auth/decorators/org-id.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: JwtUser) {
    return this.usersService.findById(user.sub).then((row) =>
      row ? this.usersService.present(row) : null,
    );
  }

  @Get()
  @Roles('owner', 'manager')
  list(@OrgId() orgId: string, @Query() query: ListUsersQueryDto) {
    return this.usersService.list(orgId, query);
  }

  @Post()
  @Roles('owner', 'manager')
  create(@CurrentUser() user: JwtUser, @OrgId() orgId: string, @Body() dto: CreateUserDto) {
    return this.usersService.createInOrg(user, orgId, dto);
  }

  @Get(':id')
  @Roles('owner', 'manager')
  get(@OrgId() orgId: string, @Param('id') id: string) {
    return this.usersService.getById(orgId, id);
  }

  @Patch(':id')
  @Roles('owner', 'manager')
  update(
    @CurrentUser() user: JwtUser,
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateInOrg(user, orgId, id, dto);
  }
}
