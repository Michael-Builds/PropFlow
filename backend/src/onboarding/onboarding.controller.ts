import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, type JwtUser } from '../auth/decorators/current-user.decorator';
import { OnboardingService } from './onboarding.service';
import { OnboardingProfileDto } from './dto/onboarding-profile.dto';
import { OnboardingPasswordDto } from './dto/onboarding-password.dto';
import { OnboardingFirstPropertyDto } from './dto/onboarding-first-property.dto';

@ApiTags('onboarding')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager', 'finance', 'vendor', 'tenant')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get('status')
  status(@CurrentUser() user: JwtUser) {
    return this.onboarding.status(user);
  }

  @Post('password')
  setPassword(@CurrentUser() user: JwtUser, @Body() dto: OnboardingPasswordDto) {
    return this.onboarding.setPassword(user, dto);
  }

  @Post('profile')
  @Roles('owner')
  saveProfile(@CurrentUser() user: JwtUser, @Body() dto: OnboardingProfileDto) {
    return this.onboarding.saveProfile(user, dto);
  }

  @Post('first-property')
  @Roles('owner')
  addFirstProperty(@CurrentUser() user: JwtUser, @Body() dto: OnboardingFirstPropertyDto) {
    return this.onboarding.addFirstProperty(user, dto);
  }

  @Post('complete')
  @Roles('owner')
  complete(@CurrentUser() user: JwtUser) {
    return this.onboarding.complete(user);
  }
}
