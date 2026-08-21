import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppLogger } from '../common/logger/app-logger.service';
import { pageArgs, pageResult } from '../common/pagination';
import { toNumber } from '../common/money';
import { ComplianceService } from '../compliance/compliance.service';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';
import { ListLeasesQueryDto } from './dto/list-leases-query.dto';
import { RenewLeaseDto } from './dto/renew-lease.dto';
import { TerminateLeaseDto } from './dto/terminate-lease.dto';
import { OperationalMailService } from '../common/mail/operational-mail.service';

const ACTIVE_STATUSES = ['active', 'ending'];

@Injectable()
export class LeasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
    private readonly compliance: ComplianceService,
    private readonly operationalMail: OperationalMailService,
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
    const [rows, total] = await Promise.all([
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

  async create(orgId: string, dto: CreateLeaseDto, actorUserId?: string) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    this.assertRange(startDate, endDate);

    const unit = await this.prisma.unit.findFirst({ where: { id: dto.unitId, orgId } });
    if (!unit) throw new NotFoundException('Unit not found.');
    const tenant = await this.prisma.tenant.findFirst({ where: { id: dto.tenantId, orgId } });
    if (!tenant) throw new NotFoundException('Tenant not found.');

    const ready = await this.compliance.assertLeaseReady(orgId, tenant.id);
    if (!ready.ok) {
      void this.operationalMail.complianceBlock({
        orgId,
        tenantName: tenant.fullName,
        reason: ready.message,
        gapsLabel: ready.gaps.length
          ? ready.gaps.map((g) => `${g.docType} (${g.reason})`).join(', ')
          : null,
      });
      throw new BadRequestException(ready.message);
    }

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
      await tx.leaseChange.create({
        data: {
          orgId,
          leaseId: lease.id,
          changeType: 'created',
          fromVersion: null,
          toVersion: lease.version,
          snapshotJson: this.snapshot(lease),
          actorUserId,
        },
      });
      return lease;
    });

    this.logger.success(`Lease ${row.id} created for unit ${unit.id}`, LeasesService.name);
    return this.present(row);
  }

  async update(orgId: string, id: string, dto: UpdateLeaseDto, actorUserId?: string) {
    const current = await this.prisma.lease.findFirst({ where: { id, orgId } });
    if (!current) throw new NotFoundException('Lease not found.');

    const startDate = dto.startDate ? new Date(dto.startDate) : current.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : current.endDate;
    this.assertRange(startDate, endDate);
    const unitId = dto.unitId ?? current.unitId;
    if (ACTIVE_STATUSES.includes(dto.status ?? current.status)) {
      await this.assertNoOverlap(orgId, unitId, startDate, endDate, id);
    }

    const material =
      dto.rentAmount != null ||
      dto.startDate != null ||
      dto.endDate != null ||
      dto.dueDay != null ||
      dto.billingCycle != null;

    const row = await this.prisma.$transaction(async (tx) => {
      const lease = await tx.lease.update({
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
          ...(material ? { version: { increment: 1 } } : {}),
        },
        include: {
          tenant: { select: { fullName: true } },
          unit: { select: { unitCode: true } },
        },
      });
      await tx.leaseChange.create({
        data: {
          orgId,
          leaseId: id,
          changeType: 'updated',
          fromVersion: current.version,
          toVersion: lease.version,
          snapshotJson: this.snapshot(lease),
          actorUserId,
        },
      });
      return lease;
    });
    return this.present(row);
  }

  async renew(orgId: string, id: string, dto: RenewLeaseDto, actorUserId?: string) {
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
      await tx.leaseChange.create({
        data: {
          orgId,
          leaseId: id,
          changeType: 'renewed',
          fromVersion: current.version,
          toVersion: lease.version,
          snapshotJson: this.snapshot(lease),
          actorUserId,
          notes: `Renewed to ${dto.endDate}`,
        },
      });
      return lease;
    });

    this.logger.success(`Lease ${id} renewed to ${dto.endDate}`, LeasesService.name);
    return this.present(row);
  }

  async terminate(orgId: string, id: string, dto: TerminateLeaseDto, actorUserId?: string) {
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
      await tx.leaseChange.create({
        data: {
          orgId,
          leaseId: id,
          changeType: 'terminated',
          fromVersion: current.version,
          toVersion: lease.version,
          snapshotJson: this.snapshot(lease),
          actorUserId,
          notes: dto.notes,
        },
      });
      return lease;
    });

    this.logger.success(`Lease ${id} terminated`, LeasesService.name);
    return this.present(row);
  }

  async history(orgId: string, id: string) {
    await this.getById(orgId, id);
    const rows = await this.prisma.leaseChange.findMany({
      where: { orgId, leaseId: id },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ({
      id: row.id,
      changeType: row.changeType,
      fromVersion: row.fromVersion,
      toVersion: row.toVersion,
      snapshot: row.snapshotJson,
      actorUserId: row.actorUserId,
      notes: row.notes,
      createdAt: row.createdAt,
    }));
  }

  private snapshot(row: {
    id: string;
    status: string;
    version: number;
    startDate: Date;
    endDate: Date;
    rentAmount: { toString(): string };
    dueDay: number;
    billingCycle: string;
    notes: string | null;
  }) {
    return {
      id: row.id,
      status: row.status,
      version: row.version,
      startDate: row.startDate.toISOString(),
      endDate: row.endDate.toISOString(),
      rentAmount: toNumber(row.rentAmount),
      dueDay: row.dueDay,
      billingCycle: row.billingCycle,
      notes: row.notes,
    };
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

  async runEndingSoonAlerts(orgId: string) {
    const leases = await this.prisma.lease.findMany({
      where: { orgId, status: { in: ACTIVE_STATUSES } },
      include: {
        tenant: { select: { id: true, fullName: true, email: true } },
        unit: { select: { unitCode: true } },
      },
    });
    const operators = await this.prisma.user.findMany({
      where: { orgId, status: 'active', role: { in: ['owner', 'manager'] } },
      select: { id: true, email: true, fullName: true },
    });
    let alerted = 0;
    const now = Date.now();
    for (const lease of leases) {
      const days = Math.ceil((lease.endDate.getTime() - now) / 86_400_000);
      if (![30, 14, 7].includes(days)) continue;

      for (const op of operators) {
        await this.operationalMail.leaseEnding({
          orgId,
          recipientUserId: op.id,
          recipientEmail: op.email,
          recipientName: op.fullName,
          tenantName: lease.tenant.fullName,
          unitCode: lease.unit.unitCode,
          endDate: lease.endDate,
          daysRemaining: days,
          rentAmount: toNumber(lease.rentAmount),
          leaseId: lease.id,
        });
      }

      const tenantUser = await this.prisma.user.findFirst({
        where: { orgId, tenantId: lease.tenantId, status: 'active' },
        select: { id: true, email: true, fullName: true },
      });
      const tenantEmail = (tenantUser?.email || lease.tenant.email || '').trim();
      if (tenantEmail) {
        await this.operationalMail.leaseEnding({
          orgId,
          recipientUserId: tenantUser?.id ?? null,
          recipientEmail: tenantEmail,
          recipientName: tenantUser?.fullName || lease.tenant.fullName,
          tenantName: lease.tenant.fullName,
          unitCode: lease.unit.unitCode,
          endDate: lease.endDate,
          daysRemaining: days,
          rentAmount: toNumber(lease.rentAmount),
          leaseId: lease.id,
        });
      }
      alerted += 1;
    }
    return { alerted };
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
      rent: toNumber(row.rentAmount),
      dueDay: row.dueDay,
      billingCycle: row.billingCycle,
      status: row.status,
      version: row.version,
      notes: row.notes,
      createdAt: row.createdAt,
    };
  }
}
