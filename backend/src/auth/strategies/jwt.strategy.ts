import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      algorithms: ['HS256'],
    });
  }

  validate(payload: {
    sub: string;
    orgId: string | null;
    role: string;
    email: string;
    tenantId?: string | null;
    vendorId?: string | null;
  }) {
    return {
      sub: payload.sub,
      orgId: payload.orgId ?? null,
      role: payload.role,
      email: payload.email,
      tenantId: payload.tenantId ?? null,
      vendorId: payload.vendorId ?? null,
    };
  }
}
