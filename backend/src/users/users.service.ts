import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppLogger } from '../common/logger/app-logger.service';
import { MailService } from '../common/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { pageArgs, pageResult } from '../common/pagination';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

const ORG_ROLES = ['owner', 'manager', 'finance', 'vendor', 'tenant'] as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { organization: true },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { organization: true },
    });
  }

  present(user: {
    id: string;
    orgId: string | null;
    email: string;
    fullName: string | null;
    role: string;
    status: string;
    tenantId: string | null;
    vendorId: string | null;
    lastLoginAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      orgId: user.orgId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      tenantId: user.tenantId,
      vendorId: user.vendorId,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  async list(orgId: string, query: ListUsersQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query.page, query.pageSize);
    const where: Prisma.UserWhereInput = {
      orgId,
      ...(query.role ? { role: query.role as Prisma.EnumUserRoleFilter['equals'] } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.user.count({ where }),
    ]);
    return pageResult(page, pageSize, total, rows.map((row) => this.present(row)));
  }

  async getById(orgId: string, id: string) {
    const row = await this.prisma.user.findFirst({ where: { id, orgId } });
    if (!row) throw new NotFoundException('User not found.');
    return this.present(row);
  }

  async createInOrg(actor: JwtUser, orgId: string, dto: CreateUserDto) {
    this.assertCanAssign(actor, dto.role);
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('A user with this email already exists.');

    const password = dto.password?.trim() || randomPassword();
    const row = await this.prisma.user.create({
      data: {
        orgId,
        email,
        fullName: dto.fullName,
        role: dto.role,
        passwordHash: await bcrypt.hash(password, 10),
        status: 'active',
        tenantId: dto.tenantId,
        vendorId: dto.vendorId,
      },
    });

    const frontend = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:4200';
    await this.mail.send(
      email,
      'You have been added to PropFlow',
      [
        `Hello${dto.fullName ? ` ${dto.fullName}` : ''},`,
        '',
        `You now have ${dto.role} access in PropFlow.`,
        `Sign in at ${frontend}/auth/login`,
        `Email: ${email}`,
        `Temporary password: ${password}`,
        '',
        'Change this password after you sign in.',
      ].join('\n'),
    );

    this.logger.success(`User ${row.id} invited as ${row.role} in org ${orgId}`, UsersService.name);
    return { ...this.present(row), temporaryPassword: dto.password ? undefined : password };
  }

  async updateInOrg(actor: JwtUser, orgId: string, id: string, dto: UpdateUserDto) {
    const current = await this.prisma.user.findFirst({ where: { id, orgId } });
    if (!current) throw new NotFoundException('User not found.');
    if (dto.role) this.assertCanAssign(actor, dto.role);
    const row = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.fullName != null ? { fullName: dto.fullName } : {}),
        ...(dto.role != null ? { role: dto.role } : {}),
        ...(dto.status != null ? { status: dto.status } : {}),
        ...(dto.tenantId !== undefined ? { tenantId: dto.tenantId } : {}),
        ...(dto.vendorId !== undefined ? { vendorId: dto.vendorId } : {}),
      },
    });
    return this.present(row);
  }

  private assertCanAssign(actor: JwtUser, role: string) {
    if (!ORG_ROLES.includes(role as (typeof ORG_ROLES)[number])) {
      throw new BadRequestException('Invalid role.');
    }
    if (actor.role === 'platform_admin' || actor.role === 'owner') return;
    if (actor.role === 'manager' && (role === 'tenant' || role === 'vendor')) return;
    throw new ForbiddenException('You cannot assign this role.');
  }
}

export function randomPassword(): string {
  return randomBytes(9).toString('base64url').slice(0, 12);
}
