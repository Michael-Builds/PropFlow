import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtUser } from './current-user.decorator';

export const OrgId = createParamDecorator((required: boolean | undefined, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest();
  const user = req.user as JwtUser | undefined;
  if (!user) throw new BadRequestException('Authentication required.');

  if (user.role === 'platform_admin') {
    const header = req.headers['x-org-id'];
    const fromHeader = Array.isArray(header) ? header[0] : header;
    const orgId = String(fromHeader || req.query?.orgId || '').trim();
    if (!orgId && required !== false) {
      throw new BadRequestException('Select an organisation (x-org-id) to manage company data.');
    }
    return orgId;
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
