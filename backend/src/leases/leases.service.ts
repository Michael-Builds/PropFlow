import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppLogger } from '../common/logger/app-logger.service';
import { pageArgs, pageResult } from '../common/pagination';
import { toNumber } from '../common/money';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';
import { ListLeasesQueryDto } from './dto/list-leases-query.dto';
import { RenewLeaseDto } from './dto/renew-lease.dto';
import { TerminateLeaseDto } from './dto/terminate-lease.dto';

const ACTIVE_STATUSES = ['active', 'ending'];

@Injectable()
export class LeasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {}

  async list(orgId: string, query: ListLeasesQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query.page, query.pageSize);
    const where: Prisma.LeaseWhereInput = {
      orgId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.unitId ? { unitId: query.unitId } : {}),
      ...(query.tenantId ? { tenantId: query.tenantId } : {}),
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.lease.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          tenant: { select: { fullName: true } },
          unit: { select: { unitCode: true } },
        },
      }),
      this.prisma.lease.count({ where }),
    ]);
    return pageResult(page, pageSize, total, rows.map((row) => this.present(row)));
  }

  async getById(orgId: string, id: string) {
    const row = await this.prisma.lease.findFirst({
      where: { id, orgId },
      include: {
        tenant: { select: { fullName: true } },
        unit: { select: { unitCode: true } },
      },
    });
    if (!row) throw new NotFoundException('Lease not found.');
    return this.present(row);
  }

  async create(orgId: string, dto: CreateLeaseDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    this.assertRange(startDate, endDate);

    const unit = await this.prisma.unit.findFirst({ where: { id: dto.unitId, orgId } });
    if (!unit) throw new NotFoundException('Unit not found.');
    const tenant = await this.prisma.tenant.findFirst({ where: { id: dto.tenantId, orgId } });
    if (!tenant) throw new NotFoundException('Tenant not found.');

    await this.assertNoOverlap(orgId, unit.id, startDate, endDate);

    const row = await this.prisma.$transaction(async (tx) => {
      const lease = await tx.lease.create({
        data: {
          orgId,
          propertyId: unit.propertyId,
          unitId: unit.id,
          tenantId: tenant.id,
          startDate,
          endDate,
          rentAmount: dto.rentAmount ?? unit.rentAmount,
          dueDay: dto.dueDay,
          billingCycle: dto.billingCycle ?? 'monthly',
          notes: dto.notes,
          status: 'active',
        },
        include: {
          tenant: { select: { fullName: true } },
          unit: { select: { unitCode: true } },
        },
      });
      await tx.unit.update({ where: { id: unit.id }, data: { status: 'occupied' } });
      return lease;
    });

    this.logger.success(`Lease ${row.id} created for unit ${unit.id}`, LeasesService.name);
    return this.present(row);
  }

  async update(orgId: string, id: string, dto: UpdateLeaseDto) {
    const current = await this.prisma.lease.findFirst({ where: { id, orgId } });
    if (!current) throw new NotFoundException('Lease not found.');

    const startDate = dto.startDate ? new Date(dto.startDate) : current.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : current.endDate;
    this.assertRange(startDate, endDate);
    const unitId = dto.unitId ?? current.unitId;
    if (ACTIVE_STATUSES.includes(dto.status ?? current.status)) {
      await this.assertNoOverlap(orgId, unitId, startDate, endDate, id);
    }

    const row = await this.prisma.lease.update({
      where: { id },
      data: {
        ...(dto.unitId != null ? { unitId: dto.unitId } : {}),
        ...(dto.tenantId != null ? { tenantId: dto.tenantId } : {}),
        ...(dto.startDate ? { startDate } : {}),
        ...(dto.endDate ? { endDate } : {}),
        ...(dto.rentAmount != null ? { rentAmount: dto.rentAmount } : {}),
        ...(dto.dueDay != null ? { dueDay: dto.dueDay } : {}),
        ...(dto.billingCycle != null ? { billingCycle: dto.billingCycle } : {}),
        ...(dto.notes != null ? { notes: dto.notes } : {}),
        ...(dto.status != null ? { status: dto.status } : {}),
      },
      include: {
        tenant: { select: { fullName: true } },
        unit: { select: { unitCode: true } },
      },
    });
    return this.present(row);
  }

  async renew(orgId: string, id: string, dto: RenewLeaseDto) {
    const current = await this.prisma.lease.findFirst({
      where: { id, orgId },
      include: {
        tenant: { select: { fullName: true } },
        unit: { select: { unitCode: true } },
      },
    });
    if (!current) throw new NotFoundException('Lease not found.');
    if (!ACTIVE_STATUSES.includes(current.status) && current.status !== 'terminated') {
      throw new BadRequestException('Only an existing tenancy can be renewed.');
    }

    const endDate = new Date(dto.endDate);
    this.assertRange(current.startDate, endDate);
    await this.assertNoOverlap(orgId, current.unitId, current.startDate, endDate, id);

    const row = await this.prisma.$transaction(async (tx) => {
      const lease = await tx.lease.update({
        where: { id },
        data: {
          endDate,
          rentAmount: dto.rentAmount ?? current.rentAmount,
          dueDay: dto.dueDay ?? current.dueDay,
          status: 'active',
          version: { increment: 1 },
        },
        include: {
          tenant: { select: { fullName: true } },
          unit: { select: { unitCode: true } },
        },
      });
      await tx.unit.update({ where: { id: current.unitId }, data: { status: 'occupied' } });
      return lease;
    });

    this.logger.success(`Lease ${id} renewed to ${dto.endDate}`, LeasesService.name);
    return this.present(row);
  }

  async terminate(orgId: string, id: string, dto: TerminateLeaseDto) {
    const current = await this.prisma.lease.findFirst({ where: { id, orgId } });
    if (!current) throw new NotFoundException('Lease not found.');
    if (current.status === 'terminated') {
      throw new BadRequestException('Lease is already terminated.');
    }

    const row = await this.prisma.$transaction(async (tx) => {
      const lease = await tx.lease.update({
        where: { id },
        data: {
          status: 'terminated',
          notes: dto.notes ? [current.notes, dto.notes].filter(Boolean).join('\n') : current.notes,
        },
        include: {
          tenant: { select: { fullName: true } },
          unit: { select: { unitCode: true } },
        },
      });
      const stillOccupied = await tx.lease.count({
        where: { unitId: current.unitId, status: { in: ACTIVE_STATUSES }, id: { not: id } },
      });
      if (stillOccupied === 0) {
        await tx.unit.update({ where: { id: current.unitId }, data: { status: 'vacant' } });
      }
      return lease;
    });

    this.logger.success(`Lease ${id} terminated`, LeasesService.name);
    return this.present(row);
  }

  private assertRange(start: Date, end: Date) {
    if (end.getTime() <= start.getTime()) {
      throw new BadRequestException('Lease end date must be after start date.');
    }
  }

  private async assertNoOverlap(
    orgId: string,
    unitId: string,
    startDate: Date,
    endDate: Date,
    excludeId?: string,
  ) {
    const overlap = await this.prisma.lease.findFirst({
      where: {
        orgId,
        unitId,
        status: { in: ACTIVE_STATUSES },
        ...(excludeId ? { id: { not: excludeId } } : {}),
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
    if (overlap) {
      throw new BadRequestException('This unit already has an overlapping active lease.');
    }
  }

  present(row: {
    id: string;
    orgId: string;
    propertyId: string;
    unitId: string;
    tenantId: string;
    startDate: Date;
    endDate: Date;
    rentAmount: { toString(): string };
    dueDay: number;
    billingCycle: string;
    status: string;
    version: number;
    notes: string | null;
    createdAt: Date;
    tenant?: { fullName: string };
    unit?: { unitCode: string };
  }) {
    return {
      id: row.id,
      orgId: row.orgId,
      propertyId: row.propertyId,
      unitId: row.unitId,
      tenantId: row.tenantId,
      tenant: row.tenant?.fullName ?? null,
      unit: row.unit?.unitCode ?? null,
      startDate: row.startDate,
      endDate: row.endDate,
      rentAmount: toNumber(row.rentAmount),
      dueDay: row.dueDay,
      billingCycle: row.billingCycle,
      status: row.status,
      version: row.version,
      notes: row.notes,
      createdAt: row.createdAt,
    };
  }
}
