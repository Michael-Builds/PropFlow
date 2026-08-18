import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService, randomPassword } from '../users/users.service';
import { pageArgs, pageResult } from '../common/pagination';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class PlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  async listOrganizations(query: PaginationQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query.page, query.pageSize);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          _count: { select: { users: true, properties: true } },
        },
      }),
      this.prisma.organization.count(),
    ]);
    return pageResult(
      page,
      pageSize,
      total,
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        status: row.status,
        users: row._count.users,
        properties: row._count.properties,
        createdAt: row.createdAt,
      })),
    );
  }

  async getOrganization(id: string) {
    const row = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, email: true, fullName: true, role: true, status: true } },
        _count: { select: { properties: true } },
      },
    });
    if (!row) throw new NotFoundException('Organisation not found.');
    return {
      id: row.id,
      name: row.name,
      status: row.status,
      properties: row._count.properties,
      users: row.users,
      createdAt: row.createdAt,
    };
  }

  async createOrganization(actor: JwtUser, dto: CreateOrganizationDto) {
    const password = dto.ownerPassword?.trim() || randomPassword();
    const org = await this.prisma.organization.create({
      data: { name: dto.name.trim(), status: 'active' },
    });
    const owner = await this.users.createInOrg(actor, org.id, {
      email: dto.ownerEmail,
      fullName: dto.ownerFullName,
      role: 'owner',
      password,
    });
    return { organization: { id: org.id, name: org.name, status: org.status }, owner };
  }

  updateOrganization(id: string, dto: UpdateOrganizationDto) {
    return this.prisma.organization.update({
      where: { id },
      data: {
        ...(dto.name != null ? { name: dto.name } : {}),
        ...(dto.status != null ? { status: dto.status } : {}),
      },
    });
  }

  addOrgUser(actor: JwtUser, orgId: string, dto: CreateUserDto) {
    return this.users.createInOrg(actor, orgId, dto);
  }
}
