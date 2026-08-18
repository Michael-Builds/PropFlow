import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppLogger } from '../common/logger/app-logger.service';
import { pageArgs, pageResult } from '../common/pagination';
import { toNumber } from '../common/money';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { ListUnitsQueryDto } from './dto/list-units-query.dto';

@Injectable()
export class UnitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {}

  async list(orgId: string, query: ListUnitsQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query.page, query.pageSize);
    const where: Prisma.UnitWhereInput = {
      orgId,
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.unit.findMany({
        where,
        orderBy: { unitCode: 'asc' },
        skip,
        take,
        include: { property: { select: { name: true } } },
      }),
      this.prisma.unit.count({ where }),
    ]);
    return pageResult(page, pageSize, total, rows.map((row) => this.present(row)));
  }

  async getById(orgId: string, id: string) {
    const row = await this.prisma.unit.findFirst({
      where: { id, orgId },
      include: { property: { select: { name: true } } },
    });
    if (!row) throw new NotFoundException('Unit not found.');
    return this.present(row);
  }

  async create(orgId: string, dto: CreateUnitDto) {
    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, orgId },
    });
    if (!property) throw new NotFoundException('Property not found.');

    try {
      const row = await this.prisma.unit.create({
        data: {
          orgId,
          propertyId: dto.propertyId,
          unitCode: dto.unitCode,
          type: dto.type,
          floor: dto.floor,
          sqm: dto.sqm,
          rentAmount: dto.rentAmount,
          currency: dto.currency ?? 'GHS',
          status: dto.status ?? 'vacant',
        },
        include: { property: { select: { name: true } } },
      });
      this.logger.success(`Unit ${row.id} created`, UnitsService.name);
      return this.present(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('A unit with this code already exists on the property.');
      }
      throw error;
    }
  }

  async update(orgId: string, id: string, dto: UpdateUnitDto) {
    await this.getById(orgId, id);
    if (dto.propertyId) {
      const property = await this.prisma.property.findFirst({
        where: { id: dto.propertyId, orgId },
      });
      if (!property) throw new NotFoundException('Property not found.');
    }
    const row = await this.prisma.unit.update({
      where: { id },
      data: {
        ...(dto.propertyId != null ? { propertyId: dto.propertyId } : {}),
        ...(dto.unitCode != null ? { unitCode: dto.unitCode } : {}),
        ...(dto.type != null ? { type: dto.type } : {}),
        ...(dto.floor != null ? { floor: dto.floor } : {}),
        ...(dto.sqm != null ? { sqm: dto.sqm } : {}),
        ...(dto.rentAmount != null ? { rentAmount: dto.rentAmount } : {}),
        ...(dto.currency != null ? { currency: dto.currency } : {}),
        ...(dto.status != null ? { status: dto.status } : {}),
      },
      include: { property: { select: { name: true } } },
    });
    return this.present(row);
  }

  present(row: {
    id: string;
    orgId: string;
    propertyId: string;
    unitCode: string;
    type: string | null;
    floor: number | null;
    sqm: { toString(): string } | null;
    rentAmount: { toString(): string };
    currency: string;
    status: string;
    createdAt: Date;
    property?: { name: string };
  }) {
    return {
      id: row.id,
      orgId: row.orgId,
      propertyId: row.propertyId,
      property: row.property?.name ?? null,
      unitCode: row.unitCode,
      type: row.type,
      floor: row.floor,
      sqm: row.sqm == null ? null : toNumber(row.sqm),
      rentAmount: toNumber(row.rentAmount),
      currency: row.currency,
      status: row.status,
      createdAt: row.createdAt,
    };
  }
}
