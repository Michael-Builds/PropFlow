import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { THROTTLE_SKIP_ALL } from '../common/throttler/throttle.constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { PlatformAvailabilityService } from './platform-availability.service';
import { UpdatePlatformAvailabilityDto } from './dto/update-platform-availability.dto';

@ApiTags('platform-availability')
@Controller('platform/availability')
export class PlatformAvailabilityController {
  constructor(private readonly availability: PlatformAvailabilityService) {}

  @Get()
  @SkipThrottle(THROTTLE_SKIP_ALL)
  get() {
    return this.availability.get();
  }

  @Patch()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin')
  update(@CurrentUser() user: JwtUser, @Body() dto: UpdatePlatformAvailabilityDto) {
    return this.availability.update(user, dto);
  }
}
