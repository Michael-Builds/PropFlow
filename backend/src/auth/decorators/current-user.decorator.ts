import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/client';

export type JwtUser = {
  sub: string;
  orgId: string | null;
  role: UserRole;
  email: string;
  tenantId?: string | null;
  vendorId?: string | null;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUser => {
    return ctx.switchToHttp().getRequest().user as JwtUser;
  },
);
