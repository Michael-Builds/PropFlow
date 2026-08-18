import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AppLogger } from '../common/logger/app-logger.service';
import { invoiceStatus, toNumber } from '../common/money';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly logger: AppLogger,
    private readonly notifications: NotificationsService,
  ) {}

  async generate(orgId: string, dto: GenerateInvoiceDto) {
    const lease = await this.prisma.lease.findFirst({
      where: { id: dto.leaseId, orgId },
    });
    if (!lease) throw new NotFoundException('Lease not found.');
    if (lease.status !== 'active' && lease.status !== 'ending') {
      throw new BadRequestException('Invoices can only be generated for an active lease.');
    }

    const amountDue = dto.amount ?? toNumber(lease.rentAmount);
    if (amountDue <= 0) throw new BadRequestException('Invoice amount must be greater than zero.');

    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);
    const dueDate = new Date(dto.dueDate);
    if (periodEnd < periodStart) {
      throw new BadRequestException('periodEnd must be on or after periodStart.');
    }

    const invoice = await this.prisma.invoice.create({
      data: {
        orgId,
        leaseId: lease.id,
        tenantId: lease.tenantId,
        periodStart,
        periodEnd,
        dueDate,
        amountDue,
        amountPaid: 0,
        balance: amountDue,
        currency: 'GHS',
        status: invoiceStatus(amountDue, 0, dueDate),
        notes: dto.notes,
      },
    });

    this.logger.success(`Invoice ${invoice.id} generated for lease ${lease.id}`, InvoicesService.name);
    return this.present(invoice);
  }

  async generateDue(orgId: string) {
    const leases = await this.prisma.lease.findMany({
      where: { orgId, status: { in: ['active', 'ending'] } },
    });
    const now = new Date();
    const created: ReturnType<InvoicesService['present']>[] = [];
    for (const lease of leases) {
      const { periodStart, periodEnd, dueDate } = billingWindow(lease.billingCycle, lease.dueDay, now);
      const existing = await this.prisma.invoice.findFirst({
        where: { orgId, leaseId: lease.id, periodStart },
      });
      if (existing) continue;
      created.push(
        await this.generate(orgId, {
          leaseId: lease.id,
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
          dueDate: dueDate.toISOString(),
        }),
      );
    }
    return { created: created.length, items: created };
  }

  async update(orgId: string, id: string, dto: UpdateInvoiceDto) {
    const invoice = await this.prisma.invoice.findFirst({ where: { id, orgId } });
    if (!invoice) throw new NotFoundException('Invoice not found.');
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : invoice.dueDate;
    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        ...(dto.notes != null ? { notes: dto.notes } : {}),
        ...(dto.dueDate ? { dueDate, status: invoiceStatus(toNumber(invoice.balance), toNumber(invoice.amountPaid), dueDate) } : {}),
      },
    });
    return this.present(updated);
  }

  async runReminders(orgId: string) {
    const weekAgo = new Date(Date.now() - 7 * 86_400_000);
    const overdue = await this.prisma.invoice.findMany({
      where: {
        orgId,
        balance: { gt: 0 },
        dueDate: { lt: new Date() },
        OR: [{ lastReminderAt: null }, { lastReminderAt: { lt: weekAgo } }],
      },
    });
    const operators = await this.prisma.user.findMany({
      where: { orgId, status: 'active', role: { in: ['owner', 'manager', 'finance'] } },
      select: { id: true },
    });

    for (const invoice of overdue) {
      const payload = {
        invoiceId: invoice.id,
        tenantId: invoice.tenantId,
        balance: toNumber(invoice.balance),
        dueDate: invoice.dueDate,
        message: 'Rent balance is overdue. This is an operational reminder, not an eviction notice.',
      };
      for (const operator of operators) {
        await this.notifications.queueEmail(orgId, operator.id, 'arrears_reminder', payload);
      }
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { lastReminderAt: new Date() },
      });
    }

    this.logger.success(`Queued arrears reminders for ${overdue.length} invoices`, InvoicesService.name);
    return { reminded: overdue.length };
  }

  async list(orgId: string, query: ListInvoicesQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const where = {
      orgId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.leaseId ? { leaseId: query.leaseId } : {}),
      ...(query.tenantId ? { tenantId: query.tenantId } : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      page,
      pageSize,
      total,
      items: rows.map((row) => this.present(row)),
    };
  }

  async getById(orgId: string, id: string, tenantId?: string | null) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, orgId, ...(tenantId ? { tenantId } : {}) },
    });
    if (!invoice) throw new NotFoundException('Invoice not found.');
    return this.present(invoice);
  }

  async arrears(orgId: string) {
    const rows = await this.prisma.invoice.findMany({
      where: {
        orgId,
        balance: { gt: 0 },
      },
      orderBy: { dueDate: 'asc' },
    });

    const items = rows.map((row) => this.present(row));
    const outstanding = items.reduce((sum, row) => sum + row.balance, 0);
    return {
      currency: 'GHS',
      count: items.length,
      outstanding,
      items,
    };
  }

  present(invoice: {
    id: string;
    orgId: string;
    leaseId: string;
    tenantId: string;
    periodStart: Date;
    periodEnd: Date;
    dueDate: Date;
    amountDue: { toString(): string };
    amountPaid: { toString(): string };
    balance: { toString(): string };
    currency: string;
    status: string;
    checkoutToken: string;
    notes: string | null;
    createdAt: Date;
  }) {
    const amountDue = toNumber(invoice.amountDue);
    const amountPaid = toNumber(invoice.amountPaid);
    const balance = toNumber(invoice.balance);
    const status = invoiceStatus(balance, amountPaid, invoice.dueDate);
    const frontend = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:4200';
    return {
      id: invoice.id,
      orgId: invoice.orgId,
      leaseId: invoice.leaseId,
      tenantId: invoice.tenantId,
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
      dueDate: invoice.dueDate,
      amountDue,
      amountPaid,
      balance,
      currency: invoice.currency,
      status,
      notes: invoice.notes,
      checkoutToken: invoice.checkoutToken,
      payUrl: `${frontend}/pay/${invoice.checkoutToken}`,
      createdAt: invoice.createdAt,
    };
  }
}

function billingWindow(cycle: string, dueDay: number, now: Date) {
  const isQuarter = cycle === 'quarterly';
  const month = isQuarter ? Math.floor(now.getMonth() / 3) * 3 : now.getMonth();
  const periodStart = new Date(now.getFullYear(), month, 1);
  const periodEnd = new Date(now.getFullYear(), month + (isQuarter ? 3 : 1), 0, 23, 59, 59, 999);
  const dueDate = new Date(now.getFullYear(), month, Math.min(dueDay, 28));
  return { periodStart, periodEnd, dueDate };
}
