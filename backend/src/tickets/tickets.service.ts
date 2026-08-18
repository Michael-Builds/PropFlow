import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppLogger } from '../common/logger/app-logger.service';
import { pageArgs, pageResult } from '../common/pagination';
import { ticketSlaDue } from '../common/document-status';
import { toNumber } from '../common/money';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import type { OrgScopedUser } from '../auth/decorators/org-id.decorator';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { ResolveTicketDto } from './dto/resolve-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {}

  async list(user: OrgScopedUser, query: ListTicketsQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query.page, query.pageSize);
    const where: Prisma.TicketWhereInput = {
      orgId: user.orgId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
      ...(query.unitId ? { unitId: query.unitId } : {}),
      ...(user.role === 'tenant' && user.tenantId ? { tenantId: user.tenantId } : {}),
      ...(user.role === 'vendor' ? { OR: [{ assigneeUserId: user.sub }, { vendorId: user.vendorId ?? '' }] } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { events: { orderBy: { createdAt: 'desc' }, take: 8 } },
      }),
      this.prisma.ticket.count({ where }),
    ]);
    return pageResult(page, pageSize, total, rows.map((row) => this.present(row)));
  }

  async getById(user: OrgScopedUser, id: string) {
    const row = await this.prisma.ticket.findFirst({
      where: { id, orgId: user.orgId },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
    if (!row) throw new NotFoundException('Ticket not found.');
    this.assertCanView(user, row);
    return this.present(row);
  }

  async create(user: OrgScopedUser, dto: CreateTicketDto) {
    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, orgId: user.orgId },
    });
    if (!property) throw new NotFoundException('Property not found.');

    const tenantId = user.role === 'tenant' ? user.tenantId ?? dto.tenantId : dto.tenantId;
    const row = await this.prisma.ticket.create({
      data: {
        orgId: user.orgId,
        propertyId: dto.propertyId,
        unitId: dto.unitId,
        tenantId,
        category: dto.category,
        priority: dto.priority,
        notes: dto.notes,
        slaDueAt: ticketSlaDue(dto.priority),
        events: {
          create: {
            orgId: user.orgId,
            eventType: 'opened',
            actorUserId: user.sub,
            payloadJson: { category: dto.category, priority: dto.priority },
          },
        },
      },
      include: { events: true },
    });
    this.logger.success(`Ticket ${row.id} opened`, TicketsService.name);
    return this.present(row);
  }

  async update(user: OrgScopedUser, id: string, dto: UpdateTicketDto) {
    const current = await this.requireTicket(user.orgId, id);
    const slaDueAt =
      dto.priority && dto.priority !== current.priority
        ? ticketSlaDue(dto.priority, current.createdAt)
        : undefined;
    const row = await this.prisma.ticket.update({
      where: { id },
      data: {
        ...(dto.category != null ? { category: dto.category } : {}),
        ...(dto.priority != null ? { priority: dto.priority } : {}),
        ...(dto.status != null ? { status: dto.status } : {}),
        ...(dto.notes != null ? { notes: dto.notes } : {}),
        ...(slaDueAt ? { slaDueAt } : {}),
        events: {
          create: {
            orgId: user.orgId,
            eventType: 'updated',
            actorUserId: user.sub,
            payloadJson: dto as object,
          },
        },
      },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
    return this.present(row);
  }

  async assign(user: OrgScopedUser, id: string, dto: AssignTicketDto) {
    if (!dto.assigneeUserId && !dto.vendorId) {
      throw new BadRequestException('Provide assigneeUserId or vendorId.');
    }
    await this.requireTicket(user.orgId, id);
    const row = await this.prisma.ticket.update({
      where: { id },
      data: {
        status: 'assigned',
        assigneeUserId: dto.assigneeUserId,
        vendorId: dto.vendorId,
        events: {
          create: {
            orgId: user.orgId,
            eventType: 'assigned',
            actorUserId: user.sub,
            payloadJson: dto as object,
          },
        },
      },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
    this.logger.success(`Ticket ${id} assigned`, TicketsService.name);
    return this.present(row);
  }

  async resolve(user: OrgScopedUser, id: string, dto: ResolveTicketDto) {
    await this.requireTicket(user.orgId, id);
    const row = await this.prisma.ticket.update({
      where: { id },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
        notes: dto.notes,
        costAmount: dto.costAmount,
        events: {
          create: {
            orgId: user.orgId,
            eventType: 'resolved',
            actorUserId: user.sub,
            payloadJson: dto as object,
          },
        },
      },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
    return this.present(row);
  }

  async close(user: OrgScopedUser, id: string) {
    await this.requireTicket(user.orgId, id);
    const row = await this.prisma.ticket.update({
      where: { id },
      data: {
        status: 'closed',
        closedAt: new Date(),
        events: {
          create: {
            orgId: user.orgId,
            eventType: 'closed',
            actorUserId: user.sub,
          },
        },
      },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
    return this.present(row);
  }

  private async requireTicket(orgId: string, id: string) {
    const row = await this.prisma.ticket.findFirst({ where: { id, orgId } });
    if (!row) throw new NotFoundException('Ticket not found.');
    return row;
  }

  private assertCanView(user: JwtUser, ticket: { tenantId: string | null; assigneeUserId: string | null; vendorId: string | null }) {
    if (user.role === 'tenant' && user.tenantId && ticket.tenantId !== user.tenantId) {
      throw new NotFoundException('Ticket not found.');
    }
    if (
      user.role === 'vendor' &&
      ticket.assigneeUserId !== user.sub &&
      ticket.vendorId !== user.vendorId
    ) {
      throw new NotFoundException('Ticket not found.');
    }
  }

  present(row: {
    id: string;
    orgId: string;
    propertyId: string;
    unitId: string | null;
    tenantId: string | null;
    category: string;
    priority: string;
    status: string;
    slaDueAt: Date | null;
    assigneeUserId: string | null;
    vendorId: string | null;
    costAmount: { toString(): string } | null;
    notes: string | null;
    resolvedAt: Date | null;
    closedAt: Date | null;
    createdAt: Date;
    events?: { id: string; eventType: string; payloadJson: Prisma.JsonValue; actorUserId: string | null; createdAt: Date }[];
  }) {
    return {
      id: row.id,
      orgId: row.orgId,
      propertyId: row.propertyId,
      unitId: row.unitId,
      tenantId: row.tenantId,
      category: row.category,
      priority: row.priority,
      status: row.status,
      slaDueAt: row.slaDueAt,
      assigneeUserId: row.assigneeUserId,
      vendorId: row.vendorId,
      costAmount: row.costAmount == null ? null : toNumber(row.costAmount),
      notes: row.notes,
      resolvedAt: row.resolvedAt,
      closedAt: row.closedAt,
      createdAt: row.createdAt,
      events: row.events ?? [],
    };
  }
}
