import { UnauthorizedException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/client';

export type JwtUser = {
  sub: string;
  orgId: string | null;
  role: UserRole;
  email: string;
  tenantId?: string | null;
  vendorId?: string | null;
};

export function jwtUserFromRequest(req: { user?: JwtUser | null }): JwtUser {
  const user = req.user;
  if (!user?.sub) {
    throw new UnauthorizedException('Authentication required.');
  }
  return user;
}

export function isPlatformAdmin(user: Pick<JwtUser, 'role'> | null | undefined): boolean {
  return user?.role === 'platform_admin';
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUser => {
    return jwtUserFromRequest(ctx.switchToHttp().getRequest());
  },
);
