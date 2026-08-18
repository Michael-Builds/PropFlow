import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../generated/prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtUser } from '../decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;
    const user = context.switchToHttp().getRequest().user as JwtUser | undefined;
    return !!user && roles.includes(user.role);
  }
}
