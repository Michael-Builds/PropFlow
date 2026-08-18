import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppLogger } from '../common/logger/app-logger.service';
import { pageArgs, pageResult } from '../common/pagination';
import { toNumber } from '../common/money';
import { parseCsv } from '../common/csv';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { ListUnitsQueryDto } from './dto/list-units-query.dto';

const UNIT_INCLUDE = {
  property: { select: { name: true } },
  block: { select: { name: true } },
} as const;

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
      ...(query.blockId ? { blockId: query.blockId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.unit.findMany({
        where,
        orderBy: { unitCode: 'asc' },
        skip,
        take,
        include: UNIT_INCLUDE,
      }),
      this.prisma.unit.count({ where }),
    ]);
    return pageResult(page, pageSize, total, rows.map((row) => this.present(row)));
  }

  async getById(orgId: string, id: string) {
    const row = await this.prisma.unit.findFirst({
      where: { id, orgId },
      include: UNIT_INCLUDE,
    });
    if (!row) throw new NotFoundException('Unit not found.');
    return this.present(row);
  }

  async create(orgId: string, dto: CreateUnitDto) {
    await this.assertProperty(orgId, dto.propertyId);
    if (dto.blockId) await this.assertBlock(orgId, dto.propertyId, dto.blockId);

    try {
      const row = await this.prisma.unit.create({
        data: {
          orgId,
          propertyId: dto.propertyId,
          blockId: dto.blockId,
          unitCode: dto.unitCode,
          type: dto.type,
          floor: dto.floor,
          sqm: dto.sqm,
          rentAmount: dto.rentAmount,
          currency: dto.currency ?? 'GHS',
          status: dto.status ?? 'vacant',
        },
        include: UNIT_INCLUDE,
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
    const current = await this.getById(orgId, id);
    const propertyId = dto.propertyId ?? current.propertyId;
    if (dto.propertyId) await this.assertProperty(orgId, dto.propertyId);
    if (dto.blockId) await this.assertBlock(orgId, propertyId, dto.blockId);
    const row = await this.prisma.unit.update({
      where: { id },
      data: {
        ...(dto.propertyId != null ? { propertyId: dto.propertyId } : {}),
        ...(dto.blockId !== undefined ? { blockId: dto.blockId } : {}),
        ...(dto.unitCode != null ? { unitCode: dto.unitCode } : {}),
        ...(dto.type != null ? { type: dto.type } : {}),
        ...(dto.floor != null ? { floor: dto.floor } : {}),
        ...(dto.sqm != null ? { sqm: dto.sqm } : {}),
        ...(dto.rentAmount != null ? { rentAmount: dto.rentAmount } : {}),
        ...(dto.currency != null ? { currency: dto.currency } : {}),
        ...(dto.status != null ? { status: dto.status } : {}),
      },
      include: UNIT_INCLUDE,
    });
    return this.present(row);
  }

  async importCsv(orgId: string, csv: string) {
    if (!csv.trim()) throw new BadRequestException('CSV content is required.');
    const rows = parseCsv(csv);
    const created: ReturnType<UnitsService['present']>[] = [];
    const errors: { row: number; message: string }[] = [];

    for (const [index, row] of rows.entries()) {
      const propertyId = row.propertyId || row.property_id;
      const propertyName = row.property || row.propertyName || row.property_name;
      const unitCode = row.unitCode || row.unit_code || row.code;
      const rentAmount = Number(row.rentAmount || row.rent_amount || row.rent);
      try {
        let resolvedPropertyId = propertyId;
        if (!resolvedPropertyId && propertyName) {
          const property = await this.prisma.property.findFirst({
            where: { orgId, name: { equals: propertyName, mode: 'insensitive' } },
          });
          resolvedPropertyId = property?.id ?? '';
        }
        if (!resolvedPropertyId || !unitCode || !Number.isFinite(rentAmount)) {
          throw new Error('propertyId, unitCode, and rentAmount are required.');
        }
        created.push(
          await this.create(orgId, {
            propertyId: resolvedPropertyId,
            blockId: row.blockId || row.block_id || undefined,
            unitCode,
            type: row.type || undefined,
            floor: row.floor ? Number(row.floor) : undefined,
            sqm: row.sqm ? Number(row.sqm) : undefined,
            rentAmount,
            currency: row.currency || 'GHS',
            status: row.status || 'vacant',
          }),
        );
      } catch (error) {
        errors.push({
          row: index + 2,
          message: error instanceof Error ? error.message : 'Invalid row',
        });
      }
    }

    return { created: created.length, errors, items: created };
  }

  present(row: {
    id: string;
    orgId: string;
    propertyId: string;
    blockId?: string | null;
    unitCode: string;
    type: string | null;
    floor: number | null;
    sqm: { toString(): string } | null;
    rentAmount: { toString(): string };
    currency: string;
    status: string;
    createdAt: Date;
    property?: { name: string };
    block?: { name: string } | null;
  }) {
    return {
      id: row.id,
      orgId: row.orgId,
      propertyId: row.propertyId,
      blockId: row.blockId ?? null,
      property: row.property?.name ?? null,
      block: row.block?.name ?? null,
      unitCode: row.unitCode,
      type: row.type,
      floor: row.floor,
      sqm: row.sqm == null ? null : toNumber(row.sqm),
      rentAmount: toNumber(row.rentAmount),
      rent: toNumber(row.rentAmount),
      currency: row.currency,
      status: row.status,
      createdAt: row.createdAt,
    };
  }

  private async assertProperty(orgId: string, propertyId: string) {
    const property = await this.prisma.property.findFirst({ where: { id: propertyId, orgId } });
    if (!property) throw new NotFoundException('Property not found.');
  }

  private async assertBlock(orgId: string, propertyId: string, blockId: string) {
    const block = await this.prisma.block.findFirst({ where: { id: blockId, orgId, propertyId } });
    if (!block) throw new NotFoundException('Block not found.');
  }
}
