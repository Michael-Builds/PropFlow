import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppLogger } from '../common/logger/app-logger.service';
import { pageArgs, pageResult } from '../common/pagination';
import { decryptPii, encryptPii } from '../common/pii';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ListTenantsQueryDto } from './dto/list-tenants-query.dto';

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {}

  async list(orgId: string, query: ListTenantsQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query.page, query.pageSize);
    const where: Prisma.TenantWhereInput = {
      orgId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.kycStatus ? { kycStatus: query.kycStatus } : {}),
      ...(query.q
        ? {
            OR: [
              { fullName: { contains: query.q, mode: 'insensitive' } },
              { email: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.tenant.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.tenant.count({ where }),
    ]);
    return pageResult(page, pageSize, total, rows.map((row) => this.present(row)));
  }

  async getById(orgId: string, id: string) {
    const row = await this.prisma.tenant.findFirst({ where: { id, orgId } });
    if (!row) throw new NotFoundException('Tenant not found.');
    return this.present(row);
  }

  async create(orgId: string, dto: CreateTenantDto) {
    const row = await this.prisma.tenant.create({
      data: {
        orgId,
        fullName: dto.fullName,
        email: dto.email,
        phone: encryptPii(dto.phone),
        occupation: dto.occupation,
        emergencyContact: encryptPii(dto.emergencyContact),
        status: dto.status ?? 'active',
        kycStatus: dto.kycStatus ?? 'pending',
      },
    });
    this.logger.success(`Tenant ${row.id} created`, TenantsService.name);
    return this.present(row);
  }

  async update(orgId: string, id: string, dto: UpdateTenantDto) {
    await this.getById(orgId, id);
    const row = await this.prisma.tenant.update({
      where: { id },
      data: {
        ...(dto.fullName != null ? { fullName: dto.fullName } : {}),
        ...(dto.email != null ? { email: dto.email } : {}),
        ...(dto.phone !== undefined ? { phone: encryptPii(dto.phone) } : {}),
        ...(dto.occupation != null ? { occupation: dto.occupation } : {}),
        ...(dto.emergencyContact !== undefined
          ? { emergencyContact: encryptPii(dto.emergencyContact) }
          : {}),
        ...(dto.status != null ? { status: dto.status } : {}),
        ...(dto.kycStatus != null ? { kycStatus: dto.kycStatus } : {}),
      },
    });
    return this.present(row);
  }

  present(row: {
    id: string;
    orgId: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    occupation: string | null;
    emergencyContact: string | null;
    status: string;
    kycStatus: string;
    createdAt: Date;
  }) {
    return {
      ...row,
      phone: decryptPii(row.phone),
      emergencyContact: decryptPii(row.emergencyContact),
    };
  }
}
