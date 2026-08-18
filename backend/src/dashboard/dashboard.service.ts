import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toNumber } from '../common/money';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(orgId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [units, occupied, invoicesDue, payments, arrears, openTickets] = await Promise.all([
      this.prisma.unit.count({ where: { orgId } }),
      this.prisma.unit.count({ where: { orgId, status: 'occupied' } }),
      this.prisma.invoice.findMany({
        where: { orgId, dueDate: { gte: monthStart, lte: monthEnd } },
        select: { amountDue: true },
      }),
      this.prisma.payment.findMany({
        where: {
          orgId,
          status: 'success',
          paidAt: { gte: monthStart, lte: monthEnd },
        },
        select: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: { orgId, balance: { gt: 0 } },
        _sum: { balance: true },
        _count: true,
      }),
      this.prisma.ticket.count({
        where: { orgId, status: { notIn: ['resolved', 'closed'] } },
      }),
    ]);

    const dueThisMonth = invoicesDue.reduce((sum, row) => sum + toNumber(row.amountDue), 0);
    const collected = payments.reduce((sum, row) => sum + toNumber(row.amount), 0);

    return {
      occupancy: units === 0 ? 0 : Math.round((occupied / units) * 1000) / 10,
      units,
      occupied,
      dueThisMonth,
      collected,
      arrears: toNumber(arrears._sum.balance ?? 0),
      arrearsCount: arrears._count,
      openTickets,
      currency: 'GHS',
    };
  }

  async collections(orgId: string) {
    const now = new Date();
    const months: { key: string; start: Date; end: Date }[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      months.push({
        key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
        start,
        end,
      });
    }

    const trend: { period: string; collected: number }[] = [];
    for (const month of months) {
      const rows = await this.prisma.payment.findMany({
        where: {
          orgId,
          status: 'success',
          paidAt: { gte: month.start, lte: month.end },
        },
        select: { amount: true },
      });
      trend.push({
        period: month.key,
        collected: rows.reduce((sum, row) => sum + toNumber(row.amount), 0),
      });
    }

    return { currency: 'GHS', trend };
  }

  async maintenance(orgId: string) {
    const tickets = await this.prisma.ticket.findMany({
      where: { orgId },
      select: { status: true, slaDueAt: true, resolvedAt: true, createdAt: true },
    });
    const open = tickets.filter((row) => !['resolved', 'closed'].includes(row.status)).length;
    const resolved = tickets.filter((row) => row.status === 'resolved' || row.status === 'closed');
    const withinSla = resolved.filter((row) => {
      if (!row.slaDueAt || !row.resolvedAt) return false;
      return row.resolvedAt.getTime() <= row.slaDueAt.getTime();
    }).length;
    const breached = tickets.filter((row) => {
      if (!row.slaDueAt) return false;
      if (['resolved', 'closed'].includes(row.status) && row.resolvedAt) {
        return row.resolvedAt.getTime() > row.slaDueAt.getTime();
      }
      return Date.now() > row.slaDueAt.getTime() && !['resolved', 'closed'].includes(row.status);
    }).length;

    return {
      open,
      resolved: resolved.length,
      slaCompliance: resolved.length === 0 ? 100 : Math.round((withinSla / resolved.length) * 1000) / 10,
      breached,
    };
  }
}
