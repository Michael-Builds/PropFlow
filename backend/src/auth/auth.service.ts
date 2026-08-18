import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { AppLogger } from '../common/logger/app-logger.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {}

  async login(payload: LoginDto) {
    const user = await this.usersService.findByEmail(payload.email);
    if (!user) {
      this.logger.warning(
        `Failed login for ${payload.email}: user not found`,
        AuthService.name,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isValid) {
      this.logger.warning(
        `Failed login for ${payload.email}: invalid password`,
        AuthService.name,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const claims = {
      sub: user.id,
      orgId: user.orgId,
      role: user.role,
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(claims, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.getOrThrow<number>('JWT_ACCESS_TTL'),
    });
    const refreshToken = await this.jwtService.signAsync(claims, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow<number>('JWT_REFRESH_TTL'),
    });

    this.logger.success(
      `User ${user.id} signed in with role ${user.role}`,
      AuthService.name,
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.getOrThrow<number>('JWT_ACCESS_TTL'),
      user: {
        id: user.id,
        role: user.role,
        orgId: user.orgId,
      },
    };
  }
}
