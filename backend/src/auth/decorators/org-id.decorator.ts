import { BadRequestException, ForbiddenException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { isPlatformAdmin, type JwtUser } from './current-user.decorator';

/**
 * Resolves the company org for org-scoped routes.
 * Platform admins are not attached to a company and must not impersonate one.
 */
export const OrgId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest();
  const user = req.user as JwtUser | undefined;
  if (!user) throw new BadRequestException('Authentication required.');

  if (isPlatformAdmin(user)) {
    throw new ForbiddenException('Platform operators use platform endpoints, not company-scoped data.');
  }

  const header = req.headers['x-org-id'];
  const fromHeader = Array.isArray(header) ? header[0] : header;
  const orgId = user.orgId || String(fromHeader || '').trim();
  if (!orgId) {
    throw new BadRequestException('User is not attached to an organisation.');
  }
  return orgId;
});

export type OrgScopedUser = JwtUser & { orgId: string };

export function withOrg(user: JwtUser, orgId: string): OrgScopedUser {
  return { ...user, orgId };
}
