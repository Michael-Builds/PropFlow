import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AUTH_THROTTLE } from '../common/throttler/throttle.constants';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle(AUTH_THROTTLE)
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }
}
