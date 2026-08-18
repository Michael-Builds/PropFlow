import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toNumber } from '../common/money';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(orgId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const [units, occupied, invoicesDue, payments, arrears, openTickets] =
      await Promise.all([
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

    const dueThisMonth = invoicesDue.reduce(
      (sum, row) => sum + toNumber(row.amountDue),
      0,
    );
    const collected = payments.reduce(
      (sum, row) => sum + toNumber(row.amount),
      0,
    );

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
      const end = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        0,
        23,
        59,
        59,
        999,
      );
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
      select: {
        status: true,
        slaDueAt: true,
        resolvedAt: true,
        createdAt: true,
      },
    });
    const open = tickets.filter(
      (row) => !['resolved', 'closed'].includes(row.status),
    ).length;
    const resolved = tickets.filter(
      (row) => row.status === 'resolved' || row.status === 'closed',
    );
    const withinSla = resolved.filter((row) => {
      if (!row.slaDueAt || !row.resolvedAt) return false;
      return row.resolvedAt.getTime() <= row.slaDueAt.getTime();
    }).length;
    const breached = tickets.filter((row) => {
      if (!row.slaDueAt) return false;
      if (['resolved', 'closed'].includes(row.status) && row.resolvedAt) {
        return row.resolvedAt.getTime() > row.slaDueAt.getTime();
      }
      return (
        Date.now() > row.slaDueAt.getTime() &&
        !['resolved', 'closed'].includes(row.status)
      );
    }).length;

    return {
      open,
      resolved: resolved.length,
      slaCompliance:
        resolved.length === 0
          ? 100
          : Math.round((withinSla / resolved.length) * 1000) / 10,
      breached,
    };
  }

  async overview(orgId: string) {
    const [summary, collections, maintenance, tickets, documents, properties] = await Promise.all([
      this.summary(orgId),
      this.collections(orgId),
      this.maintenance(orgId),
      this.prisma.ticket.groupBy({ by: ['status'], where: { orgId }, _count: true }),
      this.prisma.document.findMany({ where: { orgId }, select: { status: true } }),
      this.prisma.property.findMany({
        where: { orgId },
        include: { _count: { select: { units: true } }, units: { select: { status: true } } },
        take: 6,
      }),
    ]);

    const validDocs = documents.filter((doc) => doc.status === 'valid').length;
    const compliance = documents.length === 0 ? 100 : Math.round((validDocs / documents.length) * 100);

    return {
      posture: {
        label: summary.arrears > 0 ? 'Collections need attention' : 'Portfolio healthy',
        region: `org ${orgId}`,
        message: `${summary.occupied} of ${summary.units} units occupied. ${summary.openTickets} open tickets.`,
        syncedAt: new Date().toISOString(),
        score: Math.max(1, Math.min(10, 10 - summary.arrears / 5000)),
      },
      kpis: [
        {
          label: 'Occupancy',
          value: `${summary.occupancy}%`,
          hint: `${summary.occupied} of ${summary.units} units`,
          delta: 0,
          icon: 'building',
        },
        {
          label: 'Collected',
          value: `GHS ${summary.collected.toLocaleString('en-GH')}`,
          hint: 'Posted this month',
          delta: 0,
          icon: 'wallet',
        },
        {
          label: 'Arrears',
          value: `GHS ${summary.arrears.toLocaleString('en-GH')}`,
          hint: `${summary.arrearsCount} invoices`,
          delta: 0,
          icon: 'alert',
        },
        {
          label: 'Open tickets',
          value: String(summary.openTickets),
          hint: 'Maintenance queue',
          delta: 0,
          icon: 'wrench',
        },
        {
          label: 'Collection rate',
          value: summary.dueThisMonth
            ? `${Math.round((summary.collected / summary.dueThisMonth) * 100)}%`
            : '—',
          hint: 'Due vs posted',
          delta: 0,
          icon: 'invoice',
        },
        {
          label: 'Compliance',
          value: `${compliance}%`,
          hint: 'Documents in date',
          delta: 0,
          icon: 'folder',
        },
      ],
      ticketPipeline: tickets.map((row) => ({
        status: row.status,
        count: row._count,
        tone: row.status === 'closed' ? 'muted' : 'info',
      })),
      collectionTrend: {
        labels: collections.trend.map((row) => row.period.slice(5)),
        datasets: [
          {
            label: 'Collected',
            data: collections.trend.map((row) => row.collected),
            color: '#0028f2',
          },
        ],
      },
      occupancyMix: {
        labels: ['Occupied', 'Vacant', 'Maintenance'],
        data: [
          summary.occupied,
          Math.max(0, summary.units - summary.occupied),
          0,
        ],
        colors: ['#0f9f6e', '#d97706', '#0284c7'],
      },
      ticketSla: {
        labels: ['All'],
        datasets: [
          { label: 'On time', data: [maintenance.slaCompliance], color: '#0f9f6e' },
          { label: 'Breached', data: [maintenance.breached], color: '#d90a2c' },
        ],
      },
      arrearsAging: { labels: ['Outstanding'], data: [summary.arrears] },
      properties: properties.map((property) => {
        const occupied = property.units.filter((unit) => unit.status === 'occupied').length;
        const total = property._count.units || property.units.length;
        return {
          name: property.name,
          health: 'healthy',
          units: total,
          occupancy: total === 0 ? 0 : Math.round((occupied / total) * 100),
          arrears: 'GHS 0',
        };
      }),
      sla: {
        onTime: maintenance.slaCompliance,
        breached: maintenance.breached,
        open: maintenance.open,
        avgHours: 0,
      },
      activity: [],
      openAlerts: [],
      quickActions: [
        { label: 'Add property', description: 'Register a building or block', path: '/properties', icon: 'building' },
        { label: 'Post payment', description: 'Apply a receipt to an invoice', path: '/payments', icon: 'wallet' },
        { label: 'Create ticket', description: 'Open a maintenance work order', path: '/tickets', icon: 'wrench' },
        { label: 'Arrears console', description: 'Age balances and remind tenants', path: '/arrears', icon: 'alert' },
      ],
    };
  }
}
