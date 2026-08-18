import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AppLogger } from '../common/logger/app-logger.service';
import { invoiceStatus, toNumber } from '../common/money';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly logger: AppLogger,
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

  async getById(orgId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({ where: { id, orgId } });
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
