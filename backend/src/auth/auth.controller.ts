import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { AUTH_THROTTLE } from '../common/throttler/throttle.constants';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtUser } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle(AUTH_THROTTLE)
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }

  @Post('refresh')
  @Throttle(AUTH_THROTTLE)
  refresh(@Body() payload: RefreshTokenDto) {
    return this.authService.refresh(payload.refreshToken);
  }

  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser() user: JwtUser, @Body() payload: LogoutDto) {
    return this.authService.logout(user.sub, payload.refreshToken);
  }
}
