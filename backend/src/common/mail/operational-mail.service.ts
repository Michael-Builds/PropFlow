import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService, type MailTemplateName } from './mail.service';
import { AppLogger } from '../logger/app-logger.service';
import { NotificationsService } from '../../notifications/notifications.service';

function money(amount: number, currency = 'GHS'): string {
  return `${currency} ${amount.toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function prettyDoc(docType: string): string {
  return docType.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function dayLabel(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class OperationalMailService {
  constructor(
    private readonly mail: MailService,
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly logger: AppLogger,
  ) {}

  async paymentReceipt(input: {
    orgId: string;
    tenantId: string;
    reference: string;
    invoiceId: string;
    amount: number;
    currency?: string;
    method?: string | null;
    paidAt?: Date | null;
  }): Promise<void> {
    const tenant = await this.tenantContact(input.orgId, input.tenantId);
    if (!tenant?.email) return;
    const amountLabel = money(input.amount, input.currency);
    await this.dispatch({
      orgId: input.orgId,
      userId: tenant.userId,
      to: tenant.email,
      template: 'payment-receipt',
      subject: `Payment received · ${input.reference}`,
      notificationType: 'payment_success',
      data: {
        preheader: `We received ${amountLabel} for invoice ${input.invoiceId}.`,
        fullName: tenant.fullName,
        reference: input.reference,
        invoiceId: input.invoiceId,
        amountLabel,
        method: input.method ?? null,
        paidAt: dayLabel(input.paidAt),
        actionUrl: `${this.mail.frontendUrl()}/payments`,
      },
      text: [
        'Payment received',
        `Reference: ${input.reference}`,
        `Invoice: ${input.invoiceId}`,
        `Amount: ${amountLabel}`,
      ].join('\n'),
    });
  }

  async paymentFailed(input: {
    orgId: string;
    tenantId: string;
    reference?: string | null;
    invoiceId?: string | null;
    amount?: number | null;
    currency?: string;
  }): Promise<void> {
    const tenant = await this.tenantContact(input.orgId, input.tenantId);
    if (!tenant?.email) return;
    const amountLabel =
      input.amount != null ? money(input.amount, input.currency) : null;
    await this.dispatch({
      orgId: input.orgId,
      userId: tenant.userId,
      to: tenant.email,
      template: 'payment-failed',
      subject: 'Payment could not be completed',
      notificationType: 'payment_failed',
      data: {
        preheader: 'A PropFlow payment attempt did not go through.',
        fullName: tenant.fullName,
        reference: input.reference ?? null,
        invoiceId: input.invoiceId ?? null,
        amountLabel,
        actionUrl: `${this.mail.frontendUrl()}/invoices`,
      },
      text: [
        'Payment could not be completed',
        input.reference ? `Reference: ${input.reference}` : null,
        input.invoiceId ? `Invoice: ${input.invoiceId}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    });
  }

  async invoiceReminder(input: {
    orgId: string;
    tenantId: string;
    invoiceId: string;
    balance: number;
    dueDate: Date;
    kind: 'due' | 'overdue';
    alsoNotifyOperators?: boolean;
  }): Promise<void> {
    const tenant = await this.tenantContact(input.orgId, input.tenantId);
    const amountLabel = money(input.balance);
    const dueDate = dayLabel(input.dueDate);
    const subject =
      input.kind === 'overdue' ? 'Overdue rent balance on PropFlow' : 'Invoice due soon on PropFlow';
    const data = {
      preheader: subject,
      kind: input.kind,
      invoiceId: input.invoiceId,
      amountLabel,
      dueDate,
      actionUrl: `${this.mail.frontendUrl()}/invoices/${input.invoiceId}`,
    };

    if (tenant?.email) {
      await this.dispatch({
        orgId: input.orgId,
        userId: tenant.userId,
        to: tenant.email,
        template: 'invoice-reminder',
        subject,
        notificationType: input.kind === 'overdue' ? 'arrears_reminder' : 'invoice_due',
        data: { ...data, fullName: tenant.fullName },
        text: `${subject}\nInvoice: ${input.invoiceId}\nBalance: ${amountLabel}\nDue: ${dueDate}`,
      });
    }

    if (input.alsoNotifyOperators) {
      const operators = await this.prisma.user.findMany({
        where: { orgId: input.orgId, status: 'active', role: { in: ['owner', 'manager', 'finance'] } },
        select: { id: true, email: true, fullName: true },
      });
      for (const op of operators) {
        await this.dispatch({
          orgId: input.orgId,
          userId: op.id,
          to: op.email,
          template: 'invoice-reminder',
          subject,
          notificationType: input.kind === 'overdue' ? 'arrears_reminder' : 'invoice_due',
          data: { ...data, fullName: op.fullName },
          text: `${subject}\nInvoice: ${input.invoiceId}\nBalance: ${amountLabel}\nDue: ${dueDate}`,
        });
      }
    }
  }

  async documentExpiry(input: {
    orgId: string;
    userId: string;
    fullName?: string | null;
    email: string;
    docType: string;
    daysRemaining: number;
    expiresAt: Date;
    entityLabel?: string | null;
  }): Promise<void> {
    await this.dispatch({
      orgId: input.orgId,
      userId: input.userId,
      to: input.email,
      template: 'document-expiry',
      subject: `Document expires in ${input.daysRemaining} days`,
      notificationType: 'document_expiry',
      data: {
        preheader: `${prettyDoc(input.docType)} expires in ${input.daysRemaining} days.`,
        fullName: input.fullName ?? null,
        daysRemaining: input.daysRemaining,
        docTypeLabel: prettyDoc(input.docType),
        expiresAt: dayLabel(input.expiresAt),
        entityLabel: input.entityLabel ?? null,
        actionUrl: `${this.mail.frontendUrl()}/documents`,
      },
      text: `Document ${input.docType} expires in ${input.daysRemaining} days.`,
    });
  }

  async leaseEnding(input: {
    orgId: string;
    recipientUserId?: string | null;
    recipientEmail: string;
    recipientName?: string | null;
    tenantName?: string | null;
    unitCode?: string | null;
    endDate: Date;
    daysRemaining: number;
    rentAmount?: number | null;
    leaseId: string;
  }): Promise<void> {
    await this.dispatch({
      orgId: input.orgId,
      userId: input.recipientUserId ?? null,
      to: input.recipientEmail,
      template: 'lease-ending',
      subject: `Lease ending in ${input.daysRemaining} days`,
      notificationType: 'lease_ending',
      data: {
        preheader: `A lease ends in ${input.daysRemaining} days.`,
        fullName: input.recipientName ?? null,
        daysRemaining: input.daysRemaining,
        tenantName: input.tenantName ?? null,
        unitCode: input.unitCode ?? null,
        endDate: dayLabel(input.endDate),
        rentLabel: input.rentAmount != null ? money(input.rentAmount) : null,
        actionUrl: `${this.mail.frontendUrl()}/leases/${input.leaseId}`,
      },
      text: `Lease ${input.leaseId} ends in ${input.daysRemaining} days (${dayLabel(input.endDate)}).`,
    });
  }

  async ticketUpdate(input: {
    orgId: string;
    userId: string;
    email: string;
    fullName?: string | null;
    event: 'assigned' | 'resolved';
    ticketId: string;
    category?: string | null;
    priority?: string | null;
    status?: string | null;
    notes?: string | null;
  }): Promise<void> {
    const headline =
      input.event === 'assigned' ? 'A ticket was assigned to you' : 'A ticket was resolved';
    const intro =
      input.event === 'assigned'
        ? 'a maintenance ticket needs your attention.'
        : 'a maintenance ticket has been marked resolved.';
    await this.dispatch({
      orgId: input.orgId,
      userId: input.userId,
      to: input.email,
      template: 'ticket-update',
      subject: headline,
      notificationType: input.event === 'assigned' ? 'ticket_assigned' : 'ticket_resolved',
      data: {
        preheader: headline,
        fullName: input.fullName ?? null,
        headline,
        intro,
        ticketId: input.ticketId,
        category: input.category ?? null,
        priority: input.priority ?? null,
        status: input.status ?? null,
        notes: input.notes ?? null,
        actionUrl: `${this.mail.frontendUrl()}/tickets/${input.ticketId}`,
      },
      text: `${headline}\nTicket: ${input.ticketId}`,
    });
  }

  async newMessage(input: {
    orgId: string;
    userId: string;
    email: string;
    fullName?: string | null;
    conversationId: string;
    preview: string;
  }): Promise<void> {
    await this.dispatch({
      orgId: input.orgId,
      userId: input.userId,
      to: input.email,
      template: 'new-message',
      subject: 'New message on PropFlow',
      notificationType: 'message',
      data: {
        preheader: input.preview.slice(0, 90),
        fullName: input.fullName ?? null,
        preview: input.preview,
        actionUrl: `${this.mail.frontendUrl()}/messages`,
      },
      text: `New message:\n${input.preview}`,
    });
  }

  async complianceBlock(input: {
    orgId: string;
    tenantName: string;
    reason: string;
    gapsLabel?: string | null;
  }): Promise<void> {
    const operators = await this.prisma.user.findMany({
      where: { orgId: input.orgId, status: 'active', role: { in: ['owner', 'manager'] } },
      select: { id: true, email: true, fullName: true },
    });
    for (const op of operators) {
      await this.dispatch({
        orgId: input.orgId,
        userId: op.id,
        to: op.email,
        template: 'compliance-block',
        subject: 'Lease blocked by compliance gaps',
        notificationType: 'compliance_block',
        data: {
          preheader: input.reason,
          fullName: op.fullName,
          tenantName: input.tenantName,
          reason: input.reason,
          gapsLabel: input.gapsLabel ?? null,
          actionUrl: `${this.mail.frontendUrl()}/tenants`,
        },
        text: `Lease blocked for ${input.tenantName}: ${input.reason}`,
      });
    }
  }

  private async dispatch(input: {
    orgId: string;
    userId: string | null;
    to: string;
    template: MailTemplateName;
    subject: string;
    notificationType: string;
    data: Record<string, unknown>;
    text: string;
  }): Promise<void> {
    try {
      await this.mail.sendTemplate(
        input.to,
        input.template,
        input.subject,
        input.data,
        input.text,
      );
      if (input.userId) {
        await this.notifications.queueInApp(input.orgId, input.userId, input.notificationType, {
          message: input.subject,
          ...input.data,
        });
      }
    } catch (error) {
      this.logger.warning(
        `Operational mail failed (${input.template}) to ${input.to}: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
        OperationalMailService.name,
      );
    }
  }

  private async tenantContact(orgId: string, tenantId: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, orgId },
      select: { id: true, email: true, fullName: true },
    });
    if (!tenant) return null;
    const user = await this.prisma.user.findFirst({
      where: { orgId, tenantId, status: 'active' },
      select: { id: true, email: true, fullName: true },
    });
    return {
      email: (user?.email || tenant.email || '').trim() || null,
      fullName: user?.fullName || tenant.fullName,
      userId: user?.id ?? null,
    };
  }
}
