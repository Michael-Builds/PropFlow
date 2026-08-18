import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/client';

export type JwtUser = {
  sub: string;
  orgId: string;
  role: UserRole;
  email: string;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUser => {
    return ctx.switchToHttp().getRequest().user as JwtUser;
  },
);
