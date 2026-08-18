import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppLogger } from '../common/logger/app-logger.service';
import { pageArgs, pageResult } from '../common/pagination';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {}

  async list(orgId: string, query: ListPropertiesQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query.page, query.pageSize);
    const where: Prisma.PropertyWhereInput = {
      orgId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { location: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.property.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { _count: { select: { units: true } } },
      }),
      this.prisma.property.count({ where }),
    ]);
    return pageResult(
      page,
      pageSize,
      total,
      rows.map((row) => this.present(row)),
    );
  }

  async getById(orgId: string, id: string) {
    const row = await this.prisma.property.findFirst({
      where: { id, orgId },
      include: { _count: { select: { units: true } } },
    });
    if (!row) throw new NotFoundException('Property not found.');
    return this.present(row);
  }

  async create(orgId: string, dto: CreatePropertyDto) {
    const row = await this.prisma.property.create({
      data: {
        orgId,
        name: dto.name,
        location: dto.location,
        type: dto.type,
        manager: dto.manager,
        yearBuilt: dto.yearBuilt,
        timezone: dto.timezone,
        status: dto.status ?? 'active',
        addressJson: dto.location ? { line1: dto.location } : undefined,
      },
      include: { _count: { select: { units: true } } },
    });
    this.logger.success(`Property ${row.id} created`, PropertiesService.name);
    return this.present(row);
  }

  async update(orgId: string, id: string, dto: UpdatePropertyDto) {
    await this.getById(orgId, id);
    const row = await this.prisma.property.update({
      where: { id },
      data: {
        ...(dto.name != null ? { name: dto.name } : {}),
        ...(dto.location != null ? { location: dto.location, addressJson: { line1: dto.location } } : {}),
        ...(dto.type != null ? { type: dto.type } : {}),
        ...(dto.manager != null ? { manager: dto.manager } : {}),
        ...(dto.yearBuilt != null ? { yearBuilt: dto.yearBuilt } : {}),
        ...(dto.timezone != null ? { timezone: dto.timezone } : {}),
        ...(dto.status != null ? { status: dto.status } : {}),
      },
      include: { _count: { select: { units: true } } },
    });
    return this.present(row);
  }

  present(row: {
    id: string;
    orgId: string;
    name: string;
    location: string | null;
    type: string | null;
    manager: string | null;
    yearBuilt: number | null;
    timezone: string | null;
    status: string;
    createdAt: Date;
    _count?: { units: number };
  }) {
    return {
      id: row.id,
      orgId: row.orgId,
      name: row.name,
      location: row.location,
      type: row.type,
      manager: row.manager,
      yearBuilt: row.yearBuilt,
      timezone: row.timezone,
      status: row.status,
      units: row._count?.units ?? 0,
      createdAt: row.createdAt,
    };
  }
}
