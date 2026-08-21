import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toCsv } from '../common/csv';
import { rowsToPdf } from '../common/pdf';
import { toNumber } from '../common/money';
import { arrearsBucket } from '../common/aging';
import { decryptPii } from '../common/pii';

@Injectable()
export class ExportsService {
  constructor(private readonly prisma: PrismaService) {}

  async csv(orgId: string, resource: string) {
    const data = await this.load(orgId, resource);
    return {
      filename: `propflow-${resource}.csv`,
      contentType: 'text/csv',
      body: toCsv(data.headers, data.rows),
    };
  }

  async pdf(orgId: string, resource: string) {
    const data = await this.load(orgId, resource);
    const body = await rowsToPdf(`PropFlow ${resource}`, data.headers, data.rows);
    return {
      filename: `propflow-${resource}.pdf`,
      contentType: 'application/pdf',
      body,
    };
  }

  private async load(orgId: string, resource: string) {
    switch (resource) {
      case 'properties':
        return this.properties(orgId);
      case 'units':
        return this.units(orgId);
      case 'tenants':
        return this.tenants(orgId);
      case 'leases':
        return this.leases(orgId);
      case 'invoices':
        return this.invoices(orgId);
      case 'payments':
        return this.payments(orgId);
      case 'arrears':
        return this.arrears(orgId);
      case 'tickets':
        return this.tickets(orgId);
      default:
        return { headers: [] as string[], rows: [] as Record<string, string | number>[] };
    }
  }

  private async properties(orgId: string) {
    const rows = await this.prisma.property.findMany({ where: { orgId }, orderBy: { name: 'asc' } });
    const headers = ['id', 'name', 'location', 'status', 'createdAt'];
    return {
      headers,
      rows: rows.map((row) => ({
        id: row.id,
        name: row.name,
        location: row.location ?? '',
        status: row.status,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  private async units(orgId: string) {
    const rows = await this.prisma.unit.findMany({
      where: { orgId },
      include: { property: { select: { name: true } } },
      orderBy: { unitCode: 'asc' },
    });
    const headers = ['id', 'property', 'unitCode', 'type', 'rentAmount', 'currency', 'status'];
    return {
      headers,
      rows: rows.map((row) => ({
        id: row.id,
        property: row.property.name,
        unitCode: row.unitCode,
        type: row.type ?? '',
        rentAmount: toNumber(row.rentAmount),
        currency: row.currency,
        status: row.status,
      })),
    };
  }

  private async tenants(orgId: string) {
    const rows = await this.prisma.tenant.findMany({ where: { orgId }, orderBy: { fullName: 'asc' } });
    const headers = ['id', 'fullName', 'email', 'phone', 'kycStatus', 'status'];
    return {
      headers,
      rows: rows.map((row) => ({
        id: row.id,
        fullName: row.fullName,
        email: row.email ?? '',
        phone: decryptPii(row.phone) ?? '',
        kycStatus: row.kycStatus,
        status: row.status,
      })),
    };
  }

  private async leases(orgId: string) {
    const rows = await this.prisma.lease.findMany({
      where: { orgId },
      include: { tenant: { select: { fullName: true } }, unit: { select: { unitCode: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const headers = ['id', 'tenant', 'unit', 'startDate', 'endDate', 'rentAmount', 'status'];
    return {
      headers,
      rows: rows.map((row) => ({
        id: row.id,
        tenant: row.tenant.fullName,
        unit: row.unit.unitCode,
        startDate: row.startDate.toISOString().slice(0, 10),
        endDate: row.endDate.toISOString().slice(0, 10),
        rentAmount: toNumber(row.rentAmount),
        status: row.status,
      })),
    };
  }

  private async invoices(orgId: string) {
    const rows = await this.prisma.invoice.findMany({ where: { orgId }, orderBy: { dueDate: 'desc' } });
    const headers = ['id', 'tenantId', 'leaseId', 'dueDate', 'amountDue', 'balance', 'status'];
    return {
      headers,
      rows: rows.map((row) => ({
        id: row.id,
        tenantId: row.tenantId,
        leaseId: row.leaseId,
        dueDate: row.dueDate.toISOString().slice(0, 10),
        amountDue: toNumber(row.amountDue),
        balance: toNumber(row.balance),
        status: row.status,
      })),
    };
  }

  private async payments(orgId: string) {
    const rows = await this.prisma.payment.findMany({
      where: { orgId, status: 'success' },
      orderBy: { paidAt: 'desc' },
    });
    const headers = ['id', 'invoiceId', 'amount', 'method', 'reference', 'paidAt'];
    return {
      headers,
      rows: rows.map((row) => ({
        id: row.id,
        invoiceId: row.invoiceId,
        amount: toNumber(row.amount),
        method: row.method,
        reference: row.reference,
        paidAt: row.paidAt?.toISOString() ?? '',
      })),
    };
  }

  private async arrears(orgId: string) {
    const rows = await this.prisma.invoice.findMany({
      where: { orgId, balance: { gt: 0 } },
      orderBy: { dueDate: 'asc' },
      include: { tenant: { select: { fullName: true } } },
    });
    const headers = ['invoiceId', 'tenant', 'leaseId', 'bucket', 'balance', 'dueDate'];
    return {
      headers,
      rows: rows.map((row) => ({
        invoiceId: row.id,
        tenant: row.tenant.fullName,
        leaseId: row.leaseId,
        bucket: arrearsBucket(row.dueDate),
        balance: toNumber(row.balance),
        dueDate: row.dueDate.toISOString().slice(0, 10),
      })),
    };
  }

  private async tickets(orgId: string) {
    const rows = await this.prisma.ticket.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
    const headers = ['id', 'category', 'priority', 'status', 'slaDueAt', 'createdAt'];
    return {
      headers,
      rows: rows.map((row) => ({
        id: row.id,
        category: row.category,
        priority: row.priority,
        status: row.status,
        slaDueAt: row.slaDueAt?.toISOString() ?? '',
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }
}
